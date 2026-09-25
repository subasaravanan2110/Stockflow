import { Trash2 } from "lucide-react";
import { deleteCategoryAction } from "@/app/actions/inventory";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/dal";
import { PageHeader } from "@/components/dashboard/page-header";
import { CategoryForm } from "@/components/inventory/master-data-forms";

export default async function CategoriesPage() {
  const user = await requireUser();
  const categories = await db.category.findMany({ where: { organizationId: user.organizationId }, include: { _count: { select: { products: true } } }, orderBy: { name: "asc" } });
  return <><PageHeader eyebrow="Catalog" title="Categories" description="Organize products into clear, searchable groups." /><div className={`grid gap-6 ${user.role === "ADMIN" ? "xl:grid-cols-[380px_minmax(0,1fr)]" : "grid-cols-1"}`}>{user.role === "ADMIN" && <CategoryForm />}<div className="card min-w-0 overflow-hidden"><div className="divide-y">{categories.map((category) => <div className="flex items-center justify-between gap-4 p-5" key={category.id}><div><p className="font-bold">{category.name}</p><p className="mt-1 text-sm text-[#68736c]">{category.description || "No description"} · {category._count.products} products</p></div>{user.role === "ADMIN" && category._count.products === 0 && <form action={deleteCategoryAction.bind(null, category.id)}><button aria-label={`Delete ${category.name}`} className="grid size-9 place-items-center rounded-lg bg-red-50 text-red-700"><Trash2 className="size-4" /></button></form>}</div>)}{!categories.length && <p className="p-10 text-center text-sm text-[#68736c]">No categories yet.</p>}</div></div></div></>;
}
