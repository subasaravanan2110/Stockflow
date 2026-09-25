import { z } from "zod";
import { emailAddressSchema, noControlCharacters, requiredNumberSchema } from "@/lib/validation/common";

const optionalText = z.string().trim().max(500, "Use 500 characters or fewer.").refine(noControlCharacters, "Text contains invalid characters.").optional().or(z.literal(""));
const recordName = (label: string, max: number) => z.string({ error: `${label} is required.` }).trim().min(2, `${label} must contain at least 2 characters.`).max(max, `${label} must contain ${max} characters or fewer.`).refine(noControlCharacters, `${label} contains invalid characters.`);

export const productSchema = z.object({
  name: recordName("Product name", 120),
  sku: z.string({ error: "SKU is required." }).trim().min(2, "SKU must contain at least 2 characters.").max(40, "SKU must contain 40 characters or fewer.").regex(/^[A-Za-z0-9_-]+$/, "Use only letters, numbers, dashes, or underscores."),
  description: optionalText,
  price: requiredNumberSchema("Selling price").pipe(z.number().nonnegative("Selling price cannot be negative.").max(1_000_000, "Selling price is too large.").multipleOf(0.01, "Selling price can have at most 2 decimal places.")),
  costPrice: requiredNumberSchema("Cost price").pipe(z.number().nonnegative("Cost price cannot be negative.").max(1_000_000, "Cost price is too large.").multipleOf(0.01, "Cost price can have at most 2 decimal places.")),
  reorderLevel: requiredNumberSchema("Reorder level").pipe(z.number().int("Reorder level must be a whole number.").nonnegative("Reorder level cannot be negative.").max(1_000_000, "Reorder level is too large.")),
  categoryId: z.string().cuid("Select a valid category."),
  supplierId: z.string().cuid("Select a valid supplier.").optional().or(z.literal("")),
});

export const categorySchema = z.object({
  name: recordName("Category name", 80),
  description: optionalText,
});

export const supplierSchema = z.object({
  name: recordName("Supplier name", 120),
  email: z.union([emailAddressSchema, z.literal("")]).optional(),
  phone: z.string().trim().max(30, "Phone number must contain 30 characters or fewer.").refine((value) => value === "" || (/^\+?[0-9\s().-]+$/.test(value) && value.replace(/\D/g, "").length >= 7 && value.replace(/\D/g, "").length <= 15), "Enter a valid phone number containing 7 to 15 digits.").optional(),
  address: z.string().trim().max(300, "Address must contain 300 characters or fewer.").refine(noControlCharacters, "Address contains invalid characters.").optional(),
  leadTimeDays: requiredNumberSchema("Lead time").pipe(z.number().int("Lead time must be a whole number.").min(0, "Lead time cannot be negative.").max(365, "Lead time cannot exceed 365 days.")),
});

export const stockMovementSchema = z.object({
  productId: z.string().cuid("Select a valid product."),
  type: z.enum(["STOCK_IN", "STOCK_OUT", "ADJUSTMENT"]),
  quantity: requiredNumberSchema("Quantity").pipe(z.number().int("Quantity must be a whole number.").positive("Quantity must be greater than zero.").max(1_000_000, "Quantity is too large.")),
  reason: z.string({ error: "Reason is required." }).trim().min(3, "Reason must contain at least 3 characters.").max(240, "Reason must contain 240 characters or fewer.").refine(noControlCharacters, "Reason contains invalid characters."),
});

export const purchaseOrderSchema = z.object({
  supplierId: z.string().cuid("Select a valid supplier."),
  productId: z.string().cuid("Select a valid product."),
  quantity: requiredNumberSchema("Quantity").pipe(z.number().int("Quantity must be a whole number.").positive("Quantity must be greater than zero.").max(1_000_000, "Quantity is too large.")),
  unitCost: requiredNumberSchema("Unit cost").pipe(z.number().positive("Unit cost must be greater than zero.").max(1_000_000, "Unit cost is too large.").multipleOf(0.01, "Unit cost can have at most 2 decimal places.")),
  expectedDate: z.union([z.iso.date({ error: "Enter a valid expected date." }), z.literal("")]).optional(),
  notes: optionalText,
});
