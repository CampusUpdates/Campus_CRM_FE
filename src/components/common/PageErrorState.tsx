import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

export interface PageErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
  minHeight?: string;
  className?: string;
  isTableRow?: boolean;
  colSpan?: number;
}

export const PageErrorState: React.FC<PageErrorStateProps> = ({
  title = "Unable to load data",
  message = "A connection error occurred. Please try again.",
  onRetry,
  isRetrying = false,
  minHeight = "min-h-[280px]",
  className = "",
  isTableRow = false,
  colSpan = 7,
}) => {
  const content = (
    <div
      role="alert"
      className="flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto"
    >
      <div className="flex items-center justify-center p-3 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 mb-3 text-rose-600 dark:text-rose-400">
        <AlertCircle size={24} />
      </div>
      <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
      <p className="mt-1 text-xs text-text-secondary leading-relaxed">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          disabled={isRetrying}
          className="inline-flex items-center gap-1.5 px-4 py-2 mt-4 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw size={14} className={isRetrying ? "animate-spin" : ""} />
          {isRetrying ? "Retrying..." : "Retry"}
        </button>
      )}
    </div>
  );

  if (isTableRow) {
    return (
      <tr>
        <td colSpan={colSpan} className="p-0">
          <div className={`w-full flex items-center justify-center ${minHeight}`}>
            {content}
          </div>
        </td>
      </tr>
    );
  }

  return (
    <div
      className={`w-full flex flex-col items-center justify-center p-6 rounded-2xl border border-border bg-surface shadow-xs ${minHeight} ${className}`}
    >
      {content}
    </div>
  );
};

export default PageErrorState;
