import "server-only";
import { db } from "@/lib/db";

type AuditInput = {
  organizationId: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, string | number | boolean | null>;
};

export async function recordAudit(input: AuditInput) {
  await db.auditLog.create({ data: input });
}
