import Link from "next/link";
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Boxes, IndianRupee, PackageX } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/dal";
import { inventorySignals } from "@/lib/inventory/analytics";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/dashboard/page-header";

export default async function DashboardPage() {
  const user = await requireUser();
  const [products, movements, supplierCount] = await Promise.all([
    db.product.findMany({ where: { organizationId: user.organizationId, isArchived: false }, select: { quantity: true, reorderLevel: true, costPrice: true } }),
    db.stockMovement.findMany({ where: { organizationId: user.organizationId }, take: 7, orderBy: { createdAt: "desc" }, include: { product: { select: { name: true, sku: true } }, performedBy: { select: { name: true } } } }),
    db.supplier.count({ where: { organizationId: user.organizationId, isArchived: false } }),
  ]);
  const signals = inventorySignals(products);
  const stats = [
    { label: "Inventory value", value: formatCurrency(signals.value), icon: IndianRupee, tone: "bg-green-50 text-green-700" },
    { label: "Units on hand", value: signals.units.toLocaleString(), icon: Boxes, tone: "bg-blue-50 text-blue-700" },
    { label: "Low stock", value: signals.lowStock.toString(), icon: AlertTriangle, tone: "bg-amber-50 text-amber-700" },
    { label: "Out of stock", value: signals.outOfStock.toString(), icon: PackageX, tone: "bg-red-50 text-red-700" },
  ];
  return <><PageHeader eyebrow="Command center" title={`Good ${new Date().getHours() < 12 ? "morning" : "afternoon"}, ${user.name ?? "there"}`} description="A real-time view of stock health, movement, and the signals that need your attention." action={<Link href="/dashboard/inventory" className="btn btn-primary">Record movement</Link>} />
    <section aria-label="Inventory summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats.map(({ label, value, icon: Icon, tone }) => <article className="card p-5" key={label}><div className={`grid size-10 place-items-center rounded-xl ${tone}`}><Icon className="size-5" /></div><p className="mt-5 text-2xl font-black">{value}</p><p className="mt-1 text-sm text-[#68736c]">{label}</p></article>)}</section>
    <section className="mt-6 grid gap-6 xl:grid-cols-[1.45fr_.55fr]"><div className="card"><div className="flex items-center justify-between border-b p-5"><div><h2 className="font-extrabold">Recent movements</h2><p className="mt-1 text-xs text-[#68736c]">Latest changes across your inventory</p></div><Link href="/dashboard/inventory" className="text-sm font-bold text-[#176b45]">View all</Link></div>{movements.length ? <div className="divide-y">{movements.map((movement) => { const inbound = movement.type !== "STOCK_OUT"; return <div key={movement.id} className="flex items-center gap-4 p-4 sm:px-5"><span className={`grid size-9 place-items-center rounded-full ${inbound ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{inbound ? <ArrowUpRight className="size-4" /> : <ArrowDownRight className="size-4" />}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{movement.product.name}</p><p className="text-xs text-[#68736c]">{movement.product.sku} · {movement.performedBy.name ?? "Team member"}</p></div><div className="text-right"><p className={`text-sm font-black ${inbound ? "text-green-700" : "text-red-700"}`}>{inbound ? "+" : "−"}{movement.quantity}</p><p className="text-xs text-[#68736c]">{formatDate(movement.createdAt)}</p></div></div>; })}</div> : <div className="p-10 text-center text-sm text-[#68736c]">No movements yet. Create a product and record your first stock-in.</div>}</div>
    <aside className="card overflow-hidden"><div className="bg-[#14281d] p-6 text-white"><p className="text-xs font-bold uppercase tracking-wider text-[#dfff7a]">Inventory signal</p><h2 className="mt-3 text-2xl font-black">{signals.lowStock + signals.outOfStock ? `${signals.lowStock + signals.outOfStock} products need attention` : "Stock levels look healthy"}</h2><p className="mt-3 text-sm leading-6 text-white/65">{signals.lowStock + signals.outOfStock ? "Review reorder levels before availability affects sales." : "No products are currently below their configured reorder point."}</p><Link href="/dashboard/products?stock=low" className="btn mt-6 bg-[#dfff7a] text-[#17211b]">Review products</Link></div><div className="p-5"><p className="text-sm font-bold">Active suppliers</p><p className="mt-1 text-3xl font-black">{supplierCount}</p></div></aside></section></>;
}
