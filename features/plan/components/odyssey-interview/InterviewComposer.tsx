"use client";

import { useMemo, useState, type KeyboardEvent } from "react";

import { buttonClass, fieldClass } from "@/components/common/ui";
import { Notice } from "@/components/common/Notice";
import { getOdysseyChoices } from "@/features/plan/interview/odyssey-interview.flow";
import type {
  OdysseyAnswerPayload,
  OdysseyInterviewAnswerValue,
  OdysseyInterviewAnswers,
  OdysseyInterviewQuestionDef,
} from "@/features/plan/interview/odyssey-interview.types";
import { ODYSSEY_OTHER_CHOICE_ID } from "@/features/plan/interview/odyssey-interview.types";

export type InterviewComposerProps = {
  /** Mount with `key={question.id}`: drafts belong to one question. */
  question: OdysseyInterviewQuestionDef;
  answers: OdysseyInterviewAnswers;
  /** Earlier answer, restored when the user comes back to edit. */
  previousAnswer?: OdysseyInterviewAnswerValue;
  onSubmit: (payload: OdysseyAnswerPayload) => void;
  validationError: string | null;
  onDismissError: () => void;
};

const choiceClass = (selected: boolean) =>
  "flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-lg border px-3.5 py-2.5 text-left text-[15px] leading-snug transition-colors duration-100 " +
  (selected
    ? "border-accent bg-accent-soft font-medium text-ink"
    : "border-line bg-raised text-ink-2 hover:border-line-strong hover:text-ink");

function ChoiceMark({ selected, multi }: { selected: boolean; multi: boolean }) {
  return (
    <span
      aria-hidden
      className={
        "flex size-[18px] shrink-0 items-center justify-center border transition-colors duration-100 " +
        (multi ? "rounded " : "rounded-full ") +
        (selected ? "border-accent bg-accent text-canvas" : "border-line-strong")
      }
    >
      {selected ? (
        <svg viewBox="0 0 12 12" className="size-3" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M2.5 6.5 5 9l4.5-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : null}
    </span>
  );
}

export function InterviewComposer({
  question,
  answers,
  previousAnswer,
  onSubmit,
  validationError,
  onDismissError,
}: InterviewComposerProps) {
  const isMulti = question.type === "multi" || question.type === "multi_with_other";
  const isText = question.type === "text";

  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(previousAnswer?.choiceIds ?? []),
  );
  const [text, setText] = useState(previousAnswer?.text ?? "");

  const choices = useMemo(() => getOdysseyChoices(question, answers), [question, answers]);
  const otherChoice = choices.find((c) => c.id === ODYSSEY_OTHER_CHOICE_ID);
  const otherSelected = selected.has(ODYSSEY_OTHER_CHOICE_ID);
  const needsText = isText || otherSelected;

  const canSubmit = isText
    ? text.trim().length > 0
    : selected.size > 0 && (!otherSelected || text.trim().length > 0);

  const submit = () => {
    if (!canSubmit) return;
    onSubmit({
      choiceIds: [...selected],
      text: needsText ? text : undefined,
    });
  };

  const pick = (id: string) => {
    onDismissError();
    if (isMulti) {
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
      return;
    }
    setSelected(new Set([id]));
    // A plain single choice needs nothing else, so moving on is the feedback.
    if (id !== ODYSSEY_OTHER_CHOICE_ID) onSubmit({ choiceIds: [id] });
  };

  const onTextKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const textField = (
    <div>
      <label htmlFor="odyssey-answer-text" className="sr-only">
        답변 입력
      </label>
      <textarea
        id="odyssey-answer-text"
        // The user just chose to type here, or this question only takes text.
        autoFocus
        value={text}
        rows={3}
        onChange={(e) => {
          onDismissError();
          setText(e.target.value);
        }}
        onKeyDown={onTextKeyDown}
        placeholder="생각나는 대로 적어 주세요"
        className={`${fieldClass} resize-none`}
      />
      <p className="mt-1 text-xs text-ink-3">Enter로 다음, Shift+Enter로 줄바꿈</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-2">
      {validationError ? <Notice tone="error">{validationError}</Notice> : null}

      {choices.length ? (
        <div
          role="group"
          aria-label="답변 선택"
          className={
            question.type === "branching_confirm"
              ? "grid grid-cols-1 gap-2 sm:grid-cols-2"
              : "flex flex-col gap-2"
          }
        >
          {choices.map((choice) => {
            const isSelected = selected.has(choice.id);
            return (
              <button
                key={choice.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => pick(choice.id)}
                className={choiceClass(isSelected)}
              >
                <ChoiceMark selected={isSelected} multi={isMulti} />
                <span className="min-w-0 flex-1">{choice.label}</span>
              </button>
            );
          })}
        </div>
      ) : null}

      {isText || (otherChoice && otherSelected) ? textField : null}

      {isMulti || needsText ? (
        <div className="mt-1 flex justify-end">
          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            className={buttonClass("primary", "w-full sm:w-auto")}
          >
            다음
          </button>
        </div>
      ) : null}
    </div>
  );
}
