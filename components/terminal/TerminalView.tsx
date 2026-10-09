"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { BUILTINS, type OutputLine, type Shell } from "@/lib/shell/shell";

type Line = OutputLine | { kind: "in"; prompt: string; text: string };

export type TerminalHandle = {
  // Put text on the prompt (e.g. from a "Try it" example) and focus.
  insert: (text: string) => void;
  focus: () => void;
};

const COMMAND_NAMES = [
  "cat", "cd", "chmod", "clear", "cp", "date", "echo", "env", "export", "find", "grep", "head", "help", "history",
  "less", "ls", "man", "mkdir", "mv", "open", "printenv", "pwd", "rm", "rmdir", "sh", "sort", "sudo", "tail", "touch",
  "tree", "type", "uniq", "unset", "wc", "which", "whoami", "alias", "unalias",
];

// Render text that may contain the ANSI colours `ls` uses.
function Ansi({ text }: { text: string }) {
  const parts: { text: string; className: string }[] = [];
  let className = "";
  let last = 0;
  const re = /\x1b\[([0-9;]*)m/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push({ text: text.slice(last, m.index), className });
    const code = m[1];
    className = code === "1;34" ? "font-bold text-sky-400" : code === "1;32" ? "font-bold text-green-400" : "";
    last = re.lastIndex;
  }
  if (last < text.length) parts.push({ text: text.slice(last), className });
  return (
    <>
      {parts.map((p, i) => (
        <span key={i} className={p.className}>
          {p.text}
        </span>
      ))}
    </>
  );
}

function commonPrefix(words: string[]) {
  if (!words.length) return "";
  let prefix = words[0];
  for (const w of words) while (!w.startsWith(prefix)) prefix = prefix.slice(0, -1);
  return prefix;
}

// A terminal screen wired to a Shell. `onCommand` runs after every line so
// lessons can re-check their tasks; `onChange` is for saving state.
const TerminalView = forwardRef<
  TerminalHandle,
  {
    shell: Shell;
    greeting?: string[];
    disabled?: boolean;
    onCommand?: () => void;
    className?: string;
  }
>(function TerminalView({ shell, greeting = [], disabled, onCommand, className = "" }, ref) {
  const [lines, setLines] = useState<Line[]>(() => greeting.map((text) => ({ text, kind: "out" as const })));
  const [input, setInput] = useState("");
  const [cursor, setCursor] = useState<number | null>(null);
  const [prompt, setPrompt] = useState(() => shell.prompt());
  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    insert: (text) => {
      setInput(text);
      inputRef.current?.focus();
    },
    focus: () => inputRef.current?.focus(),
  }));

  useEffect(() => {
    outputRef.current?.scrollTo({ top: outputRef.current.scrollHeight });
  }, [lines]);

  const submit = () => {
    const raw = input;
    setInput("");
    setCursor(null);
    const echoed: Line = { kind: "in", prompt, text: raw };
    const { lines: out, clear } = shell.run(raw);
    setLines((l) => (clear ? [] : [...l, echoed, ...out].slice(-800)));
    setPrompt(shell.prompt());
    onCommand?.();
  };

  const complete = () => {
    const words = input.split(/\s+/);
    const current = words[words.length - 1] ?? "";
    let options: string[];
    let base = "";
    if (words.length <= 1) {
      options = [...COMMAND_NAMES, ...Object.keys(shell.aliases), ...BUILTINS].filter((c) => c.startsWith(current));
      options = [...new Set(options)].sort();
    } else {
      const slash = current.lastIndexOf("/");
      base = slash >= 0 ? current.slice(0, slash + 1) : "";
      const partial = current.slice(slash + 1);
      const dir = shell.resolve(base || ".");
      options = shell.fs
        .list(dir)
        .filter((n) => n.startsWith(partial) && (partial.startsWith(".") || !n.startsWith(".")))
        .map((n) => (shell.fs.isDir(`${dir === "/" ? "" : dir}/${n}`) ? `${n}/` : n));
    }
    if (options.length === 0) return;
    const head = words.slice(0, -1).join(" ");
    const prefix = head ? `${head} ` : "";
    if (options.length === 1) {
      const done = options[0];
      setInput(`${prefix}${base}${done}${done.endsWith("/") ? "" : " "}`);
    } else {
      const common = commonPrefix(options);
      if (common.length > current.length - base.length) setInput(`${prefix}${base}${common}`);
      else setLines((l) => [...l, { kind: "in", prompt, text: input }, { kind: "out", text: options.join("  ") }]);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const history = shell.history;
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    } else if (e.key === "Tab") {
      e.preventDefault();
      complete();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!history.length) return;
      const next = cursor === null ? history.length - 1 : Math.max(0, cursor - 1);
      setCursor(next);
      setInput(history[next]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (cursor === null) return;
      const next = cursor + 1;
      setCursor(next >= history.length ? null : next);
      setInput(next >= history.length ? "" : history[next]);
    } else if (e.ctrlKey && e.key.toLowerCase() === "c") {
      e.preventDefault();
      setLines((l) => [...l, { kind: "in", prompt, text: `${input}^C` }]);
      setInput("");
    } else if (e.ctrlKey && e.key.toLowerCase() === "l") {
      e.preventDefault();
      setLines([]);
    } else if (e.ctrlKey && e.key.toLowerCase() === "a") {
      e.preventDefault();
      e.currentTarget.setSelectionRange(0, 0);
    } else if (e.ctrlKey && e.key.toLowerCase() === "e") {
      e.preventDefault();
      const end = e.currentTarget.value.length;
      e.currentTarget.setSelectionRange(end, end);
    }
  };

  return (
    <div
      className={`relative h-full cursor-text bg-[#1e1e1e] font-mono text-[12.5px] leading-[1.5] text-gray-200 ${className}`}
      onClick={() => {
        if (!window.getSelection()?.toString()) inputRef.current?.focus();
      }}
    >
      <div ref={outputRef} className="absolute inset-0 overflow-y-auto px-3 py-2 select-text">
        {lines.map((line, i) =>
          line.kind === "in" ? (
            <div key={i} className="whitespace-pre-wrap break-words">
              <span className="text-green-400">{line.prompt}</span> {line.text}
            </div>
          ) : (
            <div key={i} className={`whitespace-pre-wrap break-words ${line.kind === "err" ? "text-red-400" : ""}`}>
              {line.text ? <Ansi text={line.text} /> : " "}
            </div>
          ),
        )}
        <div className="flex items-center">
          <span className="shrink-0 whitespace-pre text-green-400">{prompt} </span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setCursor(null);
            }}
            onKeyDown={onKeyDown}
            disabled={disabled}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            aria-label="Terminal input"
            className="min-w-0 flex-1 bg-transparent text-gray-100 caret-green-400 outline-none disabled:opacity-50"
          />
        </div>
      </div>
    </div>
  );
});

export default TerminalView;
