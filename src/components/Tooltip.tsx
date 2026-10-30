import { useState, useRef, useEffect, type ReactNode, useCallback } from "react";
import { createPortal } from "react-dom";

export function Tooltip({
  children,
  content,
  className = "",
  wrapperClassName = "inline-flex max-w-full"
}: {
  children: ReactNode;
  content: ReactNode;
  className?: string;
  wrapperClassName?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, maxHeight: 0 });

  const measureAndPosition = useCallback(() => {
    if (triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();

      let top = triggerRect.top - tooltipRect.height - 8;
      let left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
      let maxHeight = window.innerHeight - 16;
      let isBelow = false;

      // Top/Bottom Collision
      if (top < 8) {
        // Put below
        top = triggerRect.bottom + 8;
        isBelow = true;
      }

      if (isBelow) {
        maxHeight = window.innerHeight - top - 8;
      } else {
        maxHeight = triggerRect.top - 16;
      }

      // Left/Right Collision
      if (left < 8) {
        left = 8;
      } else if (left + tooltipRect.width > window.innerWidth - 8) {
        left = window.innerWidth - tooltipRect.width - 8;
      }

      setCoords({ top, left, maxHeight });
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Render layout first, then measure and position
      requestAnimationFrame(() => {
        measureAndPosition();
      });

      const handleScrollOrResize = () => measureAndPosition();
      window.addEventListener("scroll", handleScrollOrResize, true);
      window.addEventListener("resize", handleScrollOrResize);

      const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
        if (
          triggerRef.current &&
          !triggerRef.current.contains(event.target as Node) &&
          tooltipRef.current &&
          !tooltipRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
        }
      };

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setIsOpen(false);
      };

      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("touchstart", handleOutsideClick);
      document.addEventListener("keydown", handleEscape);

      return () => {
        window.removeEventListener("scroll", handleScrollOrResize, true);
        window.removeEventListener("resize", handleScrollOrResize);
        document.removeEventListener("mousedown", handleOutsideClick);
        document.removeEventListener("touchstart", handleOutsideClick);
        document.removeEventListener("keydown", handleEscape);
      };
    } else {
      // Reset coords when closed so it measures correctly next time
      setCoords({ top: 0, left: 0, maxHeight: 0 });
    }
  }, [isOpen, measureAndPosition, content]);

  const hasHover = typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches;

  const handleMouseEnter = () => {
    if (hasHover) setIsOpen(true);
  };

  const handleMouseLeave = () => {
    if (hasHover) setIsOpen(false);
  };

  const handleFocus = () => {
    if (hasHover) setIsOpen(true);
  };

  const handleBlur = (e: React.FocusEvent) => {
    if (hasHover) {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(e.relatedTarget as Node)
      ) {
        setIsOpen(false);
      }
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (tooltipRef.current && tooltipRef.current.contains(e.target as Node)) {
      return;
    }

    if (!hasHover) {
      setIsOpen((prev) => !prev);
    }
  };

  const isMeasuring = coords.top === 0 && coords.left === 0 && coords.maxHeight === 0;

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onClick={handleClick}
        className={wrapperClassName}
      >
        {children}
      </div>
      {isOpen && typeof document !== "undefined" && createPortal(
        <div
          ref={tooltipRef}
          style={{
            position: 'fixed',
            top: coords.top,
            left: coords.left,
            zIndex: 9999,
            maxWidth: 'calc(100vw - 16px)',
            maxHeight: coords.maxHeight > 0 ? `${coords.maxHeight}px` : undefined,
            visibility: isMeasuring ? 'hidden' : 'visible'
          }}
          className={`pointer-events-auto ${className}`}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {content}
        </div>,
        document.body
      )}
    </>
  );
}
