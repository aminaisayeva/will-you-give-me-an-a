import type { Metadata } from "next";
import Feed from "@/components/cooked/Feed";
import { getCookedSession } from "@/lib/cooked-session";

export const metadata: Metadata = { title: "Feed" };

// Anyone can browse; posting and voting need an account and a @username.
export default async function FeedPage() {
  const session = await getCookedSession();
  return (
    <Feed
      me={{
        signedIn: Boolean(session),
        profile: session?.profile ?? null,
        suggestedUsername: "",
        suggestedName: "",
      }}
    />
  );
}
