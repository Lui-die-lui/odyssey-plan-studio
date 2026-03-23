-- CreateEnum
DO $$
BEGIN
  CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'PENDING_DELETION');
EXCEPTION
  WHEN duplicate_object THEN
    -- already exists
    NULL;
END $$;

-- AlterTable
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN IF NOT EXISTS "withdrawRequestedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "hardDeleteAt" TIMESTAMP(3);

