"use client";

import { useRouter } from "next/navigation";

import type { OdysseyAiPlanFormDraft } from "@/features/plan/interview/odyssey-ai-plan-draft.types";
import type { OdysseyDraftSummary } from "@/features/plan/interview/odyssey-draft-summary.types";
import { writeOdysseyAiPlanDraftToSession } from "@/features/plan/lib/odyssey-ai-draft-session";

import {
  interviewPrimaryBtnClass,
  interviewSecondaryBtnClass,
} from "./interview-chat.styles";

type OdysseyDraftSummaryViewProps = {
  data: OdysseyDraftSummary;
  planForm: OdysseyAiPlanFormDraft;
  manualHref: string;
  onRestartInterview: () => void;
};

/**
 * 구조화된 초안 JSON만 받아 렌더 (와이어프레임 레이아웃, 이모지는 JSON title·고정 라벨)
 */
export function OdysseyDraftSummaryView({
  data,
  planForm,
  manualHref,
  onRestartInterview,
}: OdysseyDraftSummaryViewProps) {
  const router = useRouter();

  const goToManualWithDraft = () => {
    writeOdysseyAiPlanDraftToSession(planForm);
    router.push(manualHref);
  };

  return (
    <div className="interview-composer-enter flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto rounded-2xl border border-zinc-200/80 bg-white/60 px-3 py-4 dark:border-white/10 dark:bg-zinc-950/50 sm:px-5 sm:py-6">
      <header className="shrink-0">
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-2xl">
          답변을 바탕으로 오디세이 초안을 정리했어요
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          {data.summary.trim()
            ? data.summary
            : "답변을 기반으로 오디세이 플랜에 들어갈 정보를 요약했어요. ‘내 플랜 다듬기’를 누르면 수정 화면으로 넘어갑니다."}
        </p>
      </header>

      <div className="min-h-0 rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-950 sm:p-7">
        <h3 className="text-base font-semibold leading-snug text-zinc-900 dark:text-zinc-50 sm:text-lg">
          {data.headline}
        </h3>

        <div className="mt-6 space-y-6">
          {data.sections.map((s, i) => (
            <section key={`${i}-${s.title}`}>
              <h4 className="text-sm font-semibold leading-snug text-zinc-900 dark:text-zinc-100">
                {s.title}
              </h4>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                {s.description}
              </p>
            </section>
          ))}
        </div>

        <section className="mt-8 border-t border-zinc-100 pt-6 dark:border-white/10">
          <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            ☠️ 피하고 싶은 방향
          </h4>
          <ul className="mt-3 list-inside list-disc space-y-1.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            {data.avoidNotes.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </section>

        <section className="mt-8 border-t border-zinc-100 pt-6 dark:border-white/10">
          <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            ✨ 키워드 (3~5개)
          </h4>
          <div className="mt-3 flex flex-wrap gap-2">
            {data.keywords.map((k, i) => (
              <span
                key={`${k}-${i}`}
                className="inline-flex rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
              >
                {k}
              </span>
            ))}
          </div>
        </section>
      </div>

      <div className="flex shrink-0 flex-col gap-2 pb-1 sm:flex-row sm:flex-wrap sm:justify-end">
        <button
          type="button"
          onClick={onRestartInterview}
          className={interviewSecondaryBtnClass}
        >
          처음부터 다시
        </button>
        <button
          type="button"
          onClick={goToManualWithDraft}
          className={interviewPrimaryBtnClass}
        >
          내 플랜 다듬기
        </button>
      </div>
    </div>
  );
}
