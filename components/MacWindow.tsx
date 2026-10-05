import Link from "next/link";
import type { ReactNode } from "react";

// A macOS window: title bar with traffic lights and a white body.
// `closeHref` makes the red light navigate (like quitting the app).
export default function MacWindow({
  title,
  closeHref,
  className = "",
  children,
}: {
  title: string;
  closeHref?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`overflow-hidden rounded-xl bg-white/95 backdrop-blur-xl ${className}`}
      style={{
        boxShadow: "0 30px 70px rgba(0,0,0,0.5), 0 2px 10px rgba(0,0,0,0.25)",
        animation: "dialog-pop 0.35s ease",
      }}
    >
      <div
        className="relative flex h-7 shrink-0 items-center border-b border-black/10 px-2.5"
        style={{ background: "linear-gradient(180deg, #f7f7f7, #ececec)" }}
      >
        <div className="relative z-10 flex items-center gap-2">
          {closeHref ? (
            <Link
              href={closeHref}
              aria-label="Close"
              title="Close"
              className="group/close flex h-3 w-3 items-center justify-center rounded-full border border-black/10 bg-[#ff5f57] hover:brightness-95"
            >
              <span className="hidden text-[9px] font-bold leading-none text-black/60 group-hover/close:inline">
                ×
              </span>
            </Link>
          ) : (
            <span className="h-3 w-3 rounded-full border border-black/10 bg-[#ff5f57]" />
          )}
          <span className="h-3 w-3 rounded-full border border-black/10 bg-[#febc2e]" />
          <span className="h-3 w-3 rounded-full border border-black/10 bg-[#28c840]" />
        </div>
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[12px] font-medium text-gray-500">
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}
