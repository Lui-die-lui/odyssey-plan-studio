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
    title: "아직 잘 모르겠어요",
    description: "몇 가지 질문에 답하며 방향을 찾아볼게요",
    pathSegment: "ai",
  },
  {
    id: "manual",
    title: "직접 만들고 싶어요",
    description: "원하는 목표와 계획을 바로 작성할게요",
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
