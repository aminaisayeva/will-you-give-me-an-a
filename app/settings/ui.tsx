import type { ReactNode } from "react";

// Building blocks for macOS-style grouped settings lists.

export function Group({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="mt-4 first:mt-0">
      {title && <p className="mb-1.5 px-1 text-[12px] font-semibold text-gray-500">{title}</p>}
      <div className="overflow-hidden rounded-lg border border-black/[0.07] bg-white">{children}</div>
    </div>
  );
}

export function Row({ label, detail, children }: { label: ReactNode; detail?: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex min-h-[42px] items-center gap-3 border-b border-black/[0.06] px-3 py-2 last:border-b-0">
      <div className="min-w-0 flex-1">
        <div className="text-[13px] text-gray-900">{label}</div>
        {detail && <div className="text-[11px] leading-snug text-gray-500">{detail}</div>}
      </div>
      {children && <div className="flex min-w-0 shrink-0 items-center justify-end gap-2">{children}</div>}
    </div>
  );
}

export const textField =
  "w-48 max-w-full rounded-md border border-black/15 bg-white px-2 py-1 text-right text-[13px] text-gray-900 shadow-sm outline-none focus:border-[#007aff] focus:text-left focus:ring-[3px] focus:ring-[#007aff]/30 sm:w-56";

export const pushButton =
  "rounded-md border border-black/10 bg-white px-3 py-1 text-[13px] text-gray-800 shadow-sm hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50";

export const primaryButton =
  "rounded-md bg-[#007aff] px-3.5 py-1 text-[13px] font-medium text-white shadow-sm hover:brightness-110 disabled:opacity-60";

export function Status({ error, ok, okText = "✓ Saved" }: { error: string | null; ok: boolean; okText?: string }) {
  return (
    <p role="status" className={`text-[12px] ${error ? "text-red-600" : "text-green-700"}`}>
      {error ?? (ok ? okText : "")}
    </p>
  );
}
