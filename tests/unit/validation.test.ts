import { describe, expect, it } from "vitest";
import { emailSchema, invitedRegisterSchema } from "@/lib/validation/auth";
import {
  productSchema,
  purchaseOrderSchema,
  stockMovementSchema,
  supplierSchema,
} from "@/lib/validation/inventory";
import { positiveIntegerParam } from "@/lib/validation/common";

const categoryId = "cm12345678901234567890123";
const supplierId = "cm22345678901234567890123";
const productId = "cm32345678901234567890123";

const validProduct = {
  name: "USB-C Dock",
  sku: "DOCK-01",
  description: "Nine-port office dock",
  price: "99.95",
  costPrice: "70.00",
  reorderLevel: "5",
  categoryId,
  supplierId,
};

describe("email validation", () => {
  it("accepts a complete email address and normalizes it", () => {
    expect(emailSchema.parse({ email: " Subasaravanan2110@Gmail.com " })).toEqual({
      email: "subasaravanan2110@gmail.com",
    });
  });

  it.each([
    "suba@suba",
    "subasaravanan2110@gmail",
    "plain-text",
    "@gmail.com",
    "name @gmail.com",
    "name@gmail..com",
  ])("rejects the malformed email address %s", (email) => {
    const result = emailSchema.safeParse({ email });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.email).toContain(
        "Enter a valid email address like name@example.com.",
      );
    }
  });
});

describe("authentication field validation", () => {
  const invitation = { name: "Suba", token: "secure-invitation-token-that-is-long-enough" };

  it("accepts the six-character password policy", () => {
    expect(invitedRegisterSchema.safeParse({
      ...invitation,
      password: "Ab1@cd",
      confirmPassword: "Ab1@cd",
    }).success).toBe(true);
  });

  it("rejects missing character classes and mismatched confirmation", () => {
    const result = invitedRegisterSchema.safeParse({
      ...invitation,
      password: "password",
      confirmPassword: "different",
    });

    expect(result.success).toBe(false);
    expect(invitedRegisterSchema.safeParse({ ...invitation, password: "Ab12cd", confirmPassword: "Ab12cd" }).success).toBe(false);
  });
});

describe("inventory numeric validation", () => {
  it("accepts valid numeric form values", () => {
    const result = productSchema.parse(validProduct);

    expect(result.price).toBe(99.95);
    expect(result.costPrice).toBe(70);
    expect(result.reorderLevel).toBe(5);
  });

  it.each([
    ["price", "not-a-number"],
    ["price", ""],
    ["price", "1.234"],
    ["costPrice", "supplier"],
    ["reorderLevel", "2.5"],
    ["reorderLevel", "ten"],
    ["reorderLevel", "-1"],
  ])("rejects invalid %s value %s", (field, value) => {
    expect(productSchema.safeParse({ ...validProduct, [field]: value }).success).toBe(false);
  });

  it("requires positive, whole-number movement quantities", () => {
    const base = { productId, type: "STOCK_IN", reason: "New delivery" } as const;

    for (const quantity of ["five", "", "0", "-2", "1.5"]) {
      expect(stockMovementSchema.safeParse({ ...base, quantity }).success).toBe(false);
    }
    expect(stockMovementSchema.safeParse({ ...base, quantity: "5" }).success).toBe(true);
  });
});

describe("supplier and purchase validation", () => {
  it("validates supplier contact details", () => {
    const base = { name: "Acme Distribution", leadTimeDays: "5" };

    expect(supplierSchema.safeParse({ ...base, email: "sales@acme.com", phone: "+91 98765 43210" }).success).toBe(true);
    expect(supplierSchema.safeParse({ ...base, email: "sales@acme" }).success).toBe(false);
    expect(supplierSchema.safeParse({ ...base, phone: "call-acme" }).success).toBe(false);
    expect(supplierSchema.safeParse({ ...base, leadTimeDays: "next week" }).success).toBe(false);
  });

  it("validates purchase quantities, money, and ISO dates", () => {
    const validPurchase = {
      supplierId,
      productId,
      quantity: "10",
      unitCost: "15.75",
      expectedDate: "2026-10-01",
      notes: "Deliver to the main warehouse",
    };

    expect(purchaseOrderSchema.safeParse(validPurchase).success).toBe(true);
    expect(purchaseOrderSchema.safeParse({ ...validPurchase, quantity: "boxes" }).success).toBe(false);
    expect(purchaseOrderSchema.safeParse({ ...validPurchase, unitCost: "cheap" }).success).toBe(false);
    expect(purchaseOrderSchema.safeParse({ ...validPurchase, expectedDate: "01/10/2026" }).success).toBe(false);
  });
});

describe("query parameter validation", () => {
  it("only accepts positive whole numbers within the configured maximum", () => {
    expect(positiveIntegerParam("12", 1, 100)).toBe(12);
    expect(positiveIntegerParam("Infinity", 1, 100)).toBe(1);
    expect(positiveIntegerParam("2.5", 1, 100)).toBe(1);
    expect(positiveIntegerParam("-1", 1, 100)).toBe(1);
    expect(positiveIntegerParam("999", 1, 100)).toBe(100);
  });
});
