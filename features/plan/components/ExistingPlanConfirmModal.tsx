"use client";

import { ModalShell } from "@/components/common/ModalShell";

type ExistingPlanConfirmModalProps = {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  cancelLabel?: string;
  confirmLabel?: string;
  confirmBusy?: boolean;
};

/**
 * Shared confirmation dialog (same shell as login modal) before replacing an existing plan.
 */
const ExistingPlanConfirmModal = ({
  open,
  onCancel,
  onConfirm,
  title = "기존 플랜이 있습니다",
  description = "현재 저장된 플랜이 있습니다. 새로 만들면 기존 플랜이 덮어쓰기됩니다. 계속하시겠습니까?",
  cancelLabel = "취소",
  confirmLabel = "네, 새로 만들기",
  confirmBusy = false,
}: ExistingPlanConfirmModalProps) => {
  return (
    <ModalShell
      open={open}
      onClose={onCancel}
      titleId="existing-plan-confirm-title"
      showCloseButton
    >
      <h2
        id="existing-plan-confirm-title"
        className="pr-8 text-xl font-semibold tracking-tight text-black dark:text-zinc-50"
      >
        {title}
      </h2>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        {description}
      </p>

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={confirmBusy}
          className="inline-flex h-11 items-center justify-center rounded-md border border-black/10 bg-white px-4 text-sm font-medium text-black transition-colors hover:bg-black/[.03] disabled:opacity-50 dark:border-white/10 dark:bg-black dark:text-zinc-50 dark:hover:bg-white/[.05]"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={confirmBusy}
          className="inline-flex h-11 items-center justify-center rounded-md bg-black px-4 text-sm font-medium text-white transition-colors hover:bg-black/90 disabled:opacity-50 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
        >
          {confirmBusy ? "처리 중…" : confirmLabel}
        </button>
      </div>
    </ModalShell>
  );
};

export default ExistingPlanConfirmModal;
