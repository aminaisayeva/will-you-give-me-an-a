function initials(name: string) {
  return name
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export default function Avatar({
  src,
  name,
  size = 32,
  className = "",
}: {
  src: string | null;
  name: string;
  size?: number;
  className?: string;
}) {
  const style = { width: size, height: size, fontSize: size * 0.38 };
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- Supabase Storage / Google URLs, sized by us
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        className={`shrink-0 rounded-full object-cover ${className}`}
        style={style}
        referrerPolicy="no-referrer"
      />
    );
  }
  return (
    <span
      aria-label={name}
      className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-gray-400 to-gray-500 font-semibold text-white ${className}`}
      style={style}
    >
      {initials(name) || "?"}
    </span>
  );
}
