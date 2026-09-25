ALTER TABLE "User" ADD COLUMN "demoSessionUsedAt" TIMESTAMP(3);
ALTER TABLE "ActiveSession" ADD COLUMN "twoFactorVerifiedAt" TIMESTAMP(3);

CREATE TABLE "TwoFactorCredential" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "secretEncrypted" TEXT NOT NULL,
  "enabledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "TwoFactorCredential_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TwoFactorCredential_userId_key" ON "TwoFactorCredential"("userId");

ALTER TABLE "TwoFactorCredential"
ADD CONSTRAINT "TwoFactorCredential_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
