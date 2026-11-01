/**
 * Entry choices for `/plan/new` (시작 방식). Add entries here when new flows ship.
 */
export type PlanCreateStartOptionId = "guided" | "paths" | "manual";

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
    title: "질문에 답하고 세 경로 초안 받기",
    description:
      "내 상황을 답하면 서로 다른 세 가지 5년을 제안해 드려요. 방향이 아직 흐릿해도 괜찮아요.",
    pathSegment: "ai",
  },
  {
    id: "paths",
    title: "세 경로 직접 작성하기",
    description:
      "지금 이어가는 삶, 다른 길의 삶, 제약을 내려놓은 삶을 직접 적어 비교해요.",
    pathSegment: "paths",
  },
  {
    id: "manual",
    title: "5년 계획 하나만 작성하기",
    description:
      "이미 정한 방향이 있다면 연차별로 바로 적을 수 있어요.",
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
