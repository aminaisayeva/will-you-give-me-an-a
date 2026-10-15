import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AuthCard from "@/components/cooked/AuthCard";
import LoginForm from "@/components/cooked/LoginForm";
import { getCookedSession, needsOnboarding } from "@/lib/cooked-session";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const session = await getCookedSession();
  if (session) redirect(needsOnboarding(session) ? "/onboarding" : "/feed");
  const { error } = await searchParams;
  return (
    <AuthCard title="Welcome back" subtitle="Log in to post pics and vote on captions.">
      <LoginForm initialError={typeof error === "string" ? `Sign-in didn’t work: ${error}` : null} />
    </AuthCard>
  );
}
