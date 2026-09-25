"use client";

import { useActionState } from "react";
import { ShieldCheck } from "lucide-react";
import { verifyTwoFactorChallengeAction, type TwoFactorActionState } from "@/app/actions/two-factor";
import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";

const initialState: TwoFactorActionState = { status: "idle" };

export function TwoFactorChallenge() {
  const [state, action] = useActionState(verifyTwoFactorChallengeAction, initialState);
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
