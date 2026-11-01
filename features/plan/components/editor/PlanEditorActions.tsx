"use client";

import { useState, type ReactNode } from "react";

import { buttonClass } from "@/components/common/ui";

export type PlanEditorMode = "create" | "edit";

export type PlanEditorActionsProps = {
  isSubmitting: boolean;
  canSubmit: boolean;
  submitLabel: string;
  submittingLabel?: string;
  /** Plain statement of the save state, always visible beside the save button. */
  statusText: string;
  onReset?: () => void;
  resetLabel?: string;
  error?: ReactNode;
};

/** Stays at the bottom of the screen so the save state and action are never out of reach. */
export function PlanEditorActions({
  isSubmitting,
  canSubmit,
  submitLabel,
  submittingLabel = "저장 중…",
  statusText,
  onReset,
  resetLabel = "되돌리기",
  error,
}: PlanEditorActionsProps) {
  const [confirmingReset, setConfirmingReset] = useState(false);

  return (
    <div className="sticky bottom-0 z-20 -mx-4 mt-8 border-t border-line bg-canvas px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:-mx-5 sm:px-5">
      {error ? <div className="mb-3">{error}</div> : null}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p role="status" className="min-w-0 text-sm text-ink-2">
          {isSubmitting ? submittingLabel : statusText}
        </p>
        <div className="flex flex-1 justify-end gap-2 sm:flex-none">
          {onReset ? (
            <button
              type="button"
              disabled={isSubmitting}
              onBlur={() => setConfirmingReset(false)}
              onClick={() => {
                if (!confirmingReset) {
                  setConfirmingReset(true);
                  return;
                }
                setConfirmingReset(false);
                onReset();
              }}
              className={buttonClass(confirmingReset ? "secondary" : "quiet")}
            >
              {confirmingReset ? "한 번 더 누르면 되돌려요" : resetLabel}
            </button>
          ) : null}
          <button
            type="submit"
            disabled={!canSubmit || isSubmitting}
            className={buttonClass("primary", "min-w-28")}
          >
            {isSubmitting ? submittingLabel : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
