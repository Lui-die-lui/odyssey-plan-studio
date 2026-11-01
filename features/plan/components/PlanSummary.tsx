"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion, type PanInfo } from "framer-motion";

import { Notice } from "@/components/common/Notice";
import { buttonClass, helpTextClass, sectionTitleClass } from "@/components/common/ui";
import { computePlanFill } from "@/features/field/future-field-core";
import { setFieldFill } from "@/features/field/future-field-store";

import type { PlanYearDto, SavedPlanResponse } from "../types/plan.types";
import {
  PLAN_ODYSSEY_YEAR_INDICES,
  type PlanOdysseyYearIndex,
} from "../constants/plan.constants";
import { PLAN_YEAR_HORIZON } from "../constants/plan-horizon.constants";
import {
  PLAN_RATING_AVERAGE_LABEL,
  PLAN_RATING_OVERALL_LABEL,
  PLAN_RATING_SCALE_NOTE,
  PLAN_SCORE_KEYS,
  PLAN_SCORE_LABELS,
  PLAN_UNRATED_LABEL,
  PLAN_UNVERIFIED_SCORES_NOTE,
} from "../constants/plan-score.constants";
import {
  AI_SUGGESTION_LABEL,
  getYearGoalLines,
  isAiGuidanceOutdated,
} from "../lib/plan-ai-guidance";
import type { PlanRatingSummary } from "../lib/plan-summary-stats";
import {
  compareCategoryRatings,
  countUnverifiedScores,
  describeCategoryComparison,
  formatRatingOneDecimal,
  summarizeCategoryRatings,
  summarizeOverallRating,
  summarizeYearRating,
} from "../lib/plan-summary-stats";
import { PlanYearGuidanceDetails } from "./PlanYearGuidanceDetails";
import { YearTimeline, yearPanelId, yearTabId } from "./YearTimeline";

export type PlanSummaryProps = {
  plan: SavedPlanResponse;
  /** Three-path plans compare whole paths, so yearly rating sections stay hidden. */
  showRatingSummary?: boolean;
  showYearRatings?: boolean;
  /** Off when a parent reports the fill for several paths together. */
  reportFill?: boolean;
};

const TIMELINE_ID = "plan-summary-years";
const SWIPE_DISTANCE_PX = 56;

function ratingText(rating: PlanRatingSummary): string {
  if (rating.average === null) return PLAN_UNRATED_LABEL;
  const partial =
    rating.ratedCount < rating.totalCount
      ? ` (${rating.ratedCount}/${rating.totalCount}개 평가)`
      : "";
  return `${formatRatingOneDecimal(rating.average)} / 5${partial}`;
}

function yearOriginLabel(year: PlanYearDto): string {
  if (!year.aiGuidance) return "직접 작성";
  return isAiGuidanceOutdated(
    year.aiGuidance,
    year.goals.map((g) => g.text),
  )
    ? "AI 초안을 내가 수정"
    : AI_SUGGESTION_LABEL;
}

function YearPanelBody({ year, showRatings }: { year: PlanYearDto; showRatings: boolean }) {
  const lines = getYearGoalLines(year.aiGuidance, year.goals);
  const goal = lines.find((line) => line.role === "goal");
  const actions = lines.filter((line) => line.role === "action");
  const plainLines = lines.filter((line) => line.role === "plain");
  const horizon = PLAN_YEAR_HORIZON[year.yearIndex];
  const note = year.note?.trim();
  const rating = summarizeYearRating(year.scores);

  return (
    <div>
      <p className="text-xs text-ink-3">
        {year.yearIndex}년차 · {horizon.label} · {yearOriginLabel(year)}
      </p>

      {goal ? (
        <p className="mt-2 text-lg font-semibold leading-snug tracking-tight text-ink sm:text-xl">
          {goal.text}
        </p>
      ) : null}

      {actions.length ? (
        <section className="mt-5">
          <h3 className="text-sm font-medium text-ink-3">행동</h3>
          <ul className="mt-1.5 flex flex-col gap-1.5">
            {actions.map((action) => (
              <li key={action.id} className="text-[15px] leading-relaxed text-ink">
                {action.text}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {plainLines.length ? (
        <ul className="mt-3 flex flex-col gap-2">
          {plainLines.map((line) => (
            <li key={line.id} className="text-[15px] leading-relaxed text-ink">
              {line.text}
            </li>
          ))}
        </ul>
      ) : null}

      {!lines.length ? (
        <p className={`${helpTextClass} mt-3`}>
          이 해에는 아직 목표가 없어요. 수정 화면에서 추가할 수 있습니다.
        </p>
      ) : null}

      {year.aiGuidance ? (
        <section className="mt-5 border-l-2 border-line-strong pl-3">
          <h3 className="text-sm font-medium text-ink-3">확인 기준</h3>
          <p className="mt-1 text-[15px] leading-relaxed text-ink-2">
            {year.aiGuidance.checkpoint}
          </p>
        </section>
      ) : null}

      {year.aiGuidance ? (
        <PlanYearGuidanceDetails
          className="mt-4"
          guidance={year.aiGuidance}
          goalTexts={year.goals.map((g) => g.text)}
          hideCheckpoint
        />
      ) : null}

      {note ? (
        <section className="mt-4">
          <h3 className="text-sm font-medium text-ink-3">메모</h3>
          <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-ink-2">{note}</p>
        </section>
      ) : null}

      {year.keywords.length ? (
        <p className="mt-4 text-sm text-ink-3">
          키워드: {year.keywords.map((k) => k.text).join(" · ")}
        </p>
      ) : null}

      {showRatings ? (
      <section className="mt-5 border-t border-line pt-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h3 className="text-sm font-medium text-ink-3">내 자기평가</h3>
          <p className="text-sm tabular-nums text-ink-2">
            {PLAN_RATING_AVERAGE_LABEL} {ratingText(rating)}
          </p>
        </div>
        <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-4">
          {PLAN_SCORE_KEYS.map((key) => (
            <div key={key}>
              <dt className="text-xs text-ink-3">{PLAN_SCORE_LABELS[key].ko}</dt>
              <dd className="text-sm tabular-nums text-ink-2">
                {year.scores[key] ?? PLAN_UNRATED_LABEL}
              </dd>
            </div>
          ))}
        </dl>
      </section>
      ) : null}
    </div>
  );
}

function RatingSummarySection({ years }: { years: PlanYearDto[] }) {
  const overall = summarizeOverallRating(years);
  const categoryRatings = summarizeCategoryRatings(years);
  const comparison = describeCategoryComparison(compareCategoryRatings(categoryRatings));

  return (
    <section aria-labelledby="plan-rating-summary" className="border-t border-line pt-6">
      <h2 id="plan-rating-summary" className={sectionTitleClass}>
        자기평가 요약
      </h2>
      <p className={`${helpTextClass} mt-0.5`}>{PLAN_RATING_SCALE_NOTE}</p>

      <div className="mt-4 grid grid-cols-1 gap-x-10 gap-y-5 md:grid-cols-2">
        <dl className="flex flex-col text-sm">
          {[
            [PLAN_RATING_OVERALL_LABEL, ratingText(overall)],
            ["평가 완료", `${overall.ratedCount} / ${overall.totalCount}`],
            ["가장 높은 항목", comparison.highest],
            ["가장 낮은 항목", comparison.lowest],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4 border-b border-line py-2">
              <dt className="text-ink-3">{label}</dt>
              <dd className="text-right tabular-nums text-ink-2">{value}</dd>
            </div>
          ))}
        </dl>
        <dl className="flex flex-col text-sm">
          {PLAN_SCORE_KEYS.map((key) => (
            <div key={key} className="flex justify-between gap-4 border-b border-line py-2">
              <dt className="min-w-0">
                <span className="text-ink-2">{PLAN_SCORE_LABELS[key].ko}</span>
                <span className="ml-1.5 text-xs text-ink-3">{PLAN_SCORE_LABELS[key].en}</span>
              </dt>
              <dd className="shrink-0 tabular-nums text-ink-2">
                {ratingText(categoryRatings[key])}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

/**
 * Five years on one timeline. Larger screens compare every year's goal in the
 * tabs themselves; the panel below always belongs to the selected year.
 */
const PlanSummary = ({
  plan,
  showRatingSummary = true,
  showYearRatings = true,
  reportFill = true,
}: PlanSummaryProps) => {
  const reduceMotion = useReducedMotion();
  const [activeYear, setActiveYear] = useState<PlanOdysseyYearIndex>(1);
  const [direction, setDirection] = useState(1);
  // Dragging with a mouse would get in the way of selecting text.
  const [swipeEnabled] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches,
  );

  const byYear = new Map(plan.years.map((y) => [y.yearIndex, y]));
  const orderedYears = PLAN_ODYSSEY_YEAR_INDICES.flatMap((idx) => byYear.get(idx) ?? []);
  const year = byYear.get(activeYear);
  const yearPosition = PLAN_ODYSSEY_YEAR_INDICES.indexOf(activeYear);
  const previousYear = PLAN_ODYSSEY_YEAR_INDICES[yearPosition - 1];
  const nextYear = PLAN_ODYSSEY_YEAR_INDICES[yearPosition + 1];
  const unverifiedCount = countUnverifiedScores(orderedYears);

  useEffect(() => {
    if (reportFill) setFieldFill(computePlanFill(plan.years));
  }, [reportFill, plan.years]);

  const goTo = (target: PlanOdysseyYearIndex) => {
    setDirection(target >= activeYear ? 1 : -1);
    setActiveYear(target);
  };

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x <= -SWIPE_DISTANCE_PX && nextYear) goTo(nextYear);
    if (info.offset.x >= SWIPE_DISTANCE_PX && previousYear) goTo(previousYear);
  };

  return (
    <div className="flex w-full flex-col gap-8">
      {unverifiedCount > 0 ? (
        <Notice>
          {PLAN_UNVERIFIED_SCORES_NOTE} 평균에 해당 점수 {unverifiedCount}개가 포함되어 있어요.
          수정 화면에서 확인할 수 있습니다.
        </Notice>
      ) : null}

      <div>
        <YearTimeline
          idPrefix={TIMELINE_ID}
          label="연차 선택"
          activeYear={activeYear}
          onChange={goTo}
          isYearFilled={(idx) => (byYear.get(idx)?.goals.length ?? 0) > 0}
          renderYearDetail={(idx) => {
            const goals = byYear.get(idx)?.goals;
            const preview = goals?.length
              ? getYearGoalLines(byYear.get(idx)?.aiGuidance, goals)[0]?.text
              : "아직 비어 있음";
            return (
              <span
                className={
                  "mt-2 hidden overflow-hidden text-sm leading-snug [-webkit-box-orient:vertical] [-webkit-line-clamp:4] lg:[display:-webkit-box] " +
                  (idx === activeYear ? "text-ink" : "text-ink-3")
                }
              >
                {preview}
              </span>
            );
          }}
        />

        <div className="mt-4 overflow-hidden rounded-xl border border-line bg-surface">
          <motion.div
            key={activeYear}
            id={yearPanelId(TIMELINE_ID)}
            role="tabpanel"
            tabIndex={0}
            aria-labelledby={yearTabId(TIMELINE_ID, activeYear)}
            initial={reduceMotion ? false : { opacity: 0, x: 18 * direction }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            drag={swipeEnabled && !reduceMotion ? "x" : false}
            dragDirectionLock
            dragSnapToOrigin
            dragElastic={0.08}
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={onDragEnd}
            className="touch-pan-y p-5 outline-offset-[-2px] sm:p-7"
          >
            {year ? (
              <YearPanelBody year={year} showRatings={showYearRatings} />
            ) : (
              <p className={helpTextClass}>이 해에는 아직 내용이 없어요.</p>
            )}
          </motion.div>
        </div>

        <div className="mt-3 flex justify-between gap-2">
          <button
            type="button"
            disabled={!previousYear}
            onClick={() => previousYear && goTo(previousYear)}
            className={buttonClass("secondary", "flex-1 sm:flex-none")}
          >
            {previousYear ? `${previousYear}년차` : "첫 해"}
          </button>
          <button
            type="button"
            disabled={!nextYear}
            onClick={() => nextYear && goTo(nextYear)}
            className={buttonClass("secondary", "flex-1 sm:flex-none")}
          >
            {nextYear ? `${nextYear}년차` : "마지막 해"}
          </button>
        </div>
      </div>

      {showRatingSummary ? <RatingSummarySection years={orderedYears} /> : null}
    </div>
  );
};

export default PlanSummary;
