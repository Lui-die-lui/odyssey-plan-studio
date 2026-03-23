-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- AlterTable
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "role" "UserRole" NOT NULL DEFAULT 'USER',
  ADD COLUMN IF NOT EXISTS "aiBlocked" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE IF NOT EXISTS "AiRequestLog" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "ipAddress" TEXT,
  "requestType" TEXT NOT NULL,
  "success" BOOLEAN NOT NULL,
  "blockedReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AiRequestLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "SystemConfig" (
  "key" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SystemConfig_pkey" PRIMARY KEY ("key")
);

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "AiRequestLog"
  ADD CONSTRAINT "AiRequestLog_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AiRequestLog_createdAt_idx" ON "AiRequestLog"("createdAt");
CREATE INDEX IF NOT EXISTS "AiRequestLog_requestType_createdAt_idx" ON "AiRequestLog"("requestType", "createdAt");
CREATE INDEX IF NOT EXISTS "AiRequestLog_userId_createdAt_idx" ON "AiRequestLog"("userId", "createdAt");
