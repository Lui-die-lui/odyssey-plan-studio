"use client";

import { useEffect, type ReactNode } from "react";

type ModalShellProps = {
  open: boolean;
  onClose?: () => void;
  titleId: string;
  /** When false, no ✕ control is rendered (blocking dialogs). */
  showCloseButton?: boolean;
  children: ReactNode;
};

export function ModalShell({
  open,
  onClose,
  titleId,
  showCloseButton = true,
  children,
}: ModalShellProps) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const handleBackdropClick = () => {
    onClose?.();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={handleBackdropClick}
    >
      <div
        className="relative w-full max-w-md rounded-lg border border-black/10 bg-white p-6 shadow-lg dark:border-white/10 dark:bg-zinc-950"
        onClick={(e) => e.stopPropagation()}
      >
        {showCloseButton && onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 rounded-md p-1 text-sm text-zinc-500 transition-colors hover:bg-black/[.04] hover:text-black dark:hover:bg-white/10 dark:hover:text-zinc-200"
            aria-label="Close"
          >
            ✕
          </button>
        ) : null}
        {children}
      </div>
    </div>
  );
}
