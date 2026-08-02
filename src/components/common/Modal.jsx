import { useEffect } from "react";
import { X } from "lucide-react";
import { createPortal } from "react-dom";

export default function Modal({ open, onClose, title, children, size = "md", footer }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizes = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto">
      <div className="fixed inset-0 bg-ink/40 backdrop-blur-[1px]" onClick={onClose} />
      <div
        className={`relative w-full ${sizes[size]} bg-white rounded-2xl shadow-popover my-8 animate-[fadeIn_0.15s_ease-out]`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-line">
          <h3 className="text-base font-semibold text-ink">{title}</h3>
          <button onClick={onClose} className="text-muted hover:text-ink p-1 rounded-md hover:bg-panel">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">{children}</div>
        {footer && <div className="flex justify-end gap-2 px-6 py-4 border-t border-line">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
