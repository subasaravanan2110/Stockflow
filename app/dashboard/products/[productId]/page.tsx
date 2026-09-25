import { notFound } from "next/navigation";
import { archiveProductAction, updateProductAction } from "@/app/actions/inventory";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/dal";
import { PageHeader } from "@/components/dashboard/page-header";
import { ProductForm } from "@/components/inventory/product-form";
import { formatDate } from "@/lib/utils";

export default async function ProductDetailPage({ params }: { params: Promise<{ productId: string }> }) {
  const user = await requireUser(); const { productId } = await params;
  const [product, categories, suppliers] = await Promise.all([
    db.product.findFirst({ where: { id: productId, organizationId: user.organizationId }, include: { movements: { take: 8, orderBy: { createdAt: "desc" }, include: { performedBy: { select: { name: true } } } } } }),
    db.category.findMany({ where: { organizationId: user.organizationId }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.supplier.findMany({ where: { organizationId: user.organizationId, isArchived: false }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!product) notFound();
  const boundArchive = archiveProductAction.bind(null, product.id);
  const productFormValue = {
    name: product.name,
    sku: product.sku,
    description: product.description,
    price: product.price.toString(),
    costPrice: product.costPrice.toString(),
    reorderLevel: product.reorderLevel,
    categoryId: product.categoryId,
    supplierId: product.supplierId,
  };
  return <><PageHeader eyebrow={product.sku} title={product.name} description={`${product.quantity} units on hand · reorder at ${product.reorderLevel}`} action={user.role === "ADMIN" ? <form action={boundArchive}><button className="btn btn-danger">{product.isArchived ? "Restore" : "Archive"}</button></form> : undefined} />
    <div className="grid gap-6 xl:grid-cols-[1fr_380px]">{user.role === "ADMIN" ? <ProductForm action={updateProductAction.bind(null, product.id)} categories={categories} suppliers={suppliers} product={productFormValue} /> : <div className="card p-6 text-sm text-[#68736c]">Product editing requires Admin access.</div>}<aside className="card overflow-hidden"><div className="border-b p-5"><h2 className="font-extrabold">Movement history</h2></div><div className="divide-y">{product.movements.map((item) => <div className="p-4" key={item.id}><div className="flex justify-between gap-3"><p className="text-sm font-bold">{item.type.replaceAll("_", " ")}</p><p className="text-sm font-black">{item.previousQuantity} → {item.newQuantity}</p></div><p className="mt-1 text-xs text-[#68736c]">{item.reason} · {item.performedBy.name ?? "Team member"}</p><p className="mt-1 text-xs text-[#8a948d]">{formatDate(item.createdAt)}</p></div>)}{!product.movements.length && <p className="p-6 text-sm text-[#68736c]">No movements recorded.</p>}</div></aside></div>
  </>;
}
