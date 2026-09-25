import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/dal";
import { PageHeader } from "@/components/dashboard/page-header";
import { StockForm } from "@/components/inventory/stock-form";
import { Pagination } from "@/components/ui/pagination";
import { positiveIntegerParam } from "@/lib/validation/common";
import { formatDate } from "@/lib/utils";
import { getDisplayRole } from "@/lib/auth/display-role";

const PAGE_SIZE = 10;

export default async function InventoryPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const user = await requireUser();
  const params = await searchParams;
  const requestedPage = positiveIntegerParam(params.page, 1, 10_000);
  const movementWhere = {
    organizationId: user.organizationId,
    ...(user.role === "STAFF" ? { performedById: user.id } : {}),
  };
  const [products, movementCount] = await Promise.all([
    db.product.findMany({
      where: { organizationId: user.organizationId, isArchived: false },
      orderBy: { name: "asc" },
      select: { id: true, name: true, sku: true, quantity: true },
    }),
    db.stockMovement.count({ where: movementWhere }),
  ]);
  const totalPages = Math.max(1, Math.ceil(movementCount / PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages);
  const movements = await db.stockMovement.findMany({
    where: movementWhere,
    take: PAGE_SIZE,
    skip: (page - 1) * PAGE_SIZE,
    orderBy: { createdAt: "desc" },
    include: {
      product: { select: { name: true, sku: true } },
      performedBy: {
        select: {
          name: true,
          email: true,
          memberships: {
            where: { organizationId: user.organizationId },
            take: 1,
            select: { role: true },
          },
          accounts: { select: { provider: true } },
        },
      },
    },
  });

  return <>
    <PageHeader
      eyebrow={user.role === "ADMIN" ? "Audit ledger" : "Stock ledger"}
      title={user.role === "ADMIN" ? "Movement audit history" : "Inventory movements"}
      description={user.role === "ADMIN"
        ? "Review every immutable stock change made by administrators and staff, including the reason and resulting balance."
        : "Record stock changes safely and review your own submissions. Administrators retain the complete organization audit history."}
    />
    <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
      <div><StockForm products={products} /></div>
      <div className="min-w-0">
        <section className="card overflow-hidden" aria-labelledby="movement-history-title">
          <div className="border-b px-4 py-4 sm:px-5">
            <h2 id="movement-history-title" className="font-extrabold">{user.role === "ADMIN" ? "Organization movement history" : "Your movement history"}</h2>
            <p className="mt-1 text-xs text-[#68736c]">{user.role === "ADMIN" ? "Complete audit trail across administrators and staff." : "Only stock movements recorded by your account are shown."}</p>
          </div>
          <div className="table-wrap">
          <table className={`data-table ${user.role === "ADMIN" ? "min-w-[1050px]" : "min-w-[780px]"}`}>
            <thead><tr><th>Date</th><th>Product</th><th>Type</th><th>Change</th><th>Balance</th><th>Reason</th>{user.role === "ADMIN" && <><th>Performed by</th><th>Role</th></>}</tr></thead>
            <tbody>
              {movements.map((item) => {
                const storedRole = item.performedBy.memberships[0]?.role;
                const actorRole = storedRole
                  ? getDisplayRole(storedRole, item.performedBy.accounts.map((account) => account.provider))
                  : "—";
                return <tr key={item.id}>
                  <td className="text-xs text-[#68736c]">{formatDate(item.createdAt)}</td>
                  <td><p className="font-bold">{item.product.name}</p><p className="text-xs text-[#68736c]">{item.product.sku}</p></td>
                  <td>{item.type.replaceAll("_", " ")}</td>
                  <td className="font-bold">{item.type === "STOCK_OUT" ? "−" : item.type === "ADJUSTMENT" ? "=" : "+"}{item.quantity}</td>
                  <td>{item.previousQuantity} → {item.newQuantity}</td>
                  <td className="max-w-56 whitespace-normal text-sm">{item.reason}</td>
                  {user.role === "ADMIN" && <><td><p className="font-semibold">{item.performedBy.name ?? "Unnamed user"}</p><p className="text-xs text-[#68736c]">{item.performedBy.email}</p></td>
                  <td><span className={`badge ${actorRole === "Administrator" ? "bg-blue-50 text-blue-700" : actorRole === "Developer" ? "bg-violet-50 text-violet-700" : "bg-stone-100 text-stone-700"}`}>{actorRole}</span></td></>}
                </tr>;
              })}
              {!movements.length && <tr><td colSpan={user.role === "ADMIN" ? 8 : 6} className="py-12 text-center text-[#68736c]">{user.role === "ADMIN" ? "No movements recorded yet." : "You have not recorded any stock movements yet."}</td></tr>}
            </tbody>
          </table>
          </div>
        </section>
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={movementCount}
          pageSize={PAGE_SIZE}
          itemLabel="movement"
          hrefForPage={(targetPage) => `/dashboard/inventory?page=${targetPage}`}
        />
      </div>
    </div>
  </>;
}
