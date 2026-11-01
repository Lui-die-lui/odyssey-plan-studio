"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Skeleton } from "@/components/common/Skeleton";
import { clearOdysseyAiPlanDraftFromSession } from "@/features/plan/lib/odyssey-ai-draft-session";
import {
  PLAN_CREATE_START_OPTIONS,
  planCreateStepPath,
} from "@/features/plan/constants/plan-create-start";

const cardClass =
  "group flex h-full min-h-40 flex-col rounded-xl border border-line bg-surface p-5 text-left transition-colors duration-150 sm:p-6";

const interactiveCardClass = "hover:border-line-strong hover:bg-raised";

const titleClass = "text-base font-semibold tracking-tight text-ink";
const descClass = "mt-1.5 text-sm leading-relaxed text-ink-2";
const quotaInfoClass = "mt-2 text-sm text-ink-3";
const quotaBlockedClass = "mt-2 text-sm font-medium text-danger";
const footerClass =
  "mt-auto pt-4 text-sm font-medium text-ink underline-offset-4 group-hover:underline";

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
    <ul className="grid grid-cols-1 gap-3 sm:auto-rows-fr md:grid-cols-3">
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

        return (
          <li key={opt.id} className="h-full">
            {guidedDisabled ? (
              <div
                className={cardClass}
                aria-disabled="true"
              >
                <div className="flex min-h-0 flex-1 flex-col">
                  <h2 className={titleClass}>{opt.title}</h2>
                  <p className={descClass}>{opt.description}</p>
                  {guidedQuotaLoading ? (
                    <div className="mt-2 flex flex-1 flex-col">
                      <p className={quotaInfoClass}>{guidedDisabledLabel}</p>
                      <span aria-hidden className="mt-auto pt-4">
                        <Skeleton className="h-5 w-16 rounded-md" />
                      </span>
                    </div>
                  ) : guidedDisabledLabel ? (
                    <p className={quotaBlockedClass}>{guidedDisabledLabel}</p>
                  ) : null}
                </div>
              </div>
            ) : (
              <Link
                href={planCreateStepPath(opt.pathSegment, searchQueryString)}
                onClick={() => {
                  // Starting over by hand should not reopen an older AI draft.
                  if (opt.id !== "guided") clearOdysseyAiPlanDraftFromSession();
                }}
                className={`${cardClass} ${interactiveCardClass}`}
              >
                <div className="flex min-h-0 flex-1 flex-col">
                  <h2 className={titleClass}>{opt.title}</h2>
                  <p className={descClass}>{opt.description}</p>
                  {guidedRemainingLabel ? (
                    <p className={quotaInfoClass}>{guidedRemainingLabel}</p>
                  ) : null}
                  <span className={footerClass}>시작하기</span>
                </div>
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}
