-- CreateEnum
CREATE TYPE "PlanPathKind" AS ENUM ('CONTINUE', 'ALTERNATIVE', 'UNBOUND');

-- CreateTable
CREATE TABLE "PlanPath" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "kind" "PlanPathKind" NOT NULL,
    "title" TEXT NOT NULL,
    "overview" TEXT NOT NULL DEFAULT '',
    "appeal" TEXT NOT NULL DEFAULT '',
    "appealQuestionIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "requirements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "openQuestions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "marks" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "resourcesScore" INTEGER,
    "interestScore" INTEGER,
    "confidenceScore" INTEGER,
    "coherenceScore" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanPath_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanPathExperiment" (
    "id" TEXT NOT NULL,
    "pathId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "learning" TEXT NOT NULL,
    "nextUp" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanPathExperiment_pkey" PRIMARY KEY ("id")
);

-- Years without a path remain an existing single plan.
ALTER TABLE "PlanYear" ADD COLUMN "pathId" TEXT;

DROP INDEX "PlanYear_planId_yearIndex_key";

-- CreateIndex
CREATE UNIQUE INDEX "PlanPath_planId_kind_key" ON "PlanPath"("planId", "kind");
CREATE INDEX "PlanPath_planId_idx" ON "PlanPath"("planId");
CREATE UNIQUE INDEX "PlanPathExperiment_pathId_position_key" ON "PlanPathExperiment"("pathId", "position");
CREATE UNIQUE INDEX "PlanYear_planId_pathId_yearIndex_key" ON "PlanYear"("planId", "pathId", "yearIndex");
CREATE INDEX "PlanYear_pathId_idx" ON "PlanYear"("pathId");

-- AddForeignKey
ALTER TABLE "PlanPath" ADD CONSTRAINT "PlanPath_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlanPathExperiment" ADD CONSTRAINT "PlanPathExperiment_pathId_fkey" FOREIGN KEY ("pathId") REFERENCES "PlanPath"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlanYear" ADD CONSTRAINT "PlanYear_pathId_fkey" FOREIGN KEY ("pathId") REFERENCES "PlanPath"("id") ON DELETE CASCADE ON UPDATE CASCADE;
