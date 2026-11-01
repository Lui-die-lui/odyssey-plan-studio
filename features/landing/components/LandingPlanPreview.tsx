"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

import type { PlanOdysseyYearIndex } from "@/features/plan/constants/plan.constants";
import {
  YearTimeline,
  yearPanelId,
  yearTabId,
} from "@/features/plan/components/YearTimeline";

const TIMELINE_ID = "landing-example-years";

/** Illustrates the output format only; marked as an example in the UI. */
const EXAMPLE_YEARS: Record<
  PlanOdysseyYearIndex,
  { goal: string; action: string; check: string }
> = {
  1: {
    goal: "지금 일을 유지하면서, 관심 분야가 나에게 맞는지 직접 확인한다",
    action: "주 3시간 안에서 작은 작업물 하나를 끝까지 완성해 본다",
    check: "완성한 작업물 1개와 받은 피드백 기록",
  },
  2: {
    goal: "1년차 결과가 좋았다면, 작업을 이어갈 환경을 만든다",
    action: "피드백을 준 사람들과 함께하는 작은 프로젝트에 참여해 본다",
    check: "함께 끝낸 작업과 이어가고 싶은지에 대한 내 판단",
  },
  3: {
    goal: "앞선 경험이 맞았다면 비중을 늘리고, 아니라면 다른 방향과 비교한다",
    action: "일과 작업의 시간 배분을 조정해 석 달간 시험해 본다",
    check: "조정한 기간의 피로도와 지속 의향",
  },
  4: {
    goal: "전환을 이어간다면, 지금의 경험으로 할 수 있는 역할을 좁혀 본다",
    action: "관심 역할을 맡은 사람 세 명에게 실제 일을 물어본다",
    check: "해볼 만한 역할과 그렇지 않은 역할의 구분",
  },
  5: {
    goal: "쌓인 경험을 바탕으로 다음 5년의 방향을 다시 정한다",
    action: "지난 기록을 돌아보며 유지할 것과 바꿀 것을 정리한다",
    check: "다음 계획에 담을 선택과 그 이유",
  },
};

/** A real, operable piece of the product instead of a decorative hero image. */
export function LandingPlanPreview() {
  const reduceMotion = useReducedMotion();
  const [activeYear, setActiveYear] = useState<PlanOdysseyYearIndex>(1);
  const example = EXAMPLE_YEARS[activeYear];

  return (
    <figure className="min-w-0 rounded-xl border border-line bg-surface p-5 sm:p-6">
      <figcaption className="text-xs font-medium text-ink-3">
        예시: A. 지금 이어가는 삶 · 연차를 눌러 보세요
      </figcaption>
      <div className="mt-2">
        <YearTimeline
          idPrefix={TIMELINE_ID}
          label="예시 계획의 연차 선택"
          activeYear={activeYear}
          onChange={setActiveYear}
        />
      </div>
      <motion.div
        key={activeYear}
        id={yearPanelId(TIMELINE_ID)}
        role="tabpanel"
        aria-labelledby={yearTabId(TIMELINE_ID, activeYear)}
        initial={reduceMotion ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        className="mt-4 min-h-[13rem] border-t border-line pt-4 sm:min-h-[12rem]"
      >
        <p className="text-base font-semibold leading-snug tracking-tight text-ink">
          {example.goal}
        </p>
        <p className="mt-3 text-xs text-ink-3">행동</p>
        <p className="text-sm leading-relaxed text-ink-2">{example.action}</p>
        <p className="mt-3 text-xs text-ink-3">확인 기준</p>
        <p className="text-sm leading-relaxed text-ink-2">{example.check}</p>
      </motion.div>
    </figure>
  );
}
