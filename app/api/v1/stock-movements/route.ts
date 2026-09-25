import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiError, apiUser } from "@/lib/api";
import { stockMovementSchema } from "@/lib/validation/inventory";
import { createStockMovement } from "@/lib/inventory/service";
import { positiveIntegerParam } from "@/lib/validation/common";

export async function GET(request: NextRequest) {
  const user = await apiUser(); if (!user) return apiError("UNAUTHENTICATED", "Authentication required.", 401);
  const limit = positiveIntegerParam(request.nextUrl.searchParams.get("limit"), 25, 100);
  const data = await db.stockMovement.findMany({ where: { organizationId: user.organizationId }, take: limit, orderBy: { createdAt: "desc" }, include: { product: { select: { name: true, sku: true } }, performedBy: { select: { name: true } } } });
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const user = await apiUser(); if (!user) return apiError("UNAUTHENTICATED", "Authentication required.", 401);
  const parsed = stockMovementSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("VALIDATION_ERROR", "Invalid movement data.", 422, parsed.error.flatten().fieldErrors);
  try { const data = await createStockMovement({ ...parsed.data, organizationId: user.organizationId, actorId: user.id }); return NextResponse.json({ data }, { status: 201 }); }
  catch (error) { return apiError("STOCK_CONFLICT", error instanceof Error && error.message === "INSUFFICIENT_STOCK" ? "Insufficient stock." : "Inventory changed. Retry the request.", 409); }
}
