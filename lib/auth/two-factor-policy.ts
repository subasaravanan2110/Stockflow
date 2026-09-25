export function requiresTwoFactorForSession({
  provider,
  twoFactorEnabled,
  sessionVerified,
}: {
  provider?: string;
  twoFactorEnabled: boolean;
  sessionVerified: boolean;
}) {
  if (sessionVerified) return false;
  return provider === "github" || twoFactorEnabled;
}
