/** Shared control styles, so buttons, fields and surfaces follow one set of rules. */

const buttonBase =
  "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg px-5 text-sm font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50";

const buttonVariants = {
  primary: "bg-ink text-canvas hover:bg-ink-2",
  secondary: "border border-line-strong bg-raised text-ink hover:bg-surface",
  quiet: "text-ink-2 hover:bg-line/50 hover:text-ink",
  danger: "bg-danger text-canvas hover:opacity-90",
} as const;

export function buttonClass(
  variant: keyof typeof buttonVariants = "primary",
  extra = "",
): string {
  return `${buttonBase} ${buttonVariants[variant]} ${extra}`.trim();
}

export const fieldClass =
  "w-full rounded-lg border border-line bg-raised px-3 py-2.5 text-[15px] leading-relaxed text-ink outline-none transition-colors duration-150 placeholder:text-ink-3 hover:border-line-strong focus:border-accent";

export const surfaceClass = "rounded-xl border border-line bg-surface";

export const eyebrowClass = "text-xs font-medium text-ink-3";

export const pageTitleClass =
  "text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem] sm:leading-tight";

export const sectionTitleClass = "text-base font-semibold tracking-tight text-ink";

export const helpTextClass = "text-sm leading-relaxed text-ink-3";
