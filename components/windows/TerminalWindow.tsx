"use client";

import { useState } from "react";
import { useAccount } from "@/components/os/AccountContext";
import TerminalView from "@/components/terminal/TerminalView";
import { documentFiles } from "@/data/aminaos/documentFiles";
import { FileSystem, seedDir, type Seed } from "@/lib/shell/fs";
import { Shell, type ShellHost, type ShellSnapshot } from "@/lib/shell/shell";
import { isWindowId, useOS, type WindowId } from "@/lib/os/store";

// The free-play Terminal: the same shell as Terminal Academy, over a home
// folder that's saved in this browser.
const STORAGE_KEY = "terminal-academy:playground";

const README = `Welcome to the Terminal playground.

Everything here is pretend, so you can't break anything. Your files are
saved in this browser.

New to the terminal? Open Terminal Academy (it's on the desktop and in the
Dock) for step-by-step lessons.

Try:
  ls                 see what's here
  cd Documents       go into a folder
  cat ../README.md   read a file
  help               list every command
  open safari        open an app
`;

const BOOKMARKS = `cooked.ai            the photo roast thing everyone's on
websitemaker.com     ??? found this at 3am. type an idea, it builds the site. don't tell anyone.
`;

const APP_NAMES: Record<string, WindowId> = {
  academy: "academy",
  "terminal academy": "academy",
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
  transcript: "transcript",
  "final_grade.pdf": "transcript",
  "grade request": "grade",
};

function seed(): Seed {
  return {
    "README.md": README,
    ".safari_bookmarks": BOOKMARKS,
    "Desktop/": {
      "definitely_human.txt": "i am definitely human.\nproof: i procrastinated this assignment.\nan AI would have finished early.\n",
    },
    "Documents/": Object.fromEntries(documentFiles.map((f) => [f.name, f.content.endsWith("\n") ? f.content : `${f.content}\n`])),
    "Projects/": {},
  };
}

const host: ShellHost = {
  open(target) {
    const { openWindow } = useOS.getState();
    const key = target.toLowerCase().replace(/\.app$/, "");
    if (APP_NAMES[key]) {
      openWindow(APP_NAMES[key]);
      return null;
    }
    if (isWindowId(key)) {
      openWindow(key);
      return null;
    }
    const doc = documentFiles.find((f) => f.name === target.split("/").pop());
    if (doc) {
      openWindow("text-viewer", { file: doc.name });
      return null;
    }
    if (/^[\w-]+(\.[\w-]+)+$/.test(target)) {
      openWindow("safari", { url: target });
      return null;
    }
    return `The file ${target} does not exist.`;
  },
};

function load(user: string): Shell {
  const shell = new Shell(new FileSystem(seedDir({ "Users/": { [`${user}/`]: seed() }, "tmp/": {} })), { user, host });
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const snap = JSON.parse(raw) as ShellSnapshot;
      if (snap.env?.USER === user) shell.restore(snap);
    }
  } catch {
    /* start fresh */
  }
  return shell;
}

function save(shell: Shell) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(shell.snapshot()));
  } catch {
    /* storage full or unavailable */
  }
}

export default function TerminalWindow() {
  const account = useAccount();
  const user = (account?.firstName || "guest").toLowerCase().replace(/[^a-z0-9._-]/g, "") || "guest";
  // Windows only open in the browser (after mount), so reading localStorage
  // while creating the shell is safe.
  const [shell] = useState(() => load(user));

  return (
    <TerminalView
      shell={shell}
      greeting={[`Last login: ${new Date().toDateString()} on ttys000`, "Type 'help' for commands, or open Terminal Academy for lessons."]}
      onCommand={() => save(shell)}
    />
  );
}
