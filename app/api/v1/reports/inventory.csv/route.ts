import { db } from "@/lib/db";
import { apiError, apiUser } from "@/lib/api";

function csvCell(value: unknown) {
  let content = String(value ?? "");
  if (/^[=+\-@]/.test(content)) content = `'${content}`;
  return `"${content.replaceAll('"', '""')}"`;
}

export async function GET() {
  const user = await apiUser(); if (!user) return apiError("UNAUTHENTICATED", "Authentication required.", 401);
  const products = await db.product.findMany({ where: { organizationId: user.organizationId, isArchived: false }, include: { category: { select: { name: true } }, supplier: { select: { name: true } } }, orderBy: { name: "asc" }, take: 10_000 });
  const rows = [["SKU", "Product", "Category", "Supplier", "Quantity", "Reorder level", "Cost price (INR)", "Inventory value (INR)"], ...products.map((p) => [p.sku, p.name, p.category.name, p.supplier?.name ?? "", p.quantity, p.reorderLevel, p.costPrice.toString(), (p.quantity * Number(p.costPrice)).toFixed(2)])];
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
  return new Response(csv, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": "attachment; filename=stockflow-inventory.csv", "cache-control": "private, no-store" } });
}
