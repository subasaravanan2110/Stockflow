import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiError, apiUser } from "@/lib/api";
import { productSchema } from "@/lib/validation/inventory";
import { productRelationsBelongToOrganization } from "@/lib/inventory/service";
import { positiveIntegerParam } from "@/lib/validation/common";

export async function GET(request: NextRequest) {
  const user = await apiUser(); if (!user) return apiError("UNAUTHENTICATED", "Authentication required.", 401);
  const q = request.nextUrl.searchParams.get("q")?.trim().slice(0, 100) ?? "";
  const page = positiveIntegerParam(request.nextUrl.searchParams.get("page"), 1, 100_000);
  const limit = positiveIntegerParam(request.nextUrl.searchParams.get("limit"), 20, 100);
  const where = { organizationId: user.organizationId, isArchived: false, ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" as const } }, { sku: { contains: q, mode: "insensitive" as const } }] } : {}) };
  const [data, total] = await Promise.all([db.product.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit, include: { category: { select: { name: true } }, supplier: { select: { name: true } } } }), db.product.count({ where })]);
  return NextResponse.json({ data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
}

export async function POST(request: NextRequest) {
  const user = await apiUser(); if (!user) return apiError("UNAUTHENTICATED", "Authentication required.", 401);
  if (user.role !== "ADMIN") return apiError("FORBIDDEN", "Admin access required.", 403);
  const parsed = productSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("VALIDATION_ERROR", "Invalid product data.", 422, parsed.error.flatten().fieldErrors);
  if (!(await productRelationsBelongToOrganization(user.organizationId, parsed.data.categoryId, parsed.data.supplierId))) return apiError("INVALID_RELATION", "Category or supplier is not available in this workspace.", 422);
  try {
    const product = await db.product.create({ data: { ...parsed.data, sku: parsed.data.sku.toUpperCase(), supplierId: parsed.data.supplierId || null, organizationId: user.organizationId } });
    return NextResponse.json({ data: product }, { status: 201 });
  } catch { return apiError("CONFLICT", "The SKU exists or a related record is invalid.", 409); }
}
