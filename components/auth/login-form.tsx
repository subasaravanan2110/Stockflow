"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Code2, ShieldCheck, X } from "lucide-react";
import { githubLoginAction, loginAction } from "@/app/actions/auth";
import { initialActionState } from "@/lib/action-state";
import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { Button } from "@/components/ui/button";

export function LoginForm({
  demoSessionExpired = false,
  githubAccessDenied = false,
  githubAllowedDomains,
}: {
  demoSessionExpired?: boolean;
  githubAccessDenied?: boolean;
  githubAllowedDomains: string[];
}) {
  const [state, action] = useActionState(loginAction, initialActionState);
  const [showGithubNotice, setShowGithubNotice] = useState(false);
  const allowedAddresses = githubAllowedDomains.map((domain) => `@${domain}`).join(" or ");
  const githubRestricted = githubAllowedDomains.length > 0;
  return (
    <div className="card w-full max-w-md p-7 sm:p-9">
      <p className="eyebrow">Welcome back</p><h1 className="mt-2 text-3xl font-black tracking-tight">Sign in to StockFlow</h1><p className="mt-2 text-sm text-[#68736c]">Continue managing inventory with your team.</p>
      {demoSessionExpired && <p role="alert" className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900">The one-minute demonstration session expired. Please sign in again; future sessions use the normal seven-day duration.</p>}
      {githubAccessDenied && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-800">GitHub access was denied. Use a GitHub account with a verified email and existing StockFlow workspace access.</p>}
      <div className="mt-7">
        <Button type="button" variant="secondary" className="w-full" onClick={() => setShowGithubNotice(true)}><Code2 className="size-4" />Continue with GitHub</Button>
        <p className="mt-2 text-center text-xs text-[#68736c]">In future, access will be restricted to approved StockFlow developers. For this demo, you can use your own GitHub account.</p>
      </div>
      {showGithubNotice && <div className="fixed inset-0 z-50 grid place-items-center bg-black/55 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowGithubNotice(false); }}>
        <section role="dialog" aria-modal="true" aria-labelledby="github-access-title" className="card w-full max-w-md p-6 shadow-2xl">
          <div className="flex items-start justify-between gap-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-green-50 text-green-700"><ShieldCheck className="size-5" /></span>
            <button type="button" className="grid size-9 place-items-center rounded-lg border" aria-label="Close GitHub access notice" onClick={() => setShowGithubNotice(false)}><X className="size-4" /></button>
          </div>
          <h2 id="github-access-title" className="mt-5 text-xl font-black">Continue with GitHub</h2>
          <p className="mt-2 text-sm leading-6 text-[#68736c]">{githubRestricted
            ? <>Use an approved StockFlow developer account with a verified <strong className="text-current">{allowedAddresses}</strong> email. The account must also belong to this workspace.</>
            : <>In future, access will be restricted to approved StockFlow developers. For this demo, you can use your own GitHub account with a verified email.</>}</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Button type="button" variant="secondary" onClick={() => setShowGithubNotice(false)}>Cancel</Button>
            <form action={githubLoginAction}><Button type="submit" className="w-full"><Code2 className="size-4" />I understand</Button></form>
          </div>
        </section>
      </div>}
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
