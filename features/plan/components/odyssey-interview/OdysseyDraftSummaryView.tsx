"use client";

import { useRouter } from "next/navigation";

import type { OdysseyAiPlanFormDraft } from "@/features/plan/interview/odyssey-ai-plan-draft.types";
import type {
  OdysseyDraftEvidencedText,
  OdysseyDraftSummary,
} from "@/features/plan/interview/odyssey-draft-summary.types";
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

const sectionClass = "border-t border-zinc-100 pt-6 first:border-t-0 first:pt-0 dark:border-white/10";
const sectionTitleClass = "text-sm font-semibold text-zinc-900 dark:text-zinc-100";
const listClass =
  "mt-3 list-inside list-disc space-y-1.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400";

function EvidencedList({
  title,
  items,
}: {
  title: string;
  items: OdysseyDraftEvidencedText[];
}) {
  if (!items.length) return null;
  return (
    <section className={sectionClass}>
      <h4 className={sectionTitleClass}>{title}</h4>
      <ul className={listClass}>
        {items.map((item, i) => (
          <li key={i}>{item.text}</li>
        ))}
      </ul>
    </section>
  );
}

/**
 * 구조화된 초안 JSON만 받아 렌더. 사용자가 말한 사실, 해석, AI 제안을 나눠 보여줍니다.
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
          {data.summary}
        </p>
      </header>

      <div className="min-h-0 rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-950 sm:p-7">
        <h3 className="text-base font-semibold leading-snug text-zinc-900 dark:text-zinc-50 sm:text-lg">
          {data.headline}
        </h3>

        <div className="mt-6 flex flex-col gap-6">
          <EvidencedList title="내가 답한 내용" items={data.facts} />
          <EvidencedList title="답변을 연결해 본 해석" items={data.interpretations} />
          <EvidencedList title="피하고 싶은 방향" items={data.avoidNotes} />

          {data.missingInfo.length ? (
            <section className={sectionClass}>
              <h4 className={sectionTitleClass}>먼저 확인해 볼 것</h4>
              <ul className={listClass}>
                {data.missingInfo.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className={sectionClass}>
            <h4 className={sectionTitleClass}>AI 제안: 연차별 목표</h4>
            <ol className="mt-3 flex flex-col gap-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {planForm.years.map((year) => (
                <li key={year.yearIndex}>
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">
                    {year.yearIndex}Y
                  </span>{" "}
                  {year.goal}
                </li>
              ))}
            </ol>
            <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
              다음 화면에서 내용을 고치고, 네 가지 점수를 직접 평가할 수 있어요.
            </p>
          </section>

          {data.keywords.length ? (
            <section className={sectionClass}>
              <h4 className={sectionTitleClass}>키워드</h4>
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
          ) : null}
        </div>
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
