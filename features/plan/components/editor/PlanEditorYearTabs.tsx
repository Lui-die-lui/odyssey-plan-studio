"use client";

import { PLAN_ODYSSEY_YEAR_INDICES } from "../../constants/plan.constants";
import type { PlanOdysseyYearIndex } from "../../constants/plan.constants";

export type PlanEditorYearTabsProps = {
  activeYear: PlanOdysseyYearIndex;
  onChange: (year: PlanOdysseyYearIndex) => void;
};

export function PlanEditorYearTabs({
  activeYear,
  onChange,
}: PlanEditorYearTabsProps) {
  return (
    <div
      className="flex rounded-full border border-zinc-200/90 bg-zinc-100/80 p-0.5 dark:border-white/10 dark:bg-zinc-800/50"
      role="tablist"
      aria-label="연도 선택"
    >
      {PLAN_ODYSSEY_YEAR_INDICES.map((idx) => {
        const selected = activeYear === idx;
        return (
          <button
            key={idx}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(idx)}
            className={
              "min-w-0 flex-1 rounded-full px-1 py-1.5 text-center text-[11px] font-medium tracking-wide transition-colors sm:px-1.5 sm:py-2 sm:text-xs " +
              (selected
                ? "bg-zinc-900 text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200")
            }
          >
            <span className="sm:hidden">{idx}Y</span>
            <span className="hidden sm:inline">{idx}년차</span>
          </button>
        );
      })}
    </div>
  );
}
