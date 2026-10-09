// An in-memory, serialisable file system for the practice shell.

export type FileNode = { type: "file"; content: string; mode: number; mtime: number };
export type DirNode = { type: "dir"; children: Record<string, FsNode>; mode: number; mtime: number };
export type FsNode = FileNode | DirNode;

export const DEFAULT_FILE_MODE = 0o644;
export const DEFAULT_DIR_MODE = 0o755;

export class FsError extends Error {}

export function dir(children: Record<string, FsNode> = {}, mode = DEFAULT_DIR_MODE): DirNode {
  return { type: "dir", children, mode, mtime: Date.now() };
}

export function file(content = "", mode = DEFAULT_FILE_MODE): FileNode {
  return { type: "file", content, mode, mtime: Date.now() };
}

// Normalise `path` against `cwd` into an absolute path ("/a/b"). Handles
// ~, ., .. and repeated slashes.
export function resolvePath(cwd: string, path: string, home: string): string {
  let raw = path;
  if (raw === "~" || raw.startsWith("~/")) raw = home + raw.slice(1);
  if (!raw.startsWith("/")) raw = `${cwd}/${raw}`;
  const parts: string[] = [];
  for (const part of raw.split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") parts.pop();
    else parts.push(part);
  }
  return "/" + parts.join("/");
}

export function basename(path: string) {
  const parts = path.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? "/";
}

export function dirname(path: string) {
  const parts = path.split("/").filter(Boolean);
  parts.pop();
  return "/" + parts.join("/");
}

export class FileSystem {
  constructor(public root: DirNode) {}

  static fromJSON(json: string): FileSystem {
    return new FileSystem(JSON.parse(json) as DirNode);
  }

  toJSON(): string {
    return JSON.stringify(this.root);
  }

  clone(): FileSystem {
    return FileSystem.fromJSON(this.toJSON());
  }

  get(path: string): FsNode | null {
    let node: FsNode = this.root;
    for (const part of path.split("/").filter(Boolean)) {
      if (node.type !== "dir") return null;
      const next: FsNode | undefined = node.children[part];
      if (!next) return null;
      node = next;
    }
    return node;
  }

  isDir(path: string) {
    return this.get(path)?.type === "dir";
  }

  isFile(path: string) {
    return this.get(path)?.type === "file";
  }

  parentDir(path: string, label = path): DirNode {
    const parent = this.get(dirname(path));
    if (!parent) throw new FsError(`${label}: No such file or directory`);
    if (parent.type !== "dir") throw new FsError(`${label}: Not a directory`);
    return parent;
  }

  read(path: string, label = path): string {
    const node = this.get(path);
    if (!node) throw new FsError(`${label}: No such file or directory`);
    if (node.type === "dir") throw new FsError(`${label}: Is a directory`);
    if (!(node.mode & 0o400)) throw new FsError(`${label}: Permission denied`);
    return node.content;
  }

  write(path: string, content: string, append = false, label = path) {
    const existing = this.get(path);
    if (existing?.type === "dir") throw new FsError(`${label}: Is a directory`);
    if (existing) {
      if (!(existing.mode & 0o200)) throw new FsError(`${label}: Permission denied`);
      existing.content = append ? existing.content + content : content;
      existing.mtime = Date.now();
      return;
    }
    const parent = this.parentDir(path, label);
    parent.children[basename(path)] = file(content);
    parent.mtime = Date.now();
  }

  mkdir(path: string, parents = false, label = path) {
    if (parents) {
      let current = "";
      for (const part of path.split("/").filter(Boolean)) {
        current += `/${part}`;
        const node = this.get(current);
        if (node?.type === "file") throw new FsError(`${label}: Not a directory`);
        if (!node) this.parentDir(current, label).children[part] = dir();
      }
      return;
    }
    if (this.get(path)) throw new FsError(`${label}: File exists`);
    const parent = this.parentDir(path, label);
    parent.children[basename(path)] = dir();
    parent.mtime = Date.now();
  }

  remove(path: string) {
    const parent = this.parentDir(path);
    delete parent.children[basename(path)];
    parent.mtime = Date.now();
  }

  // Put a (deep-copied) node at `path`, replacing whatever was there.
  put(path: string, node: FsNode) {
    const parent = this.parentDir(path);
    parent.children[basename(path)] = JSON.parse(JSON.stringify(node)) as FsNode;
    parent.mtime = Date.now();
  }

  list(path: string): string[] {
    const node = this.get(path);
    if (!node || node.type !== "dir") return [];
    return Object.keys(node.children).sort((a, b) => a.localeCompare(b));
  }

  // Every path under `path` (including itself), depth first.
  walk(path: string): string[] {
    const node = this.get(path);
    if (!node) return [];
    if (node.type === "file") return [path];
    const out = [path];
    for (const name of this.list(path)) out.push(...this.walk(path === "/" ? `/${name}` : `${path}/${name}`));
    return out;
  }
}

// Build a directory tree from a compact description:
// { "notes.txt": "hello", "projects/": { "a.txt": "x" } }
export type Seed = { [name: string]: string | Seed };

export function seedDir(seed: Seed): DirNode {
  const children: Record<string, FsNode> = {};
  for (const [rawName, value] of Object.entries(seed)) {
    const name = rawName.replace(/\/$/, "");
    children[name] = typeof value === "string" ? file(value) : seedDir(value);
  }
  return dir(children);
}

export function modeString(node: FsNode) {
  const bits = node.mode;
  const triplet = (shift: number) =>
    `${bits & (0o4 << shift) ? "r" : "-"}${bits & (0o2 << shift) ? "w" : "-"}${bits & (0o1 << shift) ? "x" : "-"}`;
  return `${node.type === "dir" ? "d" : "-"}${triplet(6)}${triplet(3)}${triplet(0)}`;
}
