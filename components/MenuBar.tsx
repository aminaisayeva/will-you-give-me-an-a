"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import Avatar from "@/components/Avatar";

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
  const [open, setOpen] = useState(false);
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
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
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
        <span aria-hidden="true" className="text-[15px] leading-none">{""}</span>
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
              onClick={() => setOpen((o) => !o)}
              aria-haspopup="menu"
              aria-expanded={open}
              className={`flex items-center gap-1.5 rounded px-1.5 py-0.5 ${open ? "bg-white/20" : "hover:bg-white/10"}`}
            >
              <Avatar src={account.avatar} name={account.name} size={18} />
              <span className="hidden max-w-[140px] truncate sm:inline">{account.name}</span>
            </button>
            {open && (
              <div
                role="menu"
                className="absolute right-0 top-7 w-60 rounded-lg border border-black/10 bg-white/90 p-1 text-gray-900 shadow-2xl backdrop-blur-2xl"
              >
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
                <MenuLink href="/profile">Profile…</MenuLink>
                <MenuLink href="/transcript">Transcript</MenuLink>
                <div className="my-1 h-px bg-black/10" />
                <form action="/auth/signout" method="post">
                  <button
                    type="submit"
                    role="menuitem"
                    className="w-full rounded px-2.5 py-1 text-left text-[13px] hover:bg-[#0a84ff] hover:text-white"
                  >
                    Log Out {account.name}…
                  </button>
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
