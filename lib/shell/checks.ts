// Helpers lessons use to check what the learner did. Paths are relative to
// the learner's home folder unless they start with "/".

import type { FsNode } from "./fs";
import type { CommandRecord, Shell } from "./shell";

const abs = (sh: Shell, path: string) => (path.startsWith("/") ? path : `${sh.home}/${path}`.replace(/\/$/, ""));

export const node = (sh: Shell, path: string): FsNode | null => sh.fs.get(abs(sh, path));
export const exists = (sh: Shell, path: string) => node(sh, path) !== null;
export const isDir = (sh: Shell, path: string) => node(sh, path)?.type === "dir";
export const isFile = (sh: Shell, path: string) => node(sh, path)?.type === "file";

export function content(sh: Shell, path: string): string | null {
  const n = node(sh, path);
  return n?.type === "file" ? n.content : null;
}

export const fileIncludes = (sh: Shell, path: string, text: string) => (content(sh, path) ?? "").includes(text);

export function fileLines(sh: Shell, path: string): string[] {
  const c = content(sh, path);
  if (c === null || c === "") return [];
  return (c.endsWith("\n") ? c.slice(0, -1) : c).split("\n");
}

export function children(sh: Shell, path: string): string[] {
  const n = node(sh, path);
  return n?.type === "dir" ? Object.keys(n.children).sort() : [];
}

export const isExecutable = (sh: Shell, path: string) => {
  const n = node(sh, path);
  return n?.type === "file" && Boolean(n.mode & 0o100);
};

export const modeIs = (sh: Shell, path: string, mode: number) => (node(sh, path)?.mode ?? -1) === mode;

// Is the learner currently in `path`? ("" or "~" means home.)
export const cwdIs = (sh: Shell, path: string) => sh.cwd === (path === "" || path === "~" ? sh.home : abs(sh, path));

// Did a command named `name` run successfully (optionally matching `test`)?
export const ran = (sh: Shell, name: string, test?: (r: CommandRecord) => boolean) =>
  sh.log.some((r) => r.name === name && r.exit === 0 && (!test || test(r)));

// Did the learner type a line matching `re`?
export const typed = (sh: Shell, re: RegExp) => sh.log.some((r) => re.test(r.line));

// Did a successful command have a flag, e.g. hasFlag(r, "a") for `ls -la`?
export const hasFlag = (r: CommandRecord, flag: string) => r.args.some((a) => /^-[A-Za-z]+$/.test(a) && a.includes(flag));

// Did some command print `text` to the screen (or into a pipe)?
export const printed = (sh: Shell, text: string | RegExp) =>
  sh.log.some((r) => r.exit === 0 && (typeof text === "string" ? r.stdout.includes(text) : text.test(r.stdout)));

export const envIs = (sh: Shell, name: string, value?: string) =>
  value === undefined ? sh.env[name] !== undefined && sh.env[name] !== "" : sh.env[name] === value;

export const aliasIs = (sh: Shell, name: string, test?: (value: string) => boolean) =>
  sh.aliases[name] !== undefined && (!test || test(sh.aliases[name]));
