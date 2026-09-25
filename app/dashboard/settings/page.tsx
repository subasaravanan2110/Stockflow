import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/dal";
import { PageHeader } from "@/components/dashboard/page-header";
import { TwoFactorCard } from "@/components/settings/two-factor-card";
import { getDisplayRole } from "@/lib/auth/display-role";

export default async function SettingsPage() {
  const user = await requireUser();
  const displayRole = getDisplayRole(user.role, user.authProvider);
  const twoFactor = await db.twoFactorCredential.findUnique({ where: { userId: user.id }, select: { enabledAt: true } });
  return <>
    <PageHeader eyebrow="Workspace" title="Settings" description="Account, organization, and sign-in security used throughout StockFlow." />
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="card p-6"><dl className="grid gap-5 sm:grid-cols-2"><div><dt className="text-xs font-bold uppercase tracking-wider text-[#68736c]">Organization</dt><dd className="mt-1 font-bold">{user.organization.name}</dd></div><div><dt className="text-xs font-bold uppercase tracking-wider text-[#68736c]">Account type</dt><dd className="mt-1 font-bold">{displayRole}</dd></div><div><dt className="text-xs font-bold uppercase tracking-wider text-[#68736c]">Name</dt><dd className="mt-1 font-bold">{user.name}</dd></div><div><dt className="text-xs font-bold uppercase tracking-wider text-[#68736c]">Email</dt><dd className="mt-1 break-all font-bold">{user.email}</dd></div></dl></div>
      <TwoFactorCard initiallyEnabled={Boolean(twoFactor?.enabledAt)} />
    </div>
  </>;
}
