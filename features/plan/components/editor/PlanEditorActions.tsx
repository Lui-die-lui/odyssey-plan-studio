"use client";

export type PlanEditorMode = "create" | "edit";

export type PlanEditorActionsProps = {
  mode: PlanEditorMode;
  isSubmitting: boolean;
  isValid: boolean;
  submitLabel: string;
  submittingLabel?: string;
  onReset?: () => void;
  resetLabel?: string;
  /** e.g. 로그인 시 저장된다는 안내 */
  footnote?: string;
};

export function PlanEditorActions({
  mode,
  isSubmitting,
  isValid,
  submitLabel,
  submittingLabel = "저장 중…",
  onReset,
  resetLabel = "초기화",
  footnote,
}: PlanEditorActionsProps) {
  void mode;
  return (
    <div className="flex flex-col gap-3 border-t border-zinc-200/80 pt-6 dark:border-white/10">
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
        {onReset ? (
          <button
            type="button"
            onClick={onReset}
            disabled={isSubmitting}
            className="inline-flex h-11 items-center justify-center rounded-full border border-zinc-200 bg-white px-6 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 sm:mr-auto"
          >
            {resetLabel}
          </button>
        ) : null}
        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className="inline-flex h-11 min-w-[9rem] items-center justify-center rounded-full bg-zinc-900 px-8 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          {isSubmitting ? submittingLabel : submitLabel}
        </button>
      </div>
      {footnote ? (
        <p className="text-center text-xs text-zinc-500 dark:text-zinc-400 sm:text-right">
          {footnote}
        </p>
      ) : null}
    </div>
  );
}
