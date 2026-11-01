import type { ReactNode } from "react";

import { pageTitleClass } from "@/components/common/ui";

export function PlanEditorPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-6 sm:mb-8">
      {eyebrow ? <p className="mb-1.5 text-xs font-medium text-accent">{eyebrow}</p> : null}
      <div className="flex items-start justify-between gap-3 sm:gap-4">
        <h1 className={`min-w-0 flex-1 ${pageTitleClass}`}>{title}</h1>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
      <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-ink-2">{description}</p>
    </header>
  );
}
