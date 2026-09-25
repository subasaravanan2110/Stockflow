import Link from "next/link";
import { Plus } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/dal";
import { PRODUCT_PAGE_SIZE } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/dashboard/page-header";
import { ProductFilters } from "@/components/inventory/product-filters";
import { positiveIntegerParam } from "@/lib/validation/common";

type ProductSearchParams = {
  stock?: string;
  category?: string;
  supplier?: string;
  page?: string;
};

export default async function ProductsPage({ searchParams }: { searchParams: Promise<ProductSearchParams> }) {
  const user = await requireUser();
  const params = await searchParams;
  const stock = ["all", "healthy", "low", "out"].includes(params.stock ?? "") ? params.stock! : "all";
  const requestedPage = positiveIntegerParam(params.page, 1, 100_000);

  const [categories, suppliers] = await Promise.all([
    db.category.findMany({ where: { organizationId: user.organizationId }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.supplier.findMany({ where: { organizationId: user.organizationId, isArchived: false }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  const category = categories.some((item) => item.id === params.category) ? params.category! : "all";
  const supplier = suppliers.some((item) => item.id === params.supplier) ? params.supplier! : "all";

  const where = {
    organizationId: user.organizationId,
    isArchived: false,
    ...(category !== "all" ? { categoryId: category } : {}),
    ...(supplier !== "all" ? { supplierId: supplier } : {}),
    ...(stock === "out" ? { quantity: 0 } : {}),
    ...(stock === "low" ? { quantity: { gt: 0, lte: db.product.fields.reorderLevel } } : {}),
    ...(stock === "healthy" ? { quantity: { gt: db.product.fields.reorderLevel } } : {}),
  };

  const count = await db.product.count({ where });
  const pages = Math.max(1, Math.ceil(count / PRODUCT_PAGE_SIZE));
  const currentPage = Math.min(requestedPage, pages);
  const products = await db.product.findMany({
    where,
    include: { category: { select: { name: true } }, supplier: { select: { name: true } } },
    orderBy: [{ name: "asc" }, { createdAt: "desc" }],
    skip: (currentPage - 1) * PRODUCT_PAGE_SIZE,
    take: PRODUCT_PAGE_SIZE,
  });

  function pageHref(page: number) {
    const query = new URLSearchParams();
    if (stock !== "all") query.set("stock", stock);
    if (category !== "all") query.set("category", category);
    if (supplier !== "all") query.set("supplier", supplier);
    query.set("page", String(page));
    return `?${query.toString()}`;
  }

  const hasFilters = stock !== "all" || category !== "all" || supplier !== "all";

  return <>
    <PageHeader eyebrow="Catalog" title="Products" description="Manage product details and monitor current availability." action={user.role === "ADMIN" ? <Link href="/dashboard/products/new" className="btn btn-primary"><Plus className="size-4" />Add product</Link> : undefined} />

    <ProductFilters stock={stock} category={category} supplier={supplier} categories={categories} suppliers={suppliers} />

    <div className="card table-wrap">
      <table className="data-table">
        <thead><tr><th>Product</th><th>Category</th><th>Supplier</th><th>Price</th><th>On hand</th><th>Status</th></tr></thead>
        <tbody>
          {products.map((product) => {
            const low = product.quantity > 0 && product.quantity <= product.reorderLevel;
            return <tr key={product.id}>
              <td><Link href={`/dashboard/products/${product.id}`} className="font-bold hover:text-[#176b45]">{product.name}</Link><p className="text-xs text-[#68736c]">{product.sku}</p></td>
              <td>{product.category.name}</td><td>{product.supplier?.name ?? "—"}</td><td>{formatCurrency(product.price.toString())}</td><td className="font-bold">{product.quantity}</td>
              <td><span className={`badge ${product.quantity === 0 ? "bg-red-50 text-red-700" : low ? "bg-amber-50 text-amber-700" : "bg-green-50 text-green-700"}`}>{product.quantity === 0 ? "Out of stock" : low ? "Low stock" : "Healthy"}</span></td>
            </tr>;
          })}
          {!products.length && <tr><td colSpan={6} className="py-12 text-center text-[#68736c]"><p className="font-semibold">No products match these filters.</p>{hasFilters && <Link href="/dashboard/products" className="mt-2 inline-block font-bold text-[#176b45]">Clear all filters</Link>}</td></tr>}
        </tbody>
      </table>
    </div>

    <div className="mt-4 flex flex-col items-start justify-between gap-3 text-sm text-[#68736c] sm:flex-row sm:items-center"><p>{count} product{count === 1 ? "" : "s"}</p><div className="flex items-center gap-2"><Link aria-disabled={currentPage <= 1} href={pageHref(Math.max(1, currentPage - 1))} className="btn btn-secondary aria-disabled:pointer-events-none aria-disabled:opacity-50">Previous</Link><span className="grid place-items-center px-2">{currentPage} / {pages}</span><Link aria-disabled={currentPage >= pages} href={pageHref(Math.min(pages, currentPage + 1))} className="btn btn-secondary aria-disabled:pointer-events-none aria-disabled:opacity-50">Next</Link></div></div>
  </>;
}
