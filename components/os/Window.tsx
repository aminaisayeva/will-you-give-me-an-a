"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";

const MENU_BAR = 28;
const MIN_W = 320;
const MIN_H = 220;

type Rect = { x: number; y: number; width: number; height: number };
type Handle = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return mobile;
}

// Fit the requested size on screen, centred-ish with a cascade offset.
function initialRect(size: { width: number; height: number }, cascade: number): Rect {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const width = Math.min(size.width, vw - 24);
  const height = Math.min(size.height, vh - MENU_BAR - 96);
  const offset = (cascade % 6) * 26;
  return {
    width,
    height: Math.max(MIN_H, height),
    x: Math.max(12, Math.round((vw - width) / 2) - 60 + offset),
    y: Math.max(MENU_BAR + 12, Math.round((vh - MENU_BAR - 80 - height) / 2) + MENU_BAR - 20 + offset),
  };
}

// A macOS window: draggable title bar, 8 resize handles, and the traffic
// lights (close, minimize, zoom). Full screen on phones.
export default function Window({
  title,
  size,
  cascade,
  zIndex,
  focused,
  minimized,
  onClose,
  onMinimize,
  onFocus,
  toolbar,
  children,
}: {
  title: string;
  size: { width: number; height: number };
  cascade: number;
  zIndex: number;
  focused: boolean;
  minimized: boolean;
  onClose: () => void;
  onMinimize: () => void;
  onFocus: () => void;
  toolbar?: ReactNode;
  children: ReactNode;
}) {
  const mobile = useIsMobile();
  const [rect, setRect] = useState<Rect>(() => initialRect(size, cascade));
  const [maximized, setMaximized] = useState(false);
  const beforeMax = useRef<Rect | null>(null);
  const gesture = useRef<{ kind: "move" | Handle; startX: number; startY: number; start: Rect } | null>(null);

  const toggleMaximize = () => {
    onFocus();
    if (mobile) return;
    if (maximized) {
      if (beforeMax.current) setRect(beforeMax.current);
      setMaximized(false);
    } else {
      beforeMax.current = rect;
      setRect({ x: 0, y: MENU_BAR, width: window.innerWidth, height: window.innerHeight - MENU_BAR });
      setMaximized(true);
    }
  };

  const begin = (kind: "move" | Handle, e: React.PointerEvent) => {
    if (mobile || e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    onFocus();
    gesture.current = { kind, startX: e.clientX, startY: e.clientY, start: rect };
    if (kind !== "move") setMaximized(false);

    const move = (ev: PointerEvent) => {
      const g = gesture.current;
      if (!g) return;
      const dx = ev.clientX - g.startX;
      const dy = ev.clientY - g.startY;
      const s = g.start;
      if (g.kind === "move") {
        setMaximized(false);
        setRect({
          ...s,
          // Keep at least part of the title bar reachable.
          x: Math.min(window.innerWidth - 80, Math.max(80 - s.width, s.x + dx)),
          y: Math.min(window.innerHeight - 40, Math.max(MENU_BAR, s.y + dy)),
        });
        return;
      }
      const next = { ...s };
      if (g.kind.includes("e")) next.width = Math.max(MIN_W, s.width + dx);
      if (g.kind.includes("s")) next.height = Math.max(MIN_H, s.height + dy);
      if (g.kind.includes("w")) {
        const w = Math.max(MIN_W, s.width - dx);
        next.x = s.x + (s.width - w);
        next.width = w;
      }
      if (g.kind.includes("n")) {
        const h = Math.max(MIN_H, s.height - dy);
        next.y = Math.max(MENU_BAR, s.y + (s.height - h));
        next.height = s.y + s.height - next.y;
      }
      setRect(next);
    };
    const up = () => {
      gesture.current = null;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const style = mobile
    ? { left: 0, top: MENU_BAR, width: "100vw", height: `calc(100dvh - ${MENU_BAR}px)` }
    : { left: rect.x, top: rect.y, width: rect.width, height: rect.height };

  return (
    <motion.div
      role="dialog"
      aria-label={title}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: minimized ? 0 : 1, scale: minimized ? 0.3 : 1, y: minimized ? 320 : 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      onPointerDownCapture={onFocus}
      className={`pointer-events-auto fixed flex flex-col overflow-hidden bg-white/95 text-gray-900 backdrop-blur-xl dark:bg-gray-900/95 dark:text-gray-100 ${
        mobile ? "" : "rounded-xl"
      }`}
      style={{
        ...style,
        zIndex,
        pointerEvents: minimized ? "none" : "auto",
        transformOrigin: "center bottom",
        boxShadow: focused
          ? "0 30px 70px rgba(0,0,0,0.5), 0 2px 10px rgba(0,0,0,0.25)"
          : "0 16px 40px rgba(0,0,0,0.35), 0 1px 4px rgba(0,0,0,0.2)",
      }}
    >
      {/* Title bar */}
      <div
        onPointerDown={(e) => begin("move", e)}
        onDoubleClick={toggleMaximize}
        className={`relative flex h-8 shrink-0 touch-none items-center border-b border-black/10 px-3 dark:border-white/10 ${
          mobile ? "" : "cursor-default"
        } ${focused ? "bg-gradient-to-b from-[#f7f7f7] to-[#e8e8e8] dark:from-[#3a3a3c] dark:to-[#2c2c2e]" : "bg-[#f3f3f3] dark:bg-[#2c2c2e]"}`}
      >
        <div className="relative z-10 flex items-center gap-2" onPointerDown={(e) => e.stopPropagation()} onDoubleClick={(e) => e.stopPropagation()}>
          <TrafficLight color="#ff5f57" label="Close" glyph="×" active={focused} onClick={onClose} />
          <TrafficLight color="#febc2e" label="Minimize" glyph="−" active={focused} onClick={onMinimize} />
          <TrafficLight color="#28c840" label={maximized ? "Restore" : "Zoom"} glyph="+" active={focused} onClick={toggleMaximize} />
        </div>
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center px-24 text-[12px] font-semibold text-gray-600 dark:text-gray-300">
          <span className="truncate">{title}</span>
        </span>
        {toolbar && <div className="relative z-10 ml-auto flex items-center gap-1">{toolbar}</div>}
      </div>

      <div className="relative min-h-0 flex-1">{children}</div>

      {!mobile && !maximized && (
        <>
          <div className="absolute inset-x-3 top-0 h-1 cursor-ns-resize" onPointerDown={(e) => begin("n", e)} />
          <div className="absolute inset-x-3 bottom-0 h-1.5 cursor-ns-resize" onPointerDown={(e) => begin("s", e)} />
          <div className="absolute inset-y-3 left-0 w-1.5 cursor-ew-resize" onPointerDown={(e) => begin("w", e)} />
          <div className="absolute inset-y-3 right-0 w-1.5 cursor-ew-resize" onPointerDown={(e) => begin("e", e)} />
          <div className="absolute left-0 top-0 h-3 w-3 cursor-nwse-resize" onPointerDown={(e) => begin("nw", e)} />
          <div className="absolute right-0 top-0 h-3 w-3 cursor-nesw-resize" onPointerDown={(e) => begin("ne", e)} />
          <div className="absolute bottom-0 left-0 h-3 w-3 cursor-nesw-resize" onPointerDown={(e) => begin("sw", e)} />
          <div className="absolute bottom-0 right-0 h-3 w-3 cursor-nwse-resize" onPointerDown={(e) => begin("se", e)} />
        </>
      )}
    </motion.div>
  );
}

function TrafficLight({
  color,
  label,
  glyph,
  active,
  onClick,
}: {
  color: string;
  label: string;
  glyph: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="group/light flex h-3 w-3 items-center justify-center rounded-full border border-black/10"
      style={{ background: active ? color : "#c8c8cc" }}
    >
      <span className="hidden text-[9px] font-bold leading-none text-black/60 group-hover/light:inline">{glyph}</span>
    </button>
  );
}
