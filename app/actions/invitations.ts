"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/dal";
import { createToken } from "@/lib/crypto";
import { sendMail } from "@/lib/mail";
import { emailSchema } from "@/lib/validation/auth";
import { recordAudit } from "@/lib/audit";
import { staffInvitationEmail } from "@/lib/email-templates";
import type { ActionState } from "@/lib/action-state";

export type InvitationActionState = ActionState & { invitationUrl?: string };

export async function inviteStaffAction(_: InvitationActionState, formData: FormData): Promise<InvitationActionState> {
  const administrator = await requireRole(["ADMIN"]);
  const parsed = emailSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: "Enter a valid staff email address.", fieldErrors: parsed.error.flatten().fieldErrors };

  const email = parsed.data.email.toLowerCase();
  const existingMember = await db.membership.findFirst({
    where: { organizationId: administrator.organizationId, user: { email } },
    select: { id: true },
  });
  if (existingMember) return { status: "error", message: "This person is already a member of your organization." };

  const { token, tokenHash } = createToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const invitation = await db.$transaction(async (tx) => {
    await tx.invitation.deleteMany({ where: { organizationId: administrator.organizationId, email, acceptedAt: null } });
    return tx.invitation.create({
      data: {
        email,
        role: "STAFF",
        tokenHash,
        expiresAt,
        organizationId: administrator.organizationId,
        invitedById: administrator.id,
      },
    });
  });

  const origin = process.env.AUTH_URL ?? (await headers()).get("origin") ?? "http://localhost:3000";
  const invitationUrl = `${origin}/signup?token=${token}`;
  const emailContent = staffInvitationEmail({
    organizationName: administrator.organization.name,
    inviterName: administrator.name ?? "Your administrator",
    invitationUrl,
  });
  let delivered = false;
  try {
    const delivery = await sendMail({
      to: email,
      ...emailContent,
    });
    delivered = delivery.delivered;
  } catch (error) {
    console.error("Unable to send staff invitation", error);
  }

  await recordAudit({
    organizationId: administrator.organizationId,
    actorId: administrator.id,
    action: "staff.invited",
    entityType: "Invitation",
    entityId: invitation.id,
    metadata: { email, role: "STAFF", emailDelivered: delivered },
  });
  revalidatePath("/dashboard/users");
  if (!delivered) {
    return {
      status: "error",
      message: "Email was not delivered. Use the secure invitation link below for local testing, or check the Gmail SMTP or Resend configuration.",
      invitationUrl,
    };
  }
  return { status: "success", message: `Invitation sent to ${email}. It expires in 24 hours.` };
}
