"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import Avatar from "@/components/Avatar";
import MenuBar, { type MenuAccount } from "@/components/MenuBar";
import { FONT_STACK, WALLPAPER } from "@/lib/desktop-theme";

const PANES = [
  { href: "/settings/account", label: "Users & Groups", glyph: "\u{1F465}", bg: "linear-gradient(180deg, #5ac8fa, #007aff)" },
  { href: "/settings/password", label: "Login Password", glyph: "\u{1F511}", bg: "linear-gradient(180deg, #ff6b6b, #e5383b)" },
];

const TITLES: Record<string, string> = {
  "/settings/profile": "Profile",
  "/settings/account": "Users & Groups",
  "/settings/password": "Login Password",
};

export default function SettingsShell({ account, children }: { account: MenuAccount; children: ReactNode }) {
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const panes = PANES.filter((p) => !q || p.label.toLowerCase().includes(q));
  const showProfile = !q || "profile account photo".includes(q) || account.name.toLowerCase().includes(q);

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ fontFamily: FONT_STACK, background: WALLPAPER }}>
      <MenuBar appName="System Settings" account={account}>
        <Link href="/" className="hover:text-white">
          ← Desktop
        </Link>
      </MenuBar>

      <main className="absolute inset-0 flex items-start justify-center overflow-y-auto px-3 pb-6 pt-12 sm:items-center">
        <div
          className="flex w-full max-w-[820px] flex-col overflow-hidden rounded-xl bg-[#f5f5f7] md:h-[560px] md:flex-row"
          style={{
            boxShadow: "0 30px 70px rgba(0,0,0,0.5), 0 2px 10px rgba(0,0,0,0.25)",
            animation: "dialog-pop 0.35s ease",
          }}
        >
          {/* Sidebar */}
          <aside className="flex shrink-0 flex-col border-b border-black/10 bg-[#e9e8ee]/95 px-2.5 pb-3 pt-3 md:w-60 md:border-b-0 md:border-r">
            <div className="flex items-center gap-2 px-1.5">
              <Link
                href="/"
                aria-label="Close System Settings"
                title="Close"
                className="group/close flex h-3 w-3 items-center justify-center rounded-full border border-black/10 bg-[#ff5f57]"
              >
                <span className="hidden text-[9px] font-bold leading-none text-black/60 group-hover/close:inline">×</span>
              </Link>
              <span className="h-3 w-3 rounded-full border border-black/10 bg-[#febc2e]" />
              <span className="h-3 w-3 rounded-full border border-black/10 bg-[#28c840]" />
            </div>

            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              aria-label="Search settings"
              className="mt-4 w-full rounded-md border border-black/5 bg-black/[0.06] px-2.5 py-1 text-[13px] text-gray-900 outline-none placeholder:text-gray-500 focus:border-[#007aff] focus:bg-white"
            />

            <nav className="mt-3 flex flex-col gap-0.5">
              {showProfile && (
                <SidebarLink href="/settings/profile" active={pathname === "/settings/profile"} tall>
                  <Avatar src={account.avatar} name={account.name} size={34} />
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-semibold">{account.name}</span>
                    <span className="block truncate text-[11px] opacity-70">Profile</span>
                  </span>
                </SidebarLink>
              )}
              {showProfile && panes.length > 0 && <span className="my-1.5 h-px bg-black/10" />}
              {panes.map((p) => (
                <SidebarLink key={p.href} href={p.href} active={pathname === p.href}>
                  <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] text-[11px] shadow-sm"
                    style={{ background: p.bg }}
                  >
                    {p.glyph}
                  </span>
                  <span className="truncate text-[13px]">{p.label}</span>
                </SidebarLink>
              ))}
              {!showProfile && panes.length === 0 && (
                <p className="px-2 py-3 text-center text-[12px] text-gray-500">No Results</p>
              )}
            </nav>
          </aside>

          {/* Content */}
          <section className="flex min-h-[460px] min-w-0 flex-1 flex-col">
            <header className="flex h-12 shrink-0 items-center gap-3 px-5">
              <span className="flex gap-3 text-[15px] text-gray-400" aria-hidden="true">
                <span>‹</span>
                <span>›</span>
              </span>
              <h1 className="text-[15px] font-semibold text-gray-900">{TITLES[pathname] ?? "System Settings"}</h1>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">{children}</div>
          </section>
        </div>
      </main>
    </div>
  );
}

function SidebarLink({
  href,
  active,
  tall,
  children,
}: {
  href: string;
  active: boolean;
  tall?: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-2.5 rounded-md px-2 ${tall ? "py-2" : "py-1.5"} ${
        active ? "bg-[#007aff] text-white" : "text-gray-900 hover:bg-black/5"
      }`}
    >
      {children}
    </Link>
  );
}
