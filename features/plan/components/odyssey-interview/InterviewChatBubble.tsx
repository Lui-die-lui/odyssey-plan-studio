"use client";

import type { OdysseyChatMessage } from "@/features/plan/interview/odyssey-interview.types";

export function InterviewChatBubble({
  message,
  isActiveQuestion = false,
}: {
  message: OdysseyChatMessage;
  isActiveQuestion?: boolean;
}) {
  const isUser = message.role === "user";
  const isReaction = message.variant === "reaction";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="interview-chat-bubble-user max-w-[min(100%,26rem)] rounded-2xl rounded-br-md bg-zinc-900 px-3.5 py-2 text-[13px] leading-relaxed text-white dark:bg-zinc-100 dark:text-zinc-900">
          {message.content}
        </div>
      </div>
    );
  }

  if (isReaction) {
    return (
      <div className="flex justify-start">
        <div className="interview-chat-bubble-ai max-w-[min(100%,24rem)] rounded-lg rounded-bl-md border-0 bg-transparent px-1 py-0.5 text-[11px] leading-relaxed text-zinc-400/90 dark:text-zinc-500">
          {message.content}
        </div>
      </div>
    );
  }

  /* 활성/이전 질문 동일 트리 — isActive 전환 시 재마운트로 애니메이션이 다시 도는 것 방지 */
  const questionBodyClass = isActiveQuestion
    ? "max-w-[min(100%,28rem)] rounded-2xl rounded-bl-md border border-zinc-300/75 bg-white px-3.5 py-2.5 text-sm leading-relaxed text-zinc-800 dark:border-white/16 dark:bg-zinc-900/80 dark:text-zinc-100"
    : "max-w-[min(100%,28rem)] rounded-2xl rounded-bl-md border border-zinc-200/50 bg-zinc-50/70 px-3.5 py-2.5 text-sm leading-relaxed text-zinc-600 dark:border-white/[0.07] dark:bg-zinc-950/50 dark:text-zinc-400";

  return (
    <div className="flex justify-start">
      <div className={questionBodyClass}>{message.content}</div>
    </div>
  );
}
