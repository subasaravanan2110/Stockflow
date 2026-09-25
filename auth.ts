import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub, { type GitHubEmail, type GitHubProfile } from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { verify } from "argon2";
import { db } from "@/lib/db";
import { loginSchema } from "@/lib/validation/auth";
import { isAllowedGithubEmail } from "@/lib/auth/github-access";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const configuredDemoSeconds = Number(process.env.DEMO_SHORT_SESSION_SECONDS ?? "60");
const DEMO_SESSION_SECONDS = Number.isFinite(configuredDemoSeconds) && configuredDemoSeconds > 0
  ? Math.min(configuredDemoSeconds, 300)
  : 0;

async function acceptPendingInvitation(userId: string, email: string) {
  const invitation = await db.invitation.findFirst({
    where: { email: email.toLowerCase(), acceptedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "asc" },
  });
  if (invitation) {
    const acceptedMembership = await db.$transaction(async (tx) => {
      const claimed = await tx.invitation.updateMany({
        where: { id: invitation.id, acceptedAt: null, expiresAt: { gt: new Date() } },
        data: { acceptedAt: new Date() },
      });
      if (claimed.count !== 1) return null;
      return tx.membership.upsert({
        where: {
          userId_organizationId: { userId, organizationId: invitation.organizationId },
        },
        update: { role: invitation.role },
        create: { userId, organizationId: invitation.organizationId, role: invitation.role },
      });
    });
    if (acceptedMembership) return acceptedMembership;
  }
  return db.membership.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } });
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt", maxAge: SESSION_MAX_AGE_SECONDS },
  pages: { signIn: "/login", error: "/login" },
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
      // Auto-link only after the custom userinfo request confirms that GitHub
      // owns and has verified the email address used by the local account.
      allowDangerousEmailAccountLinking: true,
      userinfo: {
        async request({ tokens }: { tokens: { access_token?: string } }) {
          if (!tokens.access_token) throw new Error("GitHub did not return an access token.");
          const requestHeaders = {
            Authorization: `Bearer ${tokens.access_token}`,
            Accept: "application/vnd.github+json",
            "User-Agent": "stockflow",
            "X-GitHub-Api-Version": "2022-11-28",
          };
          const [profileResponse, emailsResponse] = await Promise.all([
            fetch("https://api.github.com/user", { headers: requestHeaders }),
            fetch("https://api.github.com/user/emails", { headers: requestHeaders }),
          ]);
          if (!profileResponse.ok || !emailsResponse.ok) throw new Error("Could not verify the GitHub identity.");
          const profile = await profileResponse.json() as GitHubProfile;
          const emails = await emailsResponse.json() as GitHubEmail[];
          const verifiedEmail = emails.find((email) => email.primary && email.verified && isAllowedGithubEmail(email.email))
            ?? emails.find((email) => email.verified && isAllowedGithubEmail(email.email));
          if (!verifiedEmail) throw new Error("GitHub access requires an approved StockFlow developer email.");
          return { ...profile, email: verifiedEmail.email.toLowerCase() };
        },
      },
    }),
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;
        const user = await db.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
        if (!user?.passwordHash || user.status !== "ACTIVE" || !user.emailVerified) return null;
        if (!(await verify(user.passwordHash, parsed.data.password))) return null;
        return { id: user.id, email: user.email, name: user.name, image: user.image };
      },
    }),
  ],
  events: {
    async signIn({ user, account, profile }) {
      if (!user.id || !user.email) return;
      const now = new Date();
      const profileData: { name?: string; image?: string } = {};
      if (account?.provider === "github" && profile) {
        const githubProfile = profile as unknown as GitHubProfile;
        const fullName = githubProfile.name?.trim() || githubProfile.login?.trim();
        if (fullName) profileData.name = fullName;
        if (githubProfile.avatar_url) profileData.image = githubProfile.avatar_url;
      }
      await db.user.update({
        where: { id: user.id },
        data: {
          ...profileData,
          lastSignedInAt: now,
          lastActivityAt: now,
          // The custom GitHub userinfo request only returns an address after
          // GitHub confirms ownership, so it is safe to trust it here.
          ...(account?.provider === "github" ? { emailVerified: now } : {}),
        },
      });
    },
    async signOut(message) {
      if ("token" in message && message.token) {
        const activeSessionId = typeof message.token.activeSessionId === "string"
          ? message.token.activeSessionId
          : typeof message.token.jti === "string" ? message.token.jti : undefined;
        if (activeSessionId) await db.activeSession.deleteMany({ where: { id: activeSessionId } });
        const userId = typeof message.token.userId === "string"
          ? message.token.userId
          : typeof message.token.sub === "string" ? message.token.sub : undefined;
        if (userId) {
          const now = new Date();
          await db.user.updateMany({
            where: { id: userId },
            data: { lastActivityAt: now, lastSignedOutAt: now },
          });
        }
      }
    },
  },
  callbacks: {
    async signIn({ user, account }) {
      if (!user.id || !user.email) return false;
      if (account?.provider === "github" && !isAllowedGithubEmail(user.email)) return false;
      return Boolean(await acceptPendingInvitation(user.id, user.email));
    },
    async jwt({ token, user, account }) {
      const rawUserId = user?.id ?? token.userId ?? token.sub;
      const userId = typeof rawUserId === "string" ? rawUserId : undefined;
      if (!userId) return token;
      const current = await db.user.findUnique({
        where: { id: userId },
        select: { status: true, sessionVersion: true, demoSessionUsedAt: true, lastActivityAt: true },
      });
      if (!current || current.status !== "ACTIVE") {
        if (typeof token.activeSessionId === "string") {
          await db.activeSession.deleteMany({ where: { id: token.activeSessionId } });
        }
        return token;
      }
      if (typeof token.sessionVersion === "number" && token.sessionVersion !== current.sessionVersion) {
        if (typeof token.activeSessionId === "string") {
          await db.activeSession.deleteMany({ where: { id: token.activeSessionId } });
        }
        delete token.organizationId;
        delete token.role;
        delete token.requiresTwoFactor;
        delete token.activeSessionId;
        return token;
      }
      const activeSessionId = typeof token.activeSessionId === "string"
        ? token.activeSessionId
        : typeof token.jti === "string" ? token.jti : crypto.randomUUID();
      const now = new Date();
      if (user && !current.demoSessionUsedAt && DEMO_SESSION_SECONDS > 0) {
        const claimed = await db.user.updateMany({
          where: { id: userId, demoSessionUsedAt: null },
          data: { demoSessionUsedAt: now },
        });
        if (claimed.count === 1) token.demoExpiresAt = now.getTime() + DEMO_SESSION_SECONDS * 1000;
      }
      if (typeof token.demoExpiresAt === "number" && token.demoExpiresAt <= now.getTime()) {
        await db.activeSession.deleteMany({ where: { id: activeSessionId } });
        token.demoSessionExpired = true;
        delete token.organizationId;
        delete token.role;
        delete token.requiresTwoFactor;
        return token;
      }

      const tokenEmail = user?.email ?? (typeof token.email === "string" ? token.email : undefined);
      const membership = tokenEmail
        ? await acceptPendingInvitation(userId, tokenEmail)
        : await db.membership.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } });
      if (!membership) {
        await db.activeSession.deleteMany({ where: { id: activeSessionId } });
        delete token.organizationId;
        delete token.role;
        return token;
      }
      let authProvider = account?.provider ?? (typeof token.authProvider === "string" ? token.authProvider : undefined);
      if (!authProvider) {
        const githubAccount = await db.account.findFirst({ where: { userId, provider: "github" }, select: { id: true } });
        authProvider = githubAccount ? "github" : "credentials";
      }
      const [twoFactorCredential, existingActiveSession] = await Promise.all([
        db.twoFactorCredential.findUnique({ where: { userId }, select: { enabledAt: true } }),
        db.activeSession.findUnique({ where: { id: activeSessionId }, select: { twoFactorVerifiedAt: true } }),
      ]);
      const requiresTwoFactor = Boolean(twoFactorCredential?.enabledAt && !existingActiveSession?.twoFactorVerifiedAt);

      token.userId = userId;
      token.organizationId = membership.organizationId;
      token.role = membership.role;
      token.sessionVersion = current.sessionVersion;
      token.activeSessionId = activeSessionId;
      token.authProvider = authProvider;
      token.requiresTwoFactor = requiresTwoFactor;
      token.demoSessionExpired = false;
      const normalExpiry = now.getTime() + SESSION_MAX_AGE_SECONDS * 1000;
      const sessionExpiry = typeof token.demoExpiresAt === "number" ? Math.min(token.demoExpiresAt, normalExpiry) : normalExpiry;
      await db.activeSession.upsert({
        where: { id: activeSessionId },
        update: { lastSeenAt: now, expiresAt: new Date(sessionExpiry) },
        create: {
          id: activeSessionId,
          userId,
          provider: authProvider,
          lastSeenAt: now,
          expiresAt: new Date(sessionExpiry),
        },
      });
      if (!current.lastActivityAt || now.getTime() - current.lastActivityAt.getTime() >= 60_000) {
        await db.user.updateMany({
          where: { id: userId, OR: [{ lastActivityAt: null }, { lastActivityAt: { lt: new Date(now.getTime() - 60_000) } }] },
          data: { lastActivityAt: now },
        });
      }
      return token;
    },
    session({ session, token }) {
      if (typeof token.activeSessionId === "string") session.activeSessionId = token.activeSessionId;
      if (typeof token.authProvider === "string") session.authProvider = token.authProvider;
      session.requiresTwoFactor = token.requiresTwoFactor === true;
      session.demoSessionExpired = token.demoSessionExpired === true;
      if (typeof token.demoExpiresAt === "number") session.demoExpiresAt = token.demoExpiresAt;
      if (session.user && typeof token.userId === "string" && typeof token.organizationId === "string" && (token.role === "ADMIN" || token.role === "STAFF")) {
        session.user.id = token.userId;
        session.user.organizationId = token.organizationId;
        session.user.role = token.role;
      }
      return session;
    },
  },
});
