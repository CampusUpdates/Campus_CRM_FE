import React, { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown, Check } from "lucide-react";

export interface DropdownOption<T = string> {
  value: T;
  label: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
}

export interface DashboardDropdownProps<T = string> {
  value: T;
  onChange: (value: T) => void;
  options: DropdownOption<T>[];
  placeholder?: string;
  label?: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  align?: "left" | "right";
  minWidth?: string;
  id?: string;
  "aria-label"?: string;
}

export function DashboardDropdown<T extends string = string>({
  value,
  onChange,
  options,
  placeholder = "Select...",
  label,
  icon: Icon,
  disabled = false,
  className = "",
  buttonClassName = "",
  menuClassName = "",
  align = "left",
  minWidth,
  id,
  "aria-label": ariaLabel,
}: DashboardDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled) return;

      if (!isOpen) {
        if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault();
          setIsOpen(true);
          const currentIndex = options.findIndex((opt) => opt.value === value);
          setHighlightedIndex(currentIndex >= 0 ? currentIndex : 0);
        }
        return;
      }

      switch (e.key) {
        case "Escape":
          e.preventDefault();
          setIsOpen(false);
          buttonRef.current?.focus();
          break;
        case "ArrowDown":
          e.preventDefault();
          setHighlightedIndex((prev) => (prev < options.length - 1 ? prev + 1 : 0));
          break;
        case "ArrowUp":
          e.preventDefault();
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : options.length - 1));
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          if (highlightedIndex >= 0 && highlightedIndex < options.length) {
            onChange(options[highlightedIndex].value);
            setIsOpen(false);
            buttonRef.current?.focus();
          }
          break;
        case "Tab":
          setIsOpen(false);
          break;
      }
    },
    [disabled, isOpen, options, value, onChange, highlightedIndex]
  );

  const handleSelect = (val: T) => {
    onChange(val);
    setIsOpen(false);
    buttonRef.current?.focus();
  };

  const SelectedIcon = selectedOption?.icon || Icon;

  return (
    <div
      ref={containerRef}
      className={`relative inline-block text-left ${className}`}
      onKeyDown={handleKeyDown}
    >
      <button
        ref={buttonRef}
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel || label || (selectedOption?.label ?? placeholder)}
        className={`
          group h-9 px-3 rounded-lg border
          border-border bg-surface hover:bg-surface-hover hover:border-neutral-300 dark:hover:border-slate-600
          text-text-primary text-xs font-semibold
          inline-flex items-center justify-between gap-2.5
          transition-all duration-150 shadow-xs outline-none
          focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20
          disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer
          ${isOpen ? "border-primary-500 ring-2 ring-primary-500/20 bg-surface-hover" : ""}
          ${buttonClassName}
        `}
        style={minWidth ? { minWidth } : undefined}
      >
        <div className="flex items-center gap-2 truncate">
          {label && (
            <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted shrink-0">
              {label}
            </span>
          )}
          {SelectedIcon && (
            <SelectedIcon size={14} className="text-primary-600 dark:text-emerald-400 shrink-0" />
          )}
          <span className="truncate text-text-primary">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <ChevronDown
          size={14}
          className={`text-text-muted shrink-0 transition-transform duration-200 group-hover:text-text-primary ${
            isOpen ? "rotate-180 text-primary-600 dark:text-emerald-400" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          tabIndex={-1}
          className={`
            absolute ${align === "right" ? "right-0" : "left-0"}
            z-50 mt-1 min-w-full rounded-lg border
            border-border bg-surface dark:bg-slate-900 shadow-xl py-1
            max-h-60 overflow-y-auto outline-none
            animate-in fade-in slide-in-from-top-1 duration-150
            ${menuClassName}
          `}
          style={minWidth ? { minWidth } : undefined}
        >
          {options.length === 0 ? (
            <div className="px-3.5 py-2 text-xs text-text-muted text-center">
              No options available
            </div>
          ) : (
            options.map((opt, index) => {
              const isSelected = opt.value === value;
              const isHighlighted = index === highlightedIndex;
              const ItemIcon = opt.icon;

              return (
                <div
                  key={String(opt.value)}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(opt.value)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`
                    flex items-center justify-between px-3 py-2 text-xs cursor-pointer
                    transition-colors duration-100 select-none border-l-2
                    ${
                      isSelected
                        ? "bg-primary-50 text-primary-700 font-semibold border-primary-600 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-500"
                        : isHighlighted
                        ? "bg-surface-hover text-text-primary border-transparent"
                        : "text-text-secondary border-transparent hover:bg-surface-hover hover:text-text-primary"
                    }
                  `}
                >
                  <div className="flex items-center gap-2 truncate mr-2">
                    {ItemIcon && (
                      <ItemIcon
                        size={13}
                        className={
                          isSelected
                            ? "text-primary-600 dark:text-emerald-400"
                            : "text-text-muted"
                        }
                      />
                    )}
                    <span className="truncate">{opt.label}</span>
                  </div>

                  {isSelected && (
                    <Check
                      size={14}
                      className="text-primary-600 dark:text-emerald-400 shrink-0 ml-1.5"
                    />
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default DashboardDropdown;
