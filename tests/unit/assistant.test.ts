import { describe, expect, it } from "vitest";
import { deterministicInventoryAnswer, type InventoryContext } from "@/lib/assistant/answers";

const context: InventoryContext = {
  totalProducts: 3,
  totalUnits: 12,
  inventoryValue: 450,
  activeSuppliers: 2,
  lowStock: [{ name: "Keyboard", sku: "KEY-1", quantity: 2, reorderLevel: 5, supplier: "Vertex" }],
  outOfStock: [{ name: "Notebook", sku: "NOTE-1", supplier: null }],
  recentMovements: [{ product: "Keyboard", type: "STOCK_OUT", quantity: 2, reason: "Order 42", createdAt: "2026-09-24T00:00:00.000Z" }],
};

describe("inventory assistant fallback", () => {
  it("answers reorder questions from verified inventory data", () => {
    const answer = deterministicInventoryAnswer("What should I reorder?", context);
    expect(answer).toContain("Keyboard");
    expect(answer).toContain("suggested order 8");
  });

  it("answers valuation questions", () => {
    expect(deterministicInventoryAnswer("What is my inventory worth?", context)).toContain("₹450.00");
  });

  it("responds naturally to greetings", () => {
    expect(deterministicInventoryAnswer("Hello", context)).toContain("Hello!");
  });

  it("provides application guidance", () => {
    const answer = deterministicInventoryAnswer("How do I add a product and record stock?", context);
    expect(answer).toContain("Products");
    expect(answer).toContain("Stock movements");
  });

  it("provides step-by-step two-factor setup guidance", () => {
    const answer = deterministicInventoryAnswer("How do I enable 2FA?", context);
    expect(answer).toContain("Open Settings");
    expect(answer).toContain("Enable 2FA");
    expect(answer).toContain("Verify and enable");
  });

  it("does not pretend to support unrelated questions", () => {
    expect(deterministicInventoryAnswer("Tell me a joke", context)).toContain("I can help with StockFlow usage");
  });
});
