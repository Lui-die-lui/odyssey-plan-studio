import type { ReactNode } from "react";

/** Centered column for plan create/edit; light background from page shell. */
export function PlanEditorLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-5 sm:py-10">
      {children}
    </div>
  );
}
