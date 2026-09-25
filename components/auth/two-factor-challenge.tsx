"use client";

import Image from "next/image";
import { useActionState, useState, useTransition } from "react";
import { LoaderCircle, QrCode, ShieldCheck } from "lucide-react";
import {
  beginTwoFactorSetupAction,
  confirmTwoFactorSetupAction,
  verifyTwoFactorChallengeAction,
  type TwoFactorActionState,
} from "@/app/actions/two-factor";
import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";

const initialState: TwoFactorActionState = { status: "idle" };

export function TwoFactorChallenge({ needsSetup = false }: { needsSetup?: boolean }) {
  const [state, action] = useActionState(verifyTwoFactorChallengeAction, initialState);
  const [setup, setSetup] = useState<TwoFactorActionState>(initialState);
  const [setupResult, setSetupResult] = useState<TwoFactorActionState>(initialState);
  const [pending, startTransition] = useTransition();

  function beginSetup() {
    startTransition(async () => {
      setSetupResult(initialState);
      setSetup(await beginTwoFactorSetupAction());
    });
  }

  function confirmSetup(formData: FormData) {
    startTransition(async () => {
      setSetupResult(await confirmTwoFactorSetupAction(initialState, formData));
    });
  }

  if (needsSetup) return <div className="card w-full max-w-md p-8">
    <span className="grid size-11 place-items-center rounded-xl bg-green-50 text-green-700"><ShieldCheck className="size-5" /></span>
    <p className="eyebrow mt-5">Developer security</p>
    <h1 className="mt-2 text-3xl font-black">Set up your authenticator</h1>
    <p className="mt-2 text-sm leading-6 text-[#68736c]">GitHub developer access requires a fresh six-digit authenticator code at every StockFlow sign-in. This setup is required only once.</p>

    {!setup.qrCode && <button type="button" onClick={beginSetup} disabled={pending} className="btn btn-primary mt-6 w-full">
      {pending ? <LoaderCircle className="size-4 animate-spin" /> : <QrCode className="size-4" />}Set up authenticator
    </button>}

    {setup.qrCode && <div className="mt-6 space-y-4">
      <div className="mx-auto w-fit rounded-xl border bg-white p-2"><Image src={setup.qrCode} alt="QR code for StockFlow developer two-factor authentication" width={184} height={184} unoptimized /></div>
      <div><p className="text-xs font-bold uppercase tracking-wider text-[#68736c]">Manual setup key</p><code className="mt-1 block break-all rounded-lg bg-[#eff3ef] p-2 text-xs">{setup.manualKey}</code></div>
      <form action={confirmSetup} className="space-y-4">
        <Field label="Six-digit code" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" title="Enter exactly six digits" minLength={6} maxLength={6} required autoFocus />
        <button disabled={pending} className="btn btn-primary w-full">{pending && <LoaderCircle className="size-4 animate-spin" />}Verify and continue</button>
      </form>
    </div>}

    {(setup.message || setupResult.message) && <p role="status" className={`mt-4 rounded-lg p-3 text-sm ${setup.status === "error" || setupResult.status === "error" ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800"}`}>{setupResult.message ?? setup.message}</p>}
  </div>;

  return <div className="card w-full max-w-md p-8">
    <span className="grid size-11 place-items-center rounded-xl bg-green-50 text-green-700"><ShieldCheck className="size-5" /></span>
    <p className="eyebrow mt-5">Second verification step</p>
    <h1 className="mt-2 text-3xl font-black">Authenticator code</h1>
    <p className="mt-2 text-sm leading-6 text-[#68736c]">Enter the current six-digit code from your authenticator app to finish signing in.</p>
    <form action={action} className="mt-6 space-y-4">
      <Field label="Six-digit code" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" title="Enter exactly six digits" minLength={6} maxLength={6} required autoFocus />
      {state.message && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{state.message}</p>}
      <SubmitButton className="w-full">Verify and continue</SubmitButton>
    </form>
  </div>;
}
