import { notFound } from "next/navigation";
import { MonitorCheck, Radio, UserCheck, Users, UserX } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/dal";
import { PageHeader } from "@/components/dashboard/page-header";
import { InviteStaffForm } from "@/components/admin/invite-staff-form";
import { TeamActivityLiveRefresh } from "@/components/admin/team-activity-live-refresh";
import { formatDate } from "@/lib/utils";
import { getDisplayRole } from "@/lib/auth/display-role";

const ONLINE_WINDOW_MS = 45_000;

function latestDate(values: Array<Date | null | undefined>) {
  return values.reduce<Date | null>((latest, value) => {
    if (!value) return latest;
    return !latest || value > latest ? value : latest;
  }, null);
}

export default async function UsersPage() {
  const administrator = await requireUser();
  if (administrator.role !== "ADMIN") notFound();

  const now = new Date();
  const onlineAfter = new Date(now.getTime() - ONLINE_WINDOW_MS);
  const expiredSessions = await db.activeSession.findMany({
    where: {
      expiresAt: { lte: now },
      user: { memberships: { some: { organizationId: administrator.organizationId } } },
    },
    select: { id: true, userId: true, lastSeenAt: true },
  });
  for (const session of expiredSessions) {
    await db.user.updateMany({
      where: {
        id: session.userId,
        OR: [{ lastActivityAt: null }, { lastActivityAt: { lt: session.lastSeenAt } }],
      },
      data: { lastActivityAt: session.lastSeenAt },
    });
  }
  if (expiredSessions.length) {
    await db.activeSession.deleteMany({ where: { id: { in: expiredSessions.map((session) => session.id) } } });
  }

  const [memberships, pendingInvitations] = await Promise.all([
    db.membership.findMany({
      where: { organizationId: administrator.organizationId },
      select: {
        role: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
            passwordHash: true,
            lastSignedInAt: true,
            lastActivityAt: true,
            lastSignedOutAt: true,
            accounts: { select: { provider: true } },
            activeSessions: {
              where: { expiresAt: { gt: now } },
              orderBy: { lastSeenAt: "desc" },
              select: { id: true, provider: true, lastSeenAt: true },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    db.invitation.findMany({
      where: { organizationId: administrator.organizationId, acceptedAt: null, expiresAt: { gt: now } },
      select: { id: true, email: true, role: true, expiresAt: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const members = memberships.map(({ role, user }) => {
    const methods = new Set(user.accounts.map((account) => account.provider));
    if (user.passwordHash) methods.add("credentials");
    user.activeSessions.forEach((session) => methods.add(session.provider));
    const onlineSessions = user.activeSessions.filter((session) => session.lastSeenAt > onlineAfter);
    return {
      ...user,
      role,
      displayRole: getDisplayRole(role, methods),
      methods: [...methods],
      onlineSessions,
      signedIn: onlineSessions.length > 0,
      lastActivityAt: latestDate([
        user.lastActivityAt,
        user.lastSignedInAt,
        ...user.activeSessions.map((session) => session.lastSeenAt),
      ]),
    };
  });
  const signedInCount = members.filter((member) => member.signedIn).length;
  const signedOutCount = members.length - signedInCount;
  const activeSessionCount = members.reduce((total, member) => total + member.onlineSessions.length, 0);

  return <>
    <PageHeader
      eyebrow="Administration"
      title="Team activity"
      description="Review every administrator, staff member, and GitHub developer, including signed-out users, sign-in methods, active sessions, and latest recorded activity."
      action={<TeamActivityLiveRefresh />}
    />
    <div className="mb-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.65fr)]">
      <InviteStaffForm />
      <section className="card p-5 sm:p-6" aria-labelledby="pending-invitations-title">
        <h2 id="pending-invitations-title" className="font-extrabold">Pending invitations</h2>
        <div className="mt-4 space-y-3">
          {pendingInvitations.map((invitation) => <div key={invitation.id} className="rounded-xl border p-3"><p className="break-all text-sm font-bold">{invitation.email}</p><p className="mt-1 text-xs text-[#68736c]">{invitation.role} · expires {formatDate(invitation.expiresAt)}</p></div>)}
          {!pendingInvitations.length && <p className="text-sm text-[#68736c]">No pending staff invitations.</p>}
        </div>
      </section>
    </div>
    <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div className="card flex items-center gap-4 p-5"><span className="grid size-11 place-items-center rounded-xl bg-stone-100 text-stone-700"><Users className="size-5" /></span><div><p className="text-2xl font-black">{members.length}</p><p className="text-sm text-[#68736c]">Team members</p></div></div>
      <div className="card flex items-center gap-4 p-5"><span className="grid size-11 place-items-center rounded-xl bg-green-50 text-green-700"><UserCheck className="size-5" /></span><div><p className="text-2xl font-black">{signedInCount}</p><p className="text-sm text-[#68736c]">Signed in</p></div></div>
      <div className="card flex items-center gap-4 p-5"><span className="grid size-11 place-items-center rounded-xl bg-amber-50 text-amber-900"><UserX className="size-5" /></span><div><p className="text-2xl font-black">{signedOutCount}</p><p className="text-sm text-[#68736c]">Signed out</p></div></div>
      <div className="card flex items-center gap-4 p-5"><span className="grid size-11 place-items-center rounded-xl bg-blue-50 text-blue-700"><MonitorCheck className="size-5" /></span><div><p className="text-2xl font-black">{activeSessionCount}</p><p className="text-sm text-[#68736c]">Active sessions</p></div></div>
    </section>
    <div className="card table-wrap">
      <table className="data-table">
        <thead><tr><th>User</th><th>Role</th><th>Sign-in methods</th><th>Sessions</th><th>Last activity</th><th>Status</th></tr></thead>
        <tbody>
          {members.map((member) => <tr key={member.id}>
            <td><p className="font-bold">{member.name ?? "Unnamed user"}</p><p className="text-xs text-[#68736c]">{member.email}</p></td>
            <td><span className={`badge ${member.role === "ADMIN" ? "bg-blue-50 text-blue-700" : member.displayRole === "Developer" ? "bg-violet-50 text-violet-700" : "bg-stone-100 text-stone-700"}`}>{member.displayRole}</span></td>
            <td className="capitalize">{member.methods.join(", ") || "—"}</td>
            <td>{member.onlineSessions.length}</td>
            <td>{member.lastActivityAt ? formatDate(member.lastActivityAt) : "No activity recorded"}</td>
            <td>{member.signedIn
              ? <span className="inline-flex items-center gap-2 font-semibold text-green-700"><Radio className="size-3 fill-current" />Signed in</span>
              : <div><span className="font-semibold text-[#68736c]">Signed out</span>{member.lastSignedOutAt && <p className="mt-1 text-xs text-[#8a948d]">{formatDate(member.lastSignedOutAt)}</p>}</div>}</td>
          </tr>)}
          {!members.length && <tr><td colSpan={6} className="py-12 text-center text-sm text-[#68736c]">No members belong to this organization.</td></tr>}
        </tbody>
      </table>
    </div>
  </>;
}
