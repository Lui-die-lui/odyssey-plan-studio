"use client";

import {
  AI_GUIDANCE_OUTDATED_NOTE,
  describeEvidenceQuestions,
  isAiGuidanceOutdated,
} from "../lib/plan-ai-guidance";
import type { PlanYearAiGuidance } from "../types/plan.types";

const labelClass = "font-medium text-zinc-800 dark:text-zinc-200";

function DetailBlock({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <dt className={labelClass}>{label}</dt>
      <dd className="mt-0.5 whitespace-pre-line">{text}</dd>
    </div>
  );
}

export type PlanYearGuidanceDetailsProps = {
  guidance?: PlanYearAiGuidance;
  goalTexts: string[];
  /** Full year memo, so a clamped preview never hides it for good. */
  note?: string;
  className?: string;
};

/** Collapsible AI explanation for a year; the PDF prints the same fields in full. */
export function PlanYearGuidanceDetails({
  guidance,
  goalTexts,
  note,
  className = "",
}: PlanYearGuidanceDetailsProps) {
  const noteText = note?.trim();
  if (!guidance && !noteText) return null;

  const evidenceQuestions = guidance
    ? describeEvidenceQuestions(guidance.evidenceQuestionIds)
    : [];

  return (
    <details className={`text-xs leading-relaxed text-zinc-600 dark:text-zinc-400 ${className}`}>
      <summary className="cursor-pointer select-none font-medium text-zinc-700 dark:text-zinc-300">
        {guidance ? "제안 근거·확인 기준" : "메모 전체 보기"}
      </summary>
      <dl className="mt-2 flex flex-col gap-2.5">
        {guidance && isAiGuidanceOutdated(guidance, goalTexts) ? (
          <p className="rounded-lg bg-zinc-100 px-2.5 py-2 text-zinc-700 dark:bg-white/[0.06] dark:text-zinc-300">
            {AI_GUIDANCE_OUTDATED_NOTE}
          </p>
        ) : null}
        {guidance ? (
          <>
            <DetailBlock label="확인 기준" text={guidance.checkpoint} />
            <div>
              <dt className={labelClass}>제안 근거</dt>
              <dd className="mt-0.5 whitespace-pre-line">{guidance.rationale}</dd>
              {evidenceQuestions.length ? (
                <dd className="mt-1">
                  <ul className="list-disc space-y-0.5 pl-4 text-zinc-500 dark:text-zinc-500">
                    {evidenceQuestions.map((question) => (
                      <li key={question}>{question}</li>
                    ))}
                  </ul>
                </dd>
              ) : null}
            </div>
            <DetailBlock label="전환 조건" text={guidance.pivotCondition} />
          </>
        ) : null}
        {noteText ? <DetailBlock label="메모" text={noteText} /> : null}
      </dl>
    </details>
  );
}
