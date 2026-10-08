"use client";

// Small pieces shared by the pages inside Safari.

export function Centered({ spinner, text }: { spinner?: boolean; text: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-[13px] text-gray-500">
      {spinner && <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#007aff] border-t-transparent" />}
      {text}
    </div>
  );
}

export function Favicon({ slug }: { slug: string }) {
  let hash = 0;
  for (const ch of slug) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  const hue = Math.abs(hash) % 360;
  return (
    <span
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[18px] font-bold uppercase text-white shadow-sm"
      style={{ background: `linear-gradient(135deg, hsl(${hue} 80% 60%), hsl(${(hue + 40) % 360} 75% 45%))` }}
    >
      {slug[0]}
    </span>
  );
}

export function timeAgo(iso: string) {
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 86400 * 7) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
