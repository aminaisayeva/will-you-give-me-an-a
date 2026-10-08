import type { LucideIcon } from "lucide-react";

const SIZES = {
  sm: { tile: "h-5 w-5 rounded-[5px]", icon: "h-3 w-3" },
  md: { tile: "h-10 w-10 rounded-xl sm:h-12 sm:w-12", icon: "h-4 w-4 sm:h-5 sm:w-5" },
  lg: { tile: "h-14 w-14 rounded-lg", icon: "h-6 w-6" },
};

// An AminaOS-style app icon: a white lucide icon on a coloured tile.
export default function AppIcon({ icon: Icon, color, size = "md", className = "" }: { icon: LucideIcon; color: string; size?: keyof typeof SIZES; className?: string }) {
  return (
    <span className={`flex shrink-0 items-center justify-center shadow-lg ${SIZES[size].tile} ${color} ${className}`}>
      <Icon className={`${SIZES[size].icon} text-white`} />
    </span>
  );
}
