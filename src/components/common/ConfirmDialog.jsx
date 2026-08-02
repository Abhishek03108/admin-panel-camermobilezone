import Modal from "./Modal.jsx";
import { AlertTriangle } from "lucide-react";

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = "Are you sure?",
  description,
  confirmLabel = "Confirm",
  danger = true,
  loading = false,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button className={danger ? "btn-danger" : "btn-primary"} onClick={onConfirm} disabled={loading}>
            {loading ? "Please wait…" : confirmLabel}
          </button>
        </>
      }
    >
      <div className="flex items-start gap-3">
        {danger && (
          <div className="w-9 h-9 rounded-full bg-danger-light flex items-center justify-center shrink-0">
            <AlertTriangle size={18} className="text-danger" />
          </div>
        )}
        <p className="text-sm text-muted">{description}</p>
      </div>
    </Modal>
  );
}
