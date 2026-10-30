import { useState, useRef, useEffect } from "react";
import { Calendar, X, Loader2 } from "lucide-react";
import type { AdvisorDateFilter, AdvisorDatePeriod } from "../../../../services/advisorDashboardService";
import { DashboardDropdown, type DropdownOption } from "../../../../components/common";

type DateRangeFilterProps = {
  filter: AdvisorDateFilter;
  onChange: (filter: AdvisorDateFilter) => void;
  disabled?: boolean;
};

type StandardPeriod = "today" | "this_week" | "this_month";

const PERIOD_OPTIONS: DropdownOption<AdvisorDatePeriod>[] = [
  { value: "today", label: "Today" },
  { value: "this_week", label: "This Week" },
  { value: "this_month", label: "This Month" },
  { value: "custom", label: "Custom Range" },
];

/** Return today as YYYY-MM-DD in local time */
function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const DateRangeFilter = ({ filter, onChange, disabled }: DateRangeFilterProps) => {
  const [isCustomRange, setIsCustomRange] = useState<boolean>(filter.period === "custom");
  const [selectedPeriod, setSelectedPeriod] = useState<StandardPeriod>(() =>
    filter.period === "custom" ? "today" : filter.period
  );
  const [startDate, setStartDate] = useState<string>(filter.startDate ?? "");
  const [endDate, setEndDate] = useState<string>(filter.endDate ?? "");
  const [validationError, setValidationError] = useState<string>("");

  const prevFilterRef = useRef(filter);

  // Sync with external filter changes (e.g., resets from outside)
  useEffect(() => {
    if (
      prevFilterRef.current.period !== filter.period ||
      prevFilterRef.current.startDate !== filter.startDate ||
      prevFilterRef.current.endDate !== filter.endDate
    ) {
      prevFilterRef.current = filter;
      if (filter.period === "custom") {
        setIsCustomRange(true);
        setStartDate(filter.startDate ?? "");
        setEndDate(filter.endDate ?? "");
      } else {
        setIsCustomRange(false);
        setSelectedPeriod(filter.period);
        setValidationError("");
      }
    }
  }, [filter]);

  const handlePeriodChange = (val: AdvisorDatePeriod) => {
    if (val === "custom") {
      setIsCustomRange(true);
      setValidationError("");
      // Do not call onChange yet — wait for valid custom date range
    } else {
      setSelectedPeriod(val);
      setIsCustomRange(false);
      setValidationError("");
      onChange({ period: val });
    }
  };

  const handleClearCustom = () => {
    setIsCustomRange(false);
    setStartDate("");
    setEndDate("");
    setValidationError("");
    const restoredPeriod = selectedPeriod || "today";
    setSelectedPeriod(restoredPeriod);
    onChange({ period: restoredPeriod });
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStart = e.target.value;
    setStartDate(newStart);

    if (!newStart || !endDate) {
      setValidationError("");
      return;
    }

    if (newStart > endDate) {
      setValidationError("Start date must be on or before end date.");
      return;
    }

    const maxDate = todayIso();
    if (newStart > maxDate) {
      setValidationError("Start date cannot be in the future.");
      return;
    }

    setValidationError("");
    if (filter.period === "custom" && filter.startDate === newStart && filter.endDate === endDate) {
      return;
    }

    onChange({
      period: "custom",
      startDate: newStart,
      endDate: endDate,
    });
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEnd = e.target.value;
    setEndDate(newEnd);

    if (!startDate || !newEnd) {
      setValidationError("");
      return;
    }

    if (startDate > newEnd) {
      setValidationError("End date must be on or after start date.");
      return;
    }

    const maxDate = todayIso();
    if (newEnd > maxDate) {
      setValidationError("End date cannot be in the future.");
      return;
    }

    setValidationError("");
    if (filter.period === "custom" && filter.startDate === startDate && filter.endDate === newEnd) {
      return;
    }

    onChange({
      period: "custom",
      startDate: startDate,
      endDate: newEnd,
    });
  };

  return (
    <div className="flex flex-col gap-1.5 shrink-0">
      {isCustomRange ? (
        <div
          role="group"
          aria-label="Custom date range filter"
          className="inline-flex flex-wrap items-center gap-1.5 sm:gap-2 animate-in fade-in duration-150"
        >
          {/* Start Date */}
          <div className="relative inline-flex items-center">
            <input
              id="advisor-date-start"
              type="date"
              aria-label="Start Date"
              value={startDate}
              max={endDate || todayIso()}
              onChange={handleStartDateChange}
              disabled={disabled}
              className={`
                h-9 w-[130px] sm:w-[138px] rounded-lg border
                border-border bg-surface px-2.5 sm:px-3 text-xs text-text-primary
                outline-none transition-all duration-150
                focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20
                font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
                shadow-xs
                ${validationError ? "border-red-500/80 focus:border-red-500 focus:ring-red-500/20" : ""}
              `}
            />
          </div>

          {/* Separator */}
          <span
            className="text-text-muted font-semibold text-xs select-none shrink-0"
            aria-hidden="true"
          >
            –
          </span>

          {/* End Date */}
          <div className="relative inline-flex items-center">
            <input
              id="advisor-date-end"
              type="date"
              aria-label="End Date"
              value={endDate}
              min={startDate || undefined}
              max={todayIso()}
              onChange={handleEndDateChange}
              disabled={disabled}
              className={`
                h-9 w-[130px] sm:w-[138px] rounded-lg border
                border-border bg-surface px-2.5 sm:px-3 text-xs text-text-primary
                outline-none transition-all duration-150
                focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20
                font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
                shadow-xs
                ${validationError ? "border-red-500/80 focus:border-red-500 focus:ring-red-500/20" : ""}
              `}
            />
          </div>

          {/* Cross Button */}
          <button
            id="advisor-date-clear-btn"
            type="button"
            onClick={handleClearCustom}
            disabled={disabled}
            title="Exit custom range"
            aria-label="Exit custom range"
            className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-border bg-surface text-text-secondary hover:text-text-primary hover:bg-surface-hover hover:border-neutral-300 dark:hover:border-slate-600 transition-all duration-150 shadow-xs cursor-pointer shrink-0 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X size={15} className="stroke-[2.2]" />
          </button>

          {/* Loading indicator */}
          {disabled && (
            <div className="inline-flex items-center text-emerald-400 shrink-0 ml-0.5" title="Loading data...">
              <Loader2 size={15} className="animate-spin" />
            </div>
          )}
        </div>
      ) : (
        <div className="inline-flex items-center animate-in fade-in duration-150">
          <DashboardDropdown<AdvisorDatePeriod>
            id="advisor-date-dropdown"
            aria-label="Dashboard date filter"
            value={selectedPeriod}
            onChange={handlePeriodChange}
            options={PERIOD_OPTIONS}
            icon={Calendar}
            disabled={disabled}
            minWidth="145px"
          />
        </div>
      )}

      {isCustomRange && validationError && (
        <p
          id="advisor-date-validation-error"
          role="alert"
          className="text-[11px] text-red-400 font-medium animate-in fade-in duration-150"
        >
          {validationError}
        </p>
      )}
    </div>
  );
};

export default DateRangeFilter;
