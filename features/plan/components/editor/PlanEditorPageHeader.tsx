import type { ReactNode } from "react";

export function PlanEditorPageHeader({
  title,
  description,
  actions,
  /** 구분선 아래·본문 사이 여백 축소 (대화형 등 풀높이 UI) */
  compactBelowDivider = false,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
  compactBelowDivider?: boolean;
}) {
  return (
    <header
      className={
        compactBelowDivider
          ? "mb-3 border-b border-zinc-200/80 pb-4 dark:border-white/10"
          : "mb-8 border-b border-zinc-200/80 pb-6 dark:border-white/10"
      }
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-row items-start justify-between gap-3 sm:gap-4">
          <h1 className="min-w-0 flex-1 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {title}
          </h1>
          {actions ? (
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 pt-0.5">
              {actions}
            </div>
          ) : null}
        </div>
        <p className="max-w-xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          {description}
        </p>
      </div>
    </header>
  );
}
