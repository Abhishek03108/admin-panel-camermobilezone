import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (message, type = "info", duration = 4000) => {
      const id = ++idCounter;
      setToasts((prev) => [...prev, { id, message, type }]);
      if (duration) {
        setTimeout(() => dismiss(id), duration);
      }
    },
    [dismiss]
  );

  const toast = {
    success: (msg) => push(msg, "success"),
    error: (msg) => push(msg, "error"),
    info: (msg) => push(msg, "info"),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-start gap-2.5 rounded-lg border px-4 py-3 shadow-popover bg-white animate-[fadeIn_0.15s_ease-out] ${
              t.type === "success"
                ? "border-verify/30"
                : t.type === "error"
                ? "border-danger/30"
                : "border-line"
            }`}
          >
            {t.type === "success" && <CheckCircle2 size={18} className="text-verify mt-0.5 shrink-0" />}
            {t.type === "error" && <XCircle size={18} className="text-danger mt-0.5 shrink-0" />}
            {t.type === "info" && <Info size={18} className="text-accent mt-0.5 shrink-0" />}
            <p className="text-sm text-ink flex-1">{t.message}</p>
            <button onClick={() => dismiss(t.id)} className="text-muted hover:text-ink shrink-0">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
