type AuthRouteSession = {
  user?: { id?: string; organizationId?: string } | null;
  requiresTwoFactor?: boolean;
  demoSessionExpired?: boolean;
} | null | undefined;

export function loginRedirectFor(session: AuthRouteSession) {
  const hasCompleteIdentity = Boolean(session?.user?.id && session.user.organizationId);
  if (!hasCompleteIdentity || session?.demoSessionExpired) return null;
  return session?.requiresTwoFactor ? "/two-factor" : "/dashboard";
}
