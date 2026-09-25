import "server-only";
import { db } from "@/lib/db";
import type { MovementType } from "@/generated/prisma/client";

export async function productRelationsBelongToOrganization(
  organizationId: string,
  categoryId: string,
  supplierId?: string | null,
) {
  const [category, supplier] = await Promise.all([
    db.category.findFirst({ where: { id: categoryId, organizationId }, select: { id: true } }),
    supplierId
      ? db.supplier.findFirst({ where: { id: supplierId, organizationId, isArchived: false }, select: { id: true } })
      : Promise.resolve(null),
  ]);
  return Boolean(category && (!supplierId || supplier));
}

type MovementInput = {
  organizationId: string;
  actorId: string;
  productId: string;
  type: Extract<MovementType, "STOCK_IN" | "STOCK_OUT" | "ADJUSTMENT">;
  quantity: number;
  reason: string;
};

export async function createStockMovement(input: MovementInput) {
  return db.$transaction(async (tx) => {
    const product = await tx.product.findFirst({
      where: { id: input.productId, organizationId: input.organizationId, isArchived: false },
    });
    if (!product) throw new Error("PRODUCT_NOT_FOUND");

    const delta = input.type === "STOCK_OUT" ? -input.quantity : input.quantity;
    const nextQuantity = input.type === "ADJUSTMENT" ? input.quantity : product.quantity + delta;
    if (nextQuantity < 0) throw new Error("INSUFFICIENT_STOCK");

    const updated = await tx.product.updateMany({
      where: { id: product.id, organizationId: input.organizationId, quantity: product.quantity },
      data: { quantity: nextQuantity },
    });
    if (updated.count !== 1) throw new Error("CONCURRENT_STOCK_CHANGE");

    const movement = await tx.stockMovement.create({
      data: {
        organizationId: input.organizationId,
        performedById: input.actorId,
        productId: product.id,
        type: input.type,
        quantity: input.quantity,
        previousQuantity: product.quantity,
        newQuantity: nextQuantity,
        reason: input.reason,
      },
    });
    await tx.auditLog.create({
      data: {
        organizationId: input.organizationId,
        actorId: input.actorId,
        action: "inventory.movement.created",
        entityType: "StockMovement",
        entityId: movement.id,
        metadata: { productId: product.id, type: input.type, quantity: input.quantity },
      },
    });
    return movement;
  }, { isolationLevel: "Serializable" });
}
