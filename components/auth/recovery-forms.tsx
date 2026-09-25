"use client";

import Link from "next/link";
import { useActionState } from "react";
import { forgotPasswordAction, resetPasswordAction } from "@/app/actions/auth";
import { initialActionState } from "@/lib/action-state";
import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";

export function ForgotPasswordForm() {
  const [state, action] = useActionState(forgotPasswordAction, initialActionState);
  return <div className="card w-full max-w-md p-8"><p className="eyebrow">Account recovery</p><h1 className="mt-2 text-3xl font-black">Forgot your password?</h1><p className="mt-2 text-sm text-[#68736c]">We’ll send a time-limited reset link if the account exists.</p><form action={action} className="mt-7 space-y-4"><Field label="Email" name="email" type="email" autoComplete="email" maxLength={254} required error={state.fieldErrors?.email} />{state.message && <p role="status" className={`rounded-lg p-3 text-sm ${state.status === "error" ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800"}`}>{state.message}</p>}<SubmitButton className="w-full">Send reset link</SubmitButton></form><Link href="/login" className="mt-6 block text-center text-sm font-bold text-[#176b45]">Back to sign in</Link></div>;
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action] = useActionState(resetPasswordAction, initialActionState);
  return <div className="card w-full max-w-md p-8"><p className="eyebrow">Choose a new password</p><h1 className="mt-2 text-3xl font-black">Reset password</h1><form action={action} className="mt-7 space-y-4"><input type="hidden" name="token" value={token} /><Field label="New password" name="password" type="password" autoComplete="new-password" minLength={6} maxLength={128} pattern="(?=\S{6,128}$)(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9\s]).*" title="Use 6 or more characters with uppercase, lowercase, a number, and a special character" hint="6+ characters with uppercase, lowercase, a number, and a special character" required error={state.fieldErrors?.password} /><Field label="Confirm password" name="confirmPassword" type="password" autoComplete="new-password" minLength={6} maxLength={128} required error={state.fieldErrors?.confirmPassword} />{state.message && <p role="status" className={`rounded-lg p-3 text-sm ${state.status === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>{state.message}</p>}<SubmitButton className="w-full">Update password</SubmitButton></form>{state.status === "success" && <Link href="/login" className="mt-5 block text-center text-sm font-bold text-[#176b45]">Continue to sign in</Link>}</div>;
}
