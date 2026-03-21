"use client";

import { PLAN_SCORE_MAX, PLAN_SCORE_MIN } from "../constants/plan.constants";

const LEVELS = [1, 2, 3, 4, 5] as const;

export type PlanDistanceScaleProps = {
  value: number;
  onChange: (value: number) => void;
  leftLabel: string;
  rightLabel: string;
  /** For accessibility: ties to visible heading text */
  ariaLabelledBy?: string;
  className?: string;
};

/**
 * Five-step segmented scale (1–5). Slim pill track with comfortable tap targets.
 */
export function PlanDistanceScale({
  value,
  onChange,
  leftLabel,
  rightLabel,
  ariaLabelledBy,
  className = "",
}: PlanDistanceScaleProps) {
  const clamped = Math.min(
    PLAN_SCORE_MAX,
    Math.max(PLAN_SCORE_MIN, Math.round(value)),
  );

  return (
    <div
      className={`flex w-full max-w-full flex-col gap-1 ${className}`}
      role="radiogroup"
      aria-labelledby={ariaLabelledBy}
    >
      <div className="flex gap-1">
        {LEVELS.map((level) => {
          const selected = level <= clamped;
          return (
            <button
              key={level}
              type="button"
              role="radio"
              aria-checked={clamped === level}
              aria-label={`${level}점`}
              onClick={() => onChange(level)}
              className="group flex min-h-10 min-w-0 flex-1 items-center px-0.5 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/50 focus-visible:ring-offset-1 sm:min-h-9 dark:focus-visible:ring-zinc-500 dark:focus-visible:ring-offset-zinc-950"
            >
              <span
                className={
                  selected
                    ? "block h-[10px] w-full rounded-full bg-zinc-900 transition-colors group-hover:bg-zinc-800 dark:bg-zinc-200 dark:group-hover:bg-zinc-300"
                    : "block h-[10px] w-full rounded-full border border-zinc-200/90 bg-white transition-colors group-hover:border-zinc-300 group-hover:bg-zinc-50/90 dark:border-zinc-500 dark:bg-transparent dark:group-hover:border-zinc-400"
                }
              />
            </button>
          );
        })}
      </div>
      <div className="flex justify-between px-0.5 text-[11px] font-normal leading-tight text-zinc-400 dark:text-zinc-500">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </div>
  );
}
