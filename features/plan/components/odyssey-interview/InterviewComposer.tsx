"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { getOdysseyChoices } from "@/features/plan/interview/odyssey-interview.flow";
import type {
  OdysseyAnswerPayload,
  OdysseyInterviewAnswers,
  OdysseyInterviewQuestionDef,
} from "@/features/plan/interview/odyssey-interview.types";
import { ODYSSEY_OTHER_CHOICE_ID } from "@/features/plan/interview/odyssey-interview.types";

import {
  interviewBranchingButtonClass,
  interviewChoiceButtonClass,
  interviewChoiceSelectedClass,
  interviewPrimaryBtnClass,
  interviewSecondaryBtnClass,
  interviewTextareaClass,
} from "./interview-chat.styles";

export type InterviewComposerProps = {
  question: OdysseyInterviewQuestionDef | undefined;
  answers: OdysseyInterviewAnswers;
  /** 사용자 답변 직후, AI 리액션·다음 질문이 순차로 붙는 동안 */
  awaitingAiFollowUp: boolean;
  onSubmit: (payload: OdysseyAnswerPayload) => void;
  validationError: string | null;
  onDismissError: () => void;
  manualHref: string;
  onRestart: () => void;
  onGenerateDraft: () => void | Promise<void>;
  generateDraftError: string | null;
};

export function InterviewComposer({
  question,
  answers,
  awaitingAiFollowUp,
  onSubmit,
  validationError,
  onDismissError,
  manualHref,
  onRestart,
  onGenerateDraft,
  generateDraftError,
}: InterviewComposerProps) {
  const [selectedSingle, setSelectedSingle] = useState<string | null>(null);
  const [selectedMulti, setSelectedMulti] = useState<Set<string>>(() => new Set());
  const [otherDraft, setOtherDraft] = useState("");

  const choices = useMemo(
    () => (question ? getOdysseyChoices(question, answers) : []),
    [question, answers],
  );

  useEffect(() => {
    setSelectedSingle(null);
    setSelectedMulti(new Set());
    setOtherDraft("");
  }, [question?.id]);

  const otherSelectedSingle = selectedSingle === ODYSSEY_OTHER_CHOICE_ID;
  const otherSelectedMulti = selectedMulti.has(ODYSSEY_OTHER_CHOICE_ID);

  if (!question) {
    return null;
  }

  if (awaitingAiFollowUp && question.type !== "complete") {
    return (
      <div
        className="flex min-h-[3.25rem] items-center justify-center rounded-xl border border-dashed border-zinc-200/80 bg-zinc-50/50 py-4 text-sm text-zinc-500 dark:border-white/10 dark:bg-zinc-900/30 dark:text-zinc-400"
        aria-live="polite"
      >
        잠시만요…
      </div>
    );
  }

  if (question.type === "complete") {
    return (
      <div
        key={question.id}
        className="interview-composer-enter space-y-3 rounded-2xl border border-zinc-200/80 bg-white/80 p-4 dark:border-white/10 dark:bg-zinc-950/80"
      >
        <p className="text-xs text-zinc-500 dark:text-zinc-500">
          인터뷰를 마쳤어요. 초안을 만들면 답변을 바탕으로 정리 화면이 열립니다.
        </p>
        {generateDraftError ? (
          <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-400/25 dark:bg-red-950/40 dark:text-red-300"
          >
            {generateDraftError}
          </p>
        ) : null}
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={() => void onGenerateDraft()}
            className={interviewPrimaryBtnClass}
          >
            초안 만들기
          </button>
          <Link href={manualHref} className={interviewSecondaryBtnClass}>
            플랜 직접 작성하기
          </Link>
          <button type="button" onClick={onRestart} className={interviewSecondaryBtnClass}>
            처음부터 다시
          </button>
        </div>
      </div>
    );
  }

  const pickSingle = (id: string) => {
    onDismissError();
    if (id === ODYSSEY_OTHER_CHOICE_ID) {
      setSelectedSingle(id);
      return;
    }
    setSelectedSingle(id);
    setOtherDraft("");
    onSubmit({ choiceIds: [id] });
  };

  const toggleMulti = (id: string) => {
    onDismissError();
    setSelectedMulti((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const submitMulti = () => {
    onSubmit({
      choiceIds: [...selectedMulti],
      text: otherDraft || undefined,
    });
  };

  const submitSingleWithOther = () => {
    if (!selectedSingle) return;
    onSubmit({
      choiceIds: [selectedSingle],
      text: otherDraft || undefined,
    });
  };

  const submitText = () => {
    onSubmit({ choiceIds: [], text: otherDraft });
  };

  return (
    <>
      {validationError ? (
        <p
          role="alert"
          className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-400/25 dark:bg-red-950/40 dark:text-red-300"
        >
          {validationError}
        </p>
      ) : null}

      <div key={question.id} className="interview-composer-enter space-y-3">
      {question.type === "text" ? (
        <>
          <label className="sr-only" htmlFor="odyssey-text-answer">
            답변 입력
          </label>
          <textarea
            id="odyssey-text-answer"
            value={otherDraft}
            onChange={(e) => {
              onDismissError();
              setOtherDraft(e.target.value);
            }}
            rows={3}
            placeholder="간단히 적어 주세요"
            className={interviewTextareaClass}
          />
          <button type="button" onClick={submitText} className={interviewPrimaryBtnClass}>
            보내기
          </button>
        </>
      ) : null}

      {question.type === "branching_confirm" && choices.length ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {choices.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => pickSingle(c.id)}
              className={interviewBranchingButtonClass}
            >
              {c.label}
            </button>
          ))}
        </div>
      ) : null}

      {(question.type === "single" || question.type === "single_with_other") &&
      choices.length ? (
        <div className="flex flex-col gap-2">
          {choices.map((c) => {
            const selected = selectedSingle === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => pickSingle(c.id)}
                className={
                  interviewChoiceButtonClass +
                  (selected ? ` ${interviewChoiceSelectedClass}` : "")
                }
              >
                {c.label}
              </button>
            );
          })}
          {question.type === "single_with_other" && otherSelectedSingle ? (
            <div className="mt-1 space-y-2">
              <label className="sr-only" htmlFor="odyssey-other-single">
                직접 입력
              </label>
              <textarea
                id="odyssey-other-single"
                value={otherDraft}
                onChange={(e) => {
                  onDismissError();
                  setOtherDraft(e.target.value);
                }}
                rows={3}
                placeholder="직접 입력해 주세요"
                className={interviewTextareaClass}
              />
              <button
                type="button"
                onClick={submitSingleWithOther}
                className={interviewPrimaryBtnClass}
              >
                보내기
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {(question.type === "multi" || question.type === "multi_with_other") &&
      choices.length ? (
        <div className="flex flex-col gap-2">
          {choices.map((c) => {
            const selected = selectedMulti.has(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => toggleMulti(c.id)}
                className={
                  interviewChoiceButtonClass +
                  (selected ? ` ${interviewChoiceSelectedClass}` : "")
                }
              >
                <span className="mr-2 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border border-current text-[10px]">
                  {selected ? "✓" : ""}
                </span>
                {c.label}
              </button>
            );
          })}
          {question.type === "multi_with_other" && otherSelectedMulti ? (
            <div className="mt-1 space-y-2">
              <label className="sr-only" htmlFor="odyssey-other-multi">
                직접 입력
              </label>
              <textarea
                id="odyssey-other-multi"
                value={otherDraft}
                onChange={(e) => {
                  onDismissError();
                  setOtherDraft(e.target.value);
                }}
                rows={3}
                placeholder="직접 입력해 주세요"
                className={interviewTextareaClass}
              />
            </div>
          ) : null}
          <button type="button" onClick={submitMulti} className={interviewPrimaryBtnClass}>
            답변 보내기
          </button>
        </div>
      ) : null}
      </div>
    </>
  );
}
