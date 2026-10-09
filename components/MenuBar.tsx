"use client";

import { Moon, Search, Sun } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import Avatar from "@/components/Avatar";
import { lockScreen } from "@/app/login/actions";
import AppIcon from "@/components/os/AppIcon";
import { APPS } from "@/components/os/apps";
import { useOS, type WindowId } from "@/lib/os/store";
import { showWelcomeNotes } from "@/components/os/StickyNotes";

export type MenuAccount = { name: string; email: string | null; avatar: string | null };

type MenuId = "apple" | "go" | "help" | "account";

function formatMacClock(d: Date): string {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const hours = d.getHours();
  const h12 = hours % 12 === 0 ? 12 : hours % 12;
  const mins = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours < 12 ? "AM" : "PM";
  return `${days[d.getDay()]} ${months[d.getMonth()]} ${d.getDate()}  ${h12}:${mins} ${ampm}`;
}

const GO_ITEMS: WindowId[] = ["academy", "terminal", "safari", "mail", "files", "calendar", "photos", "sudoku", "about"];

const MENU_PANEL =
  "absolute top-7 z-50 w-60 rounded-lg border border-black/10 bg-white/90 p-1 text-gray-900 shadow-2xl backdrop-blur-2xl";

// The macOS menu bar: Apple menu, the front app's name, Go and Help menus,
// then Spotlight, dark mode, the clock and the account menu.
export default function MenuBar({ account }: { account: MenuAccount | null }) {
  const [clock, setClock] = useState("");
  const [open, setOpen] = useState<MenuId | null>(null);
  const barRef = useRef<HTMLElement>(null);
  const focused = useOS((s) => s.focused);
  const darkMode = useOS((s) => s.darkMode);
  const { openWindow, setSpotlight, toggleDarkMode } = useOS.getState();

  useEffect(() => {
    const tick = () => setClock(formatMacClock(new Date()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!barRef.current?.contains(e.target as Node)) setOpen(null);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = (id: MenuId) => setOpen((o) => (o === id ? null : id));
  // Hovering across the bar while a menu is open switches menus, like macOS.
  const hover = (id: MenuId) => setOpen((o) => (o && o !== id ? id : o));
  const run = (fn: () => void) => () => {
    setOpen(null);
    fn();
  };
  const appName = focused ? APPS[focused].title : "Finder";

  return (
    <header
      ref={barRef}
      className="fixed inset-x-0 top-0 flex h-7 items-center justify-between border-b border-white/10 bg-black/30 px-2 text-[13px] text-white/90 backdrop-blur-md sm:px-3"
      style={{ zIndex: 5500 }}
    >
      <div className="flex min-w-0 items-center gap-0.5">
        <Menu id="apple" open={open} onToggle={toggle} onHover={hover} label="Apple menu" button={<AppleLogo />}>
          <MenuItem onClick={run(() => openWindow("about-os"))}>About AminaOS</MenuItem>
          <Separator />
          <MenuItem onClick={run(() => openWindow("settings"))}>System Settings…</MenuItem>
          <Separator />
          <form action={lockScreen}>
            <MenuItem submit>Lock Screen</MenuItem>
          </form>
          {account && (
            <form action="/auth/signout" method="post">
              <MenuItem submit>Log Out {account.name}…</MenuItem>
            </form>
          )}
        </Menu>
        <span className="truncate px-1.5 font-semibold">{appName}</span>
        <Menu id="go" open={open} onToggle={toggle} onHover={hover} label="Go" className="hidden sm:block">
          {GO_ITEMS.map((id) => (
            <MenuItem key={id} onClick={run(() => openWindow(id))}>
              <AppIcon icon={APPS[id].icon} color={APPS[id].color} size="sm" className="mr-2 shadow-none!" />
              {APPS[id].title}
            </MenuItem>
          ))}
        </Menu>
        <Menu id="help" open={open} onToggle={toggle} onHover={hover} label="Help" className="hidden sm:block">
          <MenuItem onClick={run(() => openWindow("help"))}>Terminal Academy Help</MenuItem>
          <MenuItem onClick={run(showWelcomeNotes)}>Show Welcome Notes</MenuItem>
          <MenuItem onClick={run(() => setSpotlight(true))}>Search… ⌘K</MenuItem>
        </Menu>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <IconButton label="Spotlight Search (⌘K)" onClick={() => setSpotlight(true)}>
          <Search className="h-3.5 w-3.5" />
        </IconButton>
        <IconButton label={darkMode ? "Light mode" : "Dark mode"} onClick={toggleDarkMode}>
          {darkMode ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
        </IconButton>
        <span suppressHydrationWarning className="hidden px-1 tabular-nums md:inline">
          {clock || " "}
        </span>
        {account ? (
          <Menu
            id="account"
            open={open}
            onToggle={toggle}
            onHover={hover}
            label="Account"
            align="right"
            button={
              <span className="flex items-center gap-1.5">
                <Avatar src={account.avatar} name={account.name} size={18} />
                <span className="hidden max-w-[140px] truncate sm:inline">{account.name}</span>
              </span>
            }
          >
            <div className="flex items-center gap-2.5 px-2.5 py-2">
              <Avatar src={account.avatar} name={account.name} size={36} />
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold">{account.name}</p>
                {account.email && <p className="truncate text-[11px] text-gray-500">{account.email}</p>}
              </div>
            </div>
            <Separator />
            <MenuItem onClick={run(() => openWindow("settings", { pane: "profile" }))}>Profile…</MenuItem>
            <MenuItem onClick={run(() => openWindow("settings", { pane: "account" }))}>Users &amp; Groups…</MenuItem>
            <MenuItem onClick={run(() => openWindow("settings", { pane: "password" }))}>Change Password…</MenuItem>
            <MenuItem onClick={run(() => openWindow("safari", { url: "cooked.ai" }))}>cooked.ai</MenuItem>
            <MenuItem onClick={run(() => openWindow("transcript"))}>final_grade.pdf</MenuItem>
            <Separator />
            <form action="/auth/signout" method="post">
              <MenuItem submit>Log Out {account.name}…</MenuItem>
            </form>
          </Menu>
        ) : (
          <a href="/login" className="rounded px-1.5 py-0.5 font-medium hover:bg-white/10">
            Sign In
          </a>
        )}
      </div>
    </header>
  );
}

function Menu({
  id,
  open,
  onToggle,
  onHover,
  label,
  button,
  align = "left",
  className = "",
  children,
}: {
  id: MenuId;
  open: MenuId | null;
  onToggle: (id: MenuId) => void;
  onHover: (id: MenuId) => void;
  label: string;
  button?: ReactNode;
  align?: "left" | "right";
  className?: string;
  children: ReactNode;
}) {
  const isOpen = open === id;
  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => onToggle(id)}
        onPointerEnter={() => onHover(id)}
        aria-label={button ? label : undefined}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className={`flex h-5 items-center rounded px-1.5 ${isOpen ? "bg-white/20" : "hover:bg-white/10"}`}
      >
        {button ?? label}
      </button>
      {isOpen && (
        <div role="menu" className={`${MENU_PANEL} ${align === "right" ? "right-0" : "left-0"}`}>
          {children}
        </div>
      )}
    </div>
  );
}

function MenuItem({ onClick, submit, children }: { onClick?: () => void; submit?: boolean; children: ReactNode }) {
  return (
    <button
      type={submit ? "submit" : "button"}
      role="menuitem"
      onClick={onClick}
      className="flex w-full items-center rounded px-2.5 py-1 text-left text-[13px] hover:bg-[#0a84ff] hover:text-white"
    >
      {children}
    </button>
  );
}

function Separator() {
  return <div className="my-1 h-px bg-black/10" />;
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label} className="flex h-5 items-center rounded px-1.5 hover:bg-white/10">
      {children}
    </button>
  );
}

// An SVG apple, since the  glyph only renders with Apple fonts.
function AppleLogo() {
  return (
    <svg width="13" height="15" viewBox="0 0 13 15" fill="currentColor" aria-hidden="true">
      <path d="M10.8 8c0-1.9 1.6-2.8 1.6-2.9-.9-1.3-2.3-1.5-2.8-1.5-1.2-.1-2.3.7-2.9.7s-1.5-.7-2.5-.7C2.9 3.6 1.6 4.4.9 5.6c-1.4 2.4-.4 6 1 8 .7 1 1.4 2 2.5 2 1-.1 1.4-.6 2.6-.6s1.5.6 2.5.6c1.1 0 1.7-1 2.4-2 .8-1.1 1.1-2.2 1.1-2.2s-2.1-.8-2.2-3.4ZM8.9 2.2C9.4 1.6 9.8.8 9.7 0c-.7 0-1.6.5-2.1 1.1-.5.5-.9 1.3-.8 2.1.8.1 1.6-.4 2.1-1Z" />
    </svg>
  );
}
