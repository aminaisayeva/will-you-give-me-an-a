"use client";

import { Check, ChevronRight, Lightbulb, ListChecks, Lock, PanelLeft, RotateCcw, Sparkles } from "lucide-react";
import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import { useAccount } from "@/components/os/AccountContext";
import TerminalView, { type TerminalHandle } from "@/components/terminal/TerminalView";
import { LESSONS, MODULES } from "@/lib/course/curriculum";
import { useProgress } from "@/lib/course/progress";
import { createLessonShell, lessonComplete } from "@/lib/course/sandbox";
import type { Lesson, Module } from "@/lib/course/types";
import { useOS } from "@/lib/os/store";
import type { Shell } from "@/lib/shell/shell";

const LAST_LESSON_KEY = "terminal-academy:lesson";

// `code` and **bold** in lesson text.
function Rich({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("`") && p.endsWith("`") ? (
          <code key={i} className="rounded bg-gray-100 px-1 py-px font-mono text-[0.92em] text-pink-700">
            {p.slice(1, -1)}
          </code>
        ) : p.startsWith("**") && p.endsWith("**") ? (
          <strong key={i}>{p.slice(2, -2)}</strong>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        ),
      )}
    </>
  );
}

const moduleOf = (lesson: Lesson) => MODULES.find((m) => m.lessons.some((l) => l.id === lesson.id))!;

function readLastLesson(): string | null {
  try {
    return window.localStorage.getItem(LAST_LESSON_KEY);
  } catch {
    return null;
  }
}

// Terminal Academy: lessons on the left, a live sandbox terminal on the right.
export default function AcademyWindow() {
  const account = useAccount();
  const completed = useProgress((s) => s.completed);
  const complete = useProgress((s) => s.complete);
  const user = (account?.firstName || "student").toLowerCase().replace(/[^a-z0-9._-]/g, "") || "student";

  const [lessonId, setLessonId] = useState(() => {
    const last = readLastLesson();
    return LESSONS.some((l) => l.id === last) ? last! : LESSONS[0].id;
  });
  // One sandbox per lesson for this session, so switching back keeps your work.
  const [shells] = useState(() => new Map<string, Shell>());
  const [shell, setShell] = useState<Shell>(() => {
    const l = LESSONS.find((x) => x.id === lessonId)!;
    const s = createLessonShell(l, user);
    shells.set(l.id, s);
    return s;
  });
  const [, setVersion] = useState(0);
  // Remounts the terminal screen when you switch lessons or reset one.
  const [screen, setScreen] = useState(0);
  const [hints, setHints] = useState(0);
  const [sidebar, setSidebar] = useState(false);
  const terminalRef = useRef<TerminalHandle>(null);

  const lesson = LESSONS.find((l) => l.id === lessonId)!;
  const mod = moduleOf(lesson);
  const locked = !mod.free && !account;
  const done = completed.includes(lesson.id);
  const results = lesson.tasks.map((t) => t.check(shell));
  const index = LESSONS.findIndex((l) => l.id === lesson.id);
  const next = LESSONS[index + 1] as Lesson | undefined;
  const nextLocked = next ? !moduleOf(next).free && !account : false;

  useEffect(() => {
    try {
      window.localStorage.setItem(LAST_LESSON_KEY, lessonId);
    } catch {
      /* ignore */
    }
  }, [lessonId]);

  const open = (id: string) => {
    const l = LESSONS.find((x) => x.id === id);
    if (!l) return;
    let s = shells.get(id);
    if (!s) {
      s = createLessonShell(l, user);
      shells.set(id, s);
    }
    setLessonId(id);
    setShell(s);
    setScreen((n) => n + 1);
    setHints(0);
    setSidebar(false);
  };

  const resetLesson = () => {
    const s = createLessonShell(lesson, user);
    shells.set(lesson.id, s);
    setShell(s);
    setScreen((n) => n + 1);
    setHints(0);
  };

  const onCommand = () => {
    setVersion((v) => v + 1);
    if (!locked && lessonComplete(lesson, shell)) complete(lesson.id);
  };

  const total = LESSONS.length;
  const doneCount = LESSONS.filter((l) => completed.includes(l.id)).length;

  const sidebarContent = (
    <nav className="flex h-full flex-col">
      <div className="border-b border-black/10 px-4 py-3">
        <p className="flex items-center gap-1.5 text-[13px] font-bold text-gray-900">
          <Sparkles className="h-4 w-4 text-indigo-500" /> Terminal Academy
        </p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/10">
          <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${(doneCount / total) * 100}%` }} />
        </div>
        <p className="mt-1 text-[11px] text-gray-500">
          {doneCount} of {total} lessons complete
        </p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {MODULES.map((m) => (
          <ModuleList key={m.id} module={m} current={lesson.id} completed={completed} locked={!m.free && !account} onOpen={open} />
        ))}
      </div>
      {!account && (
        <div className="border-t border-black/10 p-3 text-[11px] text-gray-500">
          Module 1 is free. <a href="/login" className="font-medium text-indigo-600 hover:underline">Sign in</a> to unlock the rest and save progress.
        </div>
      )}
    </nav>
  );

  return (
    <div className="@container relative flex h-full bg-white text-gray-900">
      {/* Sidebar: always visible on wide windows, a drawer on narrow ones */}
      <aside className="hidden w-60 shrink-0 border-r border-black/10 bg-[#f5f5f7] @3xl:block">{sidebarContent}</aside>
      {sidebar && (
        <div className="absolute inset-0 z-20 flex @3xl:hidden">
          <aside className="w-64 border-r border-black/10 bg-[#f5f5f7] shadow-2xl">{sidebarContent}</aside>
          <button type="button" aria-label="Close lessons" className="flex-1 bg-black/20" onClick={() => setSidebar(false)} />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col @2xl:flex-row">
        {/* Lesson */}
        <section className="flex max-h-[55%] min-h-0 flex-col border-b border-black/10 @2xl:max-h-none @2xl:w-[22rem] @2xl:shrink-0 @2xl:border-b-0 @2xl:border-r @5xl:w-[26rem]">
          <header className="flex shrink-0 items-center gap-2 border-b border-black/5 px-4 py-2">
            <button type="button" onClick={() => setSidebar(true)} aria-label="Show lessons" className="rounded p-1 text-gray-500 hover:bg-black/5 @3xl:hidden">
              <PanelLeft className="h-4 w-4" />
            </button>
            <p className="truncate text-[11px] font-semibold uppercase tracking-wider text-indigo-600">
              Module {mod.id} · {mod.title}
            </p>
            <span className="ml-auto shrink-0 text-[11px] text-gray-400">
              {mod.lessons.findIndex((l) => l.id === lesson.id) + 1}/{mod.lessons.length}
            </span>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-3">
            <h1 className="text-[20px] font-bold leading-tight">{lesson.title}</h1>

            {locked ? (
              <LockedCard firstParagraph={lesson.intro[0]} />
            ) : (
              <>
                <div className="mt-2 space-y-2 text-[13.5px] leading-relaxed text-gray-700">
                  {lesson.intro.map((p, i) => (
                    <p key={i}>
                      <Rich text={p} />
                    </p>
                  ))}
                </div>

                {lesson.examples && lesson.examples.length > 0 && (
                  <div className="mt-4 rounded-xl border border-black/10 bg-[#fafafa] p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Try it (click to paste)</p>
                    <ul className="mt-2 space-y-1.5">
                      {lesson.examples.map((ex) => (
                        <li key={ex.command}>
                          <button
                            type="button"
                            onClick={() => terminalRef.current?.insert(ex.command)}
                            className="group flex w-full items-baseline gap-2 text-left"
                          >
                            <code className="shrink-0 rounded bg-gray-900 px-1.5 py-0.5 font-mono text-[12px] text-green-300 group-hover:bg-gray-700">
                              {ex.command}
                            </code>
                            <span className="text-[12px] text-gray-500">
                              <Rich text={ex.note} />
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-4">
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                    <ListChecks className="h-3.5 w-3.5" /> Your tasks
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {lesson.tasks.map((t, i) => (
                      <li
                        key={i}
                        className={`flex items-start gap-2 rounded-lg px-2.5 py-2 text-[13px] ${
                          results[i] ? "bg-green-50 text-green-900" : "bg-gray-50 text-gray-800"
                        }`}
                      >
                        <span
                          className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                            results[i] ? "border-green-500 bg-green-500 text-white" : "border-gray-300 bg-white"
                          }`}
                        >
                          {results[i] && <Check className="h-3 w-3" strokeWidth={3} />}
                        </span>
                        <span>
                          <Rich text={t.text} />
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {results.every(Boolean) ? (
                  <div className="mt-4 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 p-4 text-white shadow-md" style={{ animation: "dialog-pop 0.3s ease" }}>
                    <p className="text-[14px] font-bold">Lesson complete! 🎉</p>
                    <p className="mt-1 text-[13px] text-white/90">
                      <Rich text={lesson.recap} />
                    </p>
                    {next ? (
                      nextLocked ? (
                        <div className="mt-3 rounded-lg bg-white/15 p-3 text-[12px]">
                          You finished the free module. <strong>Sign in</strong> to unlock Modules 2–7. Your progress comes with you.
                          <a href="/login" className="mt-2 block w-fit rounded-md bg-white px-3 py-1 text-[12px] font-semibold text-emerald-700">
                            Sign In to Continue
                          </a>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => open(next.id)}
                          className="mt-3 flex items-center gap-1 rounded-md bg-white px-3 py-1.5 text-[13px] font-semibold text-emerald-700 hover:bg-green-50"
                        >
                          Next: {next.title} <ChevronRight className="h-4 w-4" />
                        </button>
                      )
                    ) : (
                      <button
                        type="button"
                        onClick={() => useOS.getState().openWindow("transcript")}
                        className="mt-3 rounded-md bg-white px-3 py-1.5 text-[13px] font-semibold text-emerald-700 hover:bg-green-50"
                      >
                        You finished the course! Open your transcript →
                      </button>
                    )}
                  </div>
                ) : (
                  <Hints hints={lesson.hints} shown={hints} onMore={() => setHints((h) => Math.min(h + 1, lesson.hints.length))} />
                )}

                <div className="mt-5 flex items-center gap-3 text-[12px] text-gray-500">
                  {done && (
                    <span className="flex items-center gap-1 text-green-700">
                      <Check className="h-3.5 w-3.5" /> Completed before
                    </span>
                  )}
                  <button type="button" onClick={resetLesson} className="ml-auto flex items-center gap-1 hover:text-gray-800">
                    <RotateCcw className="h-3.5 w-3.5" /> Reset this lesson’s files
                  </button>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Terminal */}
        <section className="relative min-h-0 min-w-0 flex-1">
          <TerminalView
            key={screen}
            ref={terminalRef}
            shell={shell}
            disabled={locked}
            greeting={locked ? [] : [`Lesson: ${lesson.title}`, "Type your commands here. Your tasks update as you go."]}
            onCommand={onCommand}
          />
          {locked && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 p-6 text-center text-white">
              <div>
                <Lock className="mx-auto h-8 w-8" />
                <p className="mt-2 text-[14px] font-semibold">This module needs an account</p>
                <a href="/login" className="mt-3 inline-block rounded-md bg-white px-3 py-1 text-[13px] font-semibold text-gray-900">
                  Sign In
                </a>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function ModuleList({
  module,
  current,
  completed,
  locked,
  onOpen,
}: {
  module: Module;
  current: string;
  completed: string[];
  locked: boolean;
  onOpen: (id: string) => void;
}) {
  const doneHere = module.lessons.filter((l) => completed.includes(l.id)).length;
  return (
    <div className="mb-2">
      <p className="flex items-center gap-1.5 px-2 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
        {locked && <Lock className="h-3 w-3" />}
        <span className="truncate">
          {module.id}. {module.title}
        </span>
        <span className="ml-auto font-normal normal-case tracking-normal text-gray-400">
          {doneHere}/{module.lessons.length}
        </span>
      </p>
      <ul>
        {module.lessons.map((l) => {
          const isDone = completed.includes(l.id);
          const active = l.id === current;
          return (
            <li key={l.id}>
              <button
                type="button"
                onClick={() => onOpen(l.id)}
                className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] ${
                  active ? "bg-indigo-500 text-white" : "text-gray-800 hover:bg-black/5"
                }`}
              >
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[9px] ${
                    isDone ? (active ? "border-white bg-white text-indigo-600" : "border-green-500 bg-green-500 text-white") : active ? "border-white/70" : "border-gray-300"
                  }`}
                >
                  {isDone && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
                </span>
                <span className={`truncate ${locked && !active ? "text-gray-400" : ""}`}>{l.title}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Hints({ hints, shown, onMore }: { hints: string[]; shown: number; onMore: () => void }) {
  return (
    <div className="mt-4">
      {hints.slice(0, shown).map((h, i) => (
        <p key={i} className="mb-1.5 flex gap-2 rounded-lg bg-amber-50 px-2.5 py-2 text-[12.5px] text-amber-900">
          <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            <Rich text={h} />
          </span>
        </p>
      ))}
      {shown < hints.length && (
        <button type="button" onClick={onMore} className="flex items-center gap-1 text-[12px] font-medium text-amber-700 hover:underline">
          <Lightbulb className="h-3.5 w-3.5" /> {shown === 0 ? "Stuck? Show a hint" : "Show another hint"} ({shown}/{hints.length})
        </button>
      )}
    </div>
  );
}

function LockedCard({ firstParagraph }: { firstParagraph?: string }): ReactNode {
  return (
    <div className="mt-3">
      {firstParagraph && (
        <p className="text-[13.5px] leading-relaxed text-gray-500">
          <Rich text={firstParagraph} />
        </p>
      )}
      <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50 p-4">
        <p className="flex items-center gap-1.5 text-[14px] font-semibold text-indigo-900">
          <Lock className="h-4 w-4" /> Sign in to unlock Modules 2–7
        </p>
        <p className="mt-1 text-[12.5px] text-indigo-900/80">
          Module 1 is free for everyone. A free account unlocks the rest of the course and saves your progress on any device. Anything you finished as a guest comes with you.
        </p>
        <a href="/login" className="mt-3 inline-flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-1.5 text-[13px] font-semibold text-white hover:bg-indigo-500">
          Sign In or Create Account
        </a>
      </div>
    </div>
  );
}
