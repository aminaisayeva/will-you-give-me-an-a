// The lock screen (/login) is the first thing every browser session sees.
// Getting past it (signing in, continuing as yourself, or Guest User) sets
// this cookie. It has no max-age, so it disappears when the browser closes.
export const UNLOCK_COOKIE = "mac-unlocked";

export const unlockCookieOptions = {
  path: "/",
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};
