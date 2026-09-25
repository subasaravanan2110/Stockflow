"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { KeyRound, LoaderCircle, QrCode, ShieldCheck } from "lucide-react";
import {
  beginTwoFactorSetupAction,
  confirmTwoFactorSetupAction,
  disableTwoFactorAction,
  type TwoFactorActionState,
} from "@/app/actions/two-factor";
import { Field } from "@/components/ui/field";

const idle: TwoFactorActionState = { status: "idle" };

export function TwoFactorCard({ initiallyEnabled }: { initiallyEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initiallyEnabled);
  const [setup, setSetup] = useState<TwoFactorActionState>(idle);
  const [result, setResult] = useState<TwoFactorActionState>(idle);
  const [pending, startTransition] = useTransition();

  function beginSetup() {
    startTransition(async () => {
      setResult(idle);
      setSetup(await beginTwoFactorSetupAction());
    });
  }

  function confirmSetup(formData: FormData) {
    startTransition(async () => {
      const next = await confirmTwoFactorSetupAction(idle, formData);
      setResult(next);
      if (next.status === "success") { setEnabled(true); setSetup(idle); }
    });
  }

  function disable(formData: FormData) {
    startTransition(async () => {
      const next = await disableTwoFactorAction(idle, formData);
      setResult(next);
      if (next.status === "success") setEnabled(false);
    });
  }

  return <aside className="card self-start overflow-hidden xl:sticky xl:top-24">
    <div className="border-b bg-[#14281d] p-5 text-white">
      <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[#dfff7a] text-[#17211b]"><ShieldCheck className="size-5" /></span><div><h2 className="font-extrabold">Two-factor authentication</h2><p className="text-xs text-white/60">Authenticator app · TOTP</p></div></div>
    </div>
    <div className="space-y-4 p-5">
      <div className={`rounded-xl border p-3 text-sm ${enabled ? "border-green-200 bg-green-50 text-green-900" : "border-stone-200 bg-stone-50 text-stone-700"}`}>
        <p className="font-extrabold">{enabled ? "2FA enabled" : "2FA not enabled"}</p>
        <p className="mt-1 text-xs leading-5 opacity-75">{enabled ? "Every new password or GitHub session requires a six-digit code." : "Add a second verification step to your account."}</p>
      </div>

      {!enabled && !setup.qrCode && <button type="button" onClick={beginSetup} disabled={pending} className="btn btn-primary w-full">{pending ? <LoaderCircle className="size-4 animate-spin" /> : <QrCode className="size-4" />}Enable 2FA</button>}

      {!enabled && setup.qrCode && <div className="space-y-4">
        <div className="mx-auto w-fit rounded-xl border bg-white p-2"><Image src={setup.qrCode} alt="QR code for StockFlow two-factor authentication" width={184} height={184} unoptimized /></div>
        <div><p className="text-xs font-bold uppercase tracking-wider text-[#68736c]">Manual setup key</p><code className="mt-1 block break-all rounded-lg bg-[#eff3ef] p-2 text-xs">{setup.manualKey}</code></div>
        <form action={confirmSetup} className="space-y-3">
          <Field label="Verify six-digit code" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" title="Enter exactly six digits" minLength={6} maxLength={6} required />
          <button disabled={pending} className="btn btn-primary w-full">{pending && <LoaderCircle className="size-4 animate-spin" />}Verify and enable</button>
        </form>
      </div>}

      {enabled && <form action={disable} className="space-y-3">
        <Field label="Code required to disable" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" title="Enter exactly six digits" minLength={6} maxLength={6} required />
        <button disabled={pending} className="btn btn-secondary w-full"><KeyRound className="size-4" />Disable 2FA</button>
      </form>}

      {(result.message || setup.message) && <p role="status" className={`rounded-lg p-3 text-xs ${result.status === "error" || setup.status === "error" ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800"}`}>{result.message ?? setup.message}</p>}
      <p className="text-xs leading-5 text-[#68736c]">The shared secret is encrypted at rest. StockFlow never displays it again after setup.</p>
    </div>
  </aside>;
}
