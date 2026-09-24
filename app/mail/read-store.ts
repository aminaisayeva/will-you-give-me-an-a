// Per-viewer "read" markers for inbox emails, kept in localStorage.
// The shared database stays read-only for the public except for sending.
const KEY = "will-you-give-me-an-a:mail:read";
const listeners = new Set<() => void>();
let cache: string | null = null;

function read(): string {
  if (cache !== null) return cache;
  try {
    cache = window.localStorage.getItem(KEY) ?? "[]";
  } catch {
    cache = "[]";
  }
  return cache;
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const getSnapshot = () => read();
export const getServerSnapshot = () => "[]";

export function markRead(id: string) {
  const ids = new Set<string>(JSON.parse(read()));
  if (ids.has(id)) return;
  ids.add(id);
  cache = JSON.stringify([...ids]);
  try {
    window.localStorage.setItem(KEY, cache);
  } catch {
    /* storage unavailable: keep in memory only */
  }
  listeners.forEach((l) => l());
}
