"use client";

import { useActionState } from "react";
import { createMovementAction } from "@/app/actions/inventory";
import { initialActionState } from "@/lib/action-state";
import { Field, SelectField } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";

export function StockForm({ products }: { products: Array<{ id: string; name: string; sku: string; quantity: number }> }) {
  const [state, action] = useActionState(createMovementAction, initialActionState);
  return <form action={action} className="card grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-1">
    <SelectField label="Product" name="productId" required error={state.fieldErrors?.productId}><option value="">Select product</option>{products.map((product) => <option value={product.id} key={product.id}>{product.name} ({product.sku}) — {product.quantity} available</option>)}</SelectField>
    <SelectField label="Movement" name="type" required error={state.fieldErrors?.type}><option value="STOCK_IN">Stock in</option><option value="STOCK_OUT">Stock out</option><option value="ADJUSTMENT">Set exact quantity</option></SelectField>
    <Field label="Quantity" name="quantity" type="number" min="1" max="1000000" step="1" required error={state.fieldErrors?.quantity} />
    <Field label="Reason" name="reason" minLength={3} maxLength={240} required placeholder="e.g. customer order #1042" error={state.fieldErrors?.reason} />
    {state.message && <p role="status" className={`rounded-lg p-3 text-sm sm:col-span-2 xl:col-span-1 ${state.status === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>{state.message}</p>}
    <SubmitButton>Record movement</SubmitButton>
  </form>;
}
