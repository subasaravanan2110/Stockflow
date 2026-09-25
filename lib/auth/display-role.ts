import type { Role } from "@/generated/prisma/client";

export type DisplayRole = "Administrator" | "Developer" | "Staff";

export function getDisplayRole(role: Role, providers: string | Iterable<string> | undefined): DisplayRole {
  if (role === "ADMIN") return "Administrator";

  const providerList = typeof providers === "string"
    ? [providers]
    : providers ? [...providers] : [];

  return providerList.includes("github") ? "Developer" : "Staff";
}
