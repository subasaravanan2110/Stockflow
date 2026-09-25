import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "@/components/auth/login-form";
import { loginRedirectFor } from "@/lib/auth/redirects";

export const metadata: Metadata = { title: "Sign in" };
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ reason?: string; error?: string }> }) {
  const [session, params] = await Promise.all([auth(), searchParams]);
  const destination = loginRedirectFor(session);
  if (destination) redirect(destination);
  return <LoginForm
    demoSessionExpired={params.reason === "demo-session-expired" || session?.demoSessionExpired}
    githubAccessDenied={Boolean(params.error)}
  />;
}
