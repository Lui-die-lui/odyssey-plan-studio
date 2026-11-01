import {
  PLAN_SCORE_LABELS,
  type PlanScoreKey,
} from "../../constants/plan-score.constants";

export type PlanEditorScoreFieldDef = {
  key: PlanScoreKey;
  /** Uppercase label (wireframe style) */
  labelEn: string;
  hintKo: string;
  highMeaning: string;
  scaleLeft: string;
  scaleRight: string;
};

const labelsFor = (key: PlanScoreKey) => ({
  key,
  labelEn: PLAN_SCORE_LABELS[key].en,
  hintKo: PLAN_SCORE_LABELS[key].ko,
  highMeaning: PLAN_SCORE_LABELS[key].highMeaning,
});

export const PLAN_EDITOR_SCORE_FIELDS: PlanEditorScoreFieldDef[] = [
  {
    ...labelsFor("resources"),
    scaleLeft: "부족함",
    scaleRight: "충분함",
  },
  {
    ...labelsFor("interest"),
    scaleLeft: "낮음",
    scaleRight: "강함",
  },
  {
    ...labelsFor("confidence"),
    scaleLeft: "불안함",
    scaleRight: "해볼 만함",
  },
  {
    ...labelsFor("coherence"),
    scaleLeft: "안 맞음",
    scaleRight: "나답다",
  },
];
