import React, { useMemo } from "react";
import { INDIAN_STATES_AND_CITIES, getCitiesByState } from "../../data/indianStatesCities";
import { getFieldValidationClass } from "../../utils/formValidation";

export interface StateCitySelectProps {
  /** Selected State value */
  stateValue: string;
  /** Selected City value */
  cityValue: string;
  /** Callback fired when state changes */
  onStateChange: (state: string) => void;
  /** Callback fired when city changes */
  onCityChange: (city: string) => void;
  /** Combined onChange callback option */
  onChange?: (val: { state: string; city: string }) => void;
  /** Label for state input */
  stateLabel?: string;
  /** Label for city input */
  cityLabel?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Layout style: 'row' (side-by-side) or 'column' (stacked) */
  layout?: "row" | "column";
  /** Error message for state */
  stateError?: string;
  /** Error message for city */
  cityError?: string;
  /** Touched state for state input */
  stateTouched?: boolean;
  /** Touched state for city input */
  cityTouched?: boolean;
  /** OnBlur handler for state */
  onStateBlur?: (e: React.FocusEvent<HTMLSelectElement>) => void;
  /** OnBlur handler for city */
  onCityBlur?: (e: React.FocusEvent<HTMLSelectElement | HTMLInputElement>) => void;
  /** Placeholder text for state select */
  statePlaceholder?: string;
  /** Placeholder text for city select */
  cityPlaceholder?: string;
  /** Enable 'All States' / 'All Cities' option (useful for filter toolbars) */
  allowAllOption?: boolean;
  /** Label for 'All States' option when allowAllOption is true */
  allStatesLabel?: string;
  /** Label for 'All Cities' option when allowAllOption is true */
  allCitiesLabel?: string;
  /** Allow entering a custom city if not listed */
  allowCustomCity?: boolean;
  /** Allow clearing state and city (renders un-disabled placeholder option) */
  allowClear?: boolean;
  /** Custom wrapper CSS class */
  className?: string;
}

export const StateCitySelect: React.FC<StateCitySelectProps> = ({
  stateValue,
  cityValue,
  onStateChange,
  onCityChange,
  onChange,
  stateLabel = "State",
  cityLabel = "City",
  required = false,
  disabled = false,
  layout = "row",
  stateError,
  cityError,
  stateTouched,
  cityTouched,
  onStateBlur,
  onCityBlur,
  statePlaceholder = "Select State",
  cityPlaceholder = "Select City",
  allowAllOption = false,
  allStatesLabel = "All States",
  allCitiesLabel = "All Cities",
  allowCustomCity = true,
  allowClear = false,
  className = "",
}) => {
  // Available cities based on selected state
  const availableCities = useMemo(() => {
    return getCitiesByState(stateValue);
  }, [stateValue]);

  // Check if current city is in preset list or custom
  const isCustomCity = useMemo(() => {
    if (!cityValue || availableCities.length === 0) return false;
    return !availableCities.includes(cityValue);
  }, [cityValue, availableCities]);

  const [customCityMode, setCustomCityMode] = React.useState<boolean>(isCustomCity);

  const handleStateSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newState = e.target.value;
    onStateChange(newState);
    onCityChange(""); // Reset city when state changes
    setCustomCityMode(false);

    if (onChange) {
      onChange({ state: newState, city: "" });
    }
  };

  const handleCitySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "__OTHER__") {
      setCustomCityMode(true);
      onCityChange("");
      if (onChange) onChange({ state: stateValue, city: "" });
    } else {
      setCustomCityMode(false);
      onCityChange(val);
      if (onChange) onChange({ state: stateValue, city: val });
    }
  };

  const handleCustomCityInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onCityChange(val);
    if (onChange) onChange({ state: stateValue, city: val });
  };

  const gridLayout =
    layout === "row" ? "grid grid-cols-1 sm:grid-cols-2 gap-4" : "space-y-4";

  const stateInputClass = getFieldValidationClass(
    stateTouched,
    stateError,
    "w-full h-10 px-3 py-2 rounded-xl border bg-surface text-sm text-text-primary outline-none transition disabled:opacity-50 disabled:bg-neutral-100 dark:disabled:bg-slate-800 cursor-pointer"
  );

  const cityInputClass = getFieldValidationClass(
    cityTouched,
    cityError,
    "w-full h-10 px-3 py-2 rounded-xl border bg-surface text-sm text-text-primary outline-none transition disabled:opacity-50 disabled:bg-neutral-100 dark:disabled:bg-slate-800 cursor-pointer"
  );

  return (
    <div className={`${gridLayout} ${className}`}>
      {/* State Field */}
      <div>
        {stateLabel && (
          <label className="mb-1.5 block text-xs font-semibold text-text-secondary dark:text-neutral-300">
            {stateLabel} {required && <span className="text-red-500">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            value={stateValue}
            onChange={handleStateSelect}
            onBlur={onStateBlur}
            disabled={disabled}
            className={stateInputClass}
          >
            {allowAllOption ? (
              <option value="" className="bg-surface text-text-primary">{allStatesLabel}</option>
            ) : allowClear ? (
              <option value="" className="bg-surface text-text-primary">{statePlaceholder}</option>
            ) : (
              <option value="" disabled className="bg-surface text-text-primary">
                {statePlaceholder}
              </option>
            )}
            {INDIAN_STATES_AND_CITIES.map((item) => (
              <option key={item.state} value={item.state} className="bg-surface text-text-primary">
                {item.state}
              </option>
            ))}
          </select>
        </div>
        {stateTouched && stateError && (
          <p className="mt-1 text-xs text-red-500 dark:text-red-400">{stateError}</p>
        )}
      </div>

      {/* City Field */}
      <div>
        {cityLabel && (
          <label className="mb-1.5 block text-xs font-semibold text-text-secondary dark:text-neutral-300">
            {cityLabel} {required && <span className="text-red-500">*</span>}
          </label>
        )}
        <div className="relative">
          {customCityMode ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={cityValue}
                onChange={handleCustomCityInput}
                onBlur={onCityBlur}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const form = e.currentTarget.form;
                    if (form) {
                      const focusables = Array.from(
                        form.querySelectorAll<HTMLElement>(
                          'input:not([type="hidden"]):not([disabled]):not([readonly]), select:not([disabled]), textarea:not([disabled])'
                        )
                      ).filter((el) => el.offsetParent !== null && el.tabIndex !== -1);
                      const idx = focusables.indexOf(e.currentTarget);
                      if (idx !== -1 && idx < focusables.length - 1) {
                        focusables[idx + 1].focus();
                      } else {
                        e.currentTarget.blur();
                      }
                    }
                  }
                }}
                placeholder="Enter city name"
                disabled={disabled}
                className={cityInputClass}
              />
              <button
                type="button"
                onClick={() => {
                  setCustomCityMode(false);
                  onCityChange("");
                }}
                className="px-2.5 text-xs text-primary-600 hover:text-primary-700 font-medium whitespace-nowrap"
              >
                List
              </button>
            </div>
          ) : (
            <select
              value={cityValue}
              onChange={handleCitySelect}
              onBlur={onCityBlur}
              disabled={disabled || (!stateValue && !allowAllOption)}
              className={cityInputClass}
            >
              {allowAllOption ? (
                <option value="" className="bg-surface text-text-primary">{allCitiesLabel}</option>
              ) : allowClear ? (
                <option value="" className="bg-surface text-text-primary">
                  {!stateValue ? "Select state first" : cityPlaceholder}
                </option>
              ) : (
                <option value="" disabled className="bg-surface text-text-primary">
                  {!stateValue ? "Select state first" : cityPlaceholder}
                </option>
              )}
              {availableCities.map((city) => (
                <option key={city} value={city} className="bg-surface text-text-primary">
                  {city}
                </option>
              ))}
              {allowCustomCity && stateValue && (
                <option value="__OTHER__" className="bg-surface text-text-primary">+ Enter Other City</option>
              )}
            </select>
          )}
        </div>
        {cityTouched && cityError && (
          <p className="mt-1 text-xs text-red-500 dark:text-red-400">{cityError}</p>
        )}
      </div>
    </div>
  );
};

export default StateCitySelect;
