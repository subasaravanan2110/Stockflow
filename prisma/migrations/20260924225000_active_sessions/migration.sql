CREATE TABLE "ActiveSession" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ActiveSession_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ActiveSession_userId_idx" ON "ActiveSession"("userId");
CREATE INDEX "ActiveSession_expiresAt_idx" ON "ActiveSession"("expiresAt");
CREATE INDEX "ActiveSession_lastSeenAt_idx" ON "ActiveSession"("lastSeenAt");

ALTER TABLE "ActiveSession"
ADD CONSTRAINT "ActiveSession_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
