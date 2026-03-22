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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {title}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            {description}
          </p>
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
            {actions}
          </div>
        ) : null}
      </div>
    </header>
  );
}
