"use client";

import { useMemo, useState } from "react";

import type { PlanYearDto, SavedPlanResponse } from "../types/plan.types";
import type { PlanOdysseyYearIndex } from "../constants/plan.constants";
import { PLAN_ODYSSEY_YEAR_INDICES } from "../constants/plan.constants";
import type { PlanSummaryCategoryKey } from "../lib/plan-summary-stats";
import {
  computeCategoryAverages,
  formatDistanceOneDecimal,
  highestAndLowestCategory,
  overallAverageDistance,
  yearAverageDistance,
  yearWithHighestAverage,
} from "../lib/plan-summary-stats";

export type PlanSummaryProps = {
  plan: SavedPlanResponse | null;
  emptyStateMessage?: string;
};

const CATEGORY_LABELS: Record<
  PlanSummaryCategoryKey,
  { en: string; ko: string }
> = {
  resources: { en: "RESOURCES", ko: "현실 여건과 자원" },
  interest: { en: "INTEREST", ko: "하고 싶은 마음" },
  confidence: { en: "CONFIDENCE", ko: "해낼 수 있다는 감각" },
  coherence: { en: "COHERENCE", ko: "나 다운 방향과의 일치감" },
};

const CATEGORY_KEYS = Object.keys(CATEGORY_LABELS) as PlanSummaryCategoryKey[];

function YearDistanceBar({
  yearLabel,
  value,
  highlight,
}: {
  yearLabel: string;
  value: number;
  highlight?: boolean;
}) {
  const pct = Math.min(100, Math.max(0, (value / 5) * 100));
  const fill =
    highlight
      ? "bg-[#2E3F66] dark:bg-[#8FA8C9]"
      : "bg-[#CEDAE9] dark:bg-zinc-200";
  return (
    <div className="flex items-center gap-2">
      <span className="w-9 shrink-0 text-xs font-medium text-zinc-600 dark:text-zinc-400">
        {yearLabel}
      </span>
      <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div
          className={`h-full rounded-full ${fill}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-10 shrink-0 text-right text-xs tabular-nums text-zinc-700 dark:text-zinc-300">
        {formatDistanceOneDecimal(value)}
      </span>
    </div>
  );
}

function YearDetailCard({
  idx,
  y,
  avg,
  className = "",
}: {
  idx: PlanOdysseyYearIndex;
  y: PlanYearDto;
  avg: number;
  className?: string;
}) {
  return (
    <article
      className={
        "flex h-full min-h-[220px] flex-col bg-white p-4 dark:bg-zinc-950 " +
        className
      }
    >
      <div className="min-h-0 shrink-0">
        <h3 className="text-xl font-bold tracking-tight text-black dark:text-zinc-50 lg:text-sm">
          {idx}Y
        </h3>

        {y.goals.length > 0 ? (
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-snug text-zinc-700 dark:text-zinc-300 lg:mt-2 lg:pl-4 lg:text-xs">
            {y.goals.map((g) => (
              <li key={g.id}>{g.text}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-zinc-500 lg:mt-2 lg:text-xs">
            목표 없음
          </p>
        )}
      </div>

      <div className="mt-auto flex min-h-0 flex-col">
        {y.keywords.length > 0 || y.note ? (
          <div className="mb-3 mt-3 flex flex-col gap-2 lg:mb-2 lg:mt-2 lg:gap-1.5">
            {y.keywords.length > 0 ? (
              <div className="flex flex-wrap gap-2 lg:gap-1.5">
                {y.keywords.map((k) => (
                  <span
                    key={k.id}
                    className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-white dark:bg-zinc-700 lg:px-2.5 lg:py-0.5 lg:text-[11px]"
                  >
                    {k.text}
                  </span>
                ))}
              </div>
            ) : null}
            {y.note ? (
              <p className="line-clamp-2 text-xs text-zinc-500 dark:text-zinc-400 lg:text-[11px]">
                {y.note}
              </p>
            ) : null}
          </div>
        ) : null}
        <div className="flex items-center justify-between border-t border-black/5 pt-4 text-sm text-zinc-600 dark:border-white/10 dark:text-zinc-400 lg:pt-3 lg:text-xs">
          <span>평균 거리</span>
          <span className="tabular-nums text-zinc-900 dark:text-zinc-100">
            <span className="text-base font-bold tracking-tight lg:text-sm">
              {formatDistanceOneDecimal(avg)}
            </span>
            <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">
              {" "}
              / 5
            </span>
          </span>
        </div>
      </div>
    </article>
  );
}

const PlanSummary = ({ plan, emptyStateMessage }: PlanSummaryProps) => {
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [mobileChartsOpen, setMobileChartsOpen] = useState(false);

  const slides = useMemo(() => {
    if (!plan?.years?.length) return [];
    const by = new Map(plan.years.map((y) => [y.yearIndex, y]));
    return PLAN_ODYSSEY_YEAR_INDICES.map((idx) => {
      const y = by.get(idx);
      return y ? { idx, y } : null;
    }).filter(
      (s): s is { idx: PlanOdysseyYearIndex; y: PlanYearDto } => s != null,
    );
  }, [plan]);

  if (!plan) {
    return (
      <div className="w-full rounded-md border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-black">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {emptyStateMessage ?? "No plan saved yet."}
        </p>
      </div>
    );
  }

  const byYear = new Map(plan.years.map((y) => [y.yearIndex, y]));
  const orderedYears = PLAN_ODYSSEY_YEAR_INDICES.map((idx) => byYear.get(idx)).filter(
    (y): y is NonNullable<typeof y> => y != null,
  );

  const overall = overallAverageDistance(orderedYears);
  const categoryAvgs = computeCategoryAverages(orderedYears);
  const { highest, lowest } = highestAndLowestCategory(categoryAvgs);
  const bestYearIdx = yearWithHighestAverage(orderedYears);

  const effectiveCarouselIndex =
    slides.length > 0 ? Math.min(carouselIndex, slides.length - 1) : 0;
  const currentSlide = slides[effectiveCarouselIndex];
  const highlightedYearForBars = currentSlide?.idx;

  const goPrev = () => {
    if (!slides.length) return;
    setCarouselIndex((prev) => {
      const i = Math.min(prev, slides.length - 1);
      return (i - 1 + slides.length) % slides.length;
    });
  };

  const goNext = () => {
    if (!slides.length) return;
    setCarouselIndex((prev) => {
      const i = Math.min(prev, slides.length - 1);
      return (i + 1) % slides.length;
    });
  };

  return (
    <div
      className={
        "flex w-full flex-col gap-6 lg:gap-8 " +
        "lg:rounded-md lg:border lg:border-black/10 lg:bg-white lg:p-6 lg:shadow-sm " +
        "dark:lg:border-white/10 dark:lg:bg-black"
      }
    >
      <header className="flex flex-col gap-1 border-b border-black/10 pb-4 dark:border-white/10 lg:border-0 lg:pb-0">
        <h2 className="text-xl font-semibold tracking-tight text-black dark:text-zinc-50 lg:text-lg">
          {plan.title ?? "My Odyssey Plan"}
        </h2>
      </header>

      <section aria-label="년차별 요약">
        {/* Mobile: carousel */}
        <div className="lg:hidden">
          {slides.length > 0 ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={goPrev}
                disabled={slides.length < 2}
                className="flex size-11 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white text-xl leading-none text-zinc-600 shadow-sm transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-30 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                aria-label="이전 년차"
              >
                ‹
              </button>
              <div className="flex min-h-[220px] min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-md dark:border-white/10 dark:bg-zinc-950">
                <div
                  className="flex min-h-0 flex-1 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none"
                  style={{
                    width: `${slides.length * 100}%`,
                    transform: `translateX(-${(100 / slides.length) * effectiveCarouselIndex}%)`,
                  }}
                >
                  {slides.map((s) => (
                    <div
                      key={s.y.id}
                      className="flex h-full shrink-0 self-stretch"
                      style={{ width: `${100 / slides.length}%` }}
                    >
                      <YearDetailCard
                        idx={s.idx}
                        y={s.y}
                        avg={yearAverageDistance(s.y.scores)}
                        className="h-full w-full rounded-2xl"
                      />
                    </div>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={goNext}
                disabled={slides.length < 2}
                className="flex size-11 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white text-xl leading-none text-zinc-600 shadow-sm transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-30 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                aria-label="다음 년차"
              >
                ›
              </button>
            </div>
          ) : null}
          {slides.length > 1 ? (
            <p className="mt-2 text-center text-xs text-zinc-500">
              {effectiveCarouselIndex + 1} / {slides.length}
            </p>
          ) : null}
        </div>

        {/* Desktop: 5-column grid */}
        <div className="hidden gap-3 lg:grid lg:grid-cols-2 xl:grid-cols-5">
          {PLAN_ODYSSEY_YEAR_INDICES.map((idx) => {
            const y = byYear.get(idx);
            if (!y) return null;
            const avg = yearAverageDistance(y.scores);
            return (
              <div
                key={y.id}
                className="flex h-full min-h-[220px] flex-col overflow-hidden rounded-lg border border-black/10 shadow-sm dark:border-white/10"
              >
                <YearDetailCard idx={idx} y={y} avg={avg} className="h-full p-3" />
              </div>
            );
          })}
        </div>
      </section>

      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-2 lg:gap-6">
        <section
          className={
            "overflow-hidden rounded-2xl border border-black/10 bg-white shadow-md dark:border-white/10 dark:bg-zinc-950 " +
            "lg:rounded-lg lg:bg-app-canvas/80 lg:shadow-none dark:lg:bg-zinc-950/50"
          }
          aria-label="전체 평균 거리"
        >
          {/* Mobile: collapsible chart */}
          <div className="lg:hidden">
            <button
              type="button"
              onClick={() => setMobileChartsOpen((o) => !o)}
              className="flex w-full items-start gap-3 p-4 text-left"
              aria-expanded={mobileChartsOpen}
            >
              <div className="min-w-0 flex-1">
                <p className="text-base font-bold text-black dark:text-zinc-50">
                  전체 평균 거리{" "}
                  <span className="tabular-nums">
                    {formatDistanceOneDecimal(overall)}
                  </span>{" "}
                  <span className="text-sm font-normal text-zinc-500">/ 5</span>
                </p>
                <ul className="mt-3 list-disc space-y-2 pl-4 text-sm text-zinc-700 dark:text-zinc-300">
                  <li>
                    <span className="text-zinc-500">가장 높은 항목 </span>
                    <span className="font-medium text-black dark:text-zinc-100">
                      {CATEGORY_LABELS[highest].en}
                    </span>
                  </li>
                  <li>
                    <span className="text-zinc-500">가장 낮은 항목 </span>
                    <span className="font-medium text-black dark:text-zinc-100">
                      {CATEGORY_LABELS[lowest].en}
                    </span>
                  </li>
                  <li>
                    <span className="text-zinc-500">성취 확률 높은 년도 </span>
                    <span className="font-medium text-black dark:text-zinc-100">
                      {bestYearIdx != null ? `${bestYearIdx}Y` : "—"}
                    </span>
                  </li>
                </ul>
              </div>
              <span
                className="mt-1 shrink-0 text-lg text-zinc-400 transition-transform duration-200"
                style={{
                  transform: mobileChartsOpen ? "rotate(90deg)" : "none",
                }}
                aria-hidden
              >
                ›
              </span>
            </button>
            {mobileChartsOpen ? (
              <div className="border-t border-black/5 px-4 pb-4 pt-3 dark:border-white/10">
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  년도별 평균
                </p>
                <div className="mt-3 flex flex-col gap-2.5">
                  {PLAN_ODYSSEY_YEAR_INDICES.map((idx) => {
                    const y = byYear.get(idx);
                    const v = y ? yearAverageDistance(y.scores) : 0;
                    return (
                      <YearDistanceBar
                        key={idx}
                        yearLabel={`${idx}Y`}
                        value={v}
                        highlight={idx === highlightedYearForBars}
                      />
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>

          {/* Desktop */}
          <div className="hidden flex-col gap-4 p-5 lg:flex">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-sm font-semibold text-black dark:text-zinc-50">
                전체 평균 거리
              </h3>
              <p className="text-lg font-semibold tabular-nums text-black dark:text-zinc-50">
                {formatDistanceOneDecimal(overall)}{" "}
                <span className="text-sm font-normal text-zinc-500">/ 5</span>
              </p>
            </div>

            <div className="flex flex-col gap-5 lg:flex-row lg:gap-8">
              <ul className="list-disc space-y-2 pl-4 text-sm text-zinc-700 dark:text-zinc-300 lg:min-w-[220px] lg:flex-1">
                <li>
                  <span className="text-zinc-500 dark:text-zinc-400">
                    가장 높은 항목:{" "}
                  </span>
                  <span className="font-medium text-black dark:text-zinc-100">
                    {CATEGORY_LABELS[highest].en}
                  </span>
                </li>
                <li>
                  <span className="text-zinc-500 dark:text-zinc-400">
                    가장 낮은 항목:{" "}
                  </span>
                  <span className="font-medium text-black dark:text-zinc-100">
                    {CATEGORY_LABELS[lowest].en}
                  </span>
                </li>
                <li>
                  <span className="text-zinc-500 dark:text-zinc-400">
                    성취 확률 높은 년도:{" "}
                  </span>
                  <span className="font-medium text-black dark:text-zinc-100">
                    {bestYearIdx != null ? `${bestYearIdx}Y` : "—"}
                  </span>
                </li>
              </ul>

              <div className="flex min-w-0 flex-1 flex-col gap-2.5 lg:max-w-md">
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  년도별 평균
                </p>
                {PLAN_ODYSSEY_YEAR_INDICES.map((idx) => {
                  const y = byYear.get(idx);
                  const v = y ? yearAverageDistance(y.scores) : 0;
                  return (
                    <YearDistanceBar
                      key={idx}
                      yearLabel={`${idx}Y`}
                      value={v}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section
          className={
            "overflow-hidden rounded-2xl border border-black/10 bg-white p-4 shadow-md dark:border-white/10 dark:bg-zinc-950 sm:p-5 " +
            "lg:rounded-lg lg:bg-app-canvas/80 lg:shadow-none dark:lg:bg-zinc-950/50"
          }
          aria-label="항목별 평균"
        >
          <h3 className="text-base font-bold text-black dark:text-zinc-50 lg:text-sm lg:font-semibold">
            항목별 평균
          </h3>
          <ul className="mt-4 flex flex-col divide-y divide-black/5 dark:divide-white/10">
            {CATEGORY_KEYS.map((key) => {
              const { en, ko } = CATEGORY_LABELS[key];
              return (
                <li
                  key={key}
                  className="flex items-start justify-between gap-4 py-3 first:pt-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-black dark:text-zinc-50">
                      {en}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                      {ko}
                    </p>
                  </div>
                  <p className="shrink-0 tabular-nums text-black dark:text-zinc-50">
                    <span className="text-base font-bold tracking-tight lg:text-sm lg:font-bold">
                      {formatDistanceOneDecimal(categoryAvgs[key])}
                    </span>
                    <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">
                      {" "}
                      / 5
                    </span>
                  </p>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
};

export default PlanSummary;
