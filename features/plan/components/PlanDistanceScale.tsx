"use client";

import { useRef, type KeyboardEvent } from "react";

import { PLAN_UNRATED_LABEL } from "../constants/plan-score.constants";
import type { PlanDistanceScore } from "../types/plan.types";

const LEVELS = [1, 2, 3, 4, 5] as const;

export type PlanDistanceScaleProps = {
  /** `null` means not rated yet; no segment is filled. */
  value: PlanDistanceScore | null;
  onChange: (value: PlanDistanceScore | null) => void;
  leftLabel: string;
  rightLabel: string;
  /** For accessibility: ties to visible heading text */
  ariaLabelledBy?: string;
  className?: string;
};

/**
 * Five-step scale (1–5) that starts unrated and can be cleared. A radio group:
 * one tab stop, and arrow keys move between levels.
 */
export function PlanDistanceScale({
  value,
  onChange,
  leftLabel,
  rightLabel,
  ariaLabelledBy,
  className = "",
}: PlanDistanceScaleProps) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (e: KeyboardEvent, level: PlanDistanceScore) => {
    const delta = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key];
    if (!delta) return;
    e.preventDefault();
    const next = Math.min(5, Math.max(1, level + delta)) as PlanDistanceScore;
    onChange(next);
    buttons.current[next - 1]?.focus();
  };

  return (
    <div className={`flex w-full max-w-full flex-col gap-1 ${className}`}>
      <div className="flex gap-1" role="radiogroup" aria-labelledby={ariaLabelledBy}>
        {LEVELS.map((level) => {
          const filled = value !== null && level <= value;
          return (
            <button
              key={level}
              ref={(el) => {
                buttons.current[level - 1] = el;
              }}
              type="button"
              role="radio"
              aria-checked={value === level}
              aria-label={`${level}점`}
              tabIndex={value === level || (value === null && level === 1) ? 0 : -1}
              onClick={() => onChange(level)}
              onKeyDown={(e) => onKeyDown(e, level)}
              className="group flex min-h-11 min-w-0 flex-1 cursor-pointer items-center rounded px-0.5"
            >
              <span
                className={
                  "block h-2 w-full rounded-full transition-colors duration-100 " +
                  (filled
                    ? "bg-accent"
                    : "border border-line-strong bg-raised group-hover:border-ink-3")
                }
              />
            </button>
          );
        })}
      </div>
      <div className="flex min-h-11 items-center justify-between gap-2 px-0.5 text-xs text-ink-3">
        <span>{leftLabel}</span>
        {value === null ? (
          <span>{PLAN_UNRATED_LABEL}</span>
        ) : (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="min-h-11 cursor-pointer rounded px-1 tabular-nums text-ink-2 underline-offset-2 hover:text-ink hover:underline"
            aria-label={`${value}점 선택 해제`}
          >
            {value}점 · 지우기
          </button>
        )}
        <span>{rightLabel}</span>
      </div>
    </div>
  );
}
