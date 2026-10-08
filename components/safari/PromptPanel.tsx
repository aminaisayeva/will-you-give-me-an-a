"use client";

import { useEffect, useState } from "react";
import type { PromptDetails } from "@/app/actions/prompts";

// Shows exactly what was sent to Gemini: the person's input, the message,
// the full instructions and the model. Loaded on demand.
export default function PromptPanel({ load, who }: { load: () => Promise<PromptDetails | null>; who: string }) {
  const [details, setDetails] = useState<PromptDetails | null | undefined>(undefined);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    let cancelled = false;
    load().then((d) => {
      if (!cancelled) setDetails(d);
    });
    return () => {
      cancelled = true;
    };
    // Load once per open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (details === undefined) return <p className="text-[12px] text-gray-500">Loading prompt…</p>;
  if (details === null) return <p className="text-[12px] text-gray-500">Prompt not found.</p>;

  return (
    <div className="text-[12px] text-gray-700">
      <p className="font-semibold text-gray-900">{who} wrote</p>
      <p className="mt-0.5 whitespace-pre-wrap">{details.userInput ? `“${details.userInput}”` : <span className="italic text-gray-500">nothing (just the photo)</span>}</p>

      <p className="mt-3 font-semibold text-gray-900">
        Sent to Gemini <span className="font-normal text-gray-500">· model {details.model}</span>
      </p>
      <p className="mt-0.5 rounded-md bg-gray-50 px-2 py-1 font-mono text-[11px]">
        {details.attachedPhoto && <span className="mr-1 rounded bg-orange-100 px-1 text-orange-700">[photo]</span>}
        {details.message}
      </p>

      <button
        type="button"
        onClick={() => setShowInstructions((v) => !v)}
        className="mt-2 text-[12px] font-medium text-[#007aff] hover:underline"
      >
        {showInstructions ? "Hide" : "Show"} full instructions ({details.systemPrompt.length.toLocaleString()} characters)
      </button>
      {showInstructions && (
        <pre className="mt-1 max-h-60 overflow-y-auto whitespace-pre-wrap rounded-md bg-gray-900 p-2.5 font-mono text-[11px] leading-relaxed text-gray-100">
          {details.systemPrompt}
        </pre>
      )}
    </div>
  );
}
