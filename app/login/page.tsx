import type { Metadata } from "next";
import LoginScreen from "./LoginScreen";

export const metadata: Metadata = {
  title: "Log In · Will you give me an A?",
  description: "Sign in with Google to unlock your transcript and profile.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error } = await searchParams;
  return <LoginScreen error={typeof error === "string" ? error : null} />;
}
