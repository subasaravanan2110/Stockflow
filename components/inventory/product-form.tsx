"use client";

import { useActionState } from "react";
import type { ActionState } from "@/lib/action-state";
import { initialActionState } from "@/lib/action-state";
import { Field, SelectField, TextareaField } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";

type Option = { id: string; name: string };
type ProductValue = { name: string; sku: string; description: string | null; price: unknown; costPrice: unknown; reorderLevel: number; categoryId: string; supplierId: string | null };

export function ProductForm({ action, categories, suppliers, product }: { action: (state: ActionState, formData: FormData) => Promise<ActionState>; categories: Option[]; suppliers: Option[]; product?: ProductValue }) {
  const [state, formAction] = useActionState(action, initialActionState);
  return <form action={formAction} className="card grid gap-5 p-6 sm:grid-cols-2">
    <Field label="Product name" name="name" minLength={2} maxLength={120} required defaultValue={product?.name} error={state.fieldErrors?.name} />
    <Field label="SKU" name="sku" minLength={2} maxLength={40} pattern="[A-Za-z0-9_-]+" title="Use only letters, numbers, dashes, or underscores" required defaultValue={product?.sku} error={state.fieldErrors?.sku} hint="Letters, numbers, dashes, and underscores" />
    <div className="sm:col-span-2"><TextareaField label="Description" name="description" maxLength={500} defaultValue={product?.description ?? ""} error={state.fieldErrors?.description} /></div>
    <Field label="Selling price (₹)" name="price" type="number" min="0" max="1000000" step="0.01" required defaultValue={product ? String(product.price) : ""} error={state.fieldErrors?.price} />
    <Field label="Cost price (₹)" name="costPrice" type="number" min="0" max="1000000" step="0.01" required defaultValue={product ? String(product.costPrice) : ""} error={state.fieldErrors?.costPrice} />
    <Field label="Reorder level" name="reorderLevel" type="number" min="0" max="1000000" step="1" required defaultValue={product?.reorderLevel ?? 5} error={state.fieldErrors?.reorderLevel} />
    <SelectField label="Category" name="categoryId" required defaultValue={product?.categoryId} error={state.fieldErrors?.categoryId}><option value="">Select category</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</SelectField>
    <SelectField label="Supplier" name="supplierId" defaultValue={product?.supplierId ?? ""} error={state.fieldErrors?.supplierId}><option value="">No supplier</option>{suppliers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</SelectField>
    {state.message && <p role="status" className={`sm:col-span-2 rounded-lg p-3 text-sm ${state.status === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>{state.message}</p>}
    <div className="sm:col-span-2"><SubmitButton>{product ? "Save changes" : "Create product"}</SubmitButton></div>
  </form>;
}
