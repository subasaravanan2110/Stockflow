import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/dal";
import { createProductAction } from "@/app/actions/inventory";
import { PageHeader } from "@/components/dashboard/page-header";
import { ProductForm } from "@/components/inventory/product-form";

export default async function NewProductPage() {
  const user = await requireRole(["ADMIN"]);
  const [categories, suppliers] = await Promise.all([db.category.findMany({ where: { organizationId: user.organizationId }, orderBy: { name: "asc" }, select: { id: true, name: true } }), db.supplier.findMany({ where: { organizationId: user.organizationId, isArchived: false }, orderBy: { name: "asc" }, select: { id: true, name: true } })]);
  return <><PageHeader eyebrow="Catalog" title="Add product" description="Create the master record first, then record opening stock as a movement." />{categories.length ? <ProductForm action={createProductAction} categories={categories} suppliers={suppliers} /> : <div className="card p-8 text-center"><p className="font-bold">Create a category before adding products.</p><LinkShim /></div>}</>;
}

function LinkShim() { return <a href="/dashboard/categories" className="btn btn-primary mt-4">Create category</a>; }
