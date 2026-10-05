"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import Avatar from "@/components/Avatar";
import { lockScreen } from "@/app/login/actions";

export type MenuAccount = { name: string; email: string | null; avatar: string | null };

function formatMacClock(d: Date): string {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const hours = d.getHours();
  const h12 = hours % 12 === 0 ? 12 : hours % 12;
  const mins = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours < 12 ? "AM" : "PM";
  return `${days[d.getDay()]} ${months[d.getMonth()]} ${d.getDate()}  ${h12}:${mins} ${ampm}`;
}

export default function MenuBar({
  appName,
  account,
  children,
}: {
  appName: string;
  account: MenuAccount | null;
  children?: ReactNode;
}) {
  const [clock, setClock] = useState("");
  // Which menu is open: the  menu or the account menu.
  const [open, setOpen] = useState<"apple" | "account" | null>(null);
  const appleRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tick = () => setClock(formatMacClock(new Date()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!menuRef.current?.contains(target) && !appleRef.current?.contains(target)) setOpen(null);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <header className="absolute inset-x-0 top-0 z-40 flex h-7 items-center justify-between border-b border-white/10 bg-black/30 px-4 text-[13px] text-white/90 backdrop-blur-md">
      <div className="flex min-w-0 items-center gap-4">
        <div ref={appleRef} className="relative">
          <button
            type="button"
            onClick={() => setOpen((o) => (o === "apple" ? null : "apple"))}
            aria-label="Apple menu"
            aria-haspopup="menu"
            aria-expanded={open === "apple"}
            className={`flex h-5 items-center rounded px-1.5 ${open === "apple" ? "bg-white/20" : "hover:bg-white/10"}`}
          >
            {/* An SVG apple, since the  glyph only renders with Apple fonts. */}
            <svg width="13" height="15" viewBox="0 0 13 15" fill="currentColor" aria-hidden="true">
              <path d="M10.8 8c0-1.9 1.6-2.8 1.6-2.9-.9-1.3-2.3-1.5-2.8-1.5-1.2-.1-2.3.7-2.9.7s-1.5-.7-2.5-.7C2.9 3.6 1.6 4.4.9 5.6c-1.4 2.4-.4 6 1 8 .7 1 1.4 2 2.5 2 1-.1 1.4-.6 2.6-.6s1.5.6 2.5.6c1.1 0 1.7-1 2.4-2 .8-1.1 1.1-2.2 1.1-2.2s-2.1-.8-2.2-3.4ZM8.9 2.2C9.4 1.6 9.8.8 9.7 0c-.7 0-1.6.5-2.1 1.1-.5.5-.9 1.3-.8 2.1.8.1 1.6-.4 2.1-1Z" />
            </svg>
          </button>
          {open === "apple" && (
            <div role="menu" className={`${MENU_PANEL} left-0`}>
              <MenuLink href="/">Desktop</MenuLink>
              <div className="my-1 h-px bg-black/10" />
              <MenuLink href={account ? "/settings/profile" : "/login"}>System Settings…</MenuLink>
              <div className="my-1 h-px bg-black/10" />
              <form action={lockScreen}>
                <MenuButton>Lock Screen</MenuButton>
              </form>
              {account && (
                <form action="/auth/signout" method="post">
                  <MenuButton>Log Out {account.name}…</MenuButton>
                </form>
              )}
            </div>
          )}
        </div>
        <span className="font-semibold">{appName}</span>
        {children}
      </div>
      <div className="flex items-center gap-3.5">
        <span suppressHydrationWarning className="hidden tabular-nums sm:inline">
          {clock || "Wed Sep 17  9:41 AM"}
        </span>
        {account ? (
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setOpen((o) => (o === "account" ? null : "account"))}
              aria-haspopup="menu"
              aria-expanded={open === "account"}
              className={`flex items-center gap-1.5 rounded px-1.5 py-0.5 ${open === "account" ? "bg-white/20" : "hover:bg-white/10"}`}
            >
              <Avatar src={account.avatar} name={account.name} size={18} />
              <span className="hidden max-w-[140px] truncate sm:inline">{account.name}</span>
            </button>
            {open === "account" && (
              <div role="menu" className={`${MENU_PANEL} right-0`}>
                <div className="flex items-center gap-2.5 px-2.5 py-2">
                  <Avatar src={account.avatar} name={account.name} size={36} />
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold">{account.name}</p>
                    {account.email && (
                      <p className="truncate text-[11px] text-gray-500">{account.email}</p>
                    )}
                  </div>
                </div>
                <div className="my-1 h-px bg-black/10" />
                <MenuLink href="/settings/profile">Profile…</MenuLink>
                <MenuLink href="/settings/account">Users &amp; Groups…</MenuLink>
                <MenuLink href="/settings/password">Change Password…</MenuLink>
                <MenuLink href="/transcript">Transcript</MenuLink>
                <div className="my-1 h-px bg-black/10" />
                <form action="/auth/signout" method="post">
                  <MenuButton>Log Out {account.name}…</MenuButton>
                </form>
              </div>
            )}
          </div>
        ) : (
          <Link href="/login" className="rounded px-1.5 py-0.5 font-medium hover:bg-white/10">
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
}

const MENU_PANEL =
  "absolute top-7 z-50 w-60 rounded-lg border border-black/10 bg-white/90 p-1 text-gray-900 shadow-2xl backdrop-blur-2xl";

function MenuButton({ children }: { children: ReactNode }) {
  return (
    <button
      type="submit"
      role="menuitem"
      className="w-full rounded px-2.5 py-1 text-left text-[13px] hover:bg-[#0a84ff] hover:text-white"
    >
      {children}
    </button>
  );
}

function MenuLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      role="menuitem"
      className="block rounded px-2.5 py-1 text-[13px] hover:bg-[#0a84ff] hover:text-white"
    >
      {children}
    </Link>
  );
}
