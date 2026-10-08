"use client";

import { useEffect, useRef, useState } from "react";
import { useAccount } from "@/components/os/AccountContext";
import { listSites } from "@/app/actions/sites";
import { documentFiles } from "@/data/aminaos/documentFiles";
import { useOS, type WindowId } from "@/lib/os/store";

// A small, client-side shell over a virtual file system (ported from the
// AminaOS Go backend). Files either have text, open an app, or both.
type File = { kind: "file"; text?: string; app?: WindowId; params?: Record<string, string> };
type Dir = { kind: "dir"; children: Record<string, Node>; dynamic?: "sites" };
type Node = File | Dir;

const HOME = "/Users/guest";

const README = `Welcome to AminaOS, Grade Request Edition.

Try:
  ls                      look around
  cd Documents            go into a folder
  cat Desktop/definitely_human.txt
  open safari             open an app
  safari bodega-cats.nyc  build (or visit) any website with AI
  ls ~/Sites              see what people built
  help                    every command`;

const FS: Dir = {
  kind: "dir",
  children: {
    Users: {
      kind: "dir",
      children: {
        guest: {
          kind: "dir",
          children: {
            "README.md": { kind: "file", text: README },
            Desktop: {
              kind: "dir",
              children: {
                "Grade Request.app": { kind: "file", app: "grade" },
                "final_grade.pdf": { kind: "file", app: "transcript", text: "%PDF-1.7 (binary). Try: open final_grade.pdf" },
                "definitely_human.txt": {
                  kind: "file",
                  text: "i am definitely human.\nproof: i procrastinated this assignment.\nan AI would have finished early.",
                },
              },
            },
            Documents: {
              kind: "dir",
              children: Object.fromEntries(
                documentFiles.map((f) => [f.name, { kind: "file", text: f.content, app: "text-viewer", params: { file: f.name } } as File]),
              ),
            },
            Applications: {
              kind: "dir",
              children: {
                "Safari.app": { kind: "file", app: "safari" },
                "Mail.app": { kind: "file", app: "mail" },
                "Calendar.app": { kind: "file", app: "calendar" },
                "Photos.app": { kind: "file", app: "photos" },
                "Files.app": { kind: "file", app: "files" },
                "Sudoku.app": { kind: "file", app: "sudoku" },
                "System Settings.app": { kind: "file", app: "settings" },
                "Terminal.app": { kind: "file", app: "terminal" },
              },
            },
            Sites: { kind: "dir", children: {}, dynamic: "sites" },
            "about.txt": { kind: "file", app: "about", text: "About Amina. Try: open about" },
            "education.webloc": { kind: "file", app: "education" },
            "contact.webloc": { kind: "file", app: "contact" },
          },
        },
      },
    },
  },
};

// `open <name>` also accepts app names directly.
const APPS: Record<string, WindowId> = {
  safari: "safari",
  mail: "mail",
  calendar: "calendar",
  photos: "photos",
  files: "files",
  finder: "files",
  sudoku: "sudoku",
  settings: "settings",
  "system settings": "settings",
  terminal: "terminal",
  trash: "trash",
  help: "help",
  about: "about",
  education: "education",
  contact: "contact",
  transcript: "transcript",
  grade: "grade",
  "grade request": "grade",
};

const MAN: Record<string, string> = {
  ls: "ls [-la] [path] - list directory contents. -l shows details, -a shows hidden files.",
  cd: "cd [path] - change directory. `cd` or `cd ~` goes home, `cd ..` goes up.",
  cat: "cat [file] - print a file's contents.",
  open: "open [app|file|site] - open an app (open safari), a file, or a website (open bodega-cats.nyc).",
  safari: "safari [address or idea] - open Safari. If nobody has built that site yet, AI builds it.",
  grep: "grep [pattern] [file] - print lines of a file that contain pattern (case-insensitive).",
  pwd: "pwd - print the working directory.",
  history: "history - list the commands you've run.",
  clear: "clear - clear the screen.",
  whoami: "whoami - print your user name.",
  date: "date - print the date and time.",
  echo: "echo [text] - print text.",
  sudo: "sudo [command] - run a command as the professor. Use responsibly.",
};

const HELP = `Available commands:
  ls [-la] [path]     list directory contents
  cd [path]           change directory
  pwd                 print working directory
  cat [file]          display file contents
  open [app|file|site]  open an app, file or website
  safari [url|idea]   build or visit a website with AI
  grep [pattern] [file]  search a file
  man [command]       show the manual page
  history             command history
  clear               clear the terminal
  whoami · date · echo · sudo`;

function resolvePath(cwd: string, target: string) {
  const raw = target.startsWith("~") ? HOME + target.slice(1) : target.startsWith("/") ? target : `${cwd}/${target}`;
  const parts: string[] = [];
  for (const part of raw.split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") parts.pop();
    else parts.push(part);
  }
  return "/" + parts.join("/");
}

function lookup(path: string): Node | null {
  let node: Node = FS;
  for (const part of path.split("/").filter(Boolean)) {
    if (node.kind !== "dir") return null;
    const match: string | undefined = Object.keys(node.children).find((k) => k.toLowerCase() === part.toLowerCase());
    if (!match) return null;
    node = node.children[match];
  }
  return node;
}

function display(path: string) {
  return path === HOME ? "~" : path.startsWith(HOME + "/") ? "~" + path.slice(HOME.length) : path;
}

type Line = { kind: "in" | "out" | "err"; text: string };

export default function TerminalWindow() {
  const account = useAccount();
  const user = (account?.name.split(/\s+/)[0] ?? "guest").toLowerCase().replace(/[^a-z0-9._-]/g, "") || "guest";
  const [lines, setLines] = useState<Line[]>(() => [
    { kind: "out", text: `Last login: ${new Date().toDateString()} on ttys000` },
    { kind: "out", text: "Type 'help' for commands, or 'cat README.md' to get started." },
  ]);
  const [cwd, setCwd] = useState(HOME);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const prompt = `${user}@aminas-mac ${display(cwd)} %`;

  useEffect(() => {
    outputRef.current?.scrollTo({ top: outputRef.current.scrollHeight });
  }, [lines]);

  const print = (text: string, kind: Line["kind"] = "out") => setLines((l) => [...l, { kind, text }]);
  const open = (id: WindowId, params?: Record<string, string>) => useOS.getState().openWindow(id, params);

  const listDir = async (dir: Dir, flags: string) => {
    if (dir.dynamic === "sites") {
      setBusy(true);
      const result = await listSites("new");
      setBusy(false);
      if (result.error) return print(`ls: ${result.error}`, "err");
      if (result.sites.length === 0) return print("(empty) Nobody has built a site yet. Try: safari bodega-cats.nyc");
      return print(
        result.sites
          .map((s) => (flags.includes("l") ? `${String(s.score).padStart(4)} ▲  ${s.slug.padEnd(38)} ${s.title}` : s.slug))
          .join(flags.includes("l") ? "\n" : "    "),
      );
    }
    const names = Object.keys(dir.children).sort();
    const shown = flags.includes("a") ? [".", "..", ...names] : names;
    if (flags.includes("l")) {
      print(
        shown
          .map((n) => {
            const node = dir.children[n];
            const isDir = !node || node.kind === "dir";
            const size = node && node.kind === "file" ? (node.text?.length ?? 0) : 0;
            return `${isDir ? "drwxr-xr-x" : "-rw-r--r--"}  guest  staff  ${String(size).padStart(6)}  ${n}${isDir && node ? "/" : ""}`;
          })
          .join("\n"),
      );
    } else {
      print(shown.map((n) => (dir.children[n]?.kind === "dir" ? `${n}/` : n)).join("    "));
    }
  };

  const run = async (raw: string) => {
    const [cmdRaw, ...args] = raw.trim().split(/\s+/);
    const cmd = cmdRaw.toLowerCase();
    const rest = raw.trim().slice(cmdRaw.length).trim();

    switch (cmd) {
      case "help":
        return print(HELP);
      case "clear":
        return setLines([]);
      case "pwd":
        return print(cwd);
      case "whoami":
        return print(user);
      case "date":
        return print(new Date().toString());
      case "echo":
        return print(rest);
      case "history":
        return print([...history, raw].map((c, i) => `${String(i + 1).padStart(4)}  ${c}`).join("\n"));
      case "man": {
        if (!args[0]) return print("What manual page do you want?", "err");
        return print(MAN[args[0].toLowerCase()] ?? `No manual entry for ${args[0]}`, MAN[args[0].toLowerCase()] ? "out" : "err");
      }
      case "ls": {
        const flags = args.filter((a) => a.startsWith("-")).join("");
        const target = args.find((a) => !a.startsWith("-"));
        const path = target ? resolvePath(cwd, target) : cwd;
        const node = lookup(path);
        if (!node) return print(`ls: ${target}: No such file or directory`, "err");
        if (node.kind === "file") return print(target ?? path);
        return listDir(node, flags);
      }
      case "cd": {
        const path = resolvePath(cwd, args[0] ?? "~");
        const node = lookup(path);
        if (!node) return print(`cd: no such file or directory: ${args[0]}`, "err");
        if (node.kind !== "dir") return print(`cd: not a directory: ${args[0]}`, "err");
        return setCwd(path);
      }
      case "cat": {
        if (!args[0]) return print("cat: missing file operand", "err");
        const node = lookup(resolvePath(cwd, rest));
        if (!node) return print(`cat: ${rest}: No such file or directory`, "err");
        if (node.kind === "dir") return print(`cat: ${rest}: Is a directory`, "err");
        if (!node.text) return print(`cat: ${rest}: binary file. Try: open ${rest}`, "err");
        return print(node.text);
      }
      case "grep": {
        if (args.length < 2) return print("usage: grep [pattern] [file]", "err");
        const node = lookup(resolvePath(cwd, args.slice(1).join(" ")));
        if (!node || node.kind !== "file" || !node.text) return print(`grep: ${args.slice(1).join(" ")}: No such file or directory`, "err");
        const pattern = args[0].toLowerCase();
        const matches = node.text.split("\n").filter((l) => l.toLowerCase().includes(pattern));
        return print(matches.join("\n") || "(no matches)");
      }
      case "safari": {
        print(rest ? `Opening Safari: ${rest}` : "Opening Safari…");
        return open("safari", rest ? { url: rest } : undefined);
      }
      case "open": {
        if (!rest) return print("open: missing file operand", "err");
        const app = APPS[rest.toLowerCase().replace(/\.app$/, "")];
        if (app) {
          print(`Opening ${rest}…`);
          return open(app);
        }
        const node = lookup(resolvePath(cwd, rest));
        if (node?.kind === "file" && node.app) {
          print(`Opening ${rest}…`);
          return open(node.app, node.params);
        }
        if (node?.kind === "dir") return print(`open: ${rest} is a folder. Try: cd ${rest}`, "err");
        if (/^[\w-]+(\.[\w-]+)+$/.test(rest)) {
          print(`Opening ${rest} in Safari…`);
          return open("safari", { url: rest });
        }
        return print(`open: ${rest}: No application found`, "err");
      }
      case "sudo": {
        if (/give.*\ba\b|grade/i.test(rest)) {
          print("[sudo] password for professor: ********");
          print("Permission granted. Grade changed: A → A+");
          return open("grade");
        }
        return print(`${user} is not in the sudoers file. This incident will be reported to the professor.`, "err");
      }
      case "rm":
        return print("rm: Nice try. Files on this Mac are protected by the Honor Code.", "err");
      default:
        return print(`zsh: command not found: ${cmdRaw}. Type 'help' for commands.`, "err");
    }
  };

  const submit = async () => {
    const raw = input;
    setInput("");
    setCursor(null);
    setLines((l) => [...l, { kind: "in", text: `${prompt} ${raw}` }]);
    if (!raw.trim()) return;
    await run(raw);
    setHistory((h) => [...h, raw.trim()].slice(-100));
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (!busy) void submit();
    } else if (e.key === "ArrowUp" && history.length) {
      e.preventDefault();
      const next = cursor === null ? history.length - 1 : Math.max(0, cursor - 1);
      setCursor(next);
      setInput(history[next]);
    } else if (e.key === "ArrowDown" && cursor !== null) {
      e.preventDefault();
      const next = cursor + 1;
      if (next >= history.length) {
        setCursor(null);
        setInput("");
      } else {
        setCursor(next);
        setInput(history[next]);
      }
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      setLines([]);
    }
  };

  return (
    <div
      className="relative h-full cursor-text bg-[#1e1e1e]/[0.97] font-mono text-[12.5px] leading-[1.45] text-gray-200"
      onClick={() => inputRef.current?.focus()}
    >
      <div ref={outputRef} className="absolute inset-0 overflow-y-auto px-3 py-2">
        {lines.map((line, i) => (
          <pre
            key={i}
            className={`whitespace-pre-wrap break-words font-mono ${
              line.kind === "err" ? "text-red-400" : line.kind === "in" ? "text-green-400" : "text-gray-200"
            }`}
          >
            {line.text}
          </pre>
        ))}
        <div className="flex items-center">
          <span className="shrink-0 text-green-400">{prompt}&nbsp;</span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            autoFocus
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            aria-label="Terminal input"
            className="min-w-0 flex-1 bg-transparent text-gray-100 caret-green-400 outline-none"
          />
          {busy && <span className="ml-2 animate-pulse text-gray-500">…</span>}
        </div>
      </div>
    </div>
  );
}
