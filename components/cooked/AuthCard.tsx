import type { ReactNode } from "react";

// The centred card used by the log in, sign up and onboarding pages.
export default function AuthCard({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <main className="flex justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-[0_24px_60px_-30px_rgba(120,53,15,0.45)] ring-1 ring-stone-200 sm:p-8">
        <h1 className="text-[26px] font-extrabold tracking-[-0.02em] text-stone-900">{title}</h1>
        {subtitle && <p className="mt-1.5 text-[14.5px] text-stone-600">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </div>
    </main>
  );
}
