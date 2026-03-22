"use client";

import Link from "next/link";

import {
  PLAN_CREATE_START_OPTIONS,
  planCreateStepPath,
} from "@/features/plan/constants/plan-create-start";

const cardClass =
  "group relative flex min-h-[148px] flex-col rounded-2xl border border-zinc-200/90 bg-white p-6 text-left shadow-sm transition-[border-color,box-shadow,background-color,transform] duration-200 ease-out " +
  "hover:-translate-y-0.5 hover:border-zinc-300 hover:bg-zinc-50/90 hover:shadow-md motion-reduce:hover:translate-y-0 " +
  "active:translate-y-0 active:scale-[0.99] active:shadow-sm motion-reduce:active:scale-100 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/90 focus-visible:ring-offset-2 focus-visible:ring-offset-app-canvas " +
  "dark:border-white/10 dark:bg-zinc-950 dark:hover:border-white/20 dark:hover:bg-white/[0.05] dark:hover:shadow-lg dark:hover:shadow-black/20 " +
  "dark:focus-visible:ring-zinc-500 dark:focus-visible:ring-offset-app-canvas-dark " +
  "sm:min-h-[160px] sm:p-7";

const titleClass =
  "text-[1.05rem] font-semibold leading-snug tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-lg";

const descClass =
  "mt-2.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400";

const footerClass =
  "mt-auto flex items-center gap-1.5 pt-6 text-sm font-medium text-zinc-500 transition-colors group-hover:text-zinc-800 dark:text-zinc-500 dark:group-hover:text-zinc-200";

function CardChevron() {
  return (
    <svg
      className="h-4 w-4 shrink-0 translate-x-0 text-zinc-400 transition-transform duration-200 ease-out group-hover:translate-x-0.5 dark:text-zinc-500 dark:group-hover:text-zinc-400"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

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
            className={`${cardClass} block touch-manipulation`}
            aria-label={`${opt.title}. ${opt.description}`}
          >
            <div className="flex min-h-0 flex-1 flex-col">
              <h2 className={titleClass}>{opt.title}</h2>
              <p className={descClass}>{opt.description}</p>
              <span className={footerClass}>
                이 방식으로 시작하기
                <CardChevron />
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
