import React from "react";
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { getFieldValidationClass } from "../../utils/formValidation";

export interface FormFieldProps {
  label?: string;
  required?: boolean;
  touched?: boolean;
  error?: string | null;
  className?: string;
  children: React.ReactNode;
  hint?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  required,
  touched,
  error,
  className = "",
  children,
  hint,
}) => {
  const isInvalid = Boolean(touched && error);

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-text-secondary dark:text-neutral-300">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      {children}
      {isInvalid && error ? (
        <p className="mt-1 text-xs text-red-500 dark:text-red-400">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-text-muted">{hint}</p>
      ) : null}
    </div>
  );
};

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  touched?: boolean;
  error?: string | null;
  wrapperClassName?: string;
  hint?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, required, touched, error, className, wrapperClassName, hint, ...props }, ref) => {
    const inputClass = getFieldValidationClass(touched, error, className);

    if (label) {
      return (
        <FormField label={label} required={required} touched={touched} error={error} className={wrapperClassName} hint={hint}>
          <input ref={ref} required={required} className={inputClass} {...props} />
        </FormField>
      );
    }

    return (
      <div>
        <input ref={ref} required={required} className={inputClass} {...props} />
        {touched && error && <p className="mt-1 text-xs text-red-500 dark:text-red-400">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  touched?: boolean;
  error?: string | null;
  wrapperClassName?: string;
  hint?: string;
  options?: Array<{ label: string; value: string | number }>;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, required, touched, error, className, wrapperClassName, hint, options, children, ...props }, ref) => {
    const selectClass = getFieldValidationClass(touched, error, className);

    const content = (
      <select ref={ref} required={required} className={selectClass} {...props}>
        {children}
        {options &&
          options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
      </select>
    );

    if (label) {
      return (
        <FormField label={label} required={required} touched={touched} error={error} className={wrapperClassName} hint={hint}>
          {content}
        </FormField>
      );
    }

    return (
      <div>
        {content}
        {touched && error && <p className="mt-1 text-xs text-red-500 dark:text-red-400">{error}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  touched?: boolean;
  error?: string | null;
  wrapperClassName?: string;
  hint?: string;
}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, required, touched, error, className, wrapperClassName, hint, ...props }, ref) => {
    const textAreaClass = getFieldValidationClass(touched, error, className);

    if (label) {
      return (
        <FormField label={label} required={required} touched={touched} error={error} className={wrapperClassName} hint={hint}>
          <textarea ref={ref} required={required} className={textAreaClass} {...props} />
        </FormField>
      );
    }

    return (
      <div>
        <textarea ref={ref} required={required} className={textAreaClass} {...props} />
        {touched && error && <p className="mt-1 text-xs text-red-500 dark:text-red-400">{error}</p>}
      </div>
    );
  }
);
TextArea.displayName = "TextArea";
