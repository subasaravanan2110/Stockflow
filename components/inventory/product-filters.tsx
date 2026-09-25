"use client";

import Link from "next/link";
import { RotateCcw } from "lucide-react";

type Option = { id: string; name: string };

export function ProductFilters({
  stock,
  category,
  supplier,
  categories,
  suppliers,
}: {
  stock: string;
  category: string;
  supplier: string;
  categories: Option[];
  suppliers: Option[];
}) {
  const hasFilters = stock !== "all" || category !== "all" || supplier !== "all";
  function applyFilter(event: React.ChangeEvent<HTMLSelectElement>) {
    event.currentTarget.form?.requestSubmit();
  }

  return (
    <form action="/dashboard/products" className="card mb-5 grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-[repeat(3,minmax(180px,1fr))_auto] xl:items-end">
      <label className="block min-w-0"><span className="label">Stock status</span><select className="input" name="stock" value={stock} onChange={applyFilter}><option value="all">All stock</option><option value="healthy">Healthy</option><option value="low">Low stock</option><option value="out">Out of stock</option></select></label>
      <label className="block min-w-0"><span className="label">Category</span><select className="input" name="category" value={category} onChange={applyFilter}><option value="all">All categories</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label className="block min-w-0"><span className="label">Supplier</span><select className="input" name="supplier" value={supplier} onChange={applyFilter}><option value="all">All suppliers</option>{suppliers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <div className="sm:col-span-2 xl:col-span-1">{hasFilters && <Link href="/dashboard/products" className="btn btn-secondary w-full whitespace-nowrap"><RotateCcw className="size-4" />Reset filters</Link>}</div>
    </form>
  );
}
