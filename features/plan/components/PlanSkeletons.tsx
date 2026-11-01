import { Skeleton } from "@/components/common/Skeleton";
import { SubpageGlassVeil } from "@/components/layout/SubpageGlassVeil";
import { LandingConfetti } from "@/features/landing/components/LandingConfetti";

import { PLAN_ODYSSEY_YEAR_INDICES } from "../constants/plan.constants";
import { PlanEditorLayout } from "./editor";

type PlanContentVariant = "start" | "form" | "edit" | "interview";

const formCardClass =
  "rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-950 sm:p-6";

const summaryPanelClass =
  "overflow-hidden rounded-2xl border border-black/10 bg-white shadow-md dark:border-white/10 dark:bg-zinc-950 " +
  "lg:rounded-lg lg:bg-app-canvas/80 lg:shadow-none dark:lg:bg-zinc-950/50";

const HEADER_WIDTHS: Record<PlanContentVariant, { title: string; description: string }> = {
  start: { title: "w-64", description: "w-72" },
  form: { title: "w-52", description: "w-64" },
  edit: { title: "w-28", description: "w-72" },
  interview: { title: "w-48", description: "w-96" },
};

function PlanHeaderSkeleton({ variant }: { variant: PlanContentVariant }) {
  const { title, description } = HEADER_WIDTHS[variant];
  return (
    <div
      className={
        variant === "interview"
          ? "mb-3 border-b border-zinc-200/80 pb-4 dark:border-white/10"
          : "mb-8 border-b border-zinc-200/80 pb-6 dark:border-white/10"
      }
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3 sm:gap-4">
          <Skeleton className={`h-8 ${title} max-w-full rounded-md`} />
          {variant === "edit" ? (
            <Skeleton className="mt-0.5 h-8 w-16 shrink-0 rounded-full" />
          ) : null}
        </div>
        <Skeleton className={`h-5 ${description} max-w-full rounded-md`} />
      </div>
    </div>
  );
}

function PlanStartCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:auto-rows-fr sm:grid-cols-2 sm:gap-5">
      {[0, 1].map((key) => (
        <div
          key={key}
          className="flex min-h-[138px] flex-col rounded-2xl border border-zinc-200/90 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-950 sm:min-h-[148px] sm:p-7"
        >
          <Skeleton className="h-6 w-32 rounded-md" />
          <Skeleton className="mt-2.5 h-5 w-full rounded-md" />
          <Skeleton className="mt-1 h-5 w-4/5 rounded-md" />
          <div className="mt-auto flex justify-end pt-2">
            <Skeleton className="size-8 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function PlanFormSkeleton() {
  return (
    <div className="flex w-full flex-col gap-5 sm:gap-6">
      <div className={formCardClass}>
        <Skeleton className="h-4 w-24 rounded-md" />
        <Skeleton className="mt-2 h-10 w-full rounded-xl" />
      </div>

      <div className={formCardClass}>
        <Skeleton className="h-8 w-full rounded-full sm:h-9" />
      </div>

      <div className={formCardClass}>
        <Skeleton className="h-6 w-64 max-w-full rounded-md" />
        <Skeleton className="mb-4 mt-1 h-5 w-80 max-w-full rounded-md" />
        <Skeleton className="h-[4.75rem] w-full rounded-xl" />
      </div>

      <div className={formCardClass}>
        <Skeleton className="h-6 w-48 rounded-md" />
        <Skeleton className="mb-5 mt-1 h-5 w-72 max-w-full rounded-md" />
        <div className="flex flex-col gap-8 lg:grid lg:grid-cols-2 lg:items-start lg:gap-10">
          <div className="flex flex-col gap-4">
            {[0, 1, 2, 3].map((key) => (
              <div key={key} className="flex flex-col gap-2">
                <Skeleton className="h-8 w-40 rounded-md" />
                <Skeleton className="h-[10px] w-full rounded-full" />
                <Skeleton className="h-3.5 w-full rounded-md" />
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-3">
            <Skeleton className="h-9 w-28 rounded-md" />
            <Skeleton className="h-12 w-full rounded-full" />
            <Skeleton className="mt-6 h-5 w-24 rounded-md" />
            <Skeleton className="h-[4.5rem] w-full rounded-xl" />
          </div>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-zinc-200/80 pt-6 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-11 w-full rounded-full sm:w-24" />
        <Skeleton className="h-11 w-full rounded-full sm:w-36" />
      </div>
    </div>
  );
}

function InterviewSkeleton() {
  return (
    <div className="flex w-full flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/50 dark:border-white/10 dark:bg-zinc-950/40">
      <div className="flex h-[clamp(15rem,40dvh,23rem)] flex-col p-4 sm:h-[clamp(16.5rem,42dvh,25rem)]">
        <Skeleton className="h-16 w-[min(100%,28rem)] rounded-2xl rounded-bl-md" />
      </div>
      <div className="border-t border-zinc-200/45 bg-zinc-50/35 px-3 py-3 dark:border-white/[0.07] dark:bg-zinc-950/35 sm:px-4">
        <div className="mx-auto flex w-full max-w-xl flex-col gap-2">
          <Skeleton className="h-9 w-full rounded-xl" />
          <Skeleton className="h-9 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

function YearCardSkeleton({ className }: { className: string }) {
  return (
    <div className={`flex min-h-[220px] flex-col bg-white dark:bg-zinc-950 ${className}`}>
      <Skeleton className="h-7 w-10 rounded-md lg:h-5" />
      <div className="mt-3 flex flex-col gap-2 lg:mt-2">
        <Skeleton className="h-4 w-full rounded-md" />
        <Skeleton className="h-4 w-5/6 rounded-md" />
        <Skeleton className="h-4 w-2/3 rounded-md" />
      </div>
      <div className="mt-auto flex items-center justify-between border-t border-black/5 pt-4 dark:border-white/10 lg:pt-3">
        <Skeleton className="h-5 w-14 rounded-md lg:h-4" />
        <Skeleton className="h-5 w-12 rounded-md lg:h-4" />
      </div>
    </div>
  );
}

function YearBarsSkeleton() {
  return (
    <div className="flex flex-col gap-2.5">
      {PLAN_ODYSSEY_YEAR_INDICES.map((idx) => (
        <Skeleton key={idx} className="h-4 w-full rounded-full" />
      ))}
    </div>
  );
}

/** Mirrors `PlanSummary`: carousel below `lg`, five-column grid above it. */
export function PlanSummarySkeleton() {
  return (
    <div
      aria-hidden
      className={
        "flex w-full flex-col gap-6 lg:gap-8 " +
        "lg:rounded-md lg:border lg:border-black/10 lg:bg-white lg:p-6 lg:shadow-sm " +
        "dark:lg:border-white/10 dark:lg:bg-black"
      }
    >
      <div className="border-b border-black/10 pb-4 dark:border-white/10 lg:border-0 lg:pb-0">
        <Skeleton className="h-7 w-52 max-w-full rounded-md" />
      </div>

      <div>
        <div className="lg:hidden">
          <div className="flex items-center gap-2 sm:gap-3">
            <Skeleton className="size-11 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 overflow-hidden rounded-2xl border border-black/10 shadow-md dark:border-white/10">
              <YearCardSkeleton className="p-4" />
            </div>
            <Skeleton className="size-11 shrink-0 rounded-full" />
          </div>
          <Skeleton className="mx-auto mt-2 h-4 w-10 rounded-md" />
        </div>

        <div className="hidden gap-3 lg:grid lg:grid-cols-2 xl:grid-cols-5">
          {PLAN_ODYSSEY_YEAR_INDICES.map((idx) => (
            <div
              key={idx}
              className="overflow-hidden rounded-lg border border-black/10 shadow-sm dark:border-white/10"
            >
              <YearCardSkeleton className="h-full p-3" />
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-2 lg:gap-6">
        <div className={`${summaryPanelClass} flex flex-col gap-4 p-4 lg:p-5`}>
          <Skeleton className="h-6 w-44 rounded-md" />
          <div className="flex flex-col gap-5 lg:flex-row lg:gap-8">
            <div className="flex flex-col gap-2 lg:min-w-[220px] lg:flex-1">
              <Skeleton className="h-5 w-52 max-w-full rounded-md" />
              <Skeleton className="h-5 w-52 max-w-full rounded-md" />
              <Skeleton className="h-5 w-44 max-w-full rounded-md" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-2.5 lg:max-w-md">
              <Skeleton className="h-4 w-20 rounded-md" />
              <YearBarsSkeleton />
            </div>
          </div>
        </div>

        <div className={`${summaryPanelClass} p-4 sm:p-5`}>
          <Skeleton className="h-6 w-24 rounded-md lg:h-5" />
          <div className="mt-4 flex flex-col divide-y divide-black/5 dark:divide-white/10">
            {[0, 1, 2, 3].map((key) => (
              <div key={key} className="flex items-start justify-between gap-4 py-3 first:pt-0">
                <div className="flex min-w-0 flex-col gap-1">
                  <Skeleton className="h-5 w-24 rounded-md" />
                  <Skeleton className="h-4 w-36 max-w-full rounded-md" />
                </div>
                <Skeleton className="h-6 w-12 shrink-0 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Header and body of a plan page, for use inside an existing `PlanEditorLayout`. */
export function PlanContentSkeleton({ variant }: { variant: PlanContentVariant }) {
  return (
    <div aria-hidden className="flex min-h-0 flex-1 flex-col">
      <PlanHeaderSkeleton variant={variant} />
      {variant === "start" ? <PlanStartCardsSkeleton /> : null}
      {variant === "form" || variant === "edit" ? <PlanFormSkeleton /> : null}
      {variant === "interview" ? <InterviewSkeleton /> : null}
    </div>
  );
}

/** Full plan page shell, used before the page itself can render (auth, Suspense). */
export function PlanPageSkeleton({ variant }: { variant: PlanContentVariant }) {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-app-canvas dark:bg-app-canvas-dark">
      <LandingConfetti />
      <SubpageGlassVeil />
      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <PlanEditorLayout>
          <PlanContentSkeleton variant={variant} />
        </PlanEditorLayout>
      </div>
    </div>
  );
}

/** Full `/my-plan` shell for the auth check, before the page header can render. */
export function MyPlanPageSkeleton() {
  return (
    <div className="relative flex flex-1 flex-col overflow-hidden bg-app-canvas dark:bg-app-canvas-dark">
      <LandingConfetti />
      <SubpageGlassVeil />
      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pt-10 sm:px-6">
        <div aria-hidden className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Skeleton className="h-8 w-28 rounded-md" />
            <MyPlanActionsSkeleton />
          </div>
          <Skeleton className="h-5 w-72 max-w-full rounded-md" />
        </div>
        <div className="mt-6">
          <PlanSummarySkeleton />
        </div>
      </div>
    </div>
  );
}

export function MyPlanActionsSkeleton() {
  return (
    <div aria-hidden className="flex flex-wrap items-center gap-3">
      <Skeleton className="h-10 w-24 rounded-full" />
      <Skeleton className="h-10 w-24 rounded-full" />
    </div>
  );
}
