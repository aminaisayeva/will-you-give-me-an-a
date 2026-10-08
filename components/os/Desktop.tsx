"use client";

import { useEffect } from "react";
import { AccountProvider, type DesktopAccount } from "@/components/os/AccountContext";
import DesktopIcons from "@/components/os/DesktopIcons";
import Dock from "@/components/os/Dock";
import GradeRequest from "@/components/os/GradeRequest";
import Spotlight from "@/components/os/Spotlight";
import WindowManager from "@/components/os/WindowManager";
import MenuBar from "@/components/MenuBar";
import { FONT_STACK, WALLPAPER } from "@/lib/desktop-theme";
import { isWindowId, useOS } from "@/lib/os/store";

export type InitialWindow = { id: string; params?: Record<string, string> };

// The whole macOS-style desktop. Server routes (/, /mail, /safari/…) render it
// with different windows open.
export default function Desktop({ account, initial }: { account: DesktopAccount | null; initial: InitialWindow[] }) {
  const darkMode = useOS((s) => s.darkMode);

  // Open the windows this URL asked for, once.
  useEffect(() => {
    const { openWindow } = useOS.getState();
    for (const w of initial) if (isWindowId(w.id)) openWindow(w.id, w.params);
    // Only on first mount; later navigation happens inside the desktop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AccountProvider value={account}>
      <div
        className={`fixed inset-0 select-none overflow-hidden ${darkMode ? "dark" : ""}`}
        style={{ fontFamily: FONT_STACK, background: WALLPAPER }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: darkMode
              ? "rgba(0,0,0,0.35)"
              : "radial-gradient(120% 120% at 50% 40%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.35) 100%)",
          }}
        />
        <MenuBar account={account} />
        <DesktopIcons />
        <WindowManager />
        <GradeRequest />
        <Dock />
        <Spotlight />
      </div>
    </AccountProvider>
  );
}
