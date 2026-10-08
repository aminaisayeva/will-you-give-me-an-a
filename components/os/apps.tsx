"use client";

import type { ComponentType } from "react";
import AboutOSWindow from "@/components/windows/AboutOSWindow";
import AboutWindow from "@/components/windows/AboutWindow";
import CalendarWindow from "@/components/windows/CalendarWindow";
import ContactWindow from "@/components/windows/ContactWindow";
import EducationWindow from "@/components/windows/EducationWindow";
import FilesWindow from "@/components/windows/FilesWindow";
import HelpWindow from "@/components/windows/HelpWindow";
import MailWindow from "@/components/windows/MailWindow";
import PhotosWindow from "@/components/windows/PhotosWindow";
import SafariWindow from "@/components/windows/SafariWindow";
import SettingsWindow from "@/components/windows/SettingsWindow";
import SudokuWindow from "@/components/windows/SudokuWindow";
import TerminalWindow from "@/components/windows/TerminalWindow";
import TextViewerWindow from "@/components/windows/TextViewerWindow";
import TranscriptWindow from "@/components/windows/TranscriptWindow";
import TrashWindow from "@/components/windows/TrashWindow";
import type { WindowId } from "@/lib/os/store";

export type AppInfo = {
  title: string;
  glyph: string;
  tile: string; // CSS background for the dock / desktop icon
  size: { width: number; height: number };
  component: ComponentType | null; // null: rendered specially (Grade Request)
};

const g = (from: string, to: string) => `linear-gradient(180deg, ${from} 0%, ${to} 100%)`;

export const APPS: Record<WindowId, AppInfo> = {
  grade: { title: "Grade Request", glyph: "\u{1F170}️", tile: g("#ff7a7a", "#e5383b"), size: { width: 430, height: 300 }, component: null },
  safari: { title: "Safari", glyph: "\u{1F310}", tile: g("#67d1ff", "#1d6ff2"), size: { width: 1040, height: 700 }, component: SafariWindow },
  mail: { title: "Mail", glyph: "\u{1F4E7}", tile: g("#4facfe", "#0757c9"), size: { width: 1000, height: 640 }, component: MailWindow },
  settings: { title: "System Settings", glyph: "⚙️", tile: g("#e3e3e8", "#8e8e98"), size: { width: 780, height: 540 }, component: SettingsWindow },
  transcript: { title: "final_grade.pdf", glyph: "\u{1F4C4}", tile: g("#ffffff", "#d9d9de"), size: { width: 700, height: 640 }, component: TranscriptWindow },
  terminal: { title: "Terminal", glyph: "\u{1F5A5}️", tile: g("#3a3a3c", "#0b0b0c"), size: { width: 760, height: 460 }, component: TerminalWindow },
  about: { title: "About Me", glyph: "\u{1F469}‍\u{1F4BB}", tile: g("#7ef07e", "#0fbd2e"), size: { width: 620, height: 520 }, component: AboutWindow },
  "about-os": { title: "About AminaOS", glyph: "\u{1F4BB}", tile: g("#a8a8ff", "#5856d6"), size: { width: 620, height: 560 }, component: AboutOSWindow },
  contact: { title: "Contact", glyph: "\u{1F4EE}", tile: g("#ffb340", "#ff8a00"), size: { width: 500, height: 440 }, component: ContactWindow },
  education: { title: "Education", glyph: "\u{1F393}", tile: g("#ffe14d", "#f4b400"), size: { width: 660, height: 540 }, component: EducationWindow },
  files: { title: "Files", glyph: "\u{1F4C1}", tile: g("#7cc4ff", "#2f8cf0"), size: { width: 720, height: 500 }, component: FilesWindow },
  "text-viewer": { title: "Text Viewer", glyph: "\u{1F4DD}", tile: g("#fffbe8", "#f4d35e"), size: { width: 620, height: 460 }, component: TextViewerWindow },
  help: { title: "AminaOS Help", glyph: "❓", tile: g("#9fb4ff", "#5b6cf0"), size: { width: 680, height: 560 }, component: HelpWindow },
  calendar: { title: "Calendar", glyph: "\u{1F4C5}", tile: g("#ffffff", "#e8e8ed"), size: { width: 900, height: 620 }, component: CalendarWindow },
  photos: { title: "Photos", glyph: "\u{1F4F8}", tile: "conic-gradient(from 40deg, #ff5e5e, #ffb340, #ffe14d, #6fd66f, #4dc4ff, #b06ffb, #ff5e9d, #ff5e5e)", size: { width: 820, height: 600 }, component: PhotosWindow },
  sudoku: { title: "Sudoku", glyph: "\u{1F522}", tile: g("#c9b8ff", "#8e6cf0"), size: { width: 560, height: 660 }, component: SudokuWindow },
  trash: { title: "Trash", glyph: "\u{1F5D1}️", tile: g("rgba(255,255,255,0.55)", "rgba(190,196,205,0.55)"), size: { width: 560, height: 440 }, component: TrashWindow },
};

export const DOCK: WindowId[] = ["safari", "mail", "terminal", "calendar", "photos", "files", "settings"];

export type DesktopIcon = { id: string; label: string; open: WindowId; params?: Record<string, string>; glyph: string; locked?: boolean };

export const DESKTOP_ICONS: DesktopIcon[] = [
  { id: "grade", label: "Grade Request.app", open: "grade", glyph: "\u{1F170}️" },
  { id: "transcript", label: "final_grade.pdf", open: "transcript", glyph: "\u{1F4C4}", locked: true },
  { id: "safari", label: "Build a Website", open: "safari", glyph: "\u{1F310}" },
  { id: "files", label: "Files", open: "files", glyph: "\u{1F4C1}" },
  { id: "about", label: "About Me", open: "about", glyph: "\u{1F469}‍\u{1F4BB}" },
  { id: "education", label: "Education", open: "education", glyph: "\u{1F393}" },
  { id: "contact", label: "Contact", open: "contact", glyph: "\u{1F4EE}" },
  { id: "terminal", label: "Terminal", open: "terminal", glyph: "\u{1F5A5}️" },
  { id: "settings", label: "Settings", open: "settings", glyph: "⚙️" },
  { id: "human", label: "definitely_human.txt", open: "text-viewer", params: { file: "definitely_human.txt" }, glyph: "\u{1F5D2}️" },
];
