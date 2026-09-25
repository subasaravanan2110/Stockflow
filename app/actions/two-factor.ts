"use server";

import QRCode from "qrcode";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/dal";
import { rateLimit } from "@/lib/rate-limit";
import { createTwoFactorSetup, verifyTwoFactorCode } from "@/lib/security/two-factor";

export type TwoFactorActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  qrCode?: string;
  manualKey?: string;
};

async function limited(scope: string, userId: string) {
  const headerStore = await headers();
  const ip = headerStore.get("x-forwarded-for")?.split(",")[0] ?? "local";
  return !rateLimit(`${scope}:${userId}:${ip}`, 8, 60_000).allowed;
}

async function authenticatedSession() {
  const session = await auth();
  if (!session?.user?.id || !session.user.organizationId || session.demoSessionExpired) redirect("/login");
  return session;
}

export async function beginTwoFactorSetupAction(): Promise<TwoFactorActionState> {
  const session = await authenticatedSession();
  if (await limited("2fa-setup", session.user.id)) return { status: "error", message: "Too many attempts. Try again shortly." };
  const existing = await db.twoFactorCredential.findUnique({ where: { userId: session.user.id } });
  if (existing?.enabledAt) return { status: "error", message: "Two-factor authentication is already enabled." };

  const setup = createTwoFactorSetup(session.user.email ?? "StockFlow developer");
  await db.twoFactorCredential.upsert({
    where: { userId: session.user.id },
    update: { secretEncrypted: setup.encryptedSecret, enabledAt: null },
    create: { userId: session.user.id, secretEncrypted: setup.encryptedSecret },
  });
  const qrCode = await QRCode.toDataURL(setup.uri, { width: 184, margin: 1, errorCorrectionLevel: "M" });
  return { status: "success", message: "Scan the QR code, then enter the six-digit code.", qrCode, manualKey: setup.secret };
}

export async function confirmTwoFactorSetupAction(_: TwoFactorActionState, formData: FormData): Promise<TwoFactorActionState> {
  const session = await authenticatedSession();
  if (await limited("2fa-confirm", session.user.id)) return { status: "error", message: "Too many attempts. Try again shortly." };
  const code = String(formData.get("code") ?? "").replaceAll(" ", "");
  const credential = await db.twoFactorCredential.findUnique({ where: { userId: session.user.id } });
  if (!credential || credential.enabledAt) return { status: "error", message: "Start setup again to get a fresh QR code." };
  if (!(await verifyTwoFactorCode(credential.secretEncrypted, code))) return { status: "error", message: "That authenticator code is invalid or expired." };

  await db.$transaction([
    db.twoFactorCredential.update({ where: { userId: session.user.id }, data: { enabledAt: new Date() } }),
    ...(session.activeSessionId
      ? [db.activeSession.updateMany({ where: { id: session.activeSessionId, userId: session.user.id }, data: { twoFactorVerifiedAt: new Date() } })]
      : []),
  ]);
  revalidatePath("/dashboard/settings");
  if (session.requiresTwoFactor) redirect("/dashboard");
  return { status: "success", message: "Two-factor authentication is enabled." };
}

export async function disableTwoFactorAction(_: TwoFactorActionState, formData: FormData): Promise<TwoFactorActionState> {
  const user = await requireUser();
  if (user.authProvider === "github") return { status: "error", message: "Two-factor authentication is required for GitHub developer access." };
  if (await limited("2fa-disable", user.id)) return { status: "error", message: "Too many attempts. Try again shortly." };
  const code = String(formData.get("code") ?? "").replaceAll(" ", "");
  const credential = await db.twoFactorCredential.findUnique({ where: { userId: user.id } });
  if (!credential?.enabledAt) return { status: "error", message: "Two-factor authentication is not enabled." };
  if (!(await verifyTwoFactorCode(credential.secretEncrypted, code))) return { status: "error", message: "Enter a valid authenticator code to disable 2FA." };
  await db.twoFactorCredential.delete({ where: { userId: user.id } });
  revalidatePath("/dashboard/settings");
  return { status: "success", message: "Two-factor authentication is disabled." };
}

export async function verifyTwoFactorChallengeAction(_: TwoFactorActionState, formData: FormData): Promise<TwoFactorActionState> {
  const session = await auth();
  if (!session?.user?.id || !session.activeSessionId) redirect("/login");
  if (!session.requiresTwoFactor) redirect("/dashboard");
  if (await limited("2fa-challenge", session.user.id)) return { status: "error", message: "Too many attempts. Try again shortly." };
  const code = String(formData.get("code") ?? "").replaceAll(" ", "");
  const credential = await db.twoFactorCredential.findUnique({ where: { userId: session.user.id } });
  if (!credential?.enabledAt || !(await verifyTwoFactorCode(credential.secretEncrypted, code))) {
    return { status: "error", message: "That authenticator code is invalid or expired." };
  }
  await db.activeSession.updateMany({
    where: { id: session.activeSessionId, userId: session.user.id, expiresAt: { gt: new Date() } },
    data: { twoFactorVerifiedAt: new Date(), lastSeenAt: new Date() },
  });
  redirect("/dashboard");
}
