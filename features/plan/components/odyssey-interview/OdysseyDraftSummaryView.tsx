"use client";

import { useRouter } from "next/navigation";

import {
  buttonClass,
  helpTextClass,
  pageTitleClass,
  sectionTitleClass,
} from "@/components/common/ui";
import { PlanPathBadge } from "@/features/plan/components/PlanPathBadge";
import type { OdysseyAiPlanFormDraft } from "@/features/plan/interview/odyssey-ai-plan-draft.types";
import type {
  OdysseyDraftEvidencedText,
  OdysseyDraftSummary,
} from "@/features/plan/interview/odyssey-draft-summary.types";
import { writeOdysseyAiPlanDraftToSession } from "@/features/plan/lib/odyssey-ai-draft-session";

type OdysseyDraftSummaryViewProps = {
  data: OdysseyDraftSummary;
  planForm: OdysseyAiPlanFormDraft;
  pathsHref: string;
  onRestartInterview: () => void;
  onEditAnswers: () => void;
};

const listClass = "mt-2 flex list-disc flex-col gap-1.5 pl-5 text-[15px] leading-relaxed text-ink-2";

function TextList({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <section>
      <h3 className={sectionTitleClass}>{title}</h3>
      <ul className={listClass}>
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

const texts = (items: OdysseyDraftEvidencedText[]) => items.map((item) => item.text);

/**
 * 사용자가 말한 사실, 해석, AI 제안을 나눠 보여줍니다.
 * 저장 전 단계라는 점과 다음 행동을 먼저 알립니다.
 */
export function OdysseyDraftSummaryView({
  data,
  planForm,
  pathsHref,
  onRestartInterview,
  onEditAnswers,
}: OdysseyDraftSummaryViewProps) {
  const router = useRouter();

  const goToManualWithDraft = () => {
    writeOdysseyAiPlanDraftToSession(planForm);
    router.push(pathsHref);
  };

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-xs font-medium text-accent">AI 초안 · 아직 저장되지 않았어요</p>
        <h2 className={`${pageTitleClass} mt-1.5`}>{data.headline}</h2>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink-2">{data.summary}</p>
      </header>

      <section>
        <h3 className={sectionTitleClass}>AI가 제안한 세 가지 5년</h3>
        <p className={`${helpTextClass} mt-0.5`}>세 경로는 우열이 아니라 함께 살펴볼 가능성이에요.</p>
        <ul className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
          {planForm.paths.map((path) => (
            <li key={path.kind} className="rounded-xl border border-line bg-surface p-4">
              <PlanPathBadge kind={path.kind} />
              <p className="mt-2 text-base font-semibold leading-snug tracking-tight text-ink">
                {path.title}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-ink-2">{path.overview}</p>
              <p className="mt-2 text-xs text-ink-3">먼저 해볼 일</p>
              <p className="text-sm leading-relaxed text-ink-2">{path.experiments[0]?.action}</p>
            </li>
          ))}
        </ul>
        {data.differenceNote ? (
          <p className={`${helpTextClass} mt-3`}>{data.differenceNote}</p>
        ) : null}
      </section>

      <TextList title="내가 답한 내용" items={texts(data.facts)} />
      <TextList title="답변을 연결해 본 해석" items={texts(data.interpretations)} />
      <TextList title="피하고 싶은 방향" items={texts(data.avoidNotes)} />
      <TextList title="먼저 확인해 볼 것" items={data.missingInfo} />

      {data.keywords.length ? (
        <p className={helpTextClass}>키워드: {data.keywords.join(" · ")}</p>
      ) : null}

      <div className="flex flex-col gap-3 border-t border-line pt-5">
        <p className={helpTextClass}>
          다음 화면에서 경로별 5년을 고치고, 직접 평가한 뒤 저장할 수 있어요. 다시 만들면
          이번 달 이용 횟수를 1회 더 사용합니다.
        </p>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
          <button type="button" onClick={onRestartInterview} className={buttonClass("quiet")}>
            처음부터 다시
          </button>
          <button type="button" onClick={onEditAnswers} className={buttonClass("secondary", "sm:ml-auto")}>
            답변 고쳐서 다시 만들기
          </button>
          <button type="button" onClick={goToManualWithDraft} className={buttonClass("primary")}>
            세 경로 다듬기
          </button>
        </div>
      </div>
    </div>
  );
}
