import { useState, useCallback } from "react";

export type ValidationRules<T> = {
  [K in keyof T]?: (value: T[K], formData: T) => string | null | undefined;
};

export interface UseFormValidationOptions<T extends Record<string, any>> {
  initialValues: T;
  rules?: ValidationRules<T>;
  onSubmit?: (values: T) => void | Promise<void>;
}

export function useFormValidation<T extends Record<string, any>>({
  initialValues,
  rules = {},
  onSubmit,
}: UseFormValidationOptions<T>) {
  const [formData, setFormData] = useState<T>(initialValues);
  const [touched, setTouched] = useState<Record<keyof T, boolean>>(() => {
    const t = {} as Record<keyof T, boolean>;
    if (initialValues) {
      Object.keys(initialValues).forEach((key) => {
        t[key as keyof T] = false;
      });
    }
    return t;
  });

  const [errors, setErrors] = useState<Record<keyof T, string | null>>(() => {
    const e = {} as Record<keyof T, string | null>;
    if (initialValues) {
      Object.keys(initialValues).forEach((key) => {
        e[key as keyof T] = null;
      });
    }
    return e;
  });

  const validateSingleField = useCallback(
    (name: keyof T, value: any, currentData: T): string | null => {
      const validator = rules[name];
      if (!validator) return null;
      return validator(value, currentData) || null;
    },
    [rules]
  );

  const handleBlur = useCallback(
    (name: keyof T) => {
      setTouched((prev) => ({ ...prev, [name]: true }));
      setErrors((prev) => ({
        ...prev,
        [name]: validateSingleField(name, formData[name], formData),
      }));
    },
    [formData, validateSingleField]
  );

  const handleChange = useCallback(
    (name: keyof T, value: any) => {
      setFormData((prev) => {
        const next = { ...prev, [name]: value };
        // If the field was already touched, immediately re-validate so border flips RED <-> GREEN on fix
        if (touched[name]) {
          const err = validateSingleField(name, value, next);
          setErrors((prevErrors) => ({ ...prevErrors, [name]: err }));
        }
        return next;
      });
    },
    [touched, validateSingleField]
  );

  const markAllTouched = useCallback(() => {
    const allTouched = {} as Record<keyof T, boolean>;
    Object.keys(formData).forEach((key) => {
      allTouched[key as keyof T] = true;
    });
    setTouched(allTouched);
  }, [formData]);

  const validateAll = useCallback((): boolean => {
    markAllTouched();
    const newErrors = {} as Record<keyof T, string | null>;
    let isValid = true;

    (Object.keys(formData) as Array<keyof T>).forEach((key) => {
      const err = validateSingleField(key, formData[key], formData);
      newErrors[key] = err;
      if (err) {
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [formData, markAllTouched, validateSingleField]);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      const valid = validateAll();
      if (valid && onSubmit) {
        await onSubmit(formData);
      }
      return valid;
    },
    [formData, onSubmit, validateAll]
  );

  const resetForm = useCallback(
    (newValues?: T) => {
      const valuesToUse = newValues || initialValues;
      setFormData(valuesToUse);
      const resetTouched = {} as Record<keyof T, boolean>;
      const resetErrors = {} as Record<keyof T, string | null>;
      Object.keys(valuesToUse).forEach((key) => {
        resetTouched[key as keyof T] = false;
        resetErrors[key as keyof T] = null;
      });
      setTouched(resetTouched);
      setErrors(resetErrors);
    },
    [initialValues]
  );

  return {
    formData,
    setFormData,
    touched,
    setTouched,
    errors,
    setErrors,
    handleBlur,
    handleChange,
    validateAll,
    markAllTouched,
    handleSubmit,
    resetForm,
  };
}
