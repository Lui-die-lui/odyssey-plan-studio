"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  PLAN_CREATE_START_OPTIONS,
  planCreateStepPath,
} from "@/features/plan/constants/plan-create-start";

const cardClass =
  "group relative flex min-h-[138px] flex-col rounded-2xl border border-zinc-200/90 bg-white p-6 text-left shadow-sm transition-[border-color,box-shadow,background-color,transform] duration-200 ease-out " +
  "hover:-translate-y-0.5 hover:border-zinc-300 hover:bg-zinc-50/90 hover:shadow-md motion-reduce:hover:translate-y-0 " +
  "active:translate-y-0 active:scale-[0.99] active:shadow-sm motion-reduce:active:scale-100 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/90 focus-visible:ring-offset-2 focus-visible:ring-offset-app-canvas " +
  "dark:border-white/10 dark:bg-zinc-950 dark:hover:border-white/20 dark:hover:bg-white/[0.05] dark:hover:shadow-lg dark:hover:shadow-black/20 " +
  "dark:focus-visible:ring-zinc-500 dark:focus-visible:ring-offset-app-canvas-dark " +
  "sm:min-h-[148px] sm:p-7";

const titleClass =
  "text-[1.05rem] font-semibold leading-snug tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-lg";

const descClass =
  "mt-2.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400";

const quotaInfoClass =
  "mt-2 text-xs font-medium text-zinc-500 dark:text-zinc-400";

const quotaExhaustedClass =
  "mt-2 text-xs font-medium text-red-600 dark:text-red-400";

const footerClass =
  "mt-auto flex items-center justify-end pt-2 text-zinc-500 transition-colors group-hover:text-zinc-800 dark:text-zinc-500 dark:group-hover:text-zinc-200";

function CardChevron() {
  return (
    <svg
      className="h-8 w-8 shrink-0 rounded-full border border-zinc-200/90 bg-zinc-50 p-2 text-zinc-500 transition-all duration-200 ease-out group-hover:translate-x-0.5 group-hover:border-zinc-300 group-hover:bg-zinc-100 group-hover:text-zinc-700 dark:border-white/15 dark:bg-white/[0.03] dark:text-zinc-400 dark:group-hover:border-white/25 dark:group-hover:bg-white/[0.07] dark:group-hover:text-zinc-200"
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
  const [guidedRemaining, setGuidedRemaining] = useState<number | null>(null);
  const [guidedQuotaLoading, setGuidedQuotaLoading] = useState(true);
  const [guidedBlockedReason, setGuidedBlockedReason] = useState<
    "GLOBAL_AI_OFF" | "USER_AI_BLOCKED" | "QUOTA_EXHAUSTED" | null
  >(null);

  useEffect(() => {
    let cancelled = false;

    const loadQuota = async () => {
      try {
        const res = await fetch("/api/odyssey/quota", { method: "GET", cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as {
          remaining?: unknown;
          blockedReason?: unknown;
        };
        if (cancelled) return;
        const remaining = typeof data.remaining === "number" ? data.remaining : null;
        setGuidedRemaining(remaining);
        const blockedReason =
          data.blockedReason === "GLOBAL_AI_OFF" ||
          data.blockedReason === "USER_AI_BLOCKED" ||
          data.blockedReason === "QUOTA_EXHAUSTED"
            ? data.blockedReason
            : null;
        setGuidedBlockedReason(blockedReason);
      } catch {
        // Keep guided option blocked until quota can be determined.
      } finally {
        if (!cancelled) setGuidedQuotaLoading(false);
      }
    };

    void loadQuota();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ul className="grid grid-cols-1 gap-4 sm:auto-rows-fr sm:grid-cols-2 sm:gap-5">
      {PLAN_CREATE_START_OPTIONS.map((opt) => {
        const guidedDisabled =
          opt.id === "guided" && (guidedQuotaLoading || guidedBlockedReason !== null);
        const guidedRemainingLabel =
          opt.id === "guided" &&
          typeof guidedRemaining === "number" &&
          guidedRemaining > 0 &&
          guidedBlockedReason == null
            ? `이번 달 AI 이용 가능 횟수 ${guidedRemaining}회 남음`
            : null;
        const guidedDisabledLabel =
          opt.id !== "guided"
            ? null
            : guidedQuotaLoading
              ? "AI 사용 가능 상태를 확인하는 중입니다."
            : guidedBlockedReason === "GLOBAL_AI_OFF"
              ? "관리자 설정으로 현재 AI 초안 생성이 일시 중지되었습니다."
              : guidedBlockedReason === "USER_AI_BLOCKED"
                ? "이 계정은 현재 AI 기능 사용이 제한되어 있습니다."
                : guidedBlockedReason === "QUOTA_EXHAUSTED"
                  ? "이번 달 AI 이용 횟수를 모두 사용했어요"
                  : null;
        const disabledCardClass = guidedDisabled
          ? " cursor-not-allowed border-zinc-200/80 bg-zinc-100/75 text-zinc-400 shadow-none hover:translate-y-0 hover:border-zinc-200/80 hover:bg-zinc-100/75 hover:shadow-none dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-500 dark:hover:border-white/10 dark:hover:bg-white/[0.03]"
          : "";

        return (
          <li key={opt.id} className="h-full">
            {guidedDisabled ? (
              <div
                className={`${cardClass}${disabledCardClass} block h-full touch-manipulation`}
                aria-label={`${opt.title}. ${opt.description}. ${guidedDisabledLabel ?? "현재 사용할 수 없습니다."}`}
                aria-disabled="true"
              >
                <div className="flex min-h-0 flex-1 flex-col">
                  <h2 className={titleClass}>{opt.title}</h2>
                  <p className={descClass}>{opt.description}</p>
                  {opt.id === "guided" && guidedQuotaLoading ? (
                    <div aria-hidden className="mt-2 flex flex-col gap-2">
                      <span className="h-3.5 w-48 max-w-full animate-pulse rounded-md bg-zinc-200/80 dark:bg-zinc-700/60" />
                      <span className="h-3.5 w-40 max-w-full animate-pulse rounded-md bg-zinc-200/80 dark:bg-zinc-700/60" />
                    </div>
                  ) : guidedDisabledLabel ? (
                    <p className={quotaExhaustedClass}>{guidedDisabledLabel}</p>
                  ) : guidedRemainingLabel ? (
                    <p className={quotaInfoClass}>{guidedRemainingLabel}</p>
                  ) : null}
                </div>
              </div>
            ) : (
              <Link
                href={planCreateStepPath(opt.pathSegment, searchQueryString)}
                className={`${cardClass} block h-full touch-manipulation`}
                aria-label={`${opt.title}. ${opt.description}`}
              >
                <div className="flex min-h-0 flex-1 flex-col">
                  <h2 className={titleClass}>{opt.title}</h2>
                  <p className={descClass}>{opt.description}</p>
                  {opt.id === "guided" && guidedQuotaLoading ? (
                    <div aria-hidden className="mt-2 flex flex-col gap-2">
                      <span className="h-3.5 w-48 max-w-full animate-pulse rounded-md bg-zinc-200/80 dark:bg-zinc-700/60" />
                      <span className="h-3.5 w-40 max-w-full animate-pulse rounded-md bg-zinc-200/80 dark:bg-zinc-700/60" />
                    </div>
                  ) : guidedDisabledLabel ? (
                    <p className={quotaExhaustedClass}>{guidedDisabledLabel}</p>
                  ) : guidedRemainingLabel ? (
                    <p className={quotaInfoClass}>{guidedRemainingLabel}</p>
                  ) : null}
                  <span className={footerClass}>
                    <CardChevron />
                  </span>
                </div>
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}
