import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <p className="text-[48px]" aria-hidden="true">🍳</p>
      <h1 className="mt-2 text-[26px] font-extrabold tracking-[-0.02em] text-stone-900">Nothing cooking here</h1>
      <p className="mt-2 text-[14.5px] text-stone-600">That page or profile doesn’t exist.</p>
      <Link href="/feed" className="mt-6 rounded-xl bg-orange-600 px-4 py-2.5 text-[14px] font-semibold text-white hover:bg-orange-700">
        Back to the feed
      </Link>
    </main>
  );
}
