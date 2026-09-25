"use client";

import { useActionState } from "react";
import { createCategoryAction, createSupplierAction } from "@/app/actions/inventory";
import { initialActionState } from "@/lib/action-state";
import { Field, TextareaField } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";

export function CategoryForm() {
  const [state, action] = useActionState(createCategoryAction, initialActionState);
  return <form action={action} className="card space-y-4 p-5"><Field label="Category name" name="name" minLength={2} maxLength={80} required error={state.fieldErrors?.name} /><TextareaField label="Description" name="description" maxLength={500} error={state.fieldErrors?.description} />{state.message && <p role="status" className={`rounded-lg p-3 text-sm ${state.status === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>{state.message}</p>}<SubmitButton>Create category</SubmitButton></form>;
}

export function SupplierForm() {
  const [state, action] = useActionState(createSupplierAction, initialActionState);
  return <form action={action} className="card grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-1"><Field label="Supplier name" name="name" minLength={2} maxLength={120} required error={state.fieldErrors?.name} /><Field label="Email" name="email" type="email" maxLength={254} error={state.fieldErrors?.email} /><Field label="Phone" name="phone" type="tel" maxLength={30} pattern="(?=(?:[^0-9]*[0-9]){7,15}[^0-9]*$)\+?[0-9\s().-]+" title="Enter 7 to 15 digits; spaces, parentheses, periods, and dashes are allowed" error={state.fieldErrors?.phone} /><Field label="Lead time (days)" name="leadTimeDays" type="number" min="0" max="365" step="1" defaultValue="7" required error={state.fieldErrors?.leadTimeDays} /><div className="sm:col-span-2 xl:col-span-1"><TextareaField label="Address" name="address" maxLength={300} error={state.fieldErrors?.address} /></div>{state.message && <p role="status" className={`rounded-lg p-3 text-sm sm:col-span-2 xl:col-span-1 ${state.status === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>{state.message}</p>}<SubmitButton>Create supplier</SubmitButton></form>;
}
