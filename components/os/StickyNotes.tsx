"use client";

import { X } from "lucide-react";
import { useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { useAccount } from "@/components/os/AccountContext";
import { LESSONS } from "@/lib/course/curriculum";
import { useProgress } from "@/lib/course/progress";
import { useOS } from "@/lib/os/store";
import { useMounted } from "@/lib/os/use-mounted";

// Which welcome notes this browser has closed. Kept in localStorage; the
// Help menu's "Show Welcome Notes" brings them back.
const KEY = "terminal-academy:notes-closed";
const listeners = new Set<() => void>();
let cache: string | null = null;

function read() {
  if (cache === null) {
    try {
      cache = window.localStorage.getItem(KEY) ?? "[]";
    } catch {
      cache = "[]";
    }
  }
  return cache;
}

function writeClosed(ids: string[]) {
  cache = JSON.stringify(ids);
  try {
    window.localStorage.setItem(KEY, cache);
  } catch {
    /* keep in memory */
  }
  listeners.forEach((l) => l());
}

export function showWelcomeNotes() {
  writeClosed([]);
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

type Note = { id: string; color: string; tilt: number; title: string; body: ReactNode; action?: ReactNode };

export default function StickyNotes() {
  const mounted = useMounted();
  const account = useAccount();
  const completed = useProgress((s) => s.completed);
  const closedJson = useSyncExternalStore(subscribe, read, () => "[]");
  const closed: string[] = JSON.parse(closedJson);
  const [moved, setMoved] = useState<Record<string, { x: number; y: number }>>({});
  const drag = useRef<{ id: string; sx: number; sy: number; ox: number; oy: number } | null>(null);

  if (!mounted) return null;

  const openAcademy = () => useOS.getState().openWindow("academy");
  const doneCount = LESSONS.filter((l) => completed.includes(l.id)).length;
  const button = "mt-3 inline-block rounded-md bg-black/80 px-3 py-1 text-[12px] font-semibold text-white hover:bg-black";

  const notes: Note[] = [
    {
      id: "welcome",
      color: "#fff59d",
      tilt: -2,
      title: "👋 Welcome to Terminal Academy",
      body: (
        <>
          This is a pretend Mac that lives in your browser. You’ll learn to use the <b>terminal</b>, from your very first <code>ls</code> to
          writing your own scripts. Nothing you type here can break anything, so experiment!
        </>
      ),
    },
    {
      id: "start",
      color: "#c5f5c0",
      tilt: 1.5,
      title: "→ Start here",
      body: (
        <>
          Open <b>Terminal Academy</b> (the purple icon on the right, or the first app in the Dock). Each lesson explains one idea, then you try
          it in a real-feeling terminal. <b>Module 1 is free, no account needed.</b>
        </>
      ),
      action: (
        <button type="button" onClick={openAcademy} className={button}>
          Open Terminal Academy
        </button>
      ),
    },
    account
      ? {
          id: "progress",
          color: "#ffd0e0",
          tilt: -1,
          title: `Welcome back, ${account.firstName || account.name}!`,
          body: (
            <>
              You’ve finished <b>{doneCount}</b> of {LESSONS.length} lessons. Your progress is saved to your account, so it follows you to any
              device. Finish everything to earn your A on <b>final_grade.pdf</b>.
            </>
          ),
          action: (
            <button type="button" onClick={openAcademy} className={button}>
              {doneCount ? "Continue where I left off" : "Start lesson 1"}
            </button>
          ),
        }
      : {
          id: "signin",
          color: "#ffd0e0",
          tilt: -1,
          title: "🔑 Save your progress",
          body: (
            <>
              Click <b>Sign In</b> at the top right of the screen to create a free account. It unlocks <b>Modules 2–7</b> and saves your progress.
              Anything you finish as a guest comes with you.
            </>
          ),
          action: (
            <a href="/login" className={button}>
              Sign In
            </a>
          ),
        },
  ];

  const visible = notes.filter((n) => !closed.includes(n.id));
  if (!visible.length) return null;

  const narrow = window.innerWidth < 640;
  const width = narrow ? Math.min(250, window.innerWidth - 130) : 260;
  const defaults = (i: number) => (narrow ? { x: 10, y: 40 + i * 175 } : { x: 28 + (i % 2) * 18, y: 48 + i * 196 });

  const onPointerDown = (id: string, x: number, y: number) => (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button, a")) return;
    drag.current = { id, sx: e.clientX, sy: e.clientY, ox: x, oy: y };
    const move = (ev: PointerEvent) => {
      const d = drag.current;
      if (!d) return;
      setMoved((m) => ({
        ...m,
        [d.id]: {
          x: Math.min(window.innerWidth - 80, Math.max(0, d.ox + ev.clientX - d.sx)),
          y: Math.min(window.innerHeight - 80, Math.max(30, d.oy + ev.clientY - d.sy)),
        },
      }));
    };
    const up = () => {
      drag.current = null;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  return (
    <div className="pointer-events-none fixed inset-0" style={{ zIndex: 2 }}>
      {visible.map((note, i) => {
        const pos = moved[note.id] ?? defaults(i);
        return (
          <article
            key={note.id}
            onPointerDown={onPointerDown(note.id, pos.x, pos.y)}
            className="pointer-events-auto absolute touch-none select-none rounded-sm p-4 pt-3 text-[13px] leading-snug text-gray-900 shadow-[0_10px_25px_rgba(0,0,0,0.35)]"
            style={{
              left: pos.x,
              top: pos.y,
              width,
              background: note.color,
              transform: `rotate(${note.tilt}deg)`,
              fontFamily: '"Marker Felt", "Chalkboard SE", "Comic Sans MS", ui-rounded, system-ui, sans-serif',
              animation: "dialog-pop 0.35s ease",
            }}
          >
            <button
              type="button"
              onClick={() => writeClosed([...closed, note.id])}
              aria-label={`Close note: ${note.title}`}
              className="absolute right-1.5 top-1.5 rounded p-0.5 text-black/40 hover:bg-black/10 hover:text-black/70"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <h2 className="pr-5 text-[15px] font-bold">{note.title}</h2>
            <p className="mt-1.5 [&_code]:rounded [&_code]:bg-black/10 [&_code]:px-1 [&_code]:font-mono [&_code]:text-[12px]">{note.body}</p>
            {note.action}
          </article>
        );
      })}
    </div>
  );
}
