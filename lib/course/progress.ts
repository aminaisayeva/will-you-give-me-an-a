"use client";

import { create } from "zustand";
import { listProgress, resetProgress, saveProgress } from "@/app/actions/course";

// Completed lessons. Guests keep them in this browser; signed-in learners keep
// them in Supabase (course_progress). When a guest signs in, their browser
// progress is copied into the account.
const GUEST_KEY = "terminal-academy:progress";

function readGuest(): string[] {
  try {
    const raw = window.localStorage.getItem(GUEST_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function writeGuest(ids: string[]) {
  try {
    window.localStorage.setItem(GUEST_KEY, JSON.stringify(ids));
  } catch {
    /* storage unavailable */
  }
}

function clearGuest() {
  try {
    window.localStorage.removeItem(GUEST_KEY);
  } catch {
    /* storage unavailable */
  }
}

type ProgressStore = {
  completed: string[];
  loaded: boolean;
  signedIn: boolean;
  init: (signedIn: boolean) => Promise<void>;
  complete: (lessonId: string) => void;
  reset: () => Promise<void>;
};

export const useProgress = create<ProgressStore>((set, get) => ({
  completed: [],
  loaded: false,
  signedIn: false,

  init: async (signedIn) => {
    if (!signedIn) {
      set({ completed: readGuest(), loaded: true, signedIn: false });
      return;
    }
    const guest = readGuest();
    const saved = guest.length ? await saveProgress(guest) : await listProgress();
    if (saved) {
      if (guest.length) clearGuest();
      set({ completed: saved, loaded: true, signedIn: true });
    } else {
      // Session expired mid-way: fall back to guest progress.
      set({ completed: guest, loaded: true, signedIn: false });
    }
  },

  complete: (lessonId) => {
    const { completed, signedIn } = get();
    if (completed.includes(lessonId)) return;
    const next = [...completed, lessonId];
    set({ completed: next });
    if (signedIn) void saveProgress([lessonId]);
    else writeGuest(next);
  },

  reset: async () => {
    if (get().signedIn) await resetProgress();
    else clearGuest();
    set({ completed: [] });
  },
}));
