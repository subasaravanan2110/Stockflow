"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerAction } from "@/app/actions/auth";
import { initialActionState } from "@/lib/action-state";
import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";

type InvitationDetails = { email: string };

export function SignupForm({ token, invitation }: { token: string; invitation: InvitationDetails | null }) {
  const [state, action] = useActionState(registerAction, initialActionState);
  if (!invitation) {
    return (
      <div className="card w-full max-w-md p-7 text-center sm:p-9">
        <p className="eyebrow">StockFlow staff access</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">Invitation required</h1>
        <p className="mt-3 text-sm leading-6 text-[#68736c]">For security, staff accounts can only be created from an invitation sent by a StockFlow administrator.</p>
        <Link href="/login" className="btn btn-primary mt-7">Back to sign in</Link>
      </div>
    );
  }
  return (
    <div className="card w-full max-w-xl p-7 sm:p-9">
      <p className="eyebrow">StockFlow staff invitation</p><h1 className="mt-2 text-3xl font-black tracking-tight">Create your staff account</h1><p className="mt-2 text-sm text-[#68736c]">Set up your secure login to access the inventory assigned by your administrator.</p>
      <form action={action} className="mt-7 grid gap-4 sm:grid-cols-2">
        <input type="hidden" name="token" value={token} />
        <div className="sm:col-span-2"><Field label="Staff name" name="name" autoComplete="name" minLength={2} maxLength={80} required error={state.fieldErrors?.name} /></div>
        <div className="sm:col-span-2"><Field label="Staff email" name="invitedEmail" type="email" value={invitation.email} readOnly disabled /></div>
        <Field label="Password" name="password" type="password" autoComplete="new-password" minLength={6} maxLength={128} pattern="(?=\S{6,128}$)(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9\s]).*" title="Use 6 or more characters with uppercase, lowercase, a number, and a special character" required hint="6+ characters with uppercase, lowercase, a number, and a special character" error={state.fieldErrors?.password} />
        <Field label="Confirm password" name="confirmPassword" type="password" autoComplete="new-password" minLength={6} maxLength={128} required error={state.fieldErrors?.confirmPassword} />
        {state.message && <p role="status" className={`sm:col-span-2 rounded-lg p-3 text-sm ${state.status === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>{state.message}</p>}
        {state.status !== "success" && <SubmitButton className="sm:col-span-2">Create staff account</SubmitButton>}
      </form>
      <p className="mt-6 text-center text-sm text-[#68736c]">{state.status === "success" ? "Your account is ready. " : "Already have an account? "}<Link href="/login" className="font-bold text-[#176b45]">Sign in</Link></p>
    </div>
  );
}
