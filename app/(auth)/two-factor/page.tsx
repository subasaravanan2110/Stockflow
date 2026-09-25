import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { TwoFactorChallenge } from "@/components/auth/two-factor-challenge";

export const metadata: Metadata = { title: "Two-factor verification" };

export default async function TwoFactorPage() {
  const session = await auth();
  if (!session?.user?.id || session.demoSessionExpired) redirect("/login");
  if (!session.requiresTwoFactor) redirect("/dashboard");
  const credential = await db.twoFactorCredential.findUnique({
    where: { userId: session.user.id },
    select: { enabledAt: true },
  });
  return <TwoFactorChallenge needsSetup={session.authProvider === "github" && !credential?.enabledAt} />;
}
