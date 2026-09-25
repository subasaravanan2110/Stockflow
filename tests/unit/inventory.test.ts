import { describe, expect, it } from "vitest";
import { inventorySignals } from "@/lib/inventory/analytics";
import { productSchema, stockMovementSchema } from "@/lib/validation/inventory";
import { formatCurrency } from "@/lib/utils";

describe("inventory signals", () => {
  it("calculates value and stock warnings", () => {
    expect(inventorySignals([
      { quantity: 10, reorderLevel: 3, costPrice: "2.50" },
      { quantity: 2, reorderLevel: 4, costPrice: 10 },
      { quantity: 0, reorderLevel: 5, costPrice: 99 },
    ])).toEqual({ units: 12, value: 45, lowStock: 1, outOfStock: 1 });
  });

  it("formats money in Indian rupees and lakh grouping", () => {
    expect(formatCurrency(137220)).toBe("₹1,37,220.00");
  });
});

describe("inventory validation", () => {
  it("normalizes numeric product fields", () => {
    const result = productSchema.parse({ name: "USB-C Dock", sku: "dock-01", description: "", price: "99.95", costPrice: "70", reorderLevel: "5", categoryId: "cm12345678901234567890123", supplierId: "" });
    expect(result.price).toBe(99.95);
    expect(result.reorderLevel).toBe(5);
  });

  it("rejects negative and zero-quantity movements", () => {
    expect(stockMovementSchema.safeParse({ productId: "cm12345678901234567890123", type: "STOCK_OUT", quantity: 0, reason: "sale" }).success).toBe(false);
  });
});
