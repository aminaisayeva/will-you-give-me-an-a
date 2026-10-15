"use client";

import { Flame, ImagePlus, X } from "lucide-react";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { MAX_CONTEXT } from "@/lib/cooked";
import { focusRing, shrink } from "./shared";

const COOKING_STEPS = [
  "Preheating the oven…",
  "Asking a Midwest mom for her honest opinion…",
  "Getting a real New Yorker to look up from their phone…",
  "Scrolling for the perfect reaction…",
  "Letting the tour guide walk backwards into frame…",
];

export type ComposerHandle = { pick: () => void };

// Collapsed: one slim bar. With a photo chosen: preview, context and "Cook it".
const Composer = forwardRef<
  ComposerHandle,
  { signedIn: boolean; hasProfile: boolean; onNeedAccount: () => void; onPosted: (id: string) => void }
>(function Composer({ signedIn, hasProfile, onNeedAccount, onPosted }, ref) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<Blob | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [context, setContext] = useState("");
  const [cooking, setCooking] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  useImperativeHandle(ref, () => ({ pick: () => fileRef.current?.click() }));

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  useEffect(() => {
    if (!cooking) return;
    const id = window.setInterval(() => setStep((s) => (s + 1) % COOKING_STEPS.length), 2200);
    return () => window.clearInterval(id);
  }, [cooking]);

  if (!signedIn || !hasProfile) {
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-stone-200">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 text-orange-700">
          <ImagePlus className="h-4.5 w-4.5" />
        </span>
        <p className="min-w-0 flex-1 text-[14px] text-stone-700">
          {signedIn ? "Pick a @username to start posting and voting." : "Want your own pics roasted? Create a free account to post and vote."}
        </p>
        <button type="button" onClick={onNeedAccount} className={`rounded-lg bg-stone-900 px-3.5 py-1.5 text-[13px] font-semibold text-white transition hover:bg-stone-700 ${focusRing}`}>
          {signedIn ? "Create profile" : "Sign up"}
        </button>
      </div>
    );
  }

  const pick = async (picked: File | undefined) => {
    setError(null);
    if (!picked) return;
    if (!/^image\/(jpeg|png|webp)$/.test(picked.type)) {
      setError("Use a JPEG, PNG or WebP photo. (iPhone HEIC photos: export them as “Most Compatible”.)");
      return;
    }
    try {
      const small = await shrink(picked);
      setFile(small);
      setPreview(URL.createObjectURL(small));
    } catch {
      setError("We couldn’t read that photo. Try another one.");
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setContext("");
    setError(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const cook = async () => {
    if (!file) return;
    setCooking(true);
    setStep(0);
    setError(null);
    const form = new FormData();
    form.set("image", file, "photo.jpg");
    if (context.trim()) form.set("context", context.trim());
    try {
      const res = await fetch("/api/cooked", { method: "POST", body: form });
      const data = (await res.json().catch(() => ({}))) as { id?: string; error?: string };
      if (!res.ok || !data.id) {
        setError(data.error ?? "We couldn’t cook that pic. Try again.");
        return;
      }
      reset();
      onPosted(data.id);
    } catch {
      setError("Connection failed. Check your internet and try again.");
    } finally {
      setCooking(false);
    }
  };

  return (
    <section
      aria-label="Post a pic"
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        void pick(e.dataTransfer.files?.[0]);
      }}
      className={`rounded-2xl bg-white shadow-sm ring-1 transition ${dragging ? "ring-2 ring-orange-500" : "ring-stone-200"}`}
    >
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => void pick(e.target.files?.[0])}
      />

      {!preview ? (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition hover:bg-orange-50/60 ${focusRing}`}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-700">
            <ImagePlus className="h-4.5 w-4.5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] font-semibold text-stone-800">Got a pic? Get it cooked.</span>
            <span className="block text-[12.5px] text-stone-500">Tap to choose a photo, or drop one here.</span>
          </span>
          <span className="hidden shrink-0 rounded-lg bg-orange-600 px-3 py-1.5 text-[13px] font-semibold text-white @md:inline">Choose photo</span>
        </button>
      ) : (
        <div className="@container grid gap-4 p-4 @lg:grid-cols-[13rem_1fr]">
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element -- local preview */}
            <img src={preview} alt="The photo you chose" className="h-44 w-full rounded-xl bg-stone-100 object-cover @lg:h-full @lg:max-h-56" />
            {!cooking && (
              <button
                type="button"
                onClick={reset}
                aria-label="Remove photo"
                className={`absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white transition hover:bg-black/80 ${focusRing}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="flex min-w-0 flex-col">
            <label htmlFor="cooked-context" className="text-[13px] font-semibold text-stone-800">
              What’s going on in this pic? <span className="font-normal text-stone-500">Optional</span>
            </label>
            <input
              id="cooked-context"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              maxLength={MAX_CONTEXT}
              disabled={cooking}
              placeholder="e.g. my first NYC apartment, $2,400/month"
              className="mt-1.5 rounded-lg border border-stone-300 px-3 py-2 text-[14px] outline-none transition focus:border-orange-500 focus:ring-[3px] focus:ring-orange-200 disabled:bg-stone-50"
            />
            <p className="mt-1 text-right text-[11px] text-stone-400 tabular-nums">
              {context.length}/{MAX_CONTEXT}
            </p>
            <p className="mt-1 text-[12px] text-stone-500">Your post is public: everyone on cooked.ai can see the photo and its captions.</p>
            <button
              type="button"
              onClick={() => void cook()}
              disabled={cooking}
              className={`mt-3 flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-[14px] font-semibold text-white shadow-[0_8px_18px_-8px_rgba(194,65,12,0.7)] transition hover:bg-orange-700 active:translate-y-px disabled:cursor-wait disabled:opacity-80 @lg:mt-auto ${focusRing}`}
            >
              {cooking ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" aria-hidden="true" />
                  {COOKING_STEPS[step]}
                </>
              ) : (
                <>
                  <Flame className="h-4 w-4" /> Cook it
                </>
              )}
            </button>
          </div>
        </div>
      )}
      <p role="status" aria-live="polite" className="sr-only">
        {cooking ? "Writing captions for your photo." : ""}
      </p>
      {error && (
        <p role="alert" className="border-t border-red-100 bg-red-50 px-4 py-2 text-[13px] text-red-700">
          {error}
        </p>
      )}
    </section>
  );
});

export default Composer;
