"use client";

import { ModalShell } from "@/components/common/ModalShell";
import { buttonClass, helpTextClass } from "@/components/common/ui";

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
  title = "저장된 플랜이 있어요",
  description = "새 플랜을 저장하면 지금 플랜을 대체합니다. 저장하기 전까지 기존 플랜은 그대로 유지돼요.",
  cancelLabel = "취소",
  confirmLabel = "새 플랜 만들기",
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
        className="pr-12 text-lg font-semibold tracking-tight text-ink"
      >
        {title}
      </h2>
      <p className={`${helpTextClass} mt-2`}>
        {description}
      </p>

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={confirmBusy}
          className={buttonClass("secondary")}
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={confirmBusy}
          className={buttonClass("primary")}
        >
          {confirmBusy ? "처리 중…" : confirmLabel}
        </button>
      </div>
    </ModalShell>
  );
};

export default ExistingPlanConfirmModal;
