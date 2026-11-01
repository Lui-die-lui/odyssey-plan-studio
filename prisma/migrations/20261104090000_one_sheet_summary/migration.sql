-- Short display text for the one-page PDF; the full text stays as it is.
ALTER TABLE "PlanPath"
  ADD COLUMN "tagline" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "credentialNote" TEXT NOT NULL DEFAULT '';

ALTER TABLE "PlanYearAiGuidance"
  ADD COLUMN "briefGoal" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "briefAction" TEXT NOT NULL DEFAULT '';

ALTER TABLE "PlanPreparation"
  ADD COLUMN "brief" TEXT NOT NULL DEFAULT '';
