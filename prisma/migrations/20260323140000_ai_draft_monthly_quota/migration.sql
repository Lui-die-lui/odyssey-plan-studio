-- CreateTable
CREATE TABLE IF NOT EXISTS "AiDraftUsage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "monthKey" TEXT NOT NULL,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiDraftUsage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AiDraftUsage"
ADD CONSTRAINT "AiDraftUsage_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex / Unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS "AiDraftUsage_userId_monthKey_key" ON "AiDraftUsage"("userId", "monthKey");
CREATE INDEX IF NOT EXISTS "AiDraftUsage_userId_monthKey_idx" ON "AiDraftUsage"("userId", "monthKey");

