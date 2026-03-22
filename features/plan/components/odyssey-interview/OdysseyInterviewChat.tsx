"use client";

import { useCallback, useState } from "react";

import type {
  OdysseyDraftSummary,
  OdysseyGenerateSuccessBody,
} from "@/features/plan/interview/odyssey-draft-summary.types";
import type { OdysseyAiPlanFormDraft } from "@/features/plan/interview/odyssey-ai-plan-draft.types";
import { useOdysseyInterview } from "@/features/plan/interview/useOdysseyInterview";

import { interviewResponseSectionMinClass } from "./interview-response-panel";
import { InterviewChatThread } from "./InterviewChatThread";
import { InterviewComposer } from "./InterviewComposer";
import { OdysseyDraftSummaryView } from "./OdysseyDraftSummaryView";

type OdysseyInterviewChatProps = {
  manualHref: string;
};

type Phase = "chat" | "generating" | "summary";

/**
 * 인터뷰 → POST /api/odyssey/generate → 요약 + planForm (클라이언트 상태·sessionStorage, DB 없음)
 */
export function OdysseyInterviewChat({ manualHref }: OdysseyInterviewChatProps) {
  const {
    messages,
    answers,
    currentQuestion,
    awaitingAiFollowUp,
    submitAnswer,
    reset,
    validationError,
    clearValidationError,
  } = useOdysseyInterview();

  const [phase, setPhase] = useState<Phase>("chat");
  const [draftSummary, setDraftSummary] = useState<OdysseyDraftSummary | null>(null);
  const [draftPlanForm, setDraftPlanForm] = useState<OdysseyAiPlanFormDraft | null>(null);
  const [generateDraftError, setGenerateDraftError] = useState<string | null>(null);

  const handleGenerateDraft = useCallback(async () => {
    setGenerateDraftError(null);
    setPhase("generating");
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
        setGenerateDraftError(
          typeof data.error === "string" ? data.error : "초안을 만들지 못했습니다.",
        );
        setPhase("chat");
        return;
      }

      if (!data.summary || !data.planForm) {
        setGenerateDraftError("응답 형식이 올바르지 않습니다.");
        setPhase("chat");
        return;
      }

      setDraftSummary(data.summary);
      setDraftPlanForm(data.planForm);
      setPhase("summary");
    } catch {
      setGenerateDraftError("네트워크 오류가 발생했습니다.");
      setPhase("chat");
    }
  }, [answers]);

  const exitSummaryAndRestart = useCallback(() => {
    reset();
    setDraftSummary(null);
    setDraftPlanForm(null);
    setGenerateDraftError(null);
    setPhase("chat");
  }, [reset]);

  if (phase === "summary" && draftSummary && draftPlanForm) {
    return (
      <OdysseyDraftSummaryView
        data={draftSummary}
        planForm={draftPlanForm}
        manualHref={manualHref}
        onRestartInterview={exitSummaryAndRestart}
      />
    );
  }

  if (phase === "generating") {
    return (
      <div className="flex min-h-[min(320px,50dvh)] flex-1 flex-col items-center justify-center rounded-2xl border border-zinc-200/80 bg-white/50 px-4 py-12 text-center dark:border-white/10 dark:bg-zinc-950/40">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">초안을 정리하는 중…</p>
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
          잠시만 기다려 주세요.
        </p>
      </div>
    );
  }

  const responseMinClass = interviewResponseSectionMinClass(
    currentQuestion,
    awaitingAiFollowUp,
  );

  const responseShellClass =
    "flex shrink-0 flex-col bg-zinc-50/35 pt-2 pb-1 dark:bg-zinc-950/35 " +
    responseMinClass;

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/50 dark:border-white/10 dark:bg-zinc-950/40">
      <section
        aria-label="인터뷰 대화"
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
      >
        <InterviewChatThread
          messages={messages}
          showAwaitingFollowUp={awaitingAiFollowUp}
        />
      </section>
      <section
        aria-label="답변 선택"
        className={`${responseShellClass} flex flex-col items-stretch px-3 sm:px-4`}
      >
        <div className="odyssey-interview-response-scroll w-full max-w-xl min-w-0 self-center overflow-x-hidden overflow-y-auto overscroll-y-contain pb-2 pt-0.5 sm:pb-2 sm:pt-1">
          <InterviewComposer
            question={currentQuestion}
            answers={answers}
            awaitingAiFollowUp={awaitingAiFollowUp}
            onSubmit={submitAnswer}
            validationError={validationError}
            onDismissError={clearValidationError}
            manualHref={manualHref}
            onRestart={reset}
            onGenerateDraft={handleGenerateDraft}
            generateDraftError={generateDraftError}
          />
        </div>
      </section>
    </div>
  );
}
