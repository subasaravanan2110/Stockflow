import { receivePurchaseOrderAction } from "@/app/actions/inventory";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/dal";
import { PageHeader } from "@/components/dashboard/page-header";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PurchaseForm } from "@/components/inventory/purchase-form";

export default async function PurchasesPage() {
  const user = await requireUser();
  const [orders, suppliers, products] = await Promise.all([
    db.purchaseOrder.findMany({ where: { organizationId: user.organizationId }, include: { supplier: { select: { name: true } }, _count: { select: { items: true } } }, orderBy: { createdAt: "desc" } }),
    db.supplier.findMany({ where: { organizationId: user.organizationId, isArchived: false }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.product.findMany({ where: { organizationId: user.organizationId, isArchived: false }, select: { id: true, name: true, sku: true }, orderBy: { name: "asc" } }),
  ]);
  return <><PageHeader eyebrow="Procurement" title="Purchase orders" description="Track incoming stock and preserve a traceable purchasing history." /><div className={`grid gap-6 ${user.role === "ADMIN" ? "xl:grid-cols-[380px_minmax(0,1fr)]" : "grid-cols-1"}`}>{user.role === "ADMIN" && <PurchaseForm suppliers={suppliers} products={products} />}<div className="card table-wrap min-w-0"><table className="data-table"><thead><tr><th>Order</th><th>Supplier</th><th>Items</th><th>Total</th><th>Status</th><th>Created</th><th></th></tr></thead><tbody>{orders.map((order) => <tr key={order.id}><td className="font-bold">{order.number}</td><td>{order.supplier.name}</td><td>{order._count.items}</td><td>{formatCurrency(order.totalAmount.toString())}</td><td><span className="badge bg-blue-50 text-blue-700">{order.status}</span></td><td>{formatDate(order.createdAt)}</td><td>{order.status === "ORDERED" && user.role === "ADMIN" ? <form action={receivePurchaseOrderAction.bind(null, order.id)}><button className="btn btn-secondary whitespace-nowrap">Receive stock</button></form> : null}</td></tr>)}{!orders.length && <tr><td colSpan={7} className="py-12 text-center text-[#68736c]">Purchase ordering is ready for your first supplier order.</td></tr>}</tbody></table></div></div></>;
}
