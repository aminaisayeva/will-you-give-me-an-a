import { NextResponse, type NextRequest } from "next/server";
import { CAPTION_SYSTEM_PROMPT, captionPhoto, GeminiError } from "@/lib/gemini";
import { DAILY_PHOTO_LIMIT, MAX_CONTEXT, PHOTO_BUCKET } from "@/lib/cooked";
import { MAX_AVATAR_BYTES } from "@/lib/supabase";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 120;

const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const json = (body: Record<string, unknown>, status = 200) => NextResponse.json(body, { status });

// POST multipart { image, context? } -> { id }. Stores the photo in Storage,
// asks Gemini for captions, and saves the photo row (with the prompt) and
// its captions.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return json({ error: "Sign in to get your pics cooked." }, 401);

  const form = await request.formData().catch(() => null);
  const image = form?.get("image");
  const contextRaw = form?.get("context");
  const context = typeof contextRaw === "string" && contextRaw.trim() ? contextRaw.trim().slice(0, MAX_CONTEXT) : null;
  if (!(image instanceof File) || image.size === 0) return json({ error: "Choose a photo first." }, 400);
  const ext = TYPES[image.type];
  if (!ext) return json({ error: "Photos must be JPEG, PNG or WebP." }, 400);
  if (image.size > MAX_AVATAR_BYTES) return json({ error: "That photo is over 4 MB." }, 400);

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("photos")
    .select("id", { count: "exact", head: true })
    .eq("author_id", user.id)
    .gte("created_at", since);
  if ((count ?? 0) >= DAILY_PHOTO_LIMIT) {
    return json({ error: `You've posted ${DAILY_PHOTO_LIMIT} pics today. The oven needs a break. Come back tomorrow!` }, 429);
  }

  const bytes = Buffer.from(await image.arrayBuffer());

  let result;
  try {
    result = await captionPhoto({ mimeType: image.type, base64: bytes.toString("base64") }, context);
  } catch (err) {
    console.error("captioning failed", err);
    return json({ error: err instanceof GeminiError ? err.message : "Couldn't cook that pic. Try again." }, 502);
  }

  // The image goes to Storage; the table only stores its path.
  const path = `${user.id}/${Date.now()}.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, bytes, { contentType: image.type, cacheControl: "31536000" });
  if (uploadError) return json({ error: `Couldn't upload the photo: ${uploadError.message}` }, 500);

  const cleanup = async (photoId?: string) => {
    if (photoId) await supabase.from("photos").delete().eq("id", photoId);
    await supabase.storage.from(PHOTO_BUCKET).remove([path]);
  };

  const { data: photo, error: photoError } = await supabase
    .from("photos")
    .insert({ image_path: path, prompt: context, system_prompt: CAPTION_SYSTEM_PROMPT, model: result.model })
    .select("id")
    .single();
  if (photoError || !photo) {
    await cleanup();
    return json({ error: `Couldn't save the photo: ${photoError?.message}` }, 500);
  }

  const { error: captionError } = await supabase
    .from("captions")
    .insert(result.captions.map((c, position) => ({ photo_id: photo.id, style: c.style, text: c.text, position })));
  if (captionError) {
    await cleanup(photo.id);
    return json({ error: `Couldn't save the captions: ${captionError.message}` }, 500);
  }

  return json({ id: photo.id });
}
