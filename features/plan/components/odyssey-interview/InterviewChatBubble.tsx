"use client";

import type { OdysseyChatMessage } from "@/features/plan/interview/odyssey-interview.types";

export function InterviewChatBubble({ message }: { message: OdysseyChatMessage }) {
  const isUser = message.role === "user";
  const isReaction = message.variant === "reaction";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div
          className={
            "interview-chat-bubble-user max-w-[min(100%,28rem)] rounded-2xl rounded-br-md bg-zinc-900 px-4 py-2.5 text-sm leading-relaxed text-white dark:bg-zinc-100 dark:text-zinc-900"
          }
        >
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div
        className={
          "interview-chat-bubble-ai max-w-[min(100%,28rem)] rounded-2xl rounded-bl-md border text-sm leading-relaxed " +
          (isReaction
            ? "border-zinc-200/70 bg-zinc-50/90 px-4 py-2 text-zinc-600 dark:border-white/10 dark:bg-zinc-900/50 dark:text-zinc-400"
            : "border-zinc-200/80 bg-white px-4 py-3 text-zinc-800 shadow-sm dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-100")
        }
      >
        {message.content}
      </div>
    </div>
  );
}
