// Shown inside windows that need an account when a guest opens them.
export default function SignInPrompt({ app, glyph, reason }: { app: string; glyph: string; reason: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 bg-[#f5f5f7] p-6 text-center dark:bg-gray-900">
      <span className="text-[44px]" aria-hidden="true">
        {glyph}
      </span>
      <p className="text-[15px] font-semibold text-gray-900 dark:text-gray-100">{app} needs an account</p>
      <p className="max-w-xs text-[13px] text-gray-500 dark:text-gray-400">{reason}</p>
      <a
        href="/login"
        className="mt-2 rounded-md bg-[#007aff] px-4 py-1.5 text-[13px] font-medium text-white shadow-sm hover:brightness-110"
      >
        Sign In…
      </a>
    </div>
  );
}
