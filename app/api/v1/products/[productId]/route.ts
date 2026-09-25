import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiError, apiUser } from "@/lib/api";
import { productSchema } from "@/lib/validation/inventory";
import { productRelationsBelongToOrganization } from "@/lib/inventory/service";
import { entityIdSchema } from "@/lib/validation/common";

type Context = { params: Promise<{ productId: string }> };

export async function GET(_: NextRequest, { params }: Context) {
  const user = await apiUser(); if (!user) return apiError("UNAUTHENTICATED", "Authentication required.", 401);
  const { productId } = await params;
  if (!entityIdSchema.safeParse(productId).success) return apiError("INVALID_ID", "Invalid product identifier.", 400);
  const product = await db.product.findFirst({ where: { id: productId, organizationId: user.organizationId }, include: { category: true, supplier: true } });
  return product ? NextResponse.json({ data: product }) : apiError("NOT_FOUND", "Product not found.", 404);
}

export async function PATCH(request: NextRequest, { params }: Context) {
  const user = await apiUser(); if (!user) return apiError("UNAUTHENTICATED", "Authentication required.", 401);
  if (user.role !== "ADMIN") return apiError("FORBIDDEN", "Admin access required.", 403);
  const { productId } = await params;
  if (!entityIdSchema.safeParse(productId).success) return apiError("INVALID_ID", "Invalid product identifier.", 400);
  const parsed = productSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("VALIDATION_ERROR", "Invalid product data.", 422, parsed.error.flatten().fieldErrors);
  if (!(await productRelationsBelongToOrganization(user.organizationId, parsed.data.categoryId, parsed.data.supplierId))) return apiError("INVALID_RELATION", "Category or supplier is not available in this workspace.", 422);
  const exists = await db.product.findFirst({ where: { id: productId, organizationId: user.organizationId } });
  if (!exists) return apiError("NOT_FOUND", "Product not found.", 404);
  const product = await db.product.update({ where: { id: productId }, data: { ...parsed.data, sku: parsed.data.sku.toUpperCase(), supplierId: parsed.data.supplierId || null } });
  return NextResponse.json({ data: product });
}

export async function DELETE(_: NextRequest, { params }: Context) {
  const user = await apiUser(); if (!user) return apiError("UNAUTHENTICATED", "Authentication required.", 401);
  if (user.role !== "ADMIN") return apiError("FORBIDDEN", "Admin access required.", 403);
  const { productId } = await params;
  if (!entityIdSchema.safeParse(productId).success) return apiError("INVALID_ID", "Invalid product identifier.", 400);
  const result = await db.product.updateMany({ where: { id: productId, organizationId: user.organizationId }, data: { isArchived: true } });
  return result.count ? new NextResponse(null, { status: 204 }) : apiError("NOT_FOUND", "Product not found.", 404);
}
