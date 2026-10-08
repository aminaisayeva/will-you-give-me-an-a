"use client";

import { FileText, Flame, Globe, Search, type LucideIcon } from "lucide-react";
import AppIcon from "@/components/os/AppIcon";
import { useEffect, useMemo, useRef, useState } from "react";
import { APPS } from "@/components/os/apps";
import { documentFiles } from "@/data/aminaos/documentFiles";
import { addressFromInput } from "@/lib/sites";
import { useOS, WINDOW_IDS, type WindowId } from "@/lib/os/store";

type Result = { key: string; label: string; detail: string; icon: LucideIcon; color: string; run: () => void };

// ⌘K / Ctrl+K: search apps and files, or send the query to Safari.
export default function Spotlight() {
  const open = useOS((s) => s.spotlightOpen);
  const setSpotlight = useOS((s) => s.setSpotlight);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSpotlight(!useOS.getState().spotlightOpen);
      } else if (e.key === "Escape" && useOS.getState().spotlightOpen) {
        setSpotlight(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setSpotlight]);

  if (!open) return null;
  return <SpotlightPanel onClose={() => setSpotlight(false)} />;
}

function SpotlightPanel({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo<Result[]>(() => {
    const q = query.trim().toLowerCase();
    const openApp = (id: WindowId, params?: Record<string, string>) => () => useOS.getState().openWindow(id, params);
    const apps: Result[] = WINDOW_IDS.filter((id) => id !== "text-viewer")
      .map((id) => ({ key: id, label: APPS[id].title, detail: "Application", icon: APPS[id].icon, color: APPS[id].color, run: openApp(id) }))
      .filter((r) => !q || r.label.toLowerCase().includes(q));
    const files: Result[] = q
      ? documentFiles
          .filter((f) => f.name.toLowerCase().includes(q))
          .map((f) => ({ key: f.name, label: f.name, detail: "Document", icon: FileText, color: "bg-gray-400", run: openApp("text-viewer", { file: f.name }) }))
      : [];
    const address = addressFromInput(q);
    const sites: Result[] = [
      ...("cooked.ai".includes(q) || "photos captions roast".includes(q)
        ? [{ key: "cooked.ai", label: "cooked.ai", detail: "Website", icon: Flame, color: "bg-gradient-to-br from-orange-400 to-red-600", run: openApp("safari", { url: "cooked.ai" }) }]
        : []),
      ...(address && address !== "cooked.ai"
        ? [{ key: "web", label: `Open ${address}`, detail: "Safari", icon: Globe, color: "bg-orange-500", run: openApp("safari", { url: address }) }]
        : []),
    ];
    return [...(q ? sites : []), ...apps.slice(0, 8), ...files.slice(0, 5)];
  }, [query]);

  const choose = (r: Result | undefined) => {
    if (!r) return;
    r.run();
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-start justify-center bg-black/20 px-4 pt-[18vh]" style={{ zIndex: 6000 }} onPointerDown={onClose}>
      <div
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-white/30 bg-white/85 shadow-2xl backdrop-blur-2xl"
        onPointerDown={(e) => e.stopPropagation()}
        style={{ animation: "dialog-pop 0.18s ease" }}
      >
        <div className="flex items-center gap-3 px-4 py-3">
          <Search className="h-5 w-5 text-gray-500" />
          <input
            ref={inputRef}
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((a) => Math.min(a + 1, results.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(a - 1, 0));
              } else if (e.key === "Enter") {
                e.preventDefault();
                choose(results[active]);
              }
            }}
            placeholder="Spotlight Search"
            aria-label="Spotlight Search"
            className="min-w-0 flex-1 bg-transparent text-[20px] text-gray-900 outline-none placeholder:text-gray-400"
          />
        </div>
        {results.length > 0 && (
          <ul className="max-h-[50vh] overflow-y-auto border-t border-black/10 p-1.5">
            {results.map((r, i) => (
              <li key={r.key}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onClick={() => choose(r)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-1.5 text-left ${i === active ? "bg-[#007aff] text-white" : "text-gray-900"}`}
                >
                  <AppIcon icon={r.icon} color={r.color} size="sm" className="h-6! w-6! rounded-md!" />
                  <span className="min-w-0 flex-1 truncate text-[14px]">{r.label}</span>
                  <span className={`text-[11px] ${i === active ? "text-white/80" : "text-gray-400"}`}>{r.detail}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
