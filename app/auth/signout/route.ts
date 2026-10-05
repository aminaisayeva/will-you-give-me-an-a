import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { UNLOCK_COOKIE } from "@/lib/lock";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  // Logging out also locks the screen, like macOS.
  const response = NextResponse.redirect(new URL("/login", request.url), { status: 303 });
  response.cookies.delete(UNLOCK_COOKIE);
  return response;
}
