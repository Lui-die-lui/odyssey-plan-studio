"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

import type { OdysseyChatMessage } from "@/features/plan/interview/odyssey-interview.types";

import { InterviewChatBubble } from "./InterviewChatBubble";
import {
  interviewQuestionEnterAnimate,
  interviewQuestionEnterInitial,
  interviewQuestionTransition,
} from "./interview-question-motion";

function InterviewAwaitingFollowUpBubble() {
  return (
    <div className="mt-1.5 flex justify-start" aria-live="polite" aria-busy="true">
      <div className="max-w-[min(100%,28rem)] rounded-2xl rounded-bl-md border border-zinc-200/45 bg-zinc-50/65 px-3.5 py-2.5 dark:border-white/[0.08] dark:bg-zinc-900/55">
        {/* <p className="text-[13px] leading-relaxed text-zinc-500 dark:text-zinc-400">
          다음 질문을 정리하고 있어요
        </p> */}
        <div className="odyssey-awaiting-dots mt-2 flex gap-1" aria-hidden>
          <span className="h-1 w-1 rounded-full bg-zinc-400/75 dark:bg-zinc-500/80" />
          <span className="h-1 w-1 rounded-full bg-zinc-400/75 dark:bg-zinc-500/80" />
          <span className="h-1 w-1 rounded-full bg-zinc-400/75 dark:bg-zinc-500/80" />
        </div>
      </div>
    </div>
  );
}

function lastQuestionMessageIndex(messages: OdysseyChatMessage[]): number {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i]!;
    if (m.role === "ai" && m.variant !== "reaction") return i;
  }
  return -1;
}

export function InterviewChatThread({
  messages,
  showAwaitingFollowUp = false,
  bottomInsetClass = "",
}: {
  messages: OdysseyChatMessage[];
  showAwaitingFollowUp?: boolean;
  bottomInsetClass?: string;
}) {
  const reduceMotion = useReducedMotion();
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showTopFade, setShowTopFade] = useState(false);

  const activeQuestionIndex = useMemo(
    () => lastQuestionMessageIndex(messages),
    [messages],
  );

  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : undefined;
  const showAwaitingBubble =
    showAwaitingFollowUp &&
    (messages.length === 0 || lastMessage?.role === "user");

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setShowTopFade(el.scrollTop > 8);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let innerId = 0;
    let settleTimer: ReturnType<typeof setTimeout> | null = null;
    const outerId = requestAnimationFrame(() => {
      innerId = requestAnimationFrame(() => {
        if (!cancelled) {
          bottomRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
        }
      });
    });
    settleTimer = setTimeout(() => {
      if (!cancelled) {
        bottomRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
      }
    }, 120);
    return () => {
      cancelled = true;
      cancelAnimationFrame(outerId);
      cancelAnimationFrame(innerId);
      if (settleTimer) clearTimeout(settleTimer);
    };
  }, [messages.length, showAwaitingFollowUp, bottomInsetClass]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    onScroll();
  }, [messages.length, showAwaitingBubble, onScroll]);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className={
          "odyssey-interview-thread-scroll min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain px-3 pb-4 pt-3 sm:px-4 sm:pb-4.5 sm:pt-4 " +
          bottomInsetClass
        }
      >
        <div className="mx-auto max-w-xl">
          {messages.map((m, i) => {
            const isNewQuestion =
              m.role === "ai" && m.variant === "question" && i > 0;
            const isQuestionBubble =
              m.role === "ai" && m.variant === "question";
            const marginClass =
              i === 0 ? "" : isNewQuestion ? "mt-4" : "mt-1";
            const qTransition = reduceMotion
              ? { duration: 0.01 }
              : interviewQuestionTransition;

            const bubble = (
              <InterviewChatBubble
                message={m}
                isActiveQuestion={
                  i === activeQuestionIndex &&
                  m.role === "ai" &&
                  m.variant !== "reaction"
                }
              />
            );

            return (
              <div key={m.id} className={marginClass}>
                {isQuestionBubble ? (
                  <motion.div
                    initial={reduceMotion ? false : interviewQuestionEnterInitial}
                    animate={interviewQuestionEnterAnimate}
                    transition={qTransition}
                  >
                    {bubble}
                  </motion.div>
                ) : (
                  bubble
                )}
              </div>
            );
          })}
          {showAwaitingBubble ? <InterviewAwaitingFollowUpBubble /> : null}
          <div ref={bottomRef} className="h-2 shrink-0" aria-hidden />
        </div>
      </div>
      <div
        className={
          "pointer-events-none absolute inset-x-0 top-0 z-10 h-12 bg-gradient-to-b from-white from-20% via-white/90 to-transparent transition-opacity duration-300 dark:from-zinc-950 dark:via-zinc-950/90 " +
          (showTopFade ? "opacity-100" : "opacity-0")
        }
        aria-hidden
      />
    </div>
  );
}
