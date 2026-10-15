import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AuthCard from "@/components/cooked/AuthCard";
import SignupForm from "@/components/cooked/SignupForm";
import { getCookedSession, needsOnboarding } from "@/lib/cooked-session";

export const metadata: Metadata = { title: "Sign up" };

export default async function SignupPage() {
  const session = await getCookedSession();
  if (session) redirect(needsOnboarding(session) ? "/onboarding" : "/feed");
  return (
    <AuthCard title="Create your account" subtitle="Post pics, vote on captions, and get your own @username.">
      <SignupForm />
    </AuthCard>
  );
}
