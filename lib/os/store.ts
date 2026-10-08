"use client";

import { create } from "zustand";

// Every app that can open as a window on the desktop.
export const WINDOW_IDS = [
  "grade",
  "safari",
  "mail",
  "settings",
  "transcript",
  "terminal",
  "about",
  "about-os",
  "contact",
  "education",
  "files",
  "text-viewer",
  "help",
  "calendar",
  "photos",
  "sudoku",
  "trash",
] as const;

export type WindowId = (typeof WINDOW_IDS)[number];

export function isWindowId(value: unknown): value is WindowId {
  return typeof value === "string" && (WINDOW_IDS as readonly string[]).includes(value);
}

export type WindowState = {
  open: boolean;
  minimized: boolean;
  zIndex: number;
  // Bumped every time the window is (re)opened, so apps can react to a new
  // request such as "open Safari at this URL".
  openCount: number;
  // Small per-window arguments, e.g. { url } for Safari or { pane } for Settings.
  params: Record<string, string>;
};

type OSStore = {
  windows: Record<WindowId, WindowState>;
  focused: WindowId | null;
  nextZ: number;
  spotlightOpen: boolean;
  darkMode: boolean;

  openWindow: (id: WindowId, params?: Record<string, string>) => void;
  closeWindow: (id: WindowId) => void;
  minimizeWindow: (id: WindowId) => void;
  focusWindow: (id: WindowId) => void;
  setSpotlight: (open: boolean) => void;
  toggleDarkMode: () => void;
};

const closed = (): WindowState => ({ open: false, minimized: false, zIndex: 10, openCount: 0, params: {} });

export const useOS = create<OSStore>((set) => ({
  windows: Object.fromEntries(WINDOW_IDS.map((id) => [id, closed()])) as Record<WindowId, WindowState>,
  focused: null,
  nextZ: 20,
  spotlightOpen: false,
  darkMode: false,

  // Opening (or re-clicking an icon) always brings the window to the front and
  // restores it if it was minimized.
  openWindow: (id, params) =>
    set((s) => ({
      windows: {
        ...s.windows,
        [id]: {
          ...s.windows[id],
          open: true,
          minimized: false,
          zIndex: s.nextZ,
          openCount: s.windows[id].openCount + 1,
          params: params ?? s.windows[id].params,
        },
      },
      focused: id,
      nextZ: s.nextZ + 1,
    })),

  closeWindow: (id) =>
    set((s) => ({
      windows: { ...s.windows, [id]: { ...s.windows[id], open: false, minimized: false, params: {} } },
      focused: s.focused === id ? null : s.focused,
    })),

  // Yellow button: hide the window but keep it running; its icon restores it.
  minimizeWindow: (id) =>
    set((s) => ({
      windows: { ...s.windows, [id]: { ...s.windows[id], minimized: true } },
      focused: s.focused === id ? null : s.focused,
    })),

  focusWindow: (id) =>
    set((s) =>
      s.focused === id
        ? s
        : {
            windows: { ...s.windows, [id]: { ...s.windows[id], zIndex: s.nextZ } },
            focused: id,
            nextZ: s.nextZ + 1,
          },
    ),

  setSpotlight: (open) => set({ spotlightOpen: open }),
  toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
}));
