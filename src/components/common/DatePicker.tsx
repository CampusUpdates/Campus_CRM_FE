import React, { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { FormField } from "./FormField";
import { getFieldValidationClass } from "../../utils/formValidation";

export interface DatePickerProps {
  value?: string; // YYYY-MM-DD
  onChange?: (date: string) => void;
  minDate?: string; // YYYY-MM-DD
  maxDate?: string; // YYYY-MM-DD
  disabled?: boolean;
  placeholder?: string;
  label?: string;
  required?: boolean;
  touched?: boolean;
  error?: string | null;
  wrapperClassName?: string;
}

const parseDateString = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
};

const formatDateString = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  minDate,
  maxDate,
  disabled,
  placeholder = "Select a date",
  label,
  required,
  touched,
  error,
  wrapperClassName = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedDate = value ? parseDateString(value) : null;
  const initialViewDate = selectedDate || new Date();
  
  const [currentMonth, setCurrentMonth] = useState(initialViewDate.getMonth());
  const [currentYear, setCurrentYear] = useState(initialViewDate.getFullYear());

  useEffect(() => {
    if (isOpen && selectedDate) {
      setCurrentMonth(selectedDate.getMonth());
      setCurrentYear(selectedDate.getFullYear());
    }
  }, [isOpen, value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const inputClass = getFieldValidationClass(
    touched,
    error,
    `h-10 w-full rounded-lg border bg-surface px-3.5 pr-10 text-xs sm:text-sm text-text-primary outline-none transition placeholder:text-text-muted cursor-pointer flex items-center ${disabled ? "opacity-50 cursor-not-allowed" : ""}`
  );

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleSelectDate = (d: number, isSelectable: boolean) => {
    if (!isSelectable || disabled) return;
    const newDate = new Date(currentYear, currentMonth, d);
    if (onChange) onChange(formatDateString(newDate));
    setIsOpen(false);
  };

  const todayStr = formatDateString(new Date());
  
  const minDateObj = minDate ? parseDateString(minDate) : null;
  const maxDateObj = maxDate ? parseDateString(maxDate) : null;

  const renderDays = () => {
    const days = [];
    // empty slots
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-8 w-8" />);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(currentYear, currentMonth, d);
      const dateStr = formatDateString(dateObj);
      
      let isSelectable = true;
      if (minDateObj && dateObj < minDateObj) isSelectable = false;
      if (maxDateObj && dateObj > maxDateObj) isSelectable = false;

      const isSelected = value === dateStr;
      const isToday = todayStr === dateStr;

      let className = "h-8 w-8 flex items-center justify-center rounded-full text-xs transition-colors ";
      if (isSelected) {
        className += "bg-brand-500 text-white font-medium ";
      } else if (!isSelectable) {
        className += "text-text-muted/50 cursor-not-allowed ";
      } else {
        className += "text-text-primary hover:bg-surface-hover cursor-pointer ";
        if (isToday) {
          className += "font-bold text-brand-500 bg-brand-500/10 ";
        }
      }

      days.push(
        <div
          key={d}
          onClick={(e) => {
            e.stopPropagation();
            handleSelectDate(d, isSelectable);
          }}
          className={className}
        >
          {d}
        </div>
      );
    }
    return days;
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const content = (
    <div className="relative" ref={containerRef}>
      <div 
        className={inputClass}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        {value ? (
           (() => {
             const d = parseDateString(value);
             return d ? `${d.getDate()} ${monthNames[d.getMonth()].slice(0, 3)} ${d.getFullYear()}` : value;
           })()
        ) : (
          <span className="text-text-muted">{placeholder}</span>
        )}
        <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
      </div>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 z-50 p-3 bg-surface border border-border shadow-xl rounded-xl w-64">
          <div className="flex items-center justify-between mb-3">
            <button 
              onClick={handlePrevMonth} 
              className="p-1 rounded hover:bg-surface-hover text-text-secondary transition-colors"
              type="button"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="text-sm font-medium text-text-primary">
              {monthNames[currentMonth]} {currentYear}
            </div>
            <button 
              onClick={handleNextMonth} 
              className="p-1 rounded hover:bg-surface-hover text-text-secondary transition-colors"
              type="button"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => (
              <div key={d} className="text-[10px] font-semibold text-text-muted w-8 h-8 flex items-center justify-center">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {renderDays()}
          </div>
        </div>
      )}
    </div>
  );

  if (label) {
    return (
      <FormField label={label} required={required} touched={touched} error={error} className={wrapperClassName}>
        {content}
      </FormField>
    );
  }

  return (
    <div className={wrapperClassName}>
      {content}
      {touched && error && <p className="mt-1 text-xs text-red-500 dark:text-red-400">{error}</p>}
    </div>
  );
};
