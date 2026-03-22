import type { ReactNode } from "react";

/** Centered column for plan create/edit; light background from page shell. */
export function PlanEditorLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className={
        "mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col py-8 sm:py-10 " +
        "pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] " +
        "sm:pl-[max(1.25rem,env(safe-area-inset-left))] sm:pr-[max(1.25rem,env(safe-area-inset-right))]"
      }
    >
      {children}
    </div>
  );
}
