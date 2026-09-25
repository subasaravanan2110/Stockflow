"use server";

import { AuthError } from "next-auth";
import { hash } from "argon2";
import { headers } from "next/headers";
import { signIn, signOut } from "@/auth";
import { db } from "@/lib/db";
import { createToken, hashToken } from "@/lib/crypto";
import { sendMail } from "@/lib/mail";
import { rateLimit } from "@/lib/rate-limit";
import { emailSchema, invitedRegisterSchema, loginSchema, resetPasswordSchema } from "@/lib/validation/auth";
import { passwordResetEmail } from "@/lib/email-templates";
import type { ActionState } from "@/lib/action-state";

async function clientKey(scope: string) {
  const headerStore = await headers();
  return `${scope}:${headerStore.get("x-forwarded-for")?.split(",")[0] ?? "local"}`;
}

export async function loginAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: "Check your details and try again.", fieldErrors: parsed.error.flatten().fieldErrors };
  if (!rateLimit(await clientKey("login"), 8, 60_000).allowed) return { status: "error", message: "Too many attempts. Try again shortly." };
  try {
    await signIn("credentials", { ...parsed.data, redirectTo: "/dashboard" });
  } catch (error) {
    if (error instanceof AuthError) return { status: "error", message: "Invalid credentials or unverified email." };
    throw error;
  }
  return { status: "success" };
}

export async function githubLoginAction() {
  await signIn("github", { redirectTo: "/dashboard" });
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}

export async function registerAction(_: ActionState, formData: FormData): Promise<ActionState> {
  if (!rateLimit(await clientKey("register"), 4, 60_000).allowed) return { status: "error", message: "Too many attempts. Try again shortly." };
  const parsed = invitedRegisterSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: "Please correct the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors };
  const { name, token, password } = parsed.data;
  const invitation = await db.invitation.findFirst({
    where: { tokenHash: hashToken(token), acceptedAt: null, expiresAt: { gt: new Date() } },
    select: { id: true, email: true, organizationId: true },
  });
  if (!invitation) return { status: "error", message: "This staff invitation is invalid or has expired." };
  if (await db.user.findUnique({ where: { email: invitation.email } })) {
    return { status: "error", message: "An account with this email already exists. Sign in with that account to accept the invitation." };
  }

  const passwordHash = await hash(password);
  await db.$transaction(async (tx) => {
    const claimed = await tx.invitation.updateMany({
      where: { id: invitation.id, acceptedAt: null, expiresAt: { gt: new Date() } },
      data: { acceptedAt: new Date() },
    });
    if (claimed.count !== 1) throw new Error("INVITATION_ALREADY_USED");
    const user = await tx.user.create({ data: { name, email: invitation.email, passwordHash, emailVerified: new Date() } });
    await tx.membership.create({ data: { userId: user.id, organizationId: invitation.organizationId, role: "STAFF" } });
  });
  return { status: "success", message: "Staff account created. You can now sign in to your organization." };
}

export async function forgotPasswordAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = emailSchema.safeParse(Object.fromEntries(formData));
  const generic = { status: "success" as const, message: "If that account exists, a reset link has been sent." };
  if (!parsed.success) return { status: "error", message: "Enter a valid email address.", fieldErrors: parsed.error.flatten().fieldErrors };
  if (!rateLimit(await clientKey("forgot"), 4, 60_000).allowed) return generic;
  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (!user?.passwordHash) return generic;
  const { token, tokenHash } = createToken();
  await db.passwordResetToken.create({ data: { email: user.email, tokenHash, expiresAt: new Date(Date.now() + 30 * 60 * 1000) } });
  const origin = process.env.AUTH_URL ?? (await headers()).get("origin") ?? "http://localhost:3000";
  const emailContent = passwordResetEmail({
    name: user.name ?? "there",
    resetUrl: `${origin}/reset-password?token=${token}`,
  });
  try {
    await sendMail({ to: user.email, ...emailContent });
  } catch (error) {
    console.error("Unable to send password reset email", error);
  }
  return generic;
}

export async function resetPasswordAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = resetPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: "Use a stronger matching password.", fieldErrors: parsed.error.flatten().fieldErrors };
  const tokenHash = hashToken(parsed.data.token);
  const record = await db.passwordResetToken.findFirst({ where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } } });
  if (!record) return { status: "error", message: "This reset link is invalid or expired." };
  const passwordHash = await hash(parsed.data.password);
  const verifiedAt = new Date();
  await db.$transaction([
    db.user.update({
      where: { email: record.email },
      data: { passwordHash, emailVerified: verifiedAt, sessionVersion: { increment: 1 } },
    }),
    // A password reset is a security boundary: remove every tracked browser
    // session immediately. Any remaining JWT cookie is rejected by the
    // incremented sessionVersion the next time it reaches the server.
    db.activeSession.deleteMany({ where: { user: { email: record.email } } }),
    db.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: verifiedAt } }),
  ]);
  return { status: "success", message: "Password updated. You can now sign in." };
}

export async function verifyEmailToken(token: string, email: string) {
  const parsed = emailSchema.safeParse({ email });
  if (!parsed.success || !/^[A-Za-z0-9_-]{32,128}$/.test(token)) return false;
  const record = await db.verificationToken.findFirst({ where: { identifier: parsed.data.email, token: hashToken(token), expires: { gt: new Date() } } });
  if (!record) return false;
  await db.$transaction([
    db.user.update({ where: { email: record.identifier }, data: { emailVerified: new Date() } }),
    db.verificationToken.delete({ where: { identifier_token: { identifier: record.identifier, token: record.token } } }),
  ]);
  return true;
}
