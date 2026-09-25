import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import type { Role } from "@/generated/prisma/client";

export const getAuthSession = cache(auth);

export const getCurrentUser = cache(async () => {
  const session = await getAuthSession();
  if (!session?.user?.id || !session.user.organizationId || session.requiresTwoFactor || session.demoSessionExpired) return null;
  return db.user.findFirst({
    where: {
      id: session.user.id,
      status: "ACTIVE",
      memberships: { some: { organizationId: session.user.organizationId } },
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      memberships: {
        where: { organizationId: session.user.organizationId },
        take: 1,
        select: { organizationId: true, role: true, organization: { select: { name: true, slug: true } } },
      },
    },
  });
});

export async function requireUser() {
  const session = await getAuthSession();
  if (session?.demoSessionExpired) redirect("/login?reason=demo-session-expired");
  if (session?.requiresTwoFactor && session.user?.id && session.user.organizationId) redirect("/two-factor");
  const user = await getCurrentUser();
  if (!user?.memberships[0]) redirect("/login");
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    organizationId: user.memberships[0].organizationId,
    organization: user.memberships[0].organization,
    role: user.memberships[0].role,
    authProvider: session?.authProvider,
    demoExpiresAt: session?.demoExpiresAt,
  };
}

export async function requireRole(roles: Role[]) {
  const user = await requireUser();
  if (!roles.includes(user.role)) throw new Error("FORBIDDEN");
  return user;
}
