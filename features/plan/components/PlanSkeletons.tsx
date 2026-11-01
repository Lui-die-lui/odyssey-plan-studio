import { Skeleton } from "@/components/common/Skeleton";

import { PLAN_ODYSSEY_YEAR_INDICES } from "../constants/plan.constants";
import { PlanEditorLayout } from "./editor";

type PlanContentVariant = "start" | "form" | "edit" | "interview";

function HeaderSkeleton({ variant }: { variant: PlanContentVariant }) {
  return (
    <div className="mb-6 flex flex-col gap-2 sm:mb-8">
      <div className="flex items-start justify-between gap-3">
        <Skeleton className="h-8 w-56 max-w-full rounded-md" />
        {variant === "edit" ? <Skeleton className="h-11 w-16 rounded-lg" /> : null}
      </div>
      <Skeleton className="h-6 w-80 max-w-full rounded-md" />
    </div>
  );
}

function TimelineSkeleton() {
  return (
    <div className="grid grid-cols-5 gap-x-1 py-3 sm:gap-x-3">
      {PLAN_ODYSSEY_YEAR_INDICES.map((year) => (
        <div key={year} className="flex flex-col gap-2">
          <Skeleton className="size-3 rounded-full" />
          <Skeleton className="h-4 w-10 rounded-md" />
        </div>
      ))}
    </div>
  );
}

function StartSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Skeleton className="h-40 rounded-xl" />
      <Skeleton className="h-40 rounded-xl" />
    </div>
  );
}

function FormSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-11 w-full rounded-lg" />
      <TimelineSkeleton />
      <Skeleton className="h-6 w-48 rounded-md" />
      <Skeleton className="h-24 w-full rounded-lg" />
      <Skeleton className="h-24 w-full rounded-lg" />
    </div>
  );
}

function InterviewSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="mb-3 h-7 w-3/4 rounded-md" />
      {[0, 1, 2, 3].map((key) => (
        <Skeleton key={key} className="h-12 w-full rounded-lg" />
      ))}
    </div>
  );
}

/** Mirrors `PlanSummary`: timeline, the selected year's panel, then the rating summary. */
export function PlanSummarySkeleton() {
  return (
    <div aria-hidden className="flex w-full flex-col gap-4">
      <TimelineSkeleton />
      <Skeleton className="h-80 w-full rounded-xl" />
    </div>
  );
}

/** Header and body of a plan page, for use inside an existing `PlanEditorLayout`. */
export function PlanContentSkeleton({ variant }: { variant: PlanContentVariant }) {
  return (
    <div aria-hidden className="flex min-h-0 flex-1 flex-col">
      <HeaderSkeleton variant={variant} />
      {variant === "start" ? <StartSkeleton /> : null}
      {variant === "form" || variant === "edit" ? <FormSkeleton /> : null}
      {variant === "interview" ? <InterviewSkeleton /> : null}
    </div>
  );
}

/** Full plan page, used before the page itself can render (auth, Suspense). */
export function PlanPageSkeleton({ variant }: { variant: PlanContentVariant }) {
  return (
    <PlanEditorLayout>
      <PlanContentSkeleton variant={variant} />
    </PlanEditorLayout>
  );
}

export function MyPlanActionsSkeleton() {
  return (
    <div aria-hidden className="flex items-center gap-2">
      <Skeleton className="h-11 w-24 rounded-lg" />
      <Skeleton className="h-11 w-24 rounded-lg" />
    </div>
  );
}

/** Full `/my-plan` page for the auth check, before the page header can render. */
export function MyPlanPageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 pt-8 sm:px-6 sm:pt-10">
      <div aria-hidden className="mb-8 flex flex-col gap-2">
        <Skeleton className="h-4 w-16 rounded-md" />
        <Skeleton className="h-9 w-80 max-w-full rounded-md" />
      </div>
      <PlanSummarySkeleton />
    </div>
  );
}
