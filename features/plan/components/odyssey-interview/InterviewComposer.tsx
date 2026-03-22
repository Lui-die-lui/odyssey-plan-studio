"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

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
  interviewDirectInputRowClass,
  interviewDirectInputTextareaClass,
  interviewDirectSendBtnClass,
  interviewOtherTriggerTextClass,
  interviewPrimaryBtnClass,
  interviewSecondaryBtnClass,
  interviewTextExpandTriggerClass,
  interviewTurnCardClass,
  interviewTurnSubmitClass,
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

function DirectSendButton({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={interviewDirectSendBtnClass}
      aria-label="보내기"
    >
      <svg
        className="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
    </button>
  );
}

function MultiChoiceMark({ selected }: { selected: boolean }) {
  return (
    <span className="flex h-4 w-4 shrink-0 items-center justify-center" aria-hidden>
      <span
        className={
          "rounded-full transition-[transform,background-color,box-shadow] duration-200 " +
          (selected
            ? "h-2.5 w-2.5 bg-zinc-700 shadow-[0_0_0_3px_rgba(63,63,70,0.12)] dark:bg-zinc-200 dark:shadow-[0_0_0_3px_rgba(255,255,255,0.08)]"
            : "h-2 w-2 bg-zinc-300/70 ring-1 ring-zinc-400/25 dark:bg-zinc-600/50 dark:ring-white/12")
        }
      />
    </span>
  );
}

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
  const [textEntryOpen, setTextEntryOpen] = useState(false);
  const otherExpandedTextareaRef = useRef<HTMLTextAreaElement>(null);
  const textTypeTextareaRef = useRef<HTMLTextAreaElement>(null);

  const choices = useMemo(
    () => (question ? getOdysseyChoices(question, answers) : []),
    [question, answers],
  );

  const regularChoices = useMemo(
    () => choices.filter((c) => c.id !== ODYSSEY_OTHER_CHOICE_ID),
    [choices],
  );
  const otherChoice = useMemo(
    () => choices.find((c) => c.id === ODYSSEY_OTHER_CHOICE_ID),
    [choices],
  );

  useEffect(() => {
    setSelectedSingle(null);
    setSelectedMulti(new Set());
    setOtherDraft("");
    setTextEntryOpen(false);
  }, [question?.id]);

  const otherSelectedSingle = selectedSingle === ODYSSEY_OTHER_CHOICE_ID;
  const otherSelectedMulti = selectedMulti.has(ODYSSEY_OTHER_CHOICE_ID);

  useEffect(() => {
    if (!otherSelectedSingle && !otherSelectedMulti) return;
    const id = requestAnimationFrame(() => {
      otherExpandedTextareaRef.current?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [otherSelectedSingle, otherSelectedMulti, question?.id]);

  useEffect(() => {
    if (question?.type !== "text" || !textEntryOpen) return;
    const id = requestAnimationFrame(() => {
      textTypeTextareaRef.current?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [question?.type, textEntryOpen, question?.id]);

  if (!question) {
    return null;
  }

  if (awaitingAiFollowUp && question.type !== "complete") {
    return null;
  }

  if (question.type === "complete") {
    return (
      <div className="space-y-3 rounded-2xl bg-zinc-100/50 p-4 ring-1 ring-inset ring-zinc-200/55 dark:bg-white/[0.04] dark:ring-white/[0.08]">
        <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
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
        <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap">
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

  const canSubmitMulti =
    selectedMulti.size > 0 && (!otherSelectedMulti || otherDraft.trim().length > 0);

  const expandedShortText =
    (question.type === "single_with_other" && otherSelectedSingle) ||
    (question.type === "multi_with_other" && otherSelectedMulti);

  const composerShellMinClass =
    question.type === "text" && textEntryOpen
      ? "min-h-[9rem]"
      : expandedShortText
        ? "min-h-[7.25rem]"
        : "";

  return (
    <div
      className={[interviewTurnCardClass, composerShellMinClass].filter(Boolean).join(" ")}
    >
      {validationError ? (
        <p
          role="alert"
          className="mb-2 rounded-lg border border-red-200/80 bg-red-50/90 px-2.5 py-1.5 text-xs text-red-700 dark:border-red-400/20 dark:bg-red-950/35 dark:text-red-300"
        >
          {validationError}
        </p>
      ) : null}

      <div className="space-y-1.5">
        {question.type === "text" ? (
          textEntryOpen ? (
            <div className={interviewDirectInputRowClass}>
              <label className="sr-only" htmlFor="odyssey-text-answer">
                답변 입력
              </label>
              <textarea
                ref={textTypeTextareaRef}
                id="odyssey-text-answer"
                value={otherDraft}
                onChange={(e) => {
                  onDismissError();
                  setOtherDraft(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (otherDraft.trim()) submitText();
                  }
                }}
                rows={2}
                placeholder="답변을 입력해 주세요"
                className={interviewDirectInputTextareaClass}
              />
              <DirectSendButton onClick={submitText} disabled={!otherDraft.trim()} />
            </div>
          ) : (
            <button
              type="button"
              className={interviewTextExpandTriggerClass}
              onClick={() => {
                onDismissError();
                setTextEntryOpen(true);
              }}
            >
              직접 입력하기
            </button>
          )
        ) : null}

        {question.type === "branching_confirm" && choices.length ? (
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
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
          <div className="flex flex-col gap-1.5">
            {regularChoices.map((c) => {
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
            {otherChoice ? (
              <div
                className={
                  "mt-0.5 w-full overflow-hidden rounded-xl transition-colors " +
                  (otherSelectedSingle
                    ? "bg-zinc-50/55 p-1.5 dark:bg-white/[0.04]"
                    : "")
                }
              >
                {!otherSelectedSingle ? (
                  <button
                    type="button"
                    onClick={() => pickSingle(otherChoice.id)}
                    className={interviewTextExpandTriggerClass}
                  >
                    <span className={interviewOtherTriggerTextClass}>{otherChoice.label}</span>
                  </button>
                ) : (
                  <div className={interviewDirectInputRowClass}>
                    <label className="sr-only" htmlFor="odyssey-other-single">
                      직접 입력
                    </label>
                    <textarea
                      ref={otherExpandedTextareaRef}
                      id="odyssey-other-single"
                      value={otherDraft}
                      onChange={(e) => {
                        onDismissError();
                        setOtherDraft(e.target.value);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          if (otherDraft.trim()) submitSingleWithOther();
                        }
                      }}
                      rows={2}
                      placeholder="내용을 입력해 주세요"
                      className={interviewDirectInputTextareaClass}
                    />
                    <DirectSendButton
                      onClick={submitSingleWithOther}
                      disabled={!otherDraft.trim()}
                    />
                  </div>
                )}
              </div>
            ) : null}
          </div>
        ) : null}

        {(question.type === "multi" || question.type === "multi_with_other") &&
        choices.length ? (
          <div className="flex flex-col gap-1.5">
            {regularChoices.map((c) => {
              const selected = selectedMulti.has(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleMulti(c.id)}
                  className={
                    "flex items-center gap-2.5 " +
                    interviewChoiceButtonClass +
                    (selected ? ` ${interviewChoiceSelectedClass}` : "")
                  }
                >
                  <MultiChoiceMark selected={selected} />
                  <span className="min-w-0 flex-1 text-left">{c.label}</span>
                </button>
              );
            })}
            {otherChoice ? (
              <div
                className={
                  "mt-0.5 w-full overflow-hidden rounded-xl transition-colors " +
                  (otherSelectedMulti ? "bg-zinc-50/55 p-1.5 dark:bg-white/[0.04]" : "")
                }
              >
                <button
                  type="button"
                  onClick={() => toggleMulti(otherChoice.id)}
                  className={
                    "flex w-full items-center gap-2.5 " +
                    interviewChoiceButtonClass +
                    (otherSelectedMulti ? ` ${interviewChoiceSelectedClass}` : "")
                  }
                >
                  <MultiChoiceMark selected={otherSelectedMulti} />
                  <span className="min-w-0 flex-1 text-left text-sm text-zinc-700 dark:text-zinc-200">
                    {otherChoice.label}
                  </span>
                </button>
                {question.type === "multi_with_other" && otherSelectedMulti ? (
                  <div className="mt-1.5">
                    <label className="sr-only" htmlFor="odyssey-other-multi">
                      직접 입력
                    </label>
                    <div className={interviewDirectInputRowClass}>
                      <textarea
                        ref={otherExpandedTextareaRef}
                        id="odyssey-other-multi"
                        value={otherDraft}
                        onChange={(e) => {
                          onDismissError();
                          setOtherDraft(e.target.value);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            if (canSubmitMulti) submitMulti();
                          }
                        }}
                        rows={2}
                        placeholder="내용을 입력해 주세요"
                        className={interviewDirectInputTextareaClass}
                      />
                      <DirectSendButton
                        onClick={submitMulti}
                        disabled={!canSubmitMulti}
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
            <button
              type="button"
              onClick={submitMulti}
              disabled={!canSubmitMulti}
              className={interviewTurnSubmitClass}
            >
              선택한 내용 보내기
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
