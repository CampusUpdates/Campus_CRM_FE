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
      <div className="fixed top-3 sm:top-5 left-3 right-3 sm:left-auto sm:right-5 z-[9999] flex flex-col items-center sm:items-end gap-2.5 sm:gap-3 pointer-events-none box-border">
        {toasts.map((toast) => {
          const isSuccess = toast.type === "success";
          const isError = toast.type === "error";

          return (
            <div
              key={toast.id}
              role="alert"
              className={`
                pointer-events-auto
                box-border
                w-[calc(100vw-24px)] max-w-[400px] sm:w-auto sm:min-w-[320px] sm:max-w-sm
                flex items-start sm:items-center gap-2.5 sm:gap-3
                px-3.5 py-3 sm:px-4 sm:py-3.5
                rounded-xl shadow-xl border
                transition-all duration-300 transform translate-y-0
                bg-white text-slate-800
                ${
                  isSuccess
                    ? "border-emerald-200 text-emerald-950 bg-emerald-50/95 backdrop-blur-md"
                    : isError
                    ? "border-rose-200 text-rose-950 bg-rose-50/95 backdrop-blur-md"
                    : "border-blue-200 text-blue-950 bg-blue-50/95 backdrop-blur-md"
                }
              `}
            >
              <div className="shrink-0 mt-0.5 sm:mt-0">
                {isSuccess ? (
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                ) : isError ? (
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-rose-600" />
                ) : (
                  <Info className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                )}
              </div>

              <div className="flex-1 min-w-0 text-xs sm:text-sm font-medium leading-relaxed sm:leading-snug break-words">
                {toast.message}
              </div>

              <button
                onClick={() => removeToast(toast.id)}
                aria-label="Close notification"
                className="shrink-0 p-1 -mr-1 -mt-0.5 sm:mt-0 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition cursor-pointer"
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
