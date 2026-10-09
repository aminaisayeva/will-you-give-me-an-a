import type { Seed } from "@/lib/shell/fs";
import type { Shell } from "@/lib/shell/shell";

export type Task = {
  // What to do, in one short sentence. `backticks` render as code.
  text: string;
  check: (sh: Shell) => boolean;
};

export type Lesson = {
  id: string; // e.g. "1-2-pwd"; stable, used to save progress
  title: string;
  // Explanation paragraphs shown above the tasks. Supports `code` and **bold**.
  intro: string[];
  // Example commands shown as a "Try it" box (optional).
  examples?: { command: string; note: string }[];
  // Files and folders in the learner's home folder for this lesson.
  seed: Seed;
  // Folder (relative to home) the terminal starts in. Default: home.
  startIn?: string;
  tasks: Task[];
  // Progressive hints, shown one at a time. The last one may give the answer.
  hints: string[];
  // One or two sentences shown when the lesson is complete.
  recap: string;
  // Commands that complete every task, in order. Used by tests (and could
  // power a "show me" button). Not shown by default.
  solution: string[];
};

export type Module = {
  id: number;
  title: string;
  summary: string;
  free: boolean; // guests can take free modules
  lessons: Lesson[];
};
