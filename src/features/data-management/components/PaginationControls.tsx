import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  itemLabel = "records",
}) => {
  if (totalItems === 0 || totalPages <= 0) return null;

  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, "...", totalPages];
    }

    if (currentPage >= totalPages - 3) {
      return [
        1,
        "...",
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }

    return [
      1,
      "...",
      currentPage - 1,
      currentPage,
      currentPage + 1,
      "...",
      totalPages,
    ];
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border px-5 py-3.5 text-xs bg-surface">
      <span className="text-text-secondary font-medium">
        Page <span className="font-bold text-text-primary">{currentPage}</span> of{" "}
        <span className="font-bold text-text-primary">{totalPages}</span>{" "}
        <span className="text-text-muted">({totalItems} {itemLabel})</span>
      </span>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border bg-surface font-semibold text-text-secondary hover:bg-neutral-100 disabled:opacity-40 disabled:hover:bg-surface transition shadow-2xs"
        >
          <ChevronLeft size={14} />
          Previous
        </button>

        <div className="flex items-center gap-1">
          {pageNumbers.map((page, idx) => {
            if (page === "...") {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-2 py-1.5 text-text-muted font-bold tracking-widest"
                >
                  ...
                </span>
              );
            }

            const pageNum = page as number;
            const isActive = pageNum === currentPage;

            return (
              <button
                key={pageNum}
                type="button"
                onClick={() => onPageChange(pageNum)}
                className={`min-w-[32px] h-8 px-2 py-1 rounded-lg font-bold transition shadow-2xs ${
                  isActive
                    ? "bg-primary-600 text-white"
                    : "border border-border bg-surface text-text-secondary hover:bg-neutral-100"
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border bg-surface font-semibold text-text-secondary hover:bg-neutral-100 disabled:opacity-40 disabled:hover:bg-surface transition shadow-2xs"
        >
          Next
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};

export default PaginationControls;
