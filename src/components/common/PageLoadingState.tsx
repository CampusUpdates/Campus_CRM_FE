import React from "react";
import { RefreshCw } from "lucide-react";

export interface PageLoadingStateProps {
  message?: string;
  description?: string;
  minHeight?: string;
  className?: string;
}

export const PageLoadingState: React.FC<PageLoadingStateProps> = ({
  message = "Loading...",
  description,
  minHeight = "min-h-[380px]",
  className = "",
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`w-full flex flex-col items-center justify-center p-8 sm:p-12 rounded-2xl border border-border bg-surface shadow-xs text-center transition-all animate-in fade-in duration-200 ${minHeight} ${className}`}
    >
      <div className="flex items-center justify-center p-3 rounded-full bg-primary-50 dark:bg-primary-950/50 border border-primary-100 dark:border-primary-900/60 mb-3.5">
        <RefreshCw size={24} className="animate-spin text-primary-600 dark:text-primary-400" />
      </div>
      <p className="text-sm font-semibold text-text-primary tracking-tight">{message}</p>
      {description && (
        <p className="text-xs text-text-secondary mt-1 max-w-sm">{description}</p>
      )}
      <span className="sr-only">{message}</span>
    </div>
  );
};

export default PageLoadingState;
