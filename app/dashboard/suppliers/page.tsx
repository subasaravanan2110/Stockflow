import { archiveSupplierAction } from "@/app/actions/inventory";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/dal";
import { PageHeader } from "@/components/dashboard/page-header";
import { SupplierForm } from "@/components/inventory/master-data-forms";

export default async function SuppliersPage() {
  const user = await requireUser();
  const suppliers = await db.supplier.findMany({ where: { organizationId: user.organizationId }, include: { _count: { select: { products: true, purchaseOrders: true } } }, orderBy: [{ isArchived: "asc" }, { name: "asc" }] });
  return <><PageHeader eyebrow="Partners" title="Suppliers" description="Keep sourcing details and lead times close to your inventory." /><div className={`grid gap-6 ${user.role === "ADMIN" ? "xl:grid-cols-[380px_minmax(0,1fr)]" : "grid-cols-1"}`}>{user.role === "ADMIN" && <SupplierForm />}<div className="card table-wrap min-w-0"><table className="data-table"><thead><tr><th>Supplier</th><th>Contact</th><th>Lead time</th><th>Products</th><th>Status</th></tr></thead><tbody>{suppliers.map((supplier) => <tr key={supplier.id}><td className="font-bold">{supplier.name}</td><td><p>{supplier.email || "—"}</p><p className="text-xs text-[#68736c]">{supplier.phone}</p></td><td>{supplier.leadTimeDays} days</td><td>{supplier._count.products}</td><td><form action={archiveSupplierAction.bind(null, supplier.id)}><button disabled={user.role !== "ADMIN"} className={`badge ${supplier.isArchived ? "bg-stone-100 text-stone-600" : "bg-green-50 text-green-700"}`}>{supplier.isArchived ? "Archived" : "Active"}</button></form></td></tr>)}{!suppliers.length && <tr><td colSpan={5} className="py-12 text-center text-[#68736c]">No suppliers yet.</td></tr>}</tbody></table></div></div></>;
}
