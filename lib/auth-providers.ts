import { supabaseEnv } from "@/lib/supabase/env";

// Asks Supabase which sign-in providers are switched on, so the lock screen
// can explain a disabled Google provider instead of sending people to a raw
// "provider is not enabled" error page.
export async function isGoogleEnabled(): Promise<boolean> {
  try {
    const { url, anonKey } = supabaseEnv();
    const res = await fetch(`${url}/auth/v1/settings`, {
      headers: { apikey: anonKey },
      next: { revalidate: 60 },
    });
    if (!res.ok) return true;
    const settings = (await res.json()) as { external?: Record<string, boolean> };
    return Boolean(settings.external?.google);
  } catch {
    // If the check itself fails, let the button try.
    return true;
  }
}
