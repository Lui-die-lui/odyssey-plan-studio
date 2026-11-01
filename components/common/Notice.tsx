import type { ReactNode } from "react";

const toneClass = {
  info: "border-line bg-surface text-ink-2",
  success: "border-accent/30 bg-accent-soft text-ink",
  error: "border-danger/30 bg-danger-soft text-danger",
} as const;

/** Inline status line. Errors interrupt screen readers; other tones wait their turn. */
export function Notice({
  tone = "info",
  children,
  action,
  className = "",
}: {
  tone?: keyof typeof toneClass;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`flex flex-col gap-2 rounded-lg border px-3.5 py-3 text-sm leading-relaxed sm:flex-row sm:items-center sm:justify-between sm:gap-4 ${toneClass[tone]} ${className}`}
    >
      <div className="min-w-0">{children}</div>
      {action ? <div className="flex shrink-0 flex-wrap gap-2">{action}</div> : null}
    </div>
  );
}
