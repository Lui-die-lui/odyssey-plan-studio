"use client";

import { useEffect, useRef, type ReactNode } from "react";

type ModalShellProps = {
  open: boolean;
  onClose?: () => void;
  titleId: string;
  /** When false, no close control is rendered (blocking dialogs). */
  showCloseButton?: boolean;
  children: ReactNode;
};

/**
 * Native `<dialog>`: the browser handles the focus trap, Esc, inert background
 * and returning focus to the control that opened it.
 */
export function ModalShell({
  open,
  onClose,
  titleId,
  showCloseButton = true,
  children,
}: ModalShellProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose?.();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl border border-line bg-raised p-0 text-ink backdrop:bg-black/50"
    >
      {open ? (
        <div className="relative p-6">
          {showCloseButton && onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="absolute right-3 top-3 min-h-10 cursor-pointer rounded-lg px-2.5 text-sm text-ink-3 transition-colors hover:bg-line/50 hover:text-ink"
            >
              닫기
            </button>
          ) : null}
          {children}
        </div>
      ) : null}
    </dialog>
  );
}
