/* eslint-disable react/no-unescaped-entities */
"use client";

import Link from "next/link";

import { useMyPlan } from "@/features/plan/hooks/useMyPlan";
import PlanSummary from "@/features/plan/components/PlanSummary";

const MyPlanPage = () => {
  const { plan, loading, error, refetch } = useMyPlan({ autoLoad: true });

  return (
    <div className="flex flex-col flex-1 bg-zinc-50 font-sans dark:bg-black">
      <main className="mx-auto w-full max-w-3xl px-4 py-10">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
              My Plan
            </h1>

            <div className="flex gap-3">
              {loading ? null : plan ? (
                <Link
                  href="/plan/edit"
                  className="inline-flex h-10 items-center justify-center rounded-md bg-black px-4 text-sm font-medium text-white transition-colors hover:bg-black/90 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
                >
                  Edit Plan
                </Link>
              ) : (
                <Link
                  href="/plan/new"
                  className="inline-flex h-10 items-center justify-center rounded-md bg-black px-4 text-sm font-medium text-white transition-colors hover:bg-black/90 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
                >
                  Create Plan
                </Link>
              )}
            </div>
          </div>

          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            View your saved yearly goals and summaries.
          </p>
        </div>

        <div className="mt-6">
          {loading ? (
            <div className="rounded-md border border-black/10 bg-white p-4 text-sm text-zinc-600 dark:border-white/10 dark:bg-black dark:text-zinc-300">
              Loading your plan...
            </div>
          ) : error ? (
            <div
              role="alert"
              className="rounded-md border border-red-400/30 bg-red-50 p-4 text-sm text-red-700 dark:bg-black/20 dark:text-red-300"
            >
              <p className="font-medium">Could not load your plan.</p>
              <p className="mt-1">{error}</p>
              <button
                type="button"
                onClick={refetch}
                className="mt-3 inline-flex h-9 items-center justify-center rounded-md border border-red-400/30 bg-white px-3 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 dark:border-red-400/20 dark:bg-black dark:text-red-200 dark:hover:bg-black"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              {plan ? (
                <div className="mb-4 rounded-md border border-black/10 bg-white p-3 text-sm text-zinc-700 dark:border-white/10 dark:bg-black dark:text-zinc-200">
                  Plan loaded successfully.
                </div>
              ) : null}

              <PlanSummary
                plan={plan}
                emptyStateMessage="No saved plan yet. Create one to get started."
              />
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default MyPlanPage;

