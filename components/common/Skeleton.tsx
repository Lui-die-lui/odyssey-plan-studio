/** Pulsing placeholder; pass size and radius through `className`. */
export function Skeleton({ className }: { className: string }) {
  return (
    <span
      className={`block animate-pulse bg-zinc-200/80 dark:bg-zinc-700/60 ${className}`}
    />
  );
}
