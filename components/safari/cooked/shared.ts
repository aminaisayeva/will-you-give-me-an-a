"use client";

import { useSyncExternalStore } from "react";

// The four caption voices, as shown to people (must match CAPTION_STYLES in
// lib/gemini.ts).
export const VOICES = [
  { style: "Chronically Online", emoji: "\u{1F480}", line: "Speaks fluent meme." },
  { style: "Midwest Mom", emoji: "\u{1F33D}", line: "Proud, worried, sending casserole." },
  { style: "Real New Yorker", emoji: "\u{1F5FD}", line: "Unimpressed. Has seen worse." },
  { style: "Columbia Tour Guide", emoji: "\u{1F981}", line: "Makes everything sound prestigious." },
];

// Has this browser seen the cooked.ai welcome screen? (localStorage)
const KEY = "cooked:welcomed";
const listeners = new Set<() => void>();
let cache: string | null = null;

function read() {
  if (cache === null) {
    try {
      cache = window.localStorage.getItem(KEY) ?? "";
    } catch {
      cache = "";
    }
  }
  return cache;
}

export function setWelcomed(seen: boolean) {
  cache = seen ? "1" : "";
  try {
    if (seen) window.localStorage.setItem(KEY, "1");
    else window.localStorage.removeItem(KEY);
  } catch {
    /* keep in memory */
  }
  listeners.forEach((l) => l());
}

export function useWelcomed() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => read() === "1",
    () => true,
  );
}

// Resize in the browser before uploading: smaller files upload faster and
// cost far fewer AI tokens. Returns a JPEG no larger than 1280px.
export async function shrink(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1280 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("encode"))), "image/jpeg", 0.85),
  );
}

export const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2";
