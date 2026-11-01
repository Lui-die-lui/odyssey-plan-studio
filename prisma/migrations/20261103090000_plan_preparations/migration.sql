-- CreateTable
CREATE TABLE "PlanPreparation" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "pathId" TEXT,
    "position" INTEGER NOT NULL,
    "catalogId" TEXT,
    "title" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "basis" TEXT NOT NULL,
    "evidenceQuestionIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "checkpoint" TEXT NOT NULL,
    "conditions" TEXT NOT NULL DEFAULT '',
    "alternative" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanPreparation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlanPreparation_planId_idx" ON "PlanPreparation"("planId");
CREATE INDEX "PlanPreparation_pathId_idx" ON "PlanPreparation"("pathId");

-- AddForeignKey
ALTER TABLE "PlanPreparation" ADD CONSTRAINT "PlanPreparation_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlanPreparation" ADD CONSTRAINT "PlanPreparation_pathId_fkey" FOREIGN KEY ("pathId") REFERENCES "PlanPath"("id") ON DELETE CASCADE ON UPDATE CASCADE;
