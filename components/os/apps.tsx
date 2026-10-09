"use client";

import {
  Award,
  SquareTerminal,
  Calendar,
  CircleHelp,
  FileText,
  Flame,
  Folder,
  Globe,
  GraduationCap,
  Grid3X3,
  Images,
  Mail,
  Monitor,
  Settings,
  Terminal,
  Trash2,
  User,
  type LucideIcon,
} from "lucide-react";
import type { ComponentType } from "react";
import AboutOSWindow from "@/components/windows/AboutOSWindow";
import AcademyWindow from "@/components/windows/AcademyWindow";
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

// Icons follow AminaOS: a white lucide icon on a solid colour tile.
export type AppInfo = {
  title: string;
  icon: LucideIcon;
  color: string; // Tailwind background class for the tile
  size: { width: number; height: number };
  component: ComponentType | null; // null: rendered specially (Grade Request)
};

export const APPS: Record<WindowId, AppInfo> = {
  academy: { title: "Terminal Academy", icon: SquareTerminal, color: "bg-gradient-to-br from-indigo-500 to-violet-600", size: { width: 1180, height: 720 }, component: AcademyWindow },
  grade: { title: "Grade Request", icon: Award, color: "bg-red-500", size: { width: 430, height: 300 }, component: null },
  safari: { title: "Safari", icon: Globe, color: "bg-orange-500", size: { width: 1040, height: 700 }, component: SafariWindow },
  mail: { title: "Mail", icon: Mail, color: "bg-blue-600", size: { width: 1000, height: 640 }, component: MailWindow },
  settings: { title: "System Settings", icon: Settings, color: "bg-gray-500", size: { width: 780, height: 540 }, component: SettingsWindow },
  transcript: { title: "final_grade.pdf", icon: FileText, color: "bg-red-500", size: { width: 700, height: 640 }, component: TranscriptWindow },
  terminal: { title: "Terminal", icon: Terminal, color: "bg-black", size: { width: 760, height: 460 }, component: TerminalWindow },
  about: { title: "About Me", icon: User, color: "bg-green-500", size: { width: 620, height: 520 }, component: AboutWindow },
  "about-os": { title: "About AminaOS", icon: Monitor, color: "bg-blue-500", size: { width: 620, height: 560 }, component: AboutOSWindow },
  contact: { title: "Contact", icon: Mail, color: "bg-orange-500", size: { width: 500, height: 440 }, component: ContactWindow },
  education: { title: "Education", icon: GraduationCap, color: "bg-yellow-500", size: { width: 660, height: 540 }, component: EducationWindow },
  files: { title: "Files", icon: Folder, color: "bg-blue-400", size: { width: 720, height: 500 }, component: FilesWindow },
  "text-viewer": { title: "Text Viewer", icon: FileText, color: "bg-gray-400", size: { width: 620, height: 460 }, component: TextViewerWindow },
  help: { title: "AminaOS Help", icon: CircleHelp, color: "bg-indigo-500", size: { width: 680, height: 560 }, component: HelpWindow },
  calendar: { title: "Calendar", icon: Calendar, color: "bg-red-500", size: { width: 900, height: 620 }, component: CalendarWindow },
  photos: { title: "Photos", icon: Images, color: "bg-yellow-500", size: { width: 820, height: 600 }, component: PhotosWindow },
  sudoku: { title: "Sudoku", icon: Grid3X3, color: "bg-purple-500", size: { width: 560, height: 660 }, component: SudokuWindow },
  trash: { title: "Trash", icon: Trash2, color: "bg-gray-500", size: { width: 560, height: 440 }, component: TrashWindow },
};

export const DOCK: WindowId[] = ["academy", "terminal", "safari", "mail", "calendar", "files", "settings"];

export type DesktopIcon = {
  id: string;
  label: string;
  open: WindowId;
  params?: Record<string, string>;
  icon: LucideIcon;
  color: string;
  locked?: boolean;
};

export const DESKTOP_ICONS: DesktopIcon[] = [
  { id: "academy", label: "Terminal Academy", open: "academy", icon: SquareTerminal, color: "bg-gradient-to-br from-indigo-500 to-violet-600" },
  { id: "terminal", label: "Terminal", open: "terminal", icon: Terminal, color: "bg-black" },
  { id: "transcript", label: "final_grade.pdf", open: "transcript", icon: FileText, color: "bg-red-500", locked: true },
  { id: "files", label: "Files", open: "files", icon: Folder, color: "bg-blue-400" },
  { id: "settings", label: "Settings", open: "settings", icon: Settings, color: "bg-gray-500" },
  { id: "cooked", label: "cooked.ai", open: "safari", params: { url: "cooked.ai" }, icon: Flame, color: "bg-gradient-to-br from-orange-400 to-red-600" },
  { id: "grade", label: "Grade Request.app", open: "grade", icon: Award, color: "bg-red-500" },
  { id: "human", label: "definitely_human.txt", open: "text-viewer", params: { file: "definitely_human.txt" }, icon: FileText, color: "bg-gray-400" },
];
