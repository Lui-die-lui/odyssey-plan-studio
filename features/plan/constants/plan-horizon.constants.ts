import type { PlanOdysseyYearIndex } from "./plan.constants";

/**
 * How firm each year can be. Near years are plans; far years depend on what
 * earlier years show, so the timeline and PDF render them as less certain.
 */
export const PLAN_YEAR_HORIZON: Record<
  PlanOdysseyYearIndex,
  { label: string; firm: boolean; color: string }
> = {
  1: { label: "바로 시작", firm: true, color: "#5f83c9" },
  2: { label: "결과를 이어서", firm: true, color: "#3f9c8a" },
  3: { label: "조건부 방향", firm: false, color: "#d3923f" },
  4: { label: "조건부 방향", firm: false, color: "#c9628c" },
  5: { label: "조건부 방향", firm: false, color: "#8574cc" },
};
