"use client";

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

// Apps on the left, minimized windows after a divider, then Trash.
export default function Dock() {
  const windows = useOS((s) => s.windows);
  const openWindow = useOS((s) => s.openWindow);
  const minimized = WINDOW_IDS.filter((id) => windows[id].open && windows[id].minimized && !DOCK.includes(id));

  return (
    <nav
      className="fixed bottom-2 left-1/2 flex max-w-[calc(100vw-16px)] -translate-x-1/2 items-end gap-1.5 overflow-x-auto rounded-2xl border border-white/20 bg-white/20 px-2 pb-1.5 pt-2 shadow-2xl backdrop-blur-2xl dark:bg-black/30 sm:gap-3 sm:overflow-visible sm:px-4"
      style={{ zIndex: 5000 }}
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
  );
}
