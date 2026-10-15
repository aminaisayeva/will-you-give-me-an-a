// Where to send someone after signing in (e.g. back to cooked.ai). Set in the
// browser just before a Google sign-in or email sign-up; read once by the
// server. Only same-site paths are allowed.
export const RETURN_TO_COOKIE = "post_auth_redirect";

export function safeReturnPath(value: string | undefined | null): string | null {
  if (!value) return null;
  const path = decodeURIComponent(value);
  return path.startsWith("/") && !path.startsWith("//") && !path.includes("\\") && path.length < 200 ? path : null;
}

export function rememberReturnTo(path: string) {
  document.cookie = `${RETURN_TO_COOKIE}=${encodeURIComponent(path)}; path=/; max-age=900; samesite=lax`;
}
