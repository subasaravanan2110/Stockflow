"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Code2 } from "lucide-react";
import { githubLoginAction, loginAction } from "@/app/actions/auth";
import { initialActionState } from "@/lib/action-state";
import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { Button } from "@/components/ui/button";

export function LoginForm({
  demoSessionExpired = false,
  githubAccessDenied = false,
}: {
  demoSessionExpired?: boolean;
  githubAccessDenied?: boolean;
}) {
  const [state, action] = useActionState(loginAction, initialActionState);
  return (
    <div className="card w-full max-w-md p-7 sm:p-9">
      <p className="eyebrow">Welcome back</p><h1 className="mt-2 text-3xl font-black tracking-tight">Sign in to StockFlow</h1><p className="mt-2 text-sm text-[#68736c]">Continue managing inventory with your team.</p>
      {demoSessionExpired && <p role="alert" className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900">The one-minute demonstration session expired. Please sign in again; future sessions use the normal seven-day duration.</p>}
      {githubAccessDenied && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-800">GitHub sign-in could not be completed. Use a GitHub account with a verified email and try again.</p>}
      <div className="mt-7">
        <form action={githubLoginAction}><Button type="submit" variant="secondary" className="w-full"><Code2 className="size-4" />Continue with GitHub</Button></form>
        <p className="mt-2 text-center text-xs text-[#68736c]">GitHub access is for StockFlow developers and requires an authenticator code at every sign-in.</p>
      </div>
      <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wider text-[#8a948d]"><span className="h-px flex-1 bg-[#dfe5df]" />or use email<span className="h-px flex-1 bg-[#dfe5df]" /></div>
      <form action={action} className="space-y-4">
        <Field label="Email" name="email" type="email" autoComplete="email" maxLength={254} required error={state.fieldErrors?.email} />
        <Field label="Password" name="password" type="password" autoComplete="current-password" minLength={6} maxLength={128} required error={state.fieldErrors?.password} />
        {state.message && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{state.message}</p>}
        <div className="flex justify-end"><Link href="/forgot-password" className="text-sm font-bold text-[#176b45]">Forgot password?</Link></div>
        <SubmitButton className="w-full">Sign in</SubmitButton>
      </form>
      <p className="mt-6 text-center text-sm text-[#68736c]">Joining as staff? <Link href="/signup" className="font-bold text-[#176b45]">Use your administrator’s invitation</Link></p>
    </div>
  );
}
