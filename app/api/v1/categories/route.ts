import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiError, apiUser } from "@/lib/api";
import { categorySchema } from "@/lib/validation/inventory";

export async function GET() {
  const user = await apiUser(); if (!user) return apiError("UNAUTHENTICATED", "Authentication required.", 401);
  const data = await db.category.findMany({ where: { organizationId: user.organizationId }, orderBy: { name: "asc" } });
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const user = await apiUser(); if (!user) return apiError("UNAUTHENTICATED", "Authentication required.", 401);
  if (user.role !== "ADMIN") return apiError("FORBIDDEN", "Admin access required.", 403);
  const parsed = categorySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("VALIDATION_ERROR", "Invalid category data.", 422, parsed.error.flatten().fieldErrors);
  try { const data = await db.category.create({ data: { ...parsed.data, organizationId: user.organizationId } }); return NextResponse.json({ data }, { status: 201 }); }
  catch { return apiError("CONFLICT", "Category name already exists.", 409); }
}
