"use client";

import { useEffect, useRef } from "react";

import type { OdysseyChatMessage } from "@/features/plan/interview/odyssey-interview.types";

import { InterviewChatBubble } from "./InterviewChatBubble";

export function InterviewChatThread({ messages }: { messages: OdysseyChatMessage[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let innerId = 0;
    const outerId = requestAnimationFrame(() => {
      innerId = requestAnimationFrame(() => {
        if (!cancelled) {
          bottomRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
        }
      });
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(outerId);
      cancelAnimationFrame(innerId);
    };
  }, [messages.length]);

  return (
    <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-4 sm:px-4 sm:py-5">
      {messages.map((m) => (
        <InterviewChatBubble key={m.id} message={m} />
      ))}
      <div ref={bottomRef} className="h-px shrink-0" aria-hidden />
    </div>
  );
}
