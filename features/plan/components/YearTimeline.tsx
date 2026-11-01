"use client";

import { useRef, type KeyboardEvent, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

import {
  PLAN_ODYSSEY_YEAR_INDICES,
  type PlanOdysseyYearIndex,
} from "../constants/plan.constants";
import { PLAN_YEAR_HORIZON } from "../constants/plan-horizon.constants";

export const yearTabId = (idPrefix: string, year: PlanOdysseyYearIndex) =>
  `${idPrefix}-tab-${year}`;
export const yearPanelId = (idPrefix: string) => `${idPrefix}-panel`;

export type YearTimelineProps = {
  /** Unique per page; also names the shared selection marker animation. */
  idPrefix: string;
  label: string;
  activeYear: PlanOdysseyYearIndex;
  onChange: (year: PlanOdysseyYearIndex) => void;
  /** Years the user has filled in take on their color, like the background field. */
  isYearFilled?: (year: PlanOdysseyYearIndex) => boolean;
  /** Extra content per year, such as a goal preview or a progress count. */
  renderYearDetail?: (year: PlanOdysseyYearIndex) => ReactNode;
};

function YearNode({
  year,
  active,
  filled,
}: {
  year: PlanOdysseyYearIndex;
  active: boolean;
  filled: boolean;
}) {
  const { firm, color } = PLAN_YEAR_HORIZON[year];
  return (
    <span
      aria-hidden
      style={filled ? { borderColor: color, backgroundColor: color } : undefined}
      className={
        "relative z-10 block size-3 rounded-full border-[1.5px] transition-colors duration-150 " +
        (active
          ? "border-accent bg-accent"
          : firm
            ? "border-ink-3 bg-ink-3"
            : "border-dashed border-ink-3 bg-canvas")
      }
    />
  );
}

/**
 * The product's signature control: five years on one line. The line is solid
 * through the firm years and dashed after, so distance reads as uncertainty.
 * Implements the WAI tabs pattern; only the active tab is in the tab order.
 */
export function YearTimeline({
  idPrefix,
  label,
  activeYear,
  onChange,
  isYearFilled,
  renderYearDetail,
}: YearTimelineProps) {
  const reduceMotion = useReducedMotion();
  const tabRefs = useRef(new Map<PlanOdysseyYearIndex, HTMLButtonElement>());

  const select = (year: PlanOdysseyYearIndex) => {
    onChange(year);
    tabRefs.current.get(year)?.focus();
  };

  const onKeyDown = (e: KeyboardEvent, index: number) => {
    const years = PLAN_ODYSSEY_YEAR_INDICES;
    const target = {
      ArrowRight: years[Math.min(index + 1, years.length - 1)],
      ArrowLeft: years[Math.max(index - 1, 0)],
      Home: years[0],
      End: years[years.length - 1],
    }[e.key];
    if (!target) return;
    e.preventDefault();
    select(target);
  };

  return (
    <div className="relative">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-[1.1rem] flex">
        <span className="ml-[0.375rem] w-[calc(40%-0.375rem)] border-t-[1.5px] border-ink-3" />
        <span className="flex-1 border-t-[1.5px] border-dashed border-line-strong" />
      </div>

      <div role="tablist" aria-label={label} className="grid grid-cols-5 gap-x-1 sm:gap-x-3">
        {PLAN_ODYSSEY_YEAR_INDICES.map((year, index) => {
          const active = year === activeYear;
          return (
            <button
              key={year}
              ref={(el) => {
                if (el) tabRefs.current.set(year, el);
                else tabRefs.current.delete(year);
              }}
              type="button"
              role="tab"
              id={yearTabId(idPrefix, year)}
              aria-selected={active}
              aria-controls={yearPanelId(idPrefix)}
              tabIndex={active ? 0 : -1}
              onClick={() => onChange(year)}
              onKeyDown={(e) => onKeyDown(e, index)}
              className="group relative flex min-h-14 min-w-0 cursor-pointer flex-col items-start rounded-lg pb-2 pt-3 text-left"
            >
              <span className="relative flex h-3 items-center">
                {active ? (
                  <motion.span
                    layoutId={reduceMotion ? undefined : `${idPrefix}-marker`}
                    transition={{ type: "spring", stiffness: 520, damping: 42 }}
                    aria-hidden
                    className="absolute -inset-[5px] rounded-full bg-accent/20"
                  />
                ) : null}
                <YearNode year={year} active={active} filled={isYearFilled?.(year) ?? false} />
              </span>
              <span
                className={
                  "mt-2 text-sm font-medium transition-colors duration-150 " +
                  (active ? "text-ink" : "text-ink-3 group-hover:text-ink")
                }
              >
                {year}년차
              </span>
              <span className="hidden text-xs text-ink-3 sm:block">
                {PLAN_YEAR_HORIZON[year].label}
              </span>
              {renderYearDetail ? renderYearDetail(year) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
