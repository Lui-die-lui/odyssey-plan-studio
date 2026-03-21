import type { PlanYearScores } from "../../types/plan.types";

export type PlanEditorScoreFieldDef = {
  key: keyof PlanYearScores;
  /** Uppercase label (wireframe style) */
  labelEn: string;
  hintKo: string;
  scaleLeft: string;
  scaleRight: string;
};

export const PLAN_EDITOR_SCORE_FIELDS: PlanEditorScoreFieldDef[] = [
  {
    key: "resources",
    labelEn: "RESOURCES",
    hintKo: "현실 여건과 자원",
    scaleLeft: "부족함",
    scaleRight: "충분함",
  },
  {
    key: "interest",
    labelEn: "INTEREST",
    hintKo: "하고 싶은 마음",
    scaleLeft: "낮음",
    scaleRight: "강함",
  },
  {
    key: "confidence",
    labelEn: "CONFIDENCE",
    hintKo: "해낼 수 있다는 감각",
    scaleLeft: "불안함",
    scaleRight: "해볼 만함",
  },
  {
    key: "coherence",
    labelEn: "COHERENCE",
    hintKo: "나 다운 방향과의 일치감",
    scaleLeft: "안 맞음",
    scaleRight: "나답다",
  },
];
