"use client";

import { KeyRound, Users } from "lucide-react";
import { useState, type ReactNode } from "react";
import AppIcon from "@/components/os/AppIcon";
import Avatar from "@/components/Avatar";
import { useAccount } from "@/components/os/AccountContext";
import SignInPrompt from "@/components/os/SignInPrompt";
import AccountPane from "@/components/settings/AccountPane";
import PasswordPane from "@/components/settings/PasswordPane";
import ProfilePane from "@/components/settings/ProfilePane";
import { useOS } from "@/lib/os/store";

type Pane = "profile" | "account" | "password";

const PANES: { id: Exclude<Pane, "profile">; label: string; icon: typeof Users; color: string }[] = [
  { id: "account", label: "Users & Groups", icon: Users, color: "bg-blue-500" },
  { id: "password", label: "Login Password", icon: KeyRound, color: "bg-red-500" },
];

const TITLES: Record<Pane, string> = { profile: "Profile", account: "Users & Groups", password: "Login Password" };

function isPane(value: string | undefined): value is Pane {
  return value === "profile" || value === "account" || value === "password";
}

// System Settings: Profile (photo), Users & Groups (name), Login Password.
export default function SettingsWindow() {
  const account = useAccount();
  const requested = useOS((s) => s.windows.settings.params.pane);
  const pane: Pane = isPane(requested) ? requested : "profile";
  const go = (p: Pane) => useOS.getState().openWindow("settings", { pane: p });
  const [query, setQuery] = useState("");

  if (!account) {
    return <SignInPrompt app="System Settings" glyph="⚙️" reason="Sign in to edit your profile, name and password." />;
  }

  const q = query.trim().toLowerCase();
  const panes = PANES.filter((p) => !q || p.label.toLowerCase().includes(q));
  const showProfile = !q || "profile account photo".includes(q) || account.name.toLowerCase().includes(q);

  return (
    <div className="flex h-full flex-col bg-[#f5f5f7] text-gray-900 md:flex-row">
      <aside className="flex shrink-0 flex-col border-b border-black/10 bg-[#e9e8ee]/95 px-2.5 pb-3 pt-3 md:w-56 md:border-b-0 md:border-r">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search"
          aria-label="Search settings"
          className="w-full rounded-md border border-black/5 bg-black/[0.06] px-2.5 py-1 text-[13px] text-gray-900 outline-none placeholder:text-gray-500 focus:border-[#007aff] focus:bg-white"
        />
        <nav className="mt-3 flex flex-col gap-0.5">
          {showProfile && (
            <SidebarItem active={pane === "profile"} onClick={() => go("profile")} tall>
              <Avatar src={account.avatar} name={account.name} size={34} />
              <span className="min-w-0 text-left">
                <span className="block truncate text-[13px] font-semibold">{account.name}</span>
                <span className="block truncate text-[11px] opacity-70">Profile</span>
              </span>
            </SidebarItem>
          )}
          {showProfile && panes.length > 0 && <span className="my-1.5 h-px bg-black/10" />}
          {panes.map((p) => (
            <SidebarItem key={p.id} active={pane === p.id} onClick={() => go(p.id)}>
              <AppIcon icon={p.icon} color={p.color} size="sm" className="shadow-sm!" />
              <span className="truncate text-[13px]">{p.label}</span>
            </SidebarItem>
          ))}
          {!showProfile && panes.length === 0 && <p className="px-2 py-3 text-center text-[12px] text-gray-500">No Results</p>}
        </nav>
      </aside>

      <section className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex h-11 shrink-0 items-center px-5">
          <h1 className="text-[15px] font-semibold">{TITLES[pane]}</h1>
        </header>
        <div className="relative min-h-0 flex-1 overflow-y-auto px-5 pb-5">
          {pane === "profile" && (
            <ProfilePane
              name={account.name}
              email={account.email ?? ""}
              photo={account.photo}
              googlePhoto={account.googlePhoto}
              memberSince={account.memberSince}
              hasPassword={account.hasPassword}
            />
          )}
          {pane === "account" && (
            <AccountPane
              name={account.name}
              avatar={account.avatar}
              email={account.email ?? ""}
              firstName={account.firstName}
              lastName={account.lastName}
              loginMethods={account.loginMethods}
            />
          )}
          {pane === "password" && <PasswordPane email={account.email ?? ""} hasPassword={account.hasPassword} />}
        </div>
      </section>
    </div>
  );
}

function SidebarItem({
  active,
  tall,
  onClick,
  children,
}: {
  active: boolean;
  tall?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-2.5 rounded-md px-2 ${tall ? "py-2" : "py-1.5"} ${
        active ? "bg-[#007aff] text-white" : "text-gray-900 hover:bg-black/5"
      }`}
    >
      {children}
    </button>
  );
}
