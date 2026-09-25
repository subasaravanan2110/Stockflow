import "dotenv/config";
import { hash, verify } from "argon2";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { seedDemoInventory } from "../lib/inventory/demo-data";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });

async function main() {
  const email = (process.env.SEED_ADMIN_EMAIL ?? "admin@stockflow.local").toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";
  const existingAdmin = await prisma.user.findUnique({
    where: { email },
    select: { id: true, passwordHash: true },
  });
  const passwordChanged = !existingAdmin?.passwordHash || !(await verify(existingAdmin.passwordHash, password));
  const passwordHash = passwordChanged ? await hash(password) : existingAdmin.passwordHash;
  const user = existingAdmin
    ? await prisma.$transaction(async (tx) => {
        const updated = await tx.user.update({
          where: { id: existingAdmin.id },
          data: {
            name: "StockFlow Administrator",
            passwordHash,
            emailVerified: new Date(),
            status: "ACTIVE",
            ...(passwordChanged ? { sessionVersion: { increment: 1 } } : {}),
          },
        });
        if (passwordChanged) await tx.activeSession.deleteMany({ where: { userId: existingAdmin.id } });
        return updated;
      })
    : await prisma.user.create({
        data: { name: "StockFlow Administrator", email, passwordHash, emailVerified: new Date() },
      });
  let membership = await prisma.membership.findFirst({ where: { userId: user.id }, include: { organization: true } });
  if (!membership) {
    const organization = await prisma.organization.create({ data: { name: "Northstar Supplies", slug: `northstar-${user.id.slice(-6)}` } });
    membership = await prisma.membership.create({ data: { userId: user.id, organizationId: organization.id, role: "ADMIN" }, include: { organization: true } });
  } else if (membership.role !== "ADMIN") {
    membership = await prisma.membership.update({ where: { id: membership.id }, data: { role: "ADMIN" }, include: { organization: true } });
  }
  await prisma.membership.updateMany({ where: { userId: { not: user.id } }, data: { role: "STAFF" } });
  const workspaces = await prisma.organization.findMany({
    select: { id: true, memberships: { orderBy: { createdAt: "asc" }, take: 1, select: { userId: true } } },
  });
  let seededWorkspaces = 0;
  for (const workspace of workspaces) {
    const actorId = workspace.memberships[0]?.userId;
    if (!actorId) continue;
    await seedDemoInventory(prisma, workspace.id, actorId);
    seededWorkspaces += 1;
  }
  console.info(`Seeded StockFlow demo inventory in ${seededWorkspaces} workspace(s). Sign in with ${email}.`);
}

main().finally(() => prisma.$disconnect());
