import type { Metadata } from "next";
import { SignupForm } from "@/components/auth/signup-form";
import { db } from "@/lib/db";
import { hashToken } from "@/lib/crypto";

export const metadata: Metadata = { title: "Create staff account" };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  const validToken = /^[A-Za-z0-9_-]{32,128}$/.test(token);
  const invitation = validToken
    ? await db.invitation.findFirst({
        where: { tokenHash: hashToken(token), acceptedAt: null, expiresAt: { gt: new Date() } },
        select: { email: true },
      })
    : null;
  return <SignupForm token={token} invitation={invitation} />;
}
