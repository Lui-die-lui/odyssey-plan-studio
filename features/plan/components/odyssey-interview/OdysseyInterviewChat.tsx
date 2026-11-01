"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";

import { Notice } from "@/components/common/Notice";
import { buttonClass, helpTextClass, surfaceClass } from "@/components/common/ui";
import { setFieldFill } from "@/features/field/future-field-store";
import type { OdysseyGenerateSuccessBody } from "@/features/plan/interview/odyssey-draft-summary.types";
import {
  useOdysseyInterview,
  type OdysseyAnsweredEntry,
} from "@/features/plan/interview/useOdysseyInterview";

import { InterviewComposer } from "./InterviewComposer";
import { OdysseyDraftSummaryView } from "./OdysseyDraftSummaryView";

type OdysseyInterviewChatProps = {
  manualHref: string;
  pathsHref: string;
};

/** Share of the field colored once a typical interview is finished. */
const INTERVIEW_FILL_PER_ANSWER = 0.05;
const INTERVIEW_MAX_FILL = 0.7;

const editButtonClass =
  "min-h-11 shrink-0 cursor-pointer rounded-lg px-2.5 text-sm text-ink-3 underline-offset-4 transition-colors hover:text-ink hover:underline";

function RailNode({ current }: { current?: boolean }) {
  return (
    <span
      aria-hidden
      className={
        "relative z-10 mt-1.5 block size-3 rounded-full border-[1.5px] " +
        (current ? "border-accent bg-accent" : "border-ink-3 bg-canvas")
      }
    />
  );
}

function AnsweredList({
  entries,
  onEdit,
}: {
  entries: OdysseyAnsweredEntry[];
  onEdit: (questionId: string) => void;
}) {
  return (
    <details className="mt-8 border-t border-line pt-3">
      <summary className="flex min-h-11 items-center text-sm font-medium text-ink-2">
        지금까지 답한 내용 {entries.length}개
      </summary>
      <ol className="mt-1 divide-y divide-line">
        {entries.map((entry) => (
          <li key={entry.questionId} className="flex items-start justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="text-xs leading-relaxed text-ink-3">{entry.question}</p>
              <p className="mt-0.5 text-sm text-ink">{entry.answerLine}</p>
            </div>
            <button
              type="button"
              onClick={() => onEdit(entry.questionId)}
              className={editButtonClass}
              aria-label={`답변 수정: ${entry.question}`}
            >
              수정
            </button>
          </li>
        ))}
      </ol>
    </details>
  );
}

/**
 * 인터뷰 → POST /api/odyssey/generate → 초안 확인.
 * 질문은 항상 같은 자리에 오고, 직전 답변이 레일로 이어져 선택과 다음 질문의 관계를 보여줍니다.
 */
export function OdysseyInterviewChat({ manualHref, pathsHref }: OdysseyInterviewChatProps) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const {
    answers,
    entries,
    currentQuestion,
    isEditing,
    draft,
    setDraft,
    submitAnswer,
    editAnswer,
    cancelEdit,
    reset,
    validationError,
    clearValidationError,
  } = useOdysseyInterview();

  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const previousQuestionId = useRef(currentQuestion?.id);

  useEffect(() => {
    setFieldFill(
      draft
        ? INTERVIEW_MAX_FILL
        : Math.min(INTERVIEW_MAX_FILL, entries.length * INTERVIEW_FILL_PER_ANSWER),
    );
  }, [draft, entries.length]);

  // Keyboard and screen reader users continue from the new question.
  useEffect(() => {
    if (previousQuestionId.current === currentQuestion?.id) return;
    previousQuestionId.current = currentQuestion?.id;
    headingRef.current?.focus({ preventScroll: true });
    if (window.scrollY > 0) window.scrollTo({ top: 0 });
  }, [currentQuestion?.id]);

  useEffect(() => {
    if (!draft) return;

    const handlePopState = () => {
      router.replace("/plan/new");
    };

    // Keep one extra entry while summary is visible, then intercept back.
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [draft, router]);

  const handleGenerateDraft = useCallback(async () => {
    setGenerateError(null);
    setGenerating(true);
    try {
      const res = await fetch("/api/odyssey/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ answers }),
      });
      const data: Partial<OdysseyGenerateSuccessBody> & { error?: string } =
        await res.json().catch(() => ({}));

      if (!res.ok) {
        setGenerateError(
          typeof data.error === "string" ? data.error : "초안을 만들지 못했습니다.",
        );
        return;
      }
      if (!data.summary || !data.planForm) {
        setGenerateError("응답 형식이 올바르지 않습니다. 다시 시도해 주세요.");
        return;
      }
      setDraft({ summary: data.summary, planForm: data.planForm });
    } catch {
      setGenerateError("네트워크 연결을 확인한 뒤 다시 시도해 주세요.");
    } finally {
      setGenerating(false);
    }
  }, [answers, setDraft]);

  const restart = useCallback(() => {
    reset();
    setGenerateError(null);
  }, [reset]);

  if (draft) {
    return (
      <OdysseyDraftSummaryView
        data={draft.summary}
        planForm={draft.planForm}
        pathsHref={pathsHref}
        onRestartInterview={restart}
        onEditAnswers={() => {
          setDraft(null);
        }}
      />
    );
  }

  if (generating) {
    return (
      <div className={`${surfaceClass} px-5 py-10 sm:px-8`} role="status">
        <p className="text-base font-semibold text-ink">
          답변 {entries.length}개를 바탕으로 세 경로 초안을 만들고 있어요
        </p>
        <p className={`${helpTextClass} mt-1.5`}>
          1분 이상 걸릴 수 있어요. 이 화면을 그대로 두면 완료되는 대로 보여드릴게요.
        </p>
        <div aria-hidden className="mt-6 h-px w-full overflow-hidden bg-line">
          <div className="odyssey-working-bar h-px w-1/4 bg-accent" />
        </div>
      </div>
    );
  }

  if (!currentQuestion) return null;

  const lastEntry = isEditing ? undefined : entries[entries.length - 1];
  const isComplete = currentQuestion.type === "complete";
  const enter = reduceMotion ? false : { opacity: 0, y: 10 };

  return (
    <div className="flex w-full flex-col">
      {isEditing ? (
        <Notice
          className="mb-6"
          action={
            <button type="button" onClick={cancelEdit} className={buttonClass("secondary")}>
              수정 취소
            </button>
          }
        >
          이전 답변을 수정 중이에요. 다른 답변은 유지되고, 달라진 질문만 다시 물어볼게요.
        </Notice>
      ) : null}

      <div className="relative grid grid-cols-[0.75rem_minmax(0,1fr)] gap-x-4">
        <span
          aria-hidden
          className="absolute bottom-0 left-[0.3125rem] top-3 border-l-[1.5px] border-dashed border-line-strong"
        />

        {lastEntry ? (
          <>
            <RailNode />
            <motion.div
              key={lastEntry.questionId}
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15 }}
              className="mb-6 flex min-w-0 items-start justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="text-xs text-ink-3">방금 답한 내용</p>
                <p className="mt-0.5 text-sm font-medium text-ink">{lastEntry.answerLine}</p>
                {lastEntry.reaction.trim() ? (
                  <p className="mt-1 text-xs leading-relaxed text-ink-3">{lastEntry.reaction}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => editAnswer(lastEntry.questionId)}
                className={editButtonClass}
                aria-label={`방금 답한 내용 수정: ${lastEntry.question}`}
              >
                수정
              </button>
            </motion.div>
          </>
        ) : null}

        <RailNode current />
        <motion.div
          key={currentQuestion.id}
          initial={enter}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="min-w-0"
        >
          <h2
            ref={headingRef}
            tabIndex={-1}
            className="text-lg font-semibold leading-snug tracking-tight text-ink outline-none sm:text-xl"
          >
            {isComplete ? "답변을 모두 받았어요" : currentQuestion.prompt}
          </h2>

          {!entries.length ? (
            <p className={`${helpTextClass} mt-2`}>
              답변에 따라 이어지는 질문이 달라져요. 언제든 이전 답변을 고칠 수 있습니다.
            </p>
          ) : null}

          <div className="mt-5">
            {isComplete ? (
              <div className="flex flex-col gap-4">
                <p className={helpTextClass}>
                  초안을 만들면 세 경로를 비교할 수 있어요. 만든 뒤에도 직접 고칠 수 있고,
                  저장하기 전까지 내 플랜에 반영되지 않습니다.
                </p>
                {generateError ? (
                  <Notice tone="error">
                    {generateError} 답변은 그대로 있습니다. 생성에 실패하면 이용 횟수도
                    차감되지 않아요.
                  </Notice>
                ) : null}
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => void handleGenerateDraft()}
                    className={buttonClass("primary")}
                  >
                    {generateError ? "다시 시도" : "초안 만들기"}
                  </button>
                  <Link href={manualHref} className={buttonClass("secondary")}>
                    직접 작성하기
                  </Link>
                  <button type="button" onClick={restart} className={buttonClass("quiet")}>
                    처음부터 다시
                  </button>
                </div>
              </div>
            ) : (
              <InterviewComposer
                key={currentQuestion.id}
                question={currentQuestion}
                answers={answers}
                previousAnswer={answers[currentQuestion.id]}
                onSubmit={submitAnswer}
                validationError={validationError}
                onDismissError={clearValidationError}
              />
            )}
          </div>
        </motion.div>
      </div>

      {entries.length > 0 ? <AnsweredList entries={entries} onEdit={editAnswer} /> : null}
    </div>
  );
}
