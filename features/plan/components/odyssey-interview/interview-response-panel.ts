import type { OdysseyInterviewQuestionDef } from "@/features/plan/interview/odyssey-interview.types";

/**
 * 하단 응답 영역 — 과한 고정 height 대신 타입별 최소 높이만 두어
 * 레이아웃 안정성과 컴팩트함을 맞춤.
 */
export function interviewResponseSectionMinClass(
  question: OdysseyInterviewQuestionDef | undefined,
  awaitingAiFollowUp: boolean,
): string {
  if (!question) return "";
  if (awaitingAiFollowUp && question.type !== "complete") {
    return "";
  }
  if (question.type === "complete") {
    return "min-h-[min(9rem,32dvh)]";
  }
  switch (question.type) {
    case "text":
      return "min-h-[6rem]";
    case "single":
    case "single_with_other":
    case "multi":
    case "multi_with_other":
    case "branching_confirm":
      return "min-h-[4.5rem]";
    default:
      return "";
  }
}
