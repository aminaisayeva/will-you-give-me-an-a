"use server";

import { captionUserMessage, siteUserMessage } from "@/lib/gemini";
import { addressFromInput } from "@/lib/sites";
import { getSupabase } from "@/lib/supabase";

// What was actually sent to Gemini for a post, for the "Prompt" buttons.
export type PromptDetails = {
  userInput: string | null; // what the person typed
  message: string; // the user message sent with it
  attachedPhoto: boolean;
  systemPrompt: string; // the full instructions
  model: string;
};

export async function getPhotoPrompt(photoId: string): Promise<PromptDetails | null> {
  const { data } = await getSupabase().from("photos").select("prompt, system_prompt, model").eq("id", photoId).maybeSingle();
  if (!data) return null;
  return {
    userInput: data.prompt,
    message: captionUserMessage(data.prompt),
    attachedPhoto: true,
    systemPrompt: data.system_prompt,
    model: data.model,
  };
}

export async function getSitePrompt(siteId: string): Promise<PromptDetails | null> {
  const { data } = await getSupabase().from("sites").select("prompt, system_prompt, model").eq("id", siteId).maybeSingle();
  if (!data) return null;
  return {
    userInput: data.prompt,
    message: siteUserMessage(data.prompt, addressFromInput(data.prompt)),
    attachedPhoto: false,
    systemPrompt: data.system_prompt,
    model: data.model,
  };
}
