import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "success") => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, message, type }]);

      setTimeout(() => {
        removeToast(id);
      }, 4000);
    },
    [removeToast]
  );

  const success = useCallback((message: string) => showToast(message, "success"), [showToast]);
  const error = useCallback((message: string) => showToast(message, "error"), [showToast]);
  const info = useCallback((message: string) => showToast(message, "info"), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, info }}>
      {children}
      {/* Toast Render Container */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => {
          const isSuccess = toast.type === "success";
          const isError = toast.type === "error";

          return (
            <div
              key={toast.id}
              className={`
                pointer-events-auto
                flex items-center gap-3
                px-4 py-3.5
                rounded-xl shadow-xl border
                transition-all duration-300 transform translate-y-0
                bg-white text-slate-800
                ${
                  isSuccess
                    ? "border-emerald-200 text-emerald-900 bg-emerald-50/90 backdrop-blur-md"
                    : isError
                    ? "border-rose-200 text-rose-900 bg-rose-50/90 backdrop-blur-md"
                    : "border-blue-200 text-blue-900 bg-blue-50/90 backdrop-blur-md"
                }
              `}
            >
              <div className="shrink-0">
                {isSuccess ? (
                  <CheckCircle2 size={20} className="text-emerald-600" />
                ) : isError ? (
                  <AlertCircle size={20} className="text-rose-600" />
                ) : (
                  <Info size={20} className="text-blue-600" />
                )}
              </div>

              <div className="flex-1 text-sm font-medium leading-snug">
                {toast.message}
              </div>

              <button
                onClick={() => removeToast(toast.id)}
                className="shrink-0 p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition"
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
