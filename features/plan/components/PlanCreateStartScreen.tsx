"use client";

import Link from "next/link";

import {
  PLAN_CREATE_START_OPTIONS,
  planCreateStepPath,
} from "@/features/plan/constants/plan-create-start";

const cardClass =
  "group flex min-h-[120px] flex-col justify-between rounded-2xl border border-zinc-200/80 bg-white p-5 text-left shadow-sm transition-colors hover:border-zinc-300 hover:bg-zinc-50/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:border-white/10 dark:bg-zinc-950 dark:hover:border-white/20 dark:hover:bg-zinc-900/40 dark:focus-visible:outline-zinc-100 sm:min-h-[140px] sm:p-6";

const titleClass =
  "text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-lg";

const descClass =
  "mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400";

const ctaClass =
  "mt-4 inline-flex text-sm font-medium text-zinc-900 underline-offset-4 group-hover:underline dark:text-zinc-100";

/**
 * Chooser for how to start a new plan (`/plan/new`). Options come from
 * `PLAN_CREATE_START_OPTIONS` so new modes stay a data change.
 */
export function PlanCreateStartScreen({
  searchQueryString,
}: {
  searchQueryString: string;
}) {
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
      {PLAN_CREATE_START_OPTIONS.map((opt) => (
        <li key={opt.id}>
          <Link
            href={planCreateStepPath(opt.pathSegment, searchQueryString)}
            className={cardClass}
          >
            <div>
              <h2 className={titleClass}>{opt.title}</h2>
              <p className={descClass}>{opt.description}</p>
            </div>
            <span className={ctaClass}>계속하기</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
