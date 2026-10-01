/**
 * Form Validation Utilities for Campus CRM Frontend
 *
 * Standard validation states for form controls:
 * 1. UNTOUCHED (touched = false): Default border style. No error or success indicator.
 * 2. INVALID (touched = true && error): Red border, red error message below.
 * 3. VALID (touched = true && !error): Green border, no error message.
 */

export interface FieldValidationState {
  touched?: boolean;
  error?: string | null;
}

/**
 * Returns Tailwind CSS classes for an input element based on its validation state.
 */
export function getFieldValidationClass(
  touched?: boolean,
  error?: string | null,
  customBaseClasses?: string
): string {
  const base =
    customBaseClasses ||
    "w-full rounded-lg border bg-surface px-3.5 py-2 text-sm text-text-primary placeholder:text-text-muted transition duration-150 outline-none";

  if (!touched) {
    return `${base} border-neutral-300 dark:border-neutral-600 focus:border-primary-500 focus:ring-1 focus:ring-primary-500`;
  }

  if (error) {
    return `${base} border-red-500 dark:border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-text-primary`;
  }

  return `${base} border-emerald-500 dark:border-emerald-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-text-primary`;
}
