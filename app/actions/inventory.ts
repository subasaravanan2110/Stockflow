"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole, requireUser } from "@/lib/auth/dal";
import { recordAudit } from "@/lib/audit";
import { categorySchema, productSchema, purchaseOrderSchema, stockMovementSchema, supplierSchema } from "@/lib/validation/inventory";
import { createStockMovement, productRelationsBelongToOrganization } from "@/lib/inventory/service";
import type { ActionState } from "@/lib/action-state";
import { entityIdSchema } from "@/lib/validation/common";

function validationError(error: { flatten(): { fieldErrors: Record<string, string[]> } }): ActionState {
  return { status: "error", message: "Please correct the highlighted fields.", fieldErrors: error.flatten().fieldErrors };
}

export async function createProductAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireRole(["ADMIN"]);
  const parsed = productSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationError(parsed.error);
  if (!(await productRelationsBelongToOrganization(user.organizationId, parsed.data.categoryId, parsed.data.supplierId))) return { status: "error", message: "Select a valid category and supplier from this workspace." };
  try {
    const product = await db.product.create({
      data: {
        ...parsed.data,
        sku: parsed.data.sku.toUpperCase(),
        supplierId: parsed.data.supplierId || null,
        organizationId: user.organizationId,
      },
    });
    await recordAudit({ organizationId: user.organizationId, actorId: user.id, action: "product.created", entityType: "Product", entityId: product.id });
  } catch {
    return { status: "error", message: "Could not create the product. The SKU may already exist." };
  }
  revalidatePath("/dashboard/products");
  redirect("/dashboard/products");
}

export async function updateProductAction(id: string, _: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireRole(["ADMIN"]);
  if (!entityIdSchema.safeParse(id).success) return { status: "error", message: "Product not found." };
  const parsed = productSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationError(parsed.error);
  if (!(await productRelationsBelongToOrganization(user.organizationId, parsed.data.categoryId, parsed.data.supplierId))) return { status: "error", message: "Select a valid category and supplier from this workspace." };
  const existing = await db.product.findFirst({ where: { id, organizationId: user.organizationId } });
  if (!existing) return { status: "error", message: "Product not found." };
  await db.product.update({ where: { id }, data: { ...parsed.data, sku: parsed.data.sku.toUpperCase(), supplierId: parsed.data.supplierId || null } });
  await recordAudit({ organizationId: user.organizationId, actorId: user.id, action: "product.updated", entityType: "Product", entityId: id });
  revalidatePath(`/dashboard/products/${id}`);
  return { status: "success", message: "Product updated." };
}

export async function archiveProductAction(id: string) {
  const user = await requireRole(["ADMIN"]);
  if (!entityIdSchema.safeParse(id).success) throw new Error("NOT_FOUND");
  const product = await db.product.findFirst({ where: { id, organizationId: user.organizationId } });
  if (!product) throw new Error("NOT_FOUND");
  await db.product.update({ where: { id }, data: { isArchived: !product.isArchived } });
  await recordAudit({ organizationId: user.organizationId, actorId: user.id, action: product.isArchived ? "product.restored" : "product.archived", entityType: "Product", entityId: id });
  revalidatePath("/dashboard/products");
  revalidatePath(`/dashboard/products/${id}`);
}

export async function createCategoryAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireRole(["ADMIN"]);
  const parsed = categorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationError(parsed.error);
  try {
    await db.category.create({ data: { ...parsed.data, organizationId: user.organizationId } });
  } catch {
    return { status: "error", message: "A category with that name already exists." };
  }
  revalidatePath("/dashboard/categories");
  return { status: "success", message: "Category created." };
}

export async function deleteCategoryAction(id: string) {
  const user = await requireRole(["ADMIN"]);
  if (!entityIdSchema.safeParse(id).success) throw new Error("NOT_FOUND");
  const category = await db.category.findFirst({ where: { id, organizationId: user.organizationId }, include: { _count: { select: { products: true } } } });
  if (!category || category._count.products > 0) throw new Error("CATEGORY_IN_USE");
  await db.category.delete({ where: { id } });
  revalidatePath("/dashboard/categories");
}

export async function createSupplierAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireRole(["ADMIN"]);
  const parsed = supplierSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationError(parsed.error);
  try {
    await db.supplier.create({ data: { ...parsed.data, email: parsed.data.email || null, organizationId: user.organizationId } });
  } catch {
    return { status: "error", message: "A supplier with that name already exists." };
  }
  revalidatePath("/dashboard/suppliers");
  return { status: "success", message: "Supplier created." };
}

export async function archiveSupplierAction(id: string) {
  const user = await requireRole(["ADMIN"]);
  if (!entityIdSchema.safeParse(id).success) throw new Error("NOT_FOUND");
  const supplier = await db.supplier.findFirst({ where: { id, organizationId: user.organizationId } });
  if (!supplier) throw new Error("NOT_FOUND");
  await db.supplier.update({ where: { id }, data: { isArchived: !supplier.isArchived } });
  revalidatePath("/dashboard/suppliers");
}

export async function createMovementAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = stockMovementSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationError(parsed.error);
  try {
    await createStockMovement({ ...parsed.data, organizationId: user.organizationId, actorId: user.id });
  } catch (error) {
    const message = error instanceof Error && error.message === "INSUFFICIENT_STOCK"
      ? "This movement would make stock negative."
      : "Inventory changed while saving. Refresh and try again.";
    return { status: "error", message };
  }
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/products");
  revalidatePath("/dashboard/inventory");
  return { status: "success", message: "Stock movement recorded." };
}

export async function createPurchaseOrderAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireRole(["ADMIN"]);
  const parsed = purchaseOrderSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationError(parsed.error);
  const [supplier, product] = await Promise.all([
    db.supplier.findFirst({ where: { id: parsed.data.supplierId, organizationId: user.organizationId, isArchived: false } }),
    db.product.findFirst({ where: { id: parsed.data.productId, organizationId: user.organizationId, isArchived: false } }),
  ]);
  if (!supplier || !product) return { status: "error", message: "Select a valid supplier and product." };
  const number = `PO-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
  const order = await db.purchaseOrder.create({
    data: {
      number,
      status: "ORDERED",
      organizationId: user.organizationId,
      supplierId: supplier.id,
      expectedDate: parsed.data.expectedDate ? new Date(`${parsed.data.expectedDate}T12:00:00Z`) : null,
      notes: parsed.data.notes,
      totalAmount: parsed.data.quantity * parsed.data.unitCost,
      items: { create: { productId: product.id, quantity: parsed.data.quantity, unitCost: parsed.data.unitCost } },
    },
  });
  await recordAudit({ organizationId: user.organizationId, actorId: user.id, action: "purchase.created", entityType: "PurchaseOrder", entityId: order.id });
  revalidatePath("/dashboard/purchases");
  return { status: "success", message: `${number} created.` };
}

export async function receivePurchaseOrderAction(id: string) {
  const user = await requireRole(["ADMIN"]);
  if (!entityIdSchema.safeParse(id).success) throw new Error("NOT_FOUND");
  await db.$transaction(async (tx) => {
    const order = await tx.purchaseOrder.findFirst({ where: { id, organizationId: user.organizationId, status: "ORDERED" }, include: { items: true } });
    if (!order) throw new Error("ORDER_NOT_RECEIVABLE");
    for (const item of order.items) {
      const product = await tx.product.findFirst({ where: { id: item.productId, organizationId: user.organizationId, isArchived: false } });
      if (!product) throw new Error("PRODUCT_NOT_FOUND");
      const newQuantity = product.quantity + item.quantity;
      const updated = await tx.product.updateMany({ where: { id: product.id, quantity: product.quantity }, data: { quantity: newQuantity, costPrice: item.unitCost } });
      if (updated.count !== 1) throw new Error("CONCURRENT_STOCK_CHANGE");
      await tx.stockMovement.create({ data: { organizationId: user.organizationId, productId: product.id, performedById: user.id, purchaseOrderId: order.id, type: "PURCHASE_RECEIPT", quantity: item.quantity, previousQuantity: product.quantity, newQuantity, reason: `Received ${order.number}` } });
    }
    await tx.purchaseOrder.update({ where: { id: order.id }, data: { status: "RECEIVED", receivedAt: new Date() } });
    await tx.auditLog.create({ data: { organizationId: user.organizationId, actorId: user.id, action: "purchase.received", entityType: "PurchaseOrder", entityId: order.id } });
  }, { isolationLevel: "Serializable" });
  revalidatePath("/dashboard/purchases");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/products");
}
