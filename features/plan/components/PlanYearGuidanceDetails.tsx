"use client";

import {
  AI_GUIDANCE_OUTDATED_NOTE,
  describeEvidenceQuestions,
  isAiGuidanceOutdated,
} from "../lib/plan-ai-guidance";
import type { PlanYearAiGuidance } from "../types/plan.types";

function DetailBlock({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <dt className="font-medium text-ink">{label}</dt>
      <dd className="mt-0.5 whitespace-pre-line">{text}</dd>
    </div>
  );
}

export type PlanYearGuidanceDetailsProps = {
  guidance: PlanYearAiGuidance;
  goalTexts: string[];
  /** The summary shows the checkpoint on its own, so it can be left out here. */
  hideCheckpoint?: boolean;
  className?: string;
};

/** Collapsible AI explanation for a year; the PDF prints the same fields in full. */
export function PlanYearGuidanceDetails({
  guidance,
  goalTexts,
  hideCheckpoint = false,
  className = "",
}: PlanYearGuidanceDetailsProps) {
  const evidenceQuestions = describeEvidenceQuestions(guidance.evidenceQuestionIds);

  return (
    <details className={`text-sm leading-relaxed text-ink-2 ${className}`}>
      <summary className="flex min-h-11 items-center font-medium text-ink-2">
        {hideCheckpoint ? "제안 근거와 전환 조건" : "제안 근거·확인 기준·전환 조건"}
      </summary>
      <dl className="flex flex-col gap-3 pb-1 pt-1">
        {isAiGuidanceOutdated(guidance, goalTexts) ? (
          <p className="rounded-lg bg-line/50 px-3 py-2 text-ink-2">{AI_GUIDANCE_OUTDATED_NOTE}</p>
        ) : null}
        {hideCheckpoint ? null : <DetailBlock label="확인 기준" text={guidance.checkpoint} />}
        <div>
          <dt className="font-medium text-ink">제안 근거</dt>
          <dd className="mt-0.5 whitespace-pre-line">{guidance.rationale}</dd>
          {evidenceQuestions.length ? (
            <dd className="mt-1.5">
              <p className="text-xs text-ink-3">연결된 질문</p>
              <ul className="mt-0.5 list-disc pl-4 text-xs text-ink-3">
                {evidenceQuestions.map((question) => (
                  <li key={question}>{question}</li>
                ))}
              </ul>
            </dd>
          ) : null}
        </div>
        <DetailBlock label="전환 조건" text={guidance.pivotCondition} />
      </dl>
    </details>
  );
}
