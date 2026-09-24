-- AlterTable
ALTER TABLE "Organization" ADD COLUMN "planStatus" TEXT NOT NULL DEFAULT 'none';
ALTER TABLE "Organization" ADD COLUMN "planStripeSubId" TEXT;
ALTER TABLE "Organization" ADD COLUMN "planAmountCents" INTEGER;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "emailVerified" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "verifyTokenHash" TEXT;
ALTER TABLE "User" ADD COLUMN "verifyTokenExpires" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "MonitoringSubscription" ADD COLUMN "amountCents" INTEGER NOT NULL DEFAULT 4900;
ALTER TABLE "MonitoringSubscription" ADD COLUMN "lastScannedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_organizationId_createdAt_idx" ON "Notification"("organizationId", "createdAt");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
