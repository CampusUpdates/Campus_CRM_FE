import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Building2 } from "lucide-react";
import type { LeadCollegeApplication, LeadNegativeCollegeItem } from "../../../services/leadService";

interface CollegeItem {
  id: string;
  name: string;
  rawColor: string;
  statusName?: string;
  isNegative?: boolean;
}

interface CollegesPitchedCellProps {
  collegeApplications?: LeadCollegeApplication[];
  negativeColleges?: LeadNegativeCollegeItem[];
}

export function CollegesPitchedCell({
  collegeApplications = [],
  negativeColleges = [],
}: CollegesPitchedCellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number; maxHeight: number }>({
    top: 0,
    left: 0,
    maxHeight: 280,
  });

  // Consolidate colleges into a clean list
  const allColleges: CollegeItem[] = [];

  if (collegeApplications && collegeApplications.length > 0) {
    collegeApplications.forEach((app) => {
      allColleges.push({
        id: `app-${app.id || app.collegeId || Math.random()}`,
        name: app.college?.name || "College",
        rawColor: app.status?.color || "#3b82f6",
        statusName: app.status?.name,
        isNegative: false,
      });
    });
  }

  if (negativeColleges && negativeColleges.length > 0) {
    negativeColleges.forEach((neg) => {
      allColleges.push({
        id: `neg-${neg.id || Math.random()}`,
        name: neg.collegeName,
        rawColor: "#9ca3af",
        statusName: "Negative",
        isNegative: true,
      });
    });
  }

  const totalCount = allColleges.length; 89

  const measureAndPosition = useCallback(() => {
    if (!triggerRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const popupEl = popupRef.current;
    const popupHeight = popupEl?.offsetHeight || 200;

    const margin = 16;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const popupWidth = Math.min(360, viewportWidth - margin * 2);

    // Vertical placement logic:
    // Check available space above and below the trigger
    const spaceAbove = triggerRect.top - margin;
    const spaceBelow = viewportHeight - triggerRect.bottom - margin;

    let top: number;
    let maxHeight: number;

    // Prefer placing above if there is enough space, or if space above > space below
    if (spaceAbove >= popupHeight || (spaceAbove >= 180 && spaceAbove >= spaceBelow)) {
      // Place above
      top = Math.max(margin, triggerRect.top - popupHeight - 8);
      maxHeight = Math.min(280, spaceAbove - 8);
    } else {
      // Place below
      top = triggerRect.bottom + 8;
      maxHeight = Math.min(280, spaceBelow - 8);
    }

    // Horizontal placement:
    // Center aligned to trigger button, but clamped within viewport bounds [margin, viewportWidth - margin - popupWidth]
    let left = triggerRect.left + triggerRect.width / 2 - popupWidth / 2;
    if (left < margin) {
      left = margin;
    } else if (left + popupWidth > viewportWidth - margin) {
      left = viewportWidth - popupWidth - margin;
    }

    setCoords({
      top: Math.round(top),
      left: Math.round(left),
      maxHeight: Math.max(160, Math.round(maxHeight)),
    });
  }, []);

  // Listen to custom event to close all other open popups
  useEffect(() => {
    const handleCloseOthers = (e: Event) => {
      const customEvent = e as CustomEvent<{ triggerEl: HTMLElement | null }>;
      if (customEvent.detail?.triggerEl !== triggerRef.current) {
        setIsOpen(false);
      }
    };

    window.addEventListener("campus-crm:close-college-popups", handleCloseOthers);
    return () => {
      window.removeEventListener("campus-crm:close-college-popups", handleCloseOthers);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Notify other popups to close
      window.dispatchEvent(
        new CustomEvent("campus-crm:close-college-popups", {
          detail: { triggerEl: triggerRef.current },
        })
      );

      // Measure immediately and on next frame to account for portal DOM mount
      measureAndPosition();
      const raf = requestAnimationFrame(() => {
        measureAndPosition();
      });

      const handleScrollOrResize = () => measureAndPosition();
      window.addEventListener("scroll", handleScrollOrResize, true);
      window.addEventListener("resize", handleScrollOrResize);

      const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
        const target = e.target as Node;
        if (
          triggerRef.current &&
          !triggerRef.current.contains(target) &&
          popupRef.current &&
          !popupRef.current.contains(target)
        ) {
          setIsOpen(false);
        }
      };

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setIsOpen(false);
          triggerRef.current?.focus();
        }
      };

      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("touchstart", handleOutsideClick);
      document.addEventListener("keydown", handleKeyDown);

      return () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("scroll", handleScrollOrResize, true);
        window.removeEventListener("resize", handleScrollOrResize);
        document.removeEventListener("mousedown", handleOutsideClick);
        document.removeEventListener("touchstart", handleOutsideClick);
        document.removeEventListener("keydown", handleKeyDown);
      };
    } else {
      setCoords({ top: 0, left: 0, maxHeight: 280 });
    }
  }, [isOpen, measureAndPosition]);

  // Hover management: only activate on devices that support hover
  const isHoverSupported = typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches;
  const closeTimeoutRef = useRef<number | null>(null);

  const clearCloseTimeout = () => {
    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const handleMouseEnter = () => {
    if (!isHoverSupported) return;
    clearCloseTimeout();
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    if (!isHoverSupported) return;
    clearCloseTimeout();
    closeTimeoutRef.current = window.setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  if (totalCount === 0) {
    return <span className="text-xs text-text-muted">None</span>;
  }

  const visibleColleges = allColleges.slice(0, 2);
  const remainingCount = totalCount - 2;

  const renderPill = (college: CollegeItem, inPopup = false) => {
    if (college.isNegative) {
      return (
        <span
          key={college.id}
          className={`inline-flex items-center gap-1.5 rounded-md border border-gray-200/60 dark:border-gray-900/40 bg-gray-50/50 dark:bg-gray-950/20 text-gray-800/80 dark:text-gray-300/80 font-medium ${inPopup ? "px-2.5 py-1 text-xs max-w-full" : "px-2 py-0.5 text-[11px] max-w-[130px]"
            }`}
          title={`Negative: ${college.name}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-gray-400/70 dark:bg-gray-500/60 shrink-0" />
          <span className="truncate">{college.name}</span>
        </span>
      );
    }

    return (
      <span
        key={college.id}
        className={`inline-flex items-center gap-1.5 rounded-md border font-medium transition-all ${inPopup ? "px-2.5 py-1 text-xs max-w-full" : "px-2 py-0.5 text-xs max-w-[135px]"
          }`}
        style={{
          backgroundColor: `color-mix(in srgb, ${college.rawColor} 12%, transparent)`,
          borderColor: `color-mix(in srgb, ${college.rawColor} 30%, transparent)`,
          color: `color-mix(in srgb, ${college.rawColor} 90%, #ffffff)`,
        }}
        title={`${college.name}${college.statusName ? ` (${college.statusName})` : ""}`}
      >
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ backgroundColor: college.rawColor }}
        />
        <span className="truncate">{college.name}</span>
        {inPopup && college.statusName && (
          <span className="text-[10px] opacity-75 font-normal ml-0.5 shrink-0 truncate">
            ({college.statusName})
          </span>
        )}
      </span>
    );
  };

  const isMeasuring = coords.top === 0 && coords.left === 0;

  return (
    <div className="flex flex-wrap items-center gap-1.5 max-w-[260px]">
      {visibleColleges.map((col) => renderPill(col, false))}

      {remainingCount > 0 && (
        <div className="relative inline-flex">
          <button
            ref={triggerRef}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen((prev) => !prev);
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onFocus={() => {
              if (isHoverSupported) {
                clearCloseTimeout();
                setIsOpen(true);
              }
            }}
            onBlur={(e) => {
              if (isHoverSupported) {
                if (popupRef.current && popupRef.current.contains(e.relatedTarget as Node)) {
                  return;
                }
                handleMouseLeave();
              }
            }}
            aria-haspopup="dialog"
            aria-expanded={isOpen}
            className="group inline-flex items-center justify-center rounded-md border border-neutral-200 dark:border-neutral-700 bg-neutral-100 hover:bg-neutral-200/80 dark:bg-neutral-800 dark:hover:bg-neutral-700/80 px-2 py-0.5 text-[11px] font-semibold text-text-secondary dark:text-neutral-300 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 shrink-0 select-none touch-manipulation active:scale-95"
            title={`View all ${totalCount} colleges`}
          >
            <span>+{remainingCount} more</span>
          </button>

          {isOpen &&
            typeof document !== "undefined" &&
            createPortal(
              <div
                ref={popupRef}
                role="dialog"
                aria-label={`Colleges Pitched (${totalCount})`}
                onMouseEnter={clearCloseTimeout}
                onMouseLeave={handleMouseLeave}
                style={{
                  position: "fixed",
                  top: coords.top,
                  left: coords.left,
                  width: "min(360px, calc(100vw - 32px))",
                  zIndex: 9999,
                  opacity: isMeasuring ? 0 : 1,
                  transform: isMeasuring ? "scale(0.96)" : "scale(1)",
                  transition: "opacity 120ms ease, transform 120ms ease",
                }}
                className="bg-surface border border-border rounded-xl shadow-2xl p-3 text-text-primary"
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-border">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-text-primary">
                    <Building2 size={13} className="text-primary-500 shrink-0" />
                    <span>Colleges Pitched ({totalCount})</span>
                  </div>
                  <span className="text-[10px] text-text-muted font-medium">
                    {collegeApplications.length} pitched
                    {negativeColleges.length > 0 ? ` · ${negativeColleges.length} neg` : ""}
                  </span>
                </div>

                {/* Body - Scrollable if exceeds maxHeight */}
                <div
                  tabIndex={0}
                  className="flex flex-wrap gap-1.5 overflow-y-auto pr-1 focus:outline-none"
                  style={{
                    maxHeight: `${Math.max(110, coords.maxHeight - 50)}px`,
                  }}
                >
                  {allColleges.map((col) => renderPill(col, true))}
                </div>
              </div>,
              document.body
            )}
        </div>
      )}
    </div>
  );
}
