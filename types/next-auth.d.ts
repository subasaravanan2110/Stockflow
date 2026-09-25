import type { DefaultSession } from "next-auth";
import type { Role } from "@/generated/prisma/client";

declare module "next-auth" {
  interface Session {
    activeSessionId?: string;
    authProvider?: string;
    requiresTwoFactor?: boolean;
    demoExpiresAt?: number;
    demoSessionExpired?: boolean;
    user: DefaultSession["user"] & {
      id: string;
      organizationId: string;
      role: Role;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    organizationId?: string;
    role?: Role;
    sessionVersion?: number;
    activeSessionId?: string;
    authProvider?: string;
    requiresTwoFactor?: boolean;
    demoExpiresAt?: number;
    demoSessionExpired?: boolean;
  }
}
