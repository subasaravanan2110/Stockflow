"use client";

import { useActionState } from "react";
import { createPurchaseOrderAction } from "@/app/actions/inventory";
import { initialActionState } from "@/lib/action-state";
import { Field, SelectField, TextareaField } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";

export function PurchaseForm({ suppliers, products }: { suppliers: Array<{ id: string; name: string }>; products: Array<{ id: string; name: string; sku: string }> }) {
  const [state, action] = useActionState(createPurchaseOrderAction, initialActionState);
  return <form action={action} className="card space-y-4 p-5"><SelectField label="Supplier" name="supplierId" required error={state.fieldErrors?.supplierId}><option value="">Select supplier</option>{suppliers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</SelectField><SelectField label="Product" name="productId" required error={state.fieldErrors?.productId}><option value="">Select product</option>{products.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.sku})</option>)}</SelectField><div className="grid grid-cols-2 gap-3"><Field label="Quantity" name="quantity" type="number" min="1" max="1000000" step="1" required error={state.fieldErrors?.quantity} /><Field label="Unit cost (₹)" name="unitCost" type="number" min="0.01" max="1000000" step="0.01" required error={state.fieldErrors?.unitCost} /></div><Field label="Expected date" name="expectedDate" type="date" error={state.fieldErrors?.expectedDate} /><TextareaField label="Notes" name="notes" maxLength={500} error={state.fieldErrors?.notes} />{state.message && <p role="status" className={`rounded-lg p-3 text-sm ${state.status === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>{state.message}</p>}<SubmitButton>Create purchase order</SubmitButton></form>;
}
