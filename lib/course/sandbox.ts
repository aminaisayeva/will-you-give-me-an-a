import { FileSystem, seedDir } from "@/lib/shell/fs";
import { Shell, type ShellHost } from "@/lib/shell/shell";
import type { Lesson } from "./types";

// A fresh shell for one lesson: the lesson's files in the learner's home.
export function createLessonShell(lesson: Lesson, user = "student", host?: ShellHost) {
  const fs = new FileSystem(seedDir({ "Users/": { [`${user}/`]: lesson.seed }, "tmp/": {} }));
  const shell = new Shell(fs, { user, host });
  if (lesson.startIn) shell.cwd = shell.resolve(lesson.startIn);
  shell.env.PWD = shell.cwd;
  return shell;
}

export const lessonComplete = (lesson: Lesson, shell: Shell) => lesson.tasks.every((t) => t.check(shell));
