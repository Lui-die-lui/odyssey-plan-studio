/**
 * Entry choices for `/plan/new` (시작 방식). Add entries here when new flows ship.
 */
export type PlanCreateStartOptionId = "guided" | "manual";

export type PlanCreateStartOption = {
  id: PlanCreateStartOptionId;
  title: string;
  description: string;
  /** Relative to `/plan/new/` */
  pathSegment: string;
};

export const PLAN_CREATE_START_OPTIONS: readonly PlanCreateStartOption[] = [
  {
    id: "guided",
    title: "가이드를 받으며 시작할래요",
    description:
      "몇 가지 질문에 답하고, AI 초안을 바탕으로 방향을 정리해요.",
    pathSegment: "ai",
  },
  {
    id: "manual",
    title: "내가 직접 시작할래요",
    description:
      "생각해둔 계획이 있다면, 바로 직접 작성할 수 있어요.",
    pathSegment: "manual",
  },
];

export function planCreateStepPath(
  pathSegment: string,
  searchQueryString: string,
): string {
  const base = `/plan/new/${pathSegment}`;
  return searchQueryString ? `${base}?${searchQueryString}` : base;
}
