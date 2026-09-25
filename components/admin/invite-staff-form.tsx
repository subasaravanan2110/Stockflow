"use client";

import { useActionState, useState } from "react";
import { Check, Copy, ExternalLink, MailPlus } from "lucide-react";
import { inviteStaffAction, type InvitationActionState } from "@/app/actions/invitations";
import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";

export function InviteStaffForm() {
  const [state, action] = useActionState(inviteStaffAction, { status: "idle" } satisfies InvitationActionState);
  const [copied, setCopied] = useState(false);
  async function copyInvitation() {
    if (!state.invitationUrl) return;
    await navigator.clipboard.writeText(state.invitationUrl);
    setCopied(true);
  }
  return (
    <section className="card p-5 sm:p-6" aria-labelledby="invite-staff-title">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-green-50 text-green-700"><MailPlus className="size-5" /></span>
        <div><h2 id="invite-staff-title" className="font-extrabold">Invite staff</h2><p className="mt-1 text-sm text-[#68736c]">The email link securely assigns staff access to this organization.</p></div>
      </div>
      <form action={action} className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="min-w-0 flex-1"><Field label="Staff email" name="email" type="email" autoComplete="email" maxLength={254} required error={state.fieldErrors?.email} /></div>
        <SubmitButton className="sm:mt-6">Send invitation</SubmitButton>
      </form>
      {state.message && <p role="status" className={`mt-3 rounded-lg p-3 text-sm ${state.status === "success" ? "bg-green-50 text-green-800" : state.invitationUrl ? "bg-amber-50 text-amber-900" : "bg-red-50 text-red-800"}`}>{state.message}</p>}
      {state.invitationUrl && <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/60 p-3"><label className="label" htmlFor="invitation-link">Secure invitation link</label><input id="invitation-link" className="input mt-1 text-xs" value={state.invitationUrl} readOnly /><div className="mt-2 flex flex-wrap gap-2"><button type="button" onClick={copyInvitation} className="btn btn-secondary">{copied ? <Check className="size-4" /> : <Copy className="size-4" />}{copied ? "Copied" : "Copy link"}</button><a href={state.invitationUrl} target="_blank" rel="noreferrer" className="btn btn-secondary">Open registration <ExternalLink className="size-4" /></a></div></div>}
    </section>
  );
}
