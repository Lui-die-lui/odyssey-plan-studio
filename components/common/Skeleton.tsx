/** Static placeholder; pass size and radius through `className`. */
export function Skeleton({ className }: { className: string }) {
  return (
    <span
      className={`block bg-line/70 ${className}`}
    />
  );
}
