import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/dal";

export function apiError(code: string, message: string, status: number, fieldErrors?: Record<string, string[]>) {
  return NextResponse.json({ error: { code, message, ...(fieldErrors ? { fieldErrors } : {}) } }, { status });
}

export async function apiUser() {
  const user = await getCurrentUser();
  const membership = user?.memberships[0];
  if (!user || !membership) return null;
  return { id: user.id, organizationId: membership.organizationId, role: membership.role };
}
