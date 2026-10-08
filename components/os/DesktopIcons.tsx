"use client";

import { useRef, useState } from "react";
import { useAccount } from "@/components/os/AccountContext";
import AppIcon from "@/components/os/AppIcon";
import { DESKTOP_ICONS, type DesktopIcon } from "@/components/os/apps";
import { useOS } from "@/lib/os/store";
import { useMounted } from "@/lib/os/use-mounted";

const ICON_W = 96;
const ICON_H = 88;
const TOP = 40;

// Default layout: columns from the top-right corner, like Finder.
function defaultPosition(index: number) {
  const perColumn = Math.max(1, Math.floor((window.innerHeight - TOP - 110) / ICON_H));
  const column = Math.floor(index / perColumn);
  const row = index % perColumn;
  return { x: window.innerWidth - 16 - ICON_W * (column + 1), y: TOP + row * ICON_H };
}

// Draggable desktop icons (from AminaOS). A drag moves the icon; a click
// (mouse, touch or keyboard) opens its app.
export default function DesktopIcons() {
  const mounted = useMounted();
  const account = useAccount();
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
  const drag = useRef<{ id: string; startX: number; startY: number; origin: { x: number; y: number }; moved: boolean } | null>(null);
  // The click that ends a drag shouldn't open the app.
  const justDragged = useRef(false);

  if (!mounted) return null;

  const position = (icon: DesktopIcon, i: number) => positions[icon.id] ?? defaultPosition(i);

  const onPointerDown = (icon: DesktopIcon, i: number) => (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    drag.current = { id: icon.id, startX: e.clientX, startY: e.clientY, origin: position(icon, i), moved: false };
    const move = (ev: PointerEvent) => {
      const d = drag.current;
      if (!d) return;
      const dx = ev.clientX - d.startX;
      const dy = ev.clientY - d.startY;
      if (!d.moved && Math.hypot(dx, dy) < 6) return;
      d.moved = true;
      setPositions((p) => ({
        ...p,
        [d.id]: {
          x: Math.min(window.innerWidth - ICON_W, Math.max(0, d.origin.x + dx)),
          y: Math.min(window.innerHeight - ICON_H - 70, Math.max(TOP - 8, d.origin.y + dy)),
        },
      }));
    };
    const up = () => {
      justDragged.current = Boolean(drag.current?.moved);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      drag.current = null;
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  return (
    <div className="fixed inset-0" style={{ zIndex: 1 }}>
      {DESKTOP_ICONS.map((icon, i) => {
        const p = position(icon, i);
        const locked = icon.locked && !account;
        return (
          <button
            key={icon.id}
            type="button"
            onPointerDown={onPointerDown(icon, i)}
            onClick={() => {
              if (justDragged.current) {
                justDragged.current = false;
                return;
              }
              useOS.getState().openWindow(icon.open, icon.params);
            }}
            aria-label={`Open ${icon.label}`}
            className="group absolute flex w-[88px] touch-none select-none flex-col items-center gap-1 rounded-lg p-1 hover:bg-white/10 focus-visible:bg-white/15 focus-visible:outline-none"
            style={{ left: p.x, top: p.y }}
          >
            <span className="relative transition-transform group-hover:scale-105 group-active:scale-95">
              <AppIcon icon={icon.icon} color={icon.color} size="lg" />
              {locked && (
                <span className="absolute -bottom-1 -right-1.5 text-[15px]" aria-hidden="true">
                  {"\u{1F512}"}
                </span>
              )}
            </span>
            <span className="max-w-full break-words rounded px-1 text-center text-[11px] leading-tight text-white/95 [text-shadow:0_1px_3px_rgba(0,0,0,0.6)] group-hover:bg-[#0a84ff]">
              {icon.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
