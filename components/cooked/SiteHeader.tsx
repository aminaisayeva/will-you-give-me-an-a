"use client";

import { Flame, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Avatar from "@/components/Avatar";
import { focusRing } from "@/components/safari/cooked/shared";

export type Viewer = {
  username: string | null; // null: signed in but hasn't finished onboarding
  displayName: string;
  avatar: string | null;
} | null;

export default function SiteHeader({ viewer }: { viewer: Viewer }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("pointerdown", close);
    window.addEventListener("keydown", esc);
    return () => {
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("keydown", esc);
    };
  }, [open]);

  const navLink = (href: string, label: string) => (
    <Link
      href={href}
      aria-current={pathname === href ? "page" : undefined}
      className={`rounded-lg px-3 py-1.5 text-[14px] font-semibold transition ${focusRing} ${
        pathname === href ? "bg-stone-900 text-white" : "text-stone-700 hover:bg-stone-200/70"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-[#fbf7f2]/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
        <Link href={viewer ? "/feed" : "/"} className={`flex items-center gap-2 rounded-lg text-[20px] font-extrabold tracking-[-0.02em] text-stone-900 ${focusRing}`}>
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-600 text-white">
            <Flame className="h-4.5 w-4.5" />
          </span>
          <span>
            cooked<span className="text-orange-600">.ai</span>
          </span>
        </Link>

        <nav aria-label="Main" className="ml-2 hidden sm:flex">
          {navLink("/feed", "Feed")}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {!viewer ? (
            <>
              <Link href="/login" className={`rounded-lg px-3 py-1.5 text-[14px] font-semibold text-stone-700 hover:bg-stone-200/70 ${focusRing}`}>
                Log in
              </Link>
              <Link href="/signup" className={`rounded-lg bg-orange-600 px-3.5 py-1.5 text-[14px] font-semibold text-white transition hover:bg-orange-700 ${focusRing}`}>
                Sign up
              </Link>
            </>
          ) : !viewer.username ? (
            <Link href="/onboarding" className={`rounded-lg bg-orange-600 px-3.5 py-1.5 text-[14px] font-semibold text-white transition hover:bg-orange-700 ${focusRing}`}>
              Finish your profile
            </Link>
          ) : (
            <>
              <Link
                href="/feed#post"
                className={`flex items-center gap-1.5 rounded-lg bg-orange-600 px-3 py-1.5 text-[14px] font-semibold text-white transition hover:bg-orange-700 ${focusRing}`}
              >
                <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Post a pic</span>
              </Link>
              <div ref={menuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setOpen((o) => !o)}
                  aria-haspopup="menu"
                  aria-expanded={open}
                  aria-label={`Account menu for @${viewer.username}`}
                  className={`rounded-full ${focusRing}`}
                >
                  <Avatar src={viewer.avatar} name={viewer.displayName} size={34} />
                </button>
                {open && (
                  <div role="menu" className="absolute right-0 top-11 w-56 rounded-xl bg-white p-1.5 shadow-xl ring-1 ring-stone-200">
                    <div className="px-3 py-2">
                      <p className="truncate text-[14px] font-semibold text-stone-900">{viewer.displayName}</p>
                      <p className="truncate text-[12.5px] text-stone-500">@{viewer.username}</p>
                    </div>
                    <div className="my-1 h-px bg-stone-200" />
                    <MenuLink href={`/u/${viewer.username}`} onPick={() => setOpen(false)}>
                      Your profile
                    </MenuLink>
                    <MenuLink href="/profile" onPick={() => setOpen(false)}>
                      Settings
                    </MenuLink>
                    <div className="my-1 h-px bg-stone-200" />
                    <form action="/auth/signout" method="post">
                      <button type="submit" role="menuitem" className={`w-full rounded-lg px-3 py-2 text-left text-[14px] text-stone-700 hover:bg-stone-100 ${focusRing}`}>
                        Log out
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function MenuLink({ href, onPick, children }: { href: string; onPick: () => void; children: React.ReactNode }) {
  return (
    <Link href={href} role="menuitem" onClick={onPick} className={`block rounded-lg px-3 py-2 text-[14px] text-stone-700 hover:bg-stone-100 ${focusRing}`}>
      {children}
    </Link>
  );
}
