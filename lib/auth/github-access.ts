export function parseGithubAllowedDomains(value = process.env.GITHUB_ALLOWED_EMAIL_DOMAINS): string[] {
  const domains = (value ?? "")
    .split(",")
    .map((domain) => domain.trim().toLowerCase().replace(/^@/, ""))
    .filter(Boolean);

  return [...new Set(domains)];
}

export function isAllowedGithubEmail(email: string, allowedDomains = parseGithubAllowedDomains()): boolean {
  const normalized = email.trim().toLowerCase();
  const separator = normalized.lastIndexOf("@");
  if (separator <= 0 || separator === normalized.length - 1) return false;
  if (allowedDomains.length === 0) return true;
  return allowedDomains.includes(normalized.slice(separator + 1));
}
