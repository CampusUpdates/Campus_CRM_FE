import React from "react";
import { RefreshCw } from "lucide-react";

export interface SectionLoadingStateProps {
  message?: string;
  description?: string;
  minHeight?: string;
  className?: string;
  isTableRow?: boolean;
  colSpan?: number;
  compact?: boolean;
}

export const SectionLoadingState: React.FC<SectionLoadingStateProps> = ({
  message = "Loading data...",
  description,
  minHeight = "min-h-[160px]",
  className = "",
  isTableRow = false,
  colSpan = 7,
  compact = false,
}) => {
  const content = (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center text-center ${
        compact ? "py-6 px-4" : "py-10 px-6"
      } ${className}`}
    >
      <div
        className={`flex items-center justify-center rounded-full bg-primary-50 dark:bg-primary-950/50 border border-primary-100 dark:border-primary-900/60 ${
          compact ? "p-2 mb-2" : "p-2.5 mb-3"
        }`}
      >
        <RefreshCw
          size={compact ? 16 : 20}
          className="animate-spin text-primary-600 dark:text-primary-400"
        />
      </div>
      <p className="text-xs sm:text-sm font-medium text-text-secondary">{message}</p>
      {description && (
        <p className="text-xs text-text-muted mt-0.5 max-w-xs">{description}</p>
      )}
      <span className="sr-only">{message}</span>
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
      className={`w-full flex flex-col items-center justify-center rounded-xl border border-border bg-surface shadow-2xs ${minHeight} ${className}`}
    >
      {content}
    </div>
  );
};

export default SectionLoadingState;
