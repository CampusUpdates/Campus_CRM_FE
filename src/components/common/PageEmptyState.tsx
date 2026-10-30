import React from "react";
import { Database, type LucideIcon } from "lucide-react";

export interface PageEmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  message?: string;
  actionText?: string;
  onAction?: () => void;
  minHeight?: string;
  className?: string;
  isTableRow?: boolean;
  colSpan?: number;
}

export const PageEmptyState: React.FC<PageEmptyStateProps> = ({
  icon: Icon = Database,
  title = "No records found",
  description,
  message,
  actionText,
  onAction,
  minHeight = "min-h-[260px]",
  className = "",
  isTableRow = false,
  colSpan = 7,
}) => {
  const textContent = description ?? message;
  const content = (
    <div className="flex flex-col items-center justify-center p-6 text-center max-w-sm mx-auto">
      <div className="flex items-center justify-center p-3 rounded-full bg-neutral-100 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 text-text-muted mb-3">
        <Icon size={24} />
      </div>
      <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
      {textContent && (
        <p className="mt-1 text-xs text-text-secondary leading-relaxed">{textContent}</p>
      )}
      {actionText && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 mt-3.5 text-xs font-semibold rounded-xl bg-primary-50 hover:bg-primary-100 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800 transition-colors shadow-2xs cursor-pointer"
        >
          {actionText}
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

export default PageEmptyState;
