"use client";

import { AnimatePresence } from "framer-motion";
import { APPS } from "@/components/os/apps";
import Window from "@/components/os/Window";
import { useOS, WINDOW_IDS } from "@/lib/os/store";

// Renders every open window (except Grade Request, which is its own dialog).
export default function WindowManager() {
  const windows = useOS((s) => s.windows);
  const focused = useOS((s) => s.focused);
  const { closeWindow, minimizeWindow, focusWindow } = useOS.getState();

  // Each Window is position: fixed with its own z-index, so they share one
  // stacking order with the Grade Request dialog.
  return (
    <AnimatePresence>
        {WINDOW_IDS.map((id, i) => {
          const state = windows[id];
          const app = APPS[id];
          if (!state.open || !app.component) return null;
          const Content = app.component;
          return (
            <Window
              key={id}
              title={id === "text-viewer" && state.params.file ? state.params.file : app.title}
              size={app.size}
              cascade={i}
              zIndex={state.zIndex}
              focused={focused === id}
              minimized={state.minimized}
              onClose={() => closeWindow(id)}
              onMinimize={() => minimizeWindow(id)}
              onFocus={() => focusWindow(id)}
            >
              <Content />
            </Window>
          );
        })}
    </AnimatePresence>
  );
}
