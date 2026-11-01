-- Self-ratings become optional: null means not rated yet, which differs from 1.
ALTER TABLE "PlanYear"
  ALTER COLUMN "resourcesScore" DROP NOT NULL,
  ALTER COLUMN "resourcesScore" DROP DEFAULT,
  ALTER COLUMN "interestScore" DROP NOT NULL,
  ALTER COLUMN "interestScore" DROP DEFAULT,
  ALTER COLUMN "confidenceScore" DROP NOT NULL,
  ALTER COLUMN "confidenceScore" DROP DEFAULT,
  ALTER COLUMN "coherenceScore" DROP NOT NULL,
  ALTER COLUMN "coherenceScore" DROP DEFAULT;

ALTER TABLE "PlanYear"
  ADD COLUMN "unverifiedScoreKeys" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Existing scores may come from a person or from AI, and nothing records which.
-- Keep every value and flag it instead of guessing.
UPDATE "PlanYear"
SET "unverifiedScoreKeys" = ARRAY['resources', 'interest', 'confidence', 'coherence'];

-- CreateTable
CREATE TABLE "PlanYearAiGuidance" (
    "id" TEXT NOT NULL,
    "planYearId" TEXT NOT NULL,
    "sourceGoalTexts" TEXT[],
    "checkpoint" TEXT NOT NULL,
    "rationale" TEXT NOT NULL,
    "evidenceQuestionIds" TEXT[],
    "pivotCondition" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanYearAiGuidance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlanYearAiGuidance_planYearId_key" ON "PlanYearAiGuidance"("planYearId");

-- AddForeignKey
ALTER TABLE "PlanYearAiGuidance" ADD CONSTRAINT "PlanYearAiGuidance_planYearId_fkey" FOREIGN KEY ("planYearId") REFERENCES "PlanYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;
