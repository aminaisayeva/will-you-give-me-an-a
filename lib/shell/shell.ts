// A small zsh-like shell for Terminal Academy. It runs entirely in the
// browser over an in-memory FileSystem, and records every command so lessons
// can check what the learner did.

import { basename, dirname, FileSystem, FsError, modeString, resolvePath, type FsNode } from "./fs";

export type OutputLine = { text: string; kind: "out" | "err" };

export type CommandRecord = {
  line: string; // the full line the learner typed
  name: string;
  args: string[];
  exit: number;
  stdout: string;
  stderr: string;
  cwd: string; // working directory when it ran
  redirectedTo: string | null; // absolute path of a > / >> target
  piped: boolean; // part of a pipeline with more than one command
};

export type ShellHost = {
  // Open an app, file or website on the desktop. Returns an error message or null.
  open?: (target: string) => string | null;
};

export type ShellSnapshot = {
  fs: string;
  cwd: string;
  env: Record<string, string>;
  vars: Record<string, string>;
  aliases: Record<string, string>;
  history: string[];
};

type Result = { out: string; err: string; code: number };
type Ctx = { args: string[]; stdin: string | null; tty: boolean };
type Segment = { text: string; quote: "none" | "single" | "double" };
type Word = { segments: Segment[] };
type Token = { kind: "word"; word: Word } | { kind: "op"; op: string };
type Redirect = { op: ">" | ">>" | "<" | "2>" | "2>>"; target: Word };
type SimpleCommand = { words: Word[]; redirects: Redirect[] };
type Pipeline = { commands: SimpleCommand[] };
type Chain = { pipeline: Pipeline; next: ";" | "&&" | "||" | null }[];

const ok = (out = ""): Result => ({ out, err: "", code: 0 });
const fail = (err: string, code = 1, out = ""): Result => ({ out, err: err.endsWith("\n") ? err : `${err}\n`, code });

const BLUE = "\x1b[1;34m";
const GREEN = "\x1b[1;32m";
const RESET = "\x1b[0m";

export const BUILTINS = new Set([
  "cd", "pwd", "echo", "export", "unset", "alias", "unalias", "history", "clear", "which", "type",
  "exit", "help", "true", "false", "source",
]);

const EDITORS = new Set(["nano", "vim", "vi", "emacs", "code", "pico"]);

export class Shell {
  fs: FileSystem;
  cwd: string;
  env: Record<string, string>;
  vars: Record<string, string> = {};
  aliases: Record<string, string> = {};
  history: string[] = [];
  lastExit = 0;
  log: CommandRecord[] = [];
  host: ShellHost;
  private positional: string[][] = [];
  private currentLine = "";
  private depth = 0;

  constructor(fs: FileSystem, opts: { user?: string; cwd?: string; host?: ShellHost } = {}) {
    this.host = opts.host ?? {};
    const user = opts.user ?? "student";
    const home = `/Users/${user}`;
    this.fs = fs;
    this.cwd = opts.cwd ?? home;
    this.env = {
      HOME: home,
      USER: user,
      SHELL: "/bin/zsh",
      PATH: "/usr/local/bin:/usr/bin:/bin",
      PWD: this.cwd,
      TERM: "xterm-256color",
    };
  }

  get home() {
    return this.env.HOME;
  }

  get user() {
    return this.env.USER;
  }

  // The zsh-style prompt: "student@academy ~/notes %"
  prompt() {
    const where = this.cwd === this.home ? "~" : this.cwd.startsWith(this.home + "/") ? "~" + this.cwd.slice(this.home.length) : this.cwd;
    return `${this.user}@academy ${where} %`;
  }

  snapshot(): ShellSnapshot {
    return {
      fs: this.fs.toJSON(),
      cwd: this.cwd,
      env: { ...this.env },
      vars: { ...this.vars },
      aliases: { ...this.aliases },
      history: this.history.slice(-300),
    };
  }

  restore(snap: ShellSnapshot) {
    this.fs = FileSystem.fromJSON(snap.fs);
    this.cwd = this.fs.isDir(snap.cwd) ? snap.cwd : snap.env.HOME;
    this.env = { ...snap.env, PWD: this.cwd };
    this.vars = { ...snap.vars };
    this.aliases = { ...snap.aliases };
    this.history = [...snap.history];
  }

  resolve(path: string) {
    return resolvePath(this.cwd, path, this.home);
  }

  // Run one line typed at the prompt. Returns what to print and whether the
  // screen should be cleared.
  run(line: string): { lines: OutputLine[]; clear: boolean } {
    const trimmed = line.trim();
    if (!trimmed) return { lines: [], clear: false };
    this.history.push(trimmed);
    this.currentLine = trimmed;
    const printed: OutputLine[] = [];
    let clear = false;
    try {
      const chain = parse(tokenize(trimmed));
      const r = this.runChain(chain, (res) => {
        if (res.out) printed.push(...toLines(res.out, "out"));
        if (res.err) printed.push(...toLines(res.err, "err"));
      });
      clear = r.clear;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      printed.push({ text: message, kind: "err" });
      this.lastExit = 1;
    }
    return { lines: clear ? [] : printed, clear };
  }

  private runChain(chain: Chain, emit: (r: Result) => void): { clear: boolean } {
    let clear = false;
    let skip = false;
    for (const { pipeline, next } of chain) {
      if (!skip) {
        const r = this.runPipeline(pipeline);
        if (r.clear) clear = true;
        emit(r);
        this.lastExit = r.code;
      }
      if (next === "&&") skip = this.lastExit !== 0;
      else if (next === "||") skip = this.lastExit === 0;
      else skip = false;
    }
    return { clear };
  }

  private runPipeline(pipeline: Pipeline): Result & { clear: boolean } {
    let stdin: string | null = null;
    let err = "";
    let last: Result = ok();
    let clear = false;
    const piped = pipeline.commands.length > 1;
    pipeline.commands.forEach((cmd, i) => {
      const isLast = i === pipeline.commands.length - 1;
      const r = this.runSimple(cmd, stdin, isLast, piped);
      if (r.clear) clear = true;
      err += r.err;
      stdin = r.out;
      last = r;
    });
    return { out: last.out, err, code: last.code, clear };
  }

  private runSimple(cmd: SimpleCommand, stdin: string | null, isLast: boolean, piped: boolean): Result & { clear: boolean } {
    const cwdBefore = this.cwd;
    let words: string[];
    try {
      words = this.expandWords(cmd.words);
    } catch (err) {
      return { ...fail(err instanceof Error ? err.message : String(err)), clear: false };
    }

    // NAME=value with no command: set a shell variable.
    if (words.length > 0 && words.every((w) => /^[A-Za-z_][A-Za-z0-9_]*=/.test(w))) {
      for (const w of words) {
        const [name, ...rest] = w.split("=");
        const value = rest.join("=");
        if (name in this.env) this.env[name] = value;
        else this.vars[name] = value;
      }
      this.record(words[0].split("=")[0] + "=", [], ok(), cwdBefore, null, piped);
      return { ...ok(), clear: false };
    }
    if (words.length === 0) return { ...ok(), clear: false };

    // Aliases expand the first word.
    if (this.aliases[words[0]] && this.depth < 5) {
      const expanded = this.expandWords(parseWords(this.aliases[words[0]]));
      words = [...expanded, ...words.slice(1)];
    }

    let input = stdin;
    let outTarget: { path: string; append: boolean; display: string } | null = null;
    let errTarget: { path: string; append: boolean } | null = null;
    for (const r of cmd.redirects) {
      const target = this.expandWords([r.target])[0] ?? "";
      if (!target) return { ...fail("zsh: parse error near `\\n'"), clear: false };
      const abs = this.resolve(target);
      if (r.op === "<") {
        try {
          input = target === "/dev/null" ? "" : this.fs.read(abs, target);
        } catch (e) {
          return { ...fail(`zsh: ${e instanceof Error ? e.message.replace(/^.*?: /, "") : e}: ${target}`), clear: false };
        }
      } else if (r.op === ">" || r.op === ">>") outTarget = { path: abs, append: r.op === ">>", display: target };
      else errTarget = { path: abs, append: r.op === "2>>" };
    }

    const [name, ...args] = words;
    const tty = isLast && !outTarget;
    const res = this.execCommand(name, { args, stdin: input, tty });

    let out = res.out;
    let err = res.err;
    let redirectedTo: string | null = null;
    if (outTarget) {
      if (outTarget.path !== "/dev/null") {
        try {
          this.fs.write(outTarget.path, out, outTarget.append, outTarget.display);
          redirectedTo = outTarget.path;
        } catch (e) {
          err += `zsh: ${e instanceof Error ? e.message.replace(/^.*?: /, "").toLowerCase() : e}: ${outTarget.display}\n`;
        }
      }
      out = "";
    }
    if (errTarget) {
      if (errTarget.path !== "/dev/null") {
        try {
          this.fs.write(errTarget.path, err, errTarget.append);
        } catch {
          /* ignore */
        }
      }
      err = "";
    }
    this.record(name, args, { out: res.out, err: res.err, code: res.code }, cwdBefore, redirectedTo, piped);
    return { out, err, code: res.code, clear: name === "clear" && res.code === 0 };
  }

  private record(name: string, args: string[], r: Result, cwd: string, redirectedTo: string | null, piped: boolean) {
    this.log.push({ line: this.currentLine, name, args, exit: r.code, stdout: r.out, stderr: r.err, cwd, redirectedTo, piped });
    if (this.log.length > 500) this.log.shift();
  }

  // --- expansion -----------------------------------------------------------

  private lookup(name: string): string {
    const frame = this.positional[this.positional.length - 1];
    if (name === "?") return String(this.lastExit);
    if (name === "#") return String(frame ? frame.length - 1 : 0);
    if (name === "@" || name === "*") return frame ? frame.slice(1).join(" ") : "";
    if (/^\d$/.test(name)) return frame?.[Number(name)] ?? (name === "0" ? "zsh" : "");
    return this.vars[name] ?? this.env[name] ?? "";
  }

  private expandVars(text: string) {
    return text.replace(/\$(?:\{([A-Za-z_][A-Za-z0-9_]*|[0-9?#@*])\}|([A-Za-z_][A-Za-z0-9_]*|[0-9?#@*]))/g, (_m, a, b) =>
      this.lookup(a ?? b),
    );
  }

  private expandWords(words: Word[]): string[] {
    const out: string[] = [];
    for (const word of words) {
      let text = "";
      let pattern = "";
      let glob = false;
      word.segments.forEach((seg, i) => {
        let value = seg.quote === "single" ? seg.text : this.expandVars(seg.text);
        if (seg.quote === "none" && i === 0 && (value === "~" || value.startsWith("~/"))) value = this.home + value.slice(1);
        text += value;
        if (seg.quote === "none" && /[*?]/.test(value)) {
          glob = true;
          pattern += value;
        } else pattern += value.replace(/[*?[\]]/g, "\\$&");
      });
      if (glob) {
        const matches = this.glob(pattern);
        if (matches.length === 0) throw new Error(`zsh: no matches found: ${text}`);
        out.push(...matches);
      } else if (text !== "" || word.segments.some((s) => s.quote !== "none")) {
        out.push(text);
      }
    }
    return out;
  }

  // Expand a glob like "*.txt" or "notes/2024-*.md" against the file system.
  private glob(pattern: string): string[] {
    const absolute = pattern.startsWith("/");
    const parts = pattern.split("/").filter((p, i) => p !== "" || i === 0);
    let candidates: { abs: string; shown: string }[] = [{ abs: absolute ? "/" : this.cwd, shown: absolute ? "/" : "" }];
    for (const part of parts) {
      if (part === "") continue;
      const next: { abs: string; shown: string }[] = [];
      const join = (base: string, name: string) => (base === "/" ? `/${name}` : `${base}/${name}`);
      const joinShown = (base: string, name: string) => (base === "" ? name : base === "/" ? `/${name}` : `${base}/${name}`);
      if (/(^|[^\\])[*?]/.test(part)) {
        const re = globToRegex(part);
        for (const c of candidates) {
          for (const name of this.fs.list(c.abs)) {
            if (name.startsWith(".") && !part.startsWith(".")) continue;
            if (re.test(name)) next.push({ abs: join(c.abs, name), shown: joinShown(c.shown, name) });
          }
        }
      } else {
        const name = part.replace(/\\(.)/g, "$1");
        for (const c of candidates) {
          const abs = name === ".." ? dirname(c.abs) : name === "." ? c.abs : join(c.abs, name);
          if (this.fs.get(abs)) next.push({ abs, shown: joinShown(c.shown, name) });
        }
      }
      candidates = next;
    }
    return candidates.map((c) => c.shown).sort((a, b) => a.localeCompare(b));
  }

  // --- execution -----------------------------------------------------------

  execCommand(name: string, ctx: Ctx): Result {
    if (name.includes("/")) return this.runScriptFile(name, ctx.args, true);
    const fn = COMMANDS[name];
    if (fn) {
      try {
        return fn.call(this, ctx);
      } catch (err) {
        if (err instanceof FsError) return fail(`${name}: ${err.message}`);
        throw err;
      }
    }
    if (EDITORS.has(name)) {
      return fail(`${name}: editors aren't available on this practice Mac. Write files with: echo "some text" > file.txt`, 127);
    }
    return fail(`zsh: command not found: ${name}`, 127);
  }

  // ./script.sh (needs execute permission) or `sh script.sh`.
  runScriptFile(path: string, args: string[], requireExec: boolean): Result {
    const abs = this.resolve(path);
    const node = this.fs.get(abs);
    if (!node) return fail(`zsh: no such file or directory: ${path}`, 127);
    if (node.type === "dir") return fail(`zsh: permission denied: ${path}`, 126);
    if (requireExec && !(node.mode & 0o100)) return fail(`zsh: permission denied: ${path}`, 126);
    if (this.depth > 8) return fail(`${path}: too many nested scripts`);

    this.depth++;
    this.positional.push([path, ...args]);
    let out = "";
    let err = "";
    let code = 0;
    try {
      for (const raw of node.content.split("\n")) {
        const line = raw.trim();
        if (!line || line.startsWith("#")) continue;
        this.runChain(parse(tokenize(line)), (res) => {
          out += res.out;
          err += res.err;
        });
        code = this.lastExit;
        if (/^exit\b/.test(line)) break;
      }
    } catch (e) {
      err += `${path}: ${e instanceof Error ? e.message : e}\n`;
      code = 1;
    } finally {
      this.positional.pop();
      this.depth--;
    }
    return { out, err, code };
  }

  isExecutable(node: FsNode) {
    return node.type === "file" && Boolean(node.mode & 0o100);
  }
}

// ---------------------------------------------------------------------------
// Parsing

function tokenize(line: string): Token[] {
  const tokens: Token[] = [];
  let segments: Segment[] = [];
  let buf = "";
  let inWord = false;
  const flushSegment = (quote: Segment["quote"]) => {
    if (buf || quote !== "none") segments.push({ text: buf, quote });
    buf = "";
  };
  const endWord = () => {
    if (inWord) {
      flushSegment("none");
      tokens.push({ kind: "word", word: { segments } });
    }
    segments = [];
    buf = "";
    inWord = false;
  };

  let i = 0;
  while (i < line.length) {
    const c = line[i];
    if (c === "'") {
      inWord = true;
      flushSegment("none");
      const end = line.indexOf("'", i + 1);
      if (end === -1) throw new Error("zsh: unmatched '");
      buf = line.slice(i + 1, end);
      flushSegment("single");
      i = end + 1;
      continue;
    }
    if (c === '"') {
      inWord = true;
      flushSegment("none");
      let j = i + 1;
      while (j < line.length && line[j] !== '"') {
        if (line[j] === "\\" && j + 1 < line.length && /["\\$`]/.test(line[j + 1])) {
          buf += line[j + 1];
          j += 2;
        } else buf += line[j++];
      }
      if (j >= line.length) throw new Error('zsh: unmatched "');
      flushSegment("double");
      i = j + 1;
      continue;
    }
    if (c === "\\" && i + 1 < line.length) {
      inWord = true;
      flushSegment("none");
      buf = line[i + 1];
      flushSegment("single");
      i += 2;
      continue;
    }
    if (c === "#" && !inWord) break; // comment
    if (/\s/.test(c)) {
      endWord();
      i++;
      continue;
    }
    const three = line.slice(i, i + 3);
    const two = line.slice(i, i + 2);
    if (three === "2>>") {
      endWord();
      tokens.push({ kind: "op", op: "2>>" });
      i += 3;
      continue;
    }
    if ((two === "2>" && !inWord) || two === ">>" || two === "&&" || two === "||") {
      endWord();
      tokens.push({ kind: "op", op: two });
      i += 2;
      continue;
    }
    if (c === ">" || c === "<" || c === "|" || c === ";") {
      endWord();
      tokens.push({ kind: "op", op: c });
      i++;
      continue;
    }
    if (c === "&") {
      endWord();
      throw new Error("Background jobs (&) aren't supported on this practice Mac.");
    }
    inWord = true;
    buf += c;
    i++;
  }
  endWord();
  return tokens;
}

function parse(tokens: Token[]): Chain {
  const chain: Chain = [];
  let pipeline: Pipeline = { commands: [] };
  let cmd: SimpleCommand = { words: [], redirects: [] };

  const endCommand = () => {
    if (cmd.words.length === 0 && cmd.redirects.length === 0) throw new Error("zsh: parse error near `|'");
    pipeline.commands.push(cmd);
    cmd = { words: [], redirects: [] };
  };

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.kind === "word") {
      cmd.words.push(t.word);
      continue;
    }
    if (t.op === ">" || t.op === ">>" || t.op === "<" || t.op === "2>" || t.op === "2>>") {
      const target = tokens[i + 1];
      if (!target || target.kind !== "word") throw new Error("zsh: parse error near `\\n'");
      cmd.redirects.push({ op: t.op, target: target.word });
      i++;
      continue;
    }
    if (t.op === "|") {
      endCommand();
      continue;
    }
    // ; && ||
    if (cmd.words.length || cmd.redirects.length) endCommand();
    if (pipeline.commands.length === 0) {
      if (t.op === ";") continue;
      throw new Error(`zsh: parse error near \`${t.op}'`);
    }
    chain.push({ pipeline, next: t.op as ";" | "&&" | "||" });
    pipeline = { commands: [] };
  }
  if (cmd.words.length || cmd.redirects.length) endCommand();
  if (pipeline.commands.length) chain.push({ pipeline, next: null });
  else if (chain.length && chain[chain.length - 1].next !== ";") throw new Error("zsh: parse error near `\\n'");
  return chain;
}

function parseWords(text: string): Word[] {
  return tokenize(text).flatMap((t) => (t.kind === "word" ? [t.word] : []));
}

function globToRegex(glob: string) {
  let re = "^";
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === "\\" && i + 1 < glob.length) re += glob[++i].replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    else if (c === "*") re += ".*";
    else if (c === "?") re += ".";
    else re += c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  return new RegExp(re + "$");
}

function toLines(text: string, kind: OutputLine["kind"]): OutputLine[] {
  const body = text.endsWith("\n") ? text.slice(0, -1) : text;
  return body.split("\n").map((t) => ({ text: t, kind }));
}

// ---------------------------------------------------------------------------
// Commands

function parseFlags(args: string[], known: string) {
  const flags = new Set<string>();
  const rest: string[] = [];
  let done = false;
  for (const a of args) {
    if (!done && a === "--") {
      done = true;
      continue;
    }
    if (!done && /^-[A-Za-z]+$/.test(a)) {
      for (const f of a.slice(1)) {
        if (!known.includes(f)) throw new Error(`illegal option -- ${f}`);
        flags.add(f);
      }
    } else rest.push(a);
  }
  return { flags, rest };
}

function withFlags<T>(name: string, args: string[], known: string, usage: string, body: (f: Set<string>, rest: string[]) => T): T | Result {
  try {
    const { flags, rest } = parseFlags(args, known);
    return body(flags, rest);
  } catch (e) {
    return fail(`${name}: ${e instanceof Error ? e.message : e}\nusage: ${usage}`);
  }
}

function lsDate(ms: number) {
  const d = new Date(ms);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getMonth()]} ${String(d.getDate()).padStart(2)} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function sizeOf(node: FsNode) {
  return node.type === "file" ? new TextEncoder().encode(node.content).length : 64 + Object.keys(node.children).length * 32;
}

function readInputs(sh: Shell, name: string, files: string[], stdin: string | null): { text: string; err: string } {
  if (files.length === 0) return { text: stdin ?? "", err: "" };
  let text = "";
  let err = "";
  for (const f of files) {
    try {
      text += f === "-" ? (stdin ?? "") : sh.fs.read(sh.resolve(f), f);
    } catch (e) {
      err += `${name}: ${e instanceof Error ? e.message : e}\n`;
    }
  }
  return { text, err };
}

function lines(text: string) {
  if (!text) return [];
  const body = text.endsWith("\n") ? text.slice(0, -1) : text;
  return body.split("\n");
}

function joinLines(ls: string[]) {
  return ls.length ? ls.join("\n") + "\n" : "";
}

function applyChmod(mode: number, spec: string): number | null {
  if (/^[0-7]{3,4}$/.test(spec)) return parseInt(spec.slice(-3), 8);
  let result = mode;
  for (const clause of spec.split(",")) {
    const m = clause.match(/^([ugoa]*)([+\-=])([rwx]*)$/);
    if (!m) return null;
    const who = m[1] || "a";
    let bits = 0;
    for (const p of m[3]) bits |= p === "r" ? 4 : p === "w" ? 2 : 1;
    let mask = 0;
    if (who.includes("u") || who.includes("a")) mask |= bits << 6;
    if (who.includes("g") || who.includes("a")) mask |= bits << 3;
    if (who.includes("o") || who.includes("a")) mask |= bits;
    if (m[2] === "+") result |= mask;
    else if (m[2] === "-") result &= ~mask;
    else {
      let clear = 0;
      if (who.includes("u") || who.includes("a")) clear |= 0o700;
      if (who.includes("g") || who.includes("a")) clear |= 0o070;
      if (who.includes("o") || who.includes("a")) clear |= 0o007;
      result = (result & ~clear) | mask;
    }
  }
  return result;
}

const MAN: Record<string, string> = {
  pwd: "pwd - print the name of the current (working) directory.",
  ls: "ls [-a] [-l] [-1] [-F] [file ...] - list directory contents.\n  -a  include entries starting with . (hidden files)\n  -l  long format: permissions, owner, size, date\n  -1  one entry per line\n  -F  add / after folders and * after executables",
  cd: "cd [dir] - change the working directory. `cd` alone goes home, `cd ..` goes up one level, `cd -` goes back.",
  cat: "cat [-n] [file ...] - print files one after another. -n numbers the lines.",
  head: "head [-n count] [file] - print the first lines of a file (10 by default).",
  tail: "tail [-n count] [file] - print the last lines of a file (10 by default).",
  echo: "echo [-n] [text ...] - print text. Combine with > to write it into a file.",
  mkdir: "mkdir [-p] dir ... - make folders. -p creates parent folders as needed.",
  touch: "touch file ... - create empty files (or update their timestamp).",
  cp: "cp [-r] source ... target - copy files. -r copies folders and everything inside.",
  mv: "mv source ... target - move or rename files and folders.",
  rm: "rm [-r] [-f] file ... - remove files. -r removes folders and their contents. There is no Trash: it's gone.",
  rmdir: "rmdir dir ... - remove empty folders.",
  grep: "grep [-i] [-n] [-v] [-c] [-r] [-l] pattern [file ...] - print lines that match pattern.\n  -i ignore case  -n show line numbers  -v invert  -c count  -r search folders  -l only file names",
  find: "find [path] [-name pattern] [-iname pattern] [-type f|d] - search for files by name or type.",
  wc: "wc [-l] [-w] [-c] [file ...] - count lines, words and bytes.",
  sort: "sort [-r] [-n] [-u] [file] - sort lines. -r reverse, -n numeric, -u unique.",
  uniq: "uniq [-c] [file] - drop repeated adjacent lines. -c counts them. Usually used after sort.",
  history: "history - list the commands you've typed.",
  man: "man command - show the manual page for a command. (You're reading one.)",
  chmod: "chmod mode file ... - change permissions.\n  chmod +x script.sh   make it executable\n  chmod 644 file       rw-r--r--\n  chmod 755 file       rwxr-xr-x",
  sudo: "sudo command - run a command as the administrator (root). On a real Mac it asks for your password.",
  export: "export NAME=value - set an environment variable that programs you run can see.",
  env: "env - print all environment variables.",
  printenv: "printenv [NAME] - print environment variables.",
  unset: "unset NAME - remove a variable.",
  alias: "alias [name='command'] - create a shortcut. `alias` alone lists your aliases.",
  unalias: "unalias name - remove an alias.",
  which: "which command - show where a command lives (or that it's a built-in or alias).",
  tree: "tree [dir] - draw the folders and files under dir.",
  sh: "sh script [args ...] - run a shell script. Inside it, $1 $2 ... are the arguments.",
  clear: "clear - clear the screen.",
  whoami: "whoami - print your user name.",
  date: "date - print the date and time.",
};

function lsEntry(sh: Shell, name: string, node: FsNode, flags: Set<string>, tty: boolean) {
  let shown = name;
  if (flags.has("F")) shown += node.type === "dir" ? "/" : sh.isExecutable(node) ? "*" : "";
  if (tty) {
    if (node.type === "dir") shown = `${BLUE}${shown}${RESET}`;
    else if (sh.isExecutable(node)) shown = `${GREEN}${shown}${RESET}`;
  }
  if (!flags.has("l")) return shown;
  const size = String(sizeOf(node)).padStart(5);
  const links = node.type === "dir" ? Object.keys(node.children).length + 2 : 1;
  return `${modeString(node)}  ${String(links).padStart(2)} ${sh.user}  staff  ${size} ${lsDate(node.mtime)} ${shown}`;
}

type Command = (this: Shell, ctx: Ctx) => Result;

const COMMANDS: Record<string, Command> = {
  pwd() {
    return ok(this.cwd + "\n");
  },

  whoami() {
    return ok(this.user + "\n");
  },

  hostname() {
    return ok("academy.local\n");
  },

  date() {
    return ok(new Date().toString().replace(/ \(.*\)$/, "") + "\n");
  },

  true() {
    return ok();
  },

  false() {
    return { out: "", err: "", code: 1 };
  },

  clear() {
    return ok();
  },

  echo({ args }) {
    let newline = true;
    let rest = args;
    if (rest[0] === "-n") {
      newline = false;
      rest = rest.slice(1);
    }
    return ok(rest.join(" ") + (newline ? "\n" : ""));
  },

  cd({ args }) {
    const target = args[0] ?? "~";
    if (args.length > 1) return fail("cd: too many arguments");
    const path = target === "-" ? (this.env.OLDPWD ?? this.cwd) : this.resolve(target);
    const node = this.fs.get(path);
    if (!node) return fail(`cd: no such file or directory: ${target}`);
    if (node.type !== "dir") return fail(`cd: not a directory: ${target}`);
    this.env.OLDPWD = this.cwd;
    this.cwd = path;
    this.env.PWD = path;
    return ok(target === "-" ? path + "\n" : "");
  },

  ls({ args, tty }) {
    return withFlags("ls", args, "alF1hAG", "ls [-alF1] [file ...]", (flags, rest) => {
      const targets = rest.length ? rest : ["."];
      let out = "";
      let err = "";
      const fileEntries: string[] = [];
      const dirs: string[] = [];
      for (const t of targets) {
        const node = this.fs.get(this.resolve(t));
        if (!node) err += `ls: ${t}: No such file or directory\n`;
        else if (node.type === "file") fileEntries.push(lsEntry(this, t, node, flags, tty));
        else dirs.push(t);
      }
      const sep = flags.has("l") || flags.has("1") || !tty ? "\n" : "  ";
      if (fileEntries.length) out += fileEntries.join(sep) + "\n";
      dirs.forEach((t, i) => {
        const abs = this.resolve(t);
        const node = this.fs.get(abs)!;
        let names = this.fs.list(abs);
        if (!flags.has("a") && !flags.has("A")) names = names.filter((n) => !n.startsWith("."));
        const entries: string[] = [];
        if (flags.has("a")) {
          entries.push(lsEntry(this, ".", node, flags, tty));
          entries.push(lsEntry(this, "..", this.fs.get(dirname(abs)) ?? node, flags, tty));
        }
        for (const n of names) entries.push(lsEntry(this, n, (node as Extract<FsNode, { type: "dir" }>).children[n], flags, tty));
        if (targets.length > 1) out += `${i > 0 || fileEntries.length ? "\n" : ""}${t}:\n`;
        if (flags.has("l")) out += `total ${names.length * 8}\n`;
        if (entries.length) out += entries.join(sep) + "\n";
      });
      return { out, err, code: err ? 1 : 0 };
    });
  },

  cat({ args, stdin }) {
    return withFlags("cat", args, "n", "cat [-n] [file ...]", (flags, files) => {
      const { text, err } = readInputs(this, "cat", files, stdin);
      const out = flags.has("n") ? joinLines(lines(text).map((l, i) => `${String(i + 1).padStart(6)}\t${l}`)) : text;
      return { out, err, code: err ? 1 : 0 };
    });
  },

  less(ctx) {
    return COMMANDS.cat.call(this, ctx);
  },

  more(ctx) {
    return COMMANDS.cat.call(this, ctx);
  },

  head({ args, stdin }) {
    return headTail.call(this, "head", args, stdin);
  },

  tail({ args, stdin }) {
    return headTail.call(this, "tail", args, stdin);
  },

  mkdir({ args }) {
    return withFlags("mkdir", args, "p", "mkdir [-p] directory ...", (flags, dirs) => {
      if (!dirs.length) return fail("usage: mkdir [-p] directory ...");
      let err = "";
      for (const d of dirs) {
        try {
          this.fs.mkdir(this.resolve(d), flags.has("p"), d);
        } catch (e) {
          err += `mkdir: ${e instanceof Error ? e.message : e}\n`;
        }
      }
      return { out: "", err, code: err ? 1 : 0 };
    });
  },

  touch({ args }) {
    if (!args.length) return fail("usage: touch file ...");
    let err = "";
    for (const f of args) {
      const abs = this.resolve(f);
      const node = this.fs.get(abs);
      try {
        if (node) node.mtime = Date.now();
        else this.fs.write(abs, "", false, f);
      } catch (e) {
        err += `touch: ${e instanceof Error ? e.message : e}\n`;
      }
    }
    return { out: "", err, code: err ? 1 : 0 };
  },

  rm({ args }) {
    return withFlags("rm", args, "rRfiv", "rm [-rf] file ...", (flags, targets) => {
      if (!targets.length) return fail("usage: rm [-rf] file ...");
      const recursive = flags.has("r") || flags.has("R");
      let err = "";
      let out = "";
      for (const t of targets) {
        const abs = this.resolve(t);
        if (abs === "/" || abs === this.home) {
          err += `rm: "${t}" is protected on this practice Mac. (On a real one, this would delete everything.)\n`;
          continue;
        }
        const node = this.fs.get(abs);
        if (!node) {
          if (!flags.has("f")) err += `rm: ${t}: No such file or directory\n`;
          continue;
        }
        if (node.type === "dir" && !recursive) {
          err += `rm: ${t}: is a directory\n`;
          continue;
        }
        if (this.cwd === abs || this.cwd.startsWith(abs + "/")) {
          this.cwd = dirname(abs);
          this.env.PWD = this.cwd;
        }
        this.fs.remove(abs);
        if (flags.has("v")) out += `${t}\n`;
      }
      return { out, err, code: err ? 1 : 0 };
    });
  },

  rmdir({ args }) {
    if (!args.length) return fail("usage: rmdir directory ...");
    let err = "";
    for (const d of args) {
      const abs = this.resolve(d);
      const node = this.fs.get(abs);
      if (!node) err += `rmdir: ${d}: No such file or directory\n`;
      else if (node.type !== "dir") err += `rmdir: ${d}: Not a directory\n`;
      else if (Object.keys(node.children).length) err += `rmdir: ${d}: Directory not empty\n`;
      else this.fs.remove(abs);
    }
    return { out: "", err, code: err ? 1 : 0 };
  },

  cp({ args }) {
    return withFlags("cp", args, "rRiv", "cp [-r] source_file target_file\n       cp [-r] source_file ... target_directory", (flags, paths) => {
      if (paths.length < 2) return fail("usage: cp [-r] source_file target_file\n       cp [-r] source_file ... target_directory");
      const dest = paths[paths.length - 1];
      const destAbs = this.resolve(dest);
      const sources = paths.slice(0, -1);
      const destIsDir = this.fs.isDir(destAbs);
      if (sources.length > 1 && !destIsDir) return fail(`cp: ${dest} is not a directory`);
      let err = "";
      for (const s of sources) {
        const node = this.fs.get(this.resolve(s));
        if (!node) {
          err += `cp: ${s}: No such file or directory\n`;
          continue;
        }
        if (node.type === "dir" && !(flags.has("r") || flags.has("R"))) {
          err += `cp: ${s} is a directory (not copied).\n`;
          continue;
        }
        const target = destIsDir ? `${destAbs === "/" ? "" : destAbs}/${basename(this.resolve(s))}` : destAbs;
        if (node.type === "dir" && (target === this.resolve(s) || target.startsWith(this.resolve(s) + "/"))) {
          err += `cp: ${s}: can't copy a folder into itself\n`;
          continue;
        }
        try {
          this.fs.parentDir(target, dest);
          this.fs.put(target, node);
          const copied = this.fs.get(target)!;
          copied.mtime = Date.now();
        } catch (e) {
          err += `cp: ${e instanceof Error ? e.message : e}\n`;
        }
      }
      return { out: "", err, code: err ? 1 : 0 };
    });
  },

  mv({ args }) {
    return withFlags("mv", args, "fiv", "mv source target\n       mv source ... directory", (_flags, paths) => {
      if (paths.length < 2) return fail("usage: mv source target\n       mv source ... directory");
      const dest = paths[paths.length - 1];
      const destAbs = this.resolve(dest);
      const sources = paths.slice(0, -1);
      const destIsDir = this.fs.isDir(destAbs);
      if (sources.length > 1 && !destIsDir) return fail(`mv: ${dest} is not a directory`);
      let err = "";
      for (const s of sources) {
        const srcAbs = this.resolve(s);
        const node = this.fs.get(srcAbs);
        if (!node) {
          err += `mv: rename ${s} to ${dest}: No such file or directory\n`;
          continue;
        }
        const target = destIsDir ? `${destAbs === "/" ? "" : destAbs}/${basename(srcAbs)}` : destAbs;
        if (target === srcAbs) continue;
        if (node.type === "dir" && target.startsWith(srcAbs + "/")) {
          err += `mv: rename ${s} to ${dest}: Invalid argument\n`;
          continue;
        }
        try {
          this.fs.parentDir(target, dest);
          this.fs.put(target, node);
          this.fs.remove(srcAbs);
          if (this.cwd === srcAbs || this.cwd.startsWith(srcAbs + "/")) {
            this.cwd = target + this.cwd.slice(srcAbs.length);
            this.env.PWD = this.cwd;
          }
        } catch (e) {
          err += `mv: rename ${s} to ${dest}: ${e instanceof Error ? e.message.replace(/^.*?: /, "") : e}\n`;
        }
      }
      return { out: "", err, code: err ? 1 : 0 };
    });
  },

  grep({ args, stdin }) {
    return withFlags("grep", args, "inrRlvcwEHh", "grep [-inrvcl] pattern [file ...]", (flags, rest) => {
      if (!rest.length) return fail("usage: grep [-inrvcl] pattern [file ...]", 2);
      const [pattern, ...files] = rest;
      let re: RegExp;
      try {
        const source = flags.has("w") ? `\\b(?:${pattern})\\b` : pattern;
        re = new RegExp(source, flags.has("i") ? "i" : "");
      } catch {
        re = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), flags.has("i") ? "i" : "");
      }
      const recursive = flags.has("r") || flags.has("R");
      const sources: { label: string; text: string }[] = [];
      let err = "";
      if (files.length === 0) {
        if (recursive) files.push(".");
        else sources.push({ label: "(standard input)", text: stdin ?? "" });
      }
      for (const f of files) {
        const abs = this.resolve(f);
        const node = this.fs.get(abs);
        if (!node) err += `grep: ${f}: No such file or directory\n`;
        else if (node.type === "dir") {
          if (!recursive) err += `grep: ${f}: Is a directory\n`;
          else
            for (const p of this.fs.walk(abs)) {
              const n = this.fs.get(p);
              if (n?.type === "file") sources.push({ label: f === "." ? p.slice(abs.length + 1) : f.replace(/\/$/, "") + p.slice(abs.length), text: n.content });
            }
        } else sources.push({ label: f, text: node.content });
      }
      const showName = (sources.length > 1 || recursive) && !flags.has("h");
      let out = "";
      let matched = false;
      for (const s of sources) {
        const hits = lines(s.text)
          .map((l, i) => ({ l, n: i + 1 }))
          .filter(({ l }) => re.test(l) !== flags.has("v"));
        if (hits.length) matched = true;
        if (flags.has("l")) {
          if (hits.length) out += s.label + "\n";
        } else if (flags.has("c")) out += `${showName ? s.label + ":" : ""}${hits.length}\n`;
        else
          for (const { l, n } of hits) out += `${showName ? s.label + ":" : ""}${flags.has("n") ? n + ":" : ""}${l}\n`;
      }
      return { out, err, code: err ? 2 : matched ? 0 : 1 };
    });
  },

  find({ args }) {
    const paths: string[] = [];
    let i = 0;
    while (i < args.length && !args[i].startsWith("-")) paths.push(args[i++]);
    if (!paths.length) paths.push(".");
    let name: RegExp | null = null;
    let type: "f" | "d" | null = null;
    while (i < args.length) {
      const flag = args[i++];
      const value = args[i++];
      if (value === undefined) return fail(`find: ${flag}: requires additional arguments`);
      if (flag === "-name") name = globToRegex(value);
      else if (flag === "-iname") name = new RegExp(globToRegex(value).source, "i");
      else if (flag === "-type") {
        if (value !== "f" && value !== "d") return fail(`find: -type: ${value}: unknown type`);
        type = value;
      } else return fail(`find: ${flag}: unknown primary or operator`);
    }
    let out = "";
    let err = "";
    for (const p of paths) {
      const abs = this.resolve(p);
      if (!this.fs.get(abs)) {
        err += `find: ${p}: No such file or directory\n`;
        continue;
      }
      for (const found of this.fs.walk(abs)) {
        const node = this.fs.get(found)!;
        if (type === "f" && node.type !== "file") continue;
        if (type === "d" && node.type !== "dir") continue;
        if (name && !name.test(basename(found))) continue;
        out += (p.replace(/\/$/, "") || "/") + found.slice(abs === "/" ? 0 : abs.length) + "\n";
      }
    }
    return { out, err, code: err ? 1 : 0 };
  },

  wc({ args, stdin }) {
    return withFlags("wc", args, "lwcm", "wc [-lwc] [file ...]", (flags, files) => {
      const pick = flags.size ? flags : new Set(["l", "w", "c"]);
      const count = (text: string) => {
        const parts: string[] = [];
        if (pick.has("l")) parts.push(String((text.match(/\n/g) ?? []).length).padStart(8));
        if (pick.has("w")) parts.push(String(text.split(/\s+/).filter(Boolean).length).padStart(8));
        if (pick.has("c") || pick.has("m")) parts.push(String(new TextEncoder().encode(text).length).padStart(8));
        return parts.join("");
      };
      if (!files.length) return ok(count(stdin ?? "") + "\n");
      let out = "";
      let err = "";
      for (const f of files) {
        try {
          out += `${count(this.fs.read(this.resolve(f), f))} ${f}\n`;
        } catch (e) {
          err += `wc: ${e instanceof Error ? e.message : e}\n`;
        }
      }
      return { out, err, code: err ? 1 : 0 };
    });
  },

  sort({ args, stdin }) {
    return withFlags("sort", args, "rnuf", "sort [-rnu] [file ...]", (flags, files) => {
      const { text, err } = readInputs(this, "sort", files, stdin);
      let ls = lines(text);
      if (flags.has("n")) ls.sort((a, b) => (parseFloat(a) || 0) - (parseFloat(b) || 0) || a.localeCompare(b));
      else if (flags.has("f")) ls.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
      else ls.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
      if (flags.has("r")) ls.reverse();
      if (flags.has("u")) ls = ls.filter((l, i) => i === 0 || l !== ls[i - 1]);
      return { out: joinLines(ls), err, code: err ? 1 : 0 };
    });
  },

  uniq({ args, stdin }) {
    return withFlags("uniq", args, "cd", "uniq [-c] [file]", (flags, files) => {
      const { text, err } = readInputs(this, "uniq", files, stdin);
      const groups: { line: string; n: number }[] = [];
      for (const l of lines(text)) {
        const last = groups[groups.length - 1];
        if (last && last.line === l) last.n++;
        else groups.push({ line: l, n: 1 });
      }
      const kept = flags.has("d") ? groups.filter((g) => g.n > 1) : groups;
      const out = joinLines(kept.map((g) => (flags.has("c") ? `${String(g.n).padStart(4)} ${g.line}` : g.line)));
      return { out, err, code: err ? 1 : 0 };
    });
  },

  history() {
    return ok(joinLines(this.history.map((c, i) => `${String(i + 1).padStart(5)}  ${c}`)));
  },

  man({ args }) {
    if (!args[0]) return fail("What manual page do you want?\nFor example, try 'man ls'.");
    const page = MAN[args[0]];
    return page ? ok(page + "\n") : fail(`No manual entry for ${args[0]}`);
  },

  help() {
    return ok(
      [
        "Commands on this practice Mac (try `man <command>` for details):",
        "  navigate   pwd  ls  cd  tree",
        "  read       cat  head  tail  less",
        "  files      mkdir  touch  echo  cp  mv  rm  rmdir",
        "  search     grep  find  wc  sort  uniq",
        "  system     chmod  sudo  whoami  date  history  clear  man",
        "  shell      export  env  printenv  unset  alias  unalias  which  sh",
        "  desktop    open <app or site>   (e.g. open safari)",
        "Use | to pipe, > to write a file, >> to append.",
      ].join("\n") + "\n",
    );
  },

  chmod({ args }) {
    if (args.length < 2) return fail("usage: chmod mode file ...");
    const [spec, ...files] = args;
    let err = "";
    for (const f of files) {
      const node = this.fs.get(this.resolve(f));
      if (!node) {
        err += `chmod: ${f}: No such file or directory\n`;
        continue;
      }
      const mode = applyChmod(node.mode, spec);
      if (mode === null) return fail(`chmod: Invalid file mode: ${spec}`);
      node.mode = mode;
    }
    return { out: "", err, code: err ? 1 : 0 };
  },

  // Runs the command as "root". There's no password on this practice Mac.
  sudo({ args, stdin, tty }) {
    if (!args.length) return fail("usage: sudo command");
    const [name, ...rest] = args;
    const before = this.env.USER;
    this.env.USER = "root";
    try {
      return this.execCommand(name, { args: rest, stdin, tty });
    } finally {
      this.env.USER = before;
    }
  },

  export({ args }) {
    if (!args.length) return ok(joinLines(Object.entries(this.env).map(([k, v]) => `${k}=${v}`)));
    for (const a of args) {
      const [name, ...rest] = a.split("=");
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) return fail(`export: not valid in this context: ${name}`);
      if (rest.length) this.env[name] = rest.join("=");
      else if (name in this.vars) this.env[name] = this.vars[name];
      delete this.vars[name];
    }
    return ok();
  },

  env() {
    return ok(joinLines(Object.entries(this.env).map(([k, v]) => `${k}=${v}`)));
  },

  printenv({ args }) {
    if (!args.length) return ok(joinLines(Object.entries(this.env).map(([k, v]) => `${k}=${v}`)));
    const v = this.env[args[0]];
    return v === undefined ? { out: "", err: "", code: 1 } : ok(v + "\n");
  },

  unset({ args }) {
    for (const a of args) {
      delete this.env[a];
      delete this.vars[a];
    }
    return ok();
  },

  alias({ args }) {
    if (!args.length) return ok(joinLines(Object.entries(this.aliases).map(([k, v]) => `${k}='${v}'`)));
    let out = "";
    for (const a of args) {
      const eq = a.indexOf("=");
      if (eq === -1) {
        if (this.aliases[a] !== undefined) out += `${a}='${this.aliases[a]}'\n`;
        else return { out, err: "", code: 1 };
      } else this.aliases[a.slice(0, eq)] = a.slice(eq + 1);
    }
    return ok(out);
  },

  unalias({ args }) {
    let err = "";
    for (const a of args) {
      if (this.aliases[a] === undefined) err += `unalias: no such hash table element: ${a}\n`;
      delete this.aliases[a];
    }
    return { out: "", err, code: err ? 1 : 0 };
  },

  which({ args }) {
    if (!args.length) return fail("usage: which command ...");
    let out = "";
    let code = 0;
    for (const a of args) {
      if (this.aliases[a] !== undefined) out += `${a}: aliased to ${this.aliases[a]}\n`;
      else if (BUILTINS.has(a)) out += `${a}: shell built-in command\n`;
      else if (COMMANDS[a]) out += `/bin/${a}\n`;
      else {
        out += `${a} not found\n`;
        code = 1;
      }
    }
    return { out, err: "", code };
  },

  type({ args }) {
    let out = "";
    let code = 0;
    for (const a of args) {
      if (this.aliases[a] !== undefined) out += `${a} is an alias for ${this.aliases[a]}\n`;
      else if (BUILTINS.has(a)) out += `${a} is a shell builtin\n`;
      else if (COMMANDS[a]) out += `${a} is /bin/${a}\n`;
      else {
        out += `${a} not found\n`;
        code = 1;
      }
    }
    return { out, err: "", code };
  },

  tree({ args }) {
    const start = args[0] ?? ".";
    const abs = this.resolve(start);
    if (!this.fs.isDir(abs)) return fail(`${start} [error opening dir]`);
    let dirs = 0;
    let files = 0;
    const out: string[] = [start];
    const walk = (path: string, prefix: string) => {
      const names = this.fs.list(path).filter((n) => !n.startsWith("."));
      names.forEach((n, i) => {
        const last = i === names.length - 1;
        const child = `${path === "/" ? "" : path}/${n}`;
        const node = this.fs.get(child)!;
        out.push(`${prefix}${last ? "└── " : "├── "}${n}`);
        if (node.type === "dir") {
          dirs++;
          walk(child, prefix + (last ? "    " : "│   "));
        } else files++;
      });
    };
    walk(abs, "");
    out.push("", `${dirs} director${dirs === 1 ? "y" : "ies"}, ${files} file${files === 1 ? "" : "s"}`);
    return ok(joinLines(out));
  },

  sh({ args }) {
    if (!args.length) return fail("sh: interactive shells aren't available here. Try: sh script.sh");
    return this.runScriptFile(args[0], args.slice(1), false);
  },

  bash(ctx) {
    return COMMANDS.sh.call(this, ctx);
  },

  zsh(ctx) {
    return COMMANDS.sh.call(this, ctx);
  },

  source({ args }) {
    if (!args.length) return fail("source: not enough arguments");
    return this.runScriptFile(args[0], args.slice(1), false);
  },

  open({ args }) {
    if (!args.length) return fail("usage: open <app, file or website>");
    const message = this.host.open ? this.host.open(args.join(" ")) : "open: opening apps isn't available here";
    return message ? fail(message) : ok();
  },

  exit() {
    return ok("logout\n\n[Process completed] (the window stays open on this practice Mac)\n");
  },
};

function headTail(this: Shell, name: "head" | "tail", args: string[], stdin: string | null): Result {
  let n = 10;
  const files: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "-n") n = parseInt(args[++i] ?? "", 10);
    else if (/^-n\d+$/.test(a)) n = parseInt(a.slice(2), 10);
    else if (/^-\d+$/.test(a)) n = parseInt(a.slice(1), 10);
    else files.push(a);
  }
  if (Number.isNaN(n)) return fail(`${name}: illegal line count`);
  const { text, err } = readInputs(this, name, files, stdin);
  const ls = lines(text);
  const picked = name === "head" ? ls.slice(0, n) : ls.slice(Math.max(0, ls.length - n));
  return { out: joinLines(picked), err, code: err ? 1 : 0 };
}
