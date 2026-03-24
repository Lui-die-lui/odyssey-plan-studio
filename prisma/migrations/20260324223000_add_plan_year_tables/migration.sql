-- Create new normalized plan-year tables used by current app code.
CREATE TABLE IF NOT EXISTS "PlanYear" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "yearIndex" INTEGER NOT NULL,
    "note" TEXT,
    "resourcesScore" INTEGER NOT NULL DEFAULT 1,
    "interestScore" INTEGER NOT NULL DEFAULT 1,
    "confidenceScore" INTEGER NOT NULL DEFAULT 1,
    "coherenceScore" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PlanYear_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PlanYearGoal" (
    "id" TEXT NOT NULL,
    "planYearId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PlanYearGoal_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PlanYearKeyword" (
    "id" TEXT NOT NULL,
    "planYearId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PlanYearKeyword_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PlanYear_planId_yearIndex_key" ON "PlanYear"("planId", "yearIndex");
CREATE INDEX IF NOT EXISTS "PlanYear_planId_idx" ON "PlanYear"("planId");
CREATE UNIQUE INDEX IF NOT EXISTS "PlanYearGoal_planYearId_position_key" ON "PlanYearGoal"("planYearId", "position");
CREATE INDEX IF NOT EXISTS "PlanYearGoal_planYearId_idx" ON "PlanYearGoal"("planYearId");
CREATE UNIQUE INDEX IF NOT EXISTS "PlanYearKeyword_planYearId_position_key" ON "PlanYearKeyword"("planYearId", "position");
CREATE INDEX IF NOT EXISTS "PlanYearKeyword_planYearId_idx" ON "PlanYearKeyword"("planYearId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'PlanYear_planId_fkey'
  ) THEN
    ALTER TABLE "PlanYear"
      ADD CONSTRAINT "PlanYear_planId_fkey"
      FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'PlanYearGoal_planYearId_fkey'
  ) THEN
    ALTER TABLE "PlanYearGoal"
      ADD CONSTRAINT "PlanYearGoal_planYearId_fkey"
      FOREIGN KEY ("planYearId") REFERENCES "PlanYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'PlanYearKeyword_planYearId_fkey'
  ) THEN
    ALTER TABLE "PlanYearKeyword"
      ADD CONSTRAINT "PlanYearKeyword_planYearId_fkey"
      FOREIGN KEY ("planYearId") REFERENCES "PlanYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Backfill from legacy YearPlanItem table if present.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'YearPlanItem'
  ) THEN
    INSERT INTO "PlanYear" (
      "id",
      "planId",
      "yearIndex",
      "note",
      "createdAt",
      "updatedAt"
    )
    SELECT
      ('py_' || y."id"),
      y."planId",
      y."year" AS "yearIndex",
      NULLIF(y."summary", '') AS "note",
      y."createdAt",
      y."updatedAt"
    FROM "YearPlanItem" y
    ON CONFLICT ("planId", "yearIndex") DO NOTHING;

    INSERT INTO "PlanYearGoal" (
      "id",
      "planYearId",
      "position",
      "text",
      "createdAt",
      "updatedAt"
    )
    SELECT
      ('pyg_' || y."id"),
      py."id",
      0,
      y."goal",
      y."createdAt",
      y."updatedAt"
    FROM "YearPlanItem" y
    JOIN "PlanYear" py
      ON py."planId" = y."planId"
     AND py."yearIndex" = y."year"
    ON CONFLICT ("planYearId", "position") DO NOTHING;
  END IF;
END $$;
