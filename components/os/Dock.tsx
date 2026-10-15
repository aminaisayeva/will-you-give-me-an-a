"use client";

import { useState } from "react";
import AppIcon from "@/components/os/AppIcon";
import { APPS, DOCK } from "@/components/os/apps";
import { useOS, WINDOW_IDS, type WindowId } from "@/lib/os/store";

function DockTile({ id, running, onClick }: { id: WindowId; running: boolean; onClick: () => void }) {
  const app = APPS[id];
  return (
    <div className="group relative flex flex-col items-center">
      <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-black/60 px-2 py-0.5 text-[11px] text-white opacity-0 backdrop-blur transition-opacity duration-150 group-hover:opacity-100">
        {app.title}
      </span>
      <button
        type="button"
        onClick={onClick}
        aria-label={`Open ${app.title}`}
        className="origin-bottom rounded-xl transition-all duration-200 group-hover:-translate-y-2 group-hover:scale-125"
      >
        <AppIcon icon={app.icon} color={app.color} />
      </button>
      <span className={`mt-1 h-1 w-1 rounded-full bg-white/80 ${running ? "opacity-100" : "opacity-0"}`} />
    </div>
  );
}

// Apps on the left, minimized windows after a divider, then Trash. Hides
// itself while a window fills the screen; point at the bottom edge to bring it
// back, like macOS's "automatically hide and show the Dock".
export default function Dock() {
  const windows = useOS((s) => s.windows);
  const openWindow = useOS((s) => s.openWindow);
  const minimized = WINDOW_IDS.filter((id) => windows[id].open && windows[id].minimized && !DOCK.includes(id));
  const fullscreen = WINDOW_IDS.some((id) => windows[id].open && !windows[id].minimized && windows[id].fullscreen);
  const [peek, setPeek] = useState(false);
  const hidden = fullscreen && !peek;

  return (
    <>
    {fullscreen && (
      // Invisible strip along the bottom edge that reveals the Dock.
      <div className="fixed inset-x-0 bottom-0 h-1.5" style={{ zIndex: 5001 }} onPointerEnter={() => setPeek(true)} aria-hidden="true" />
    )}
    <nav
      aria-label="Dock"
      onPointerLeave={() => setPeek(false)}
      onFocus={() => setPeek(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setPeek(false);
      }}
      className="fixed bottom-2 left-1/2 flex max-w-[calc(100vw-16px)] items-end gap-1.5 overflow-x-auto rounded-2xl border border-white/20 bg-white/20 px-2 pb-1.5 pt-2 shadow-2xl backdrop-blur-2xl dark:bg-black/30 sm:gap-3 sm:overflow-visible sm:px-4"
      style={{
        zIndex: 5000,
        transform: `translateX(-50%) translateY(${hidden ? "calc(100% + 16px)" : "0"})`,
        transition: "transform 260ms cubic-bezier(0.32, 0.72, 0, 1)",
      }}
    >
      {DOCK.map((id) => (
        <DockTile key={id} id={id} running={windows[id].open} onClick={() => openWindow(id)} />
      ))}
      <div className="mx-0.5 w-px self-stretch bg-white/25" />
      {minimized.map((id) => (
        <DockTile key={id} id={id} running onClick={() => openWindow(id)} />
      ))}
      <DockTile id="trash" running={windows.trash.open} onClick={() => openWindow("trash")} />
    </nav>
    </>
  );
}
