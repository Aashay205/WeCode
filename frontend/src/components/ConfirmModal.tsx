type ConfirmModalProps = {
  open: boolean;
  title: string;
  description: string;
  confirmText?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmModal({
  open,
  title,
  description,
  confirmText = "Confirm",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="wecode-overlay fixed inset-0 z-50 flex items-center justify-center backdrop-blur-[1px]">
      <div className="wecode-enter wecode-dialog w-[520px] max-w-[calc(100vw-2rem)] rounded-[18px] border p-5 shadow-[0_0_0_1px_rgba(148,163,184,0.08),0_24px_60px_rgba(0,0,0,0.4)]">
        <h3 className="mb-4 text-[28px] font-medium leading-tight text-slate-100">{title}</h3>
        <p className="mb-5 text-[17px] leading-8 text-slate-200/90">{description}</p>

        <div className="flex justify-end gap-3 pt-1">
          <button
            onClick={onCancel}
            className="wecode-button wecode-button--ghost min-w-[110px] rounded-xl px-5"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            className="wecode-button wecode-button--danger min-w-[110px] rounded-xl px-5"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
