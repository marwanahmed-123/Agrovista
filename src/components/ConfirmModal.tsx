interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "success" | "primary";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null;

  const variantStyles: Record<"danger" | "success" | "primary", string> = {
    danger: "bg-red-500 hover:bg-red-600",
    success: "bg-green-500 hover:bg-green-600",
    primary: "bg-primary hover:bg-primary-dark",
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-4 sm:p-6 mx-auto">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">
          {title}
        </h2>
        <p className="text-gray-600 mb-5 sm:mb-6 text-sm sm:text-base">
          {message}
        </p>
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium rounded-lg transition-colors duration-200 text-sm"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`w-full sm:w-auto px-4 py-2.5 sm:py-2 text-white font-medium rounded-lg transition-colors duration-200 disabled:opacity-70 text-sm ${variantStyles[variant]}`}
          >
            {loading ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
