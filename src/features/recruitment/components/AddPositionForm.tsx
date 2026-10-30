import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import { createPosition, type CreatePositionPayload } from "../../../services/positionService";
import { getFieldValidationClass } from "../../../utils/formValidation";

type AddPositionFormProps = {
  onSuccess?: () => void;
};

const AddPositionForm = ({ onSuccess }: AddPositionFormProps) => {
  const { accessToken } = useAuth();
  const toast = useToast();

  const [formData, setFormData] = useState<CreatePositionPayload>({
    title: "",
    department: "",
    description: "",
    vacancies: 1,
    isActive: true,
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const validatePositionField = (name: string, value: any): string | null => {
    if (name === "title" && !String(value || "").trim()) {
      return "Job position title is required.";
    }
    if (name === "department" && !String(value || "").trim()) {
      return "Department is required.";
    }
    return null;
  };

  const handleBlur = (name: string) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    const err = validatePositionField(name, (formData as any)[name]);
    setErrors((prev) => ({ ...prev, [name]: err }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    let nextVal: any = value;
    if (type === "checkbox") {
      nextVal = (e.target as HTMLInputElement).checked;
    } else if (name === "vacancies") {
      nextVal = Number(value);
    }

    const nextData = { ...formData, [name]: nextVal };
    setFormData(nextData);

    if (touched[name]) {
      const err = validatePositionField(name, nextVal);
      setErrors((prev) => ({ ...prev, [name]: err }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const allFields = ["title", "department", "vacancies", "description"];
    const newTouched: Record<string, boolean> = {};
    const newErrors: Record<string, string | null> = {};
    let hasError = false;

    allFields.forEach((f) => {
      newTouched[f] = true;
      const err = validatePositionField(f, (formData as any)[f]);
      newErrors[f] = err;
      if (err) hasError = true;
    });

    setTouched(newTouched);
    setErrors(newErrors);

    if (hasError) {
      const firstErr = Object.values(newErrors).find(Boolean);
      if (firstErr) setErrorMsg(firstErr);
      return;
    }

    setLoading(true);

    try {
      await createPosition(accessToken, formData);
      toast.showToast("Job position created successfully!", "success");
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create position.");
      toast.showToast(err.message || "Failed to create position.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {errorMsg && (
        <div className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600 border border-red-200">
          {errorMsg}
        </div>
      )}

      {/* Position Title */}
      <div>
        <label className="block text-xs font-semibold text-text-secondary mb-1">
          Position Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          onBlur={() => handleBlur("title")}
          placeholder="e.g. Senior Program Advisor, Admissions Lead"
          className={getFieldValidationClass(touched.title, errors.title, "w-full rounded-lg border bg-surface px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none transition")}
        />
        {touched.title && errors.title && (
          <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.title}</p>
        )}
      </div>

      {/* Department */}
      <div>
        <label className="block text-xs font-semibold text-text-secondary mb-1">
          Department <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="department"
          value={formData.department}
          onChange={handleChange}
          onBlur={() => handleBlur("department")}
          placeholder="e.g. Sales & Admissions, Human Resources, Engineering"
          className={getFieldValidationClass(touched.department, errors.department, "w-full rounded-lg border bg-surface px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none transition")}
        />
        {touched.department && errors.department && (
          <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.department}</p>
        )}
      </div>

      {/* Vacancies */}
      <div>
        <label className="block text-xs font-semibold text-text-secondary mb-1">
          Open Vacancies
        </label>
        <input
          type="number"
          name="vacancies"
          min="1"
          value={formData.vacancies}
          onChange={handleChange}
          onBlur={() => handleBlur("vacancies")}
          className={getFieldValidationClass(touched.vacancies, errors.vacancies, "w-full rounded-lg border bg-surface px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none transition")}
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-semibold text-text-secondary mb-1">
          Job Description / Requirements
        </label>
        <textarea
          name="description"
          rows={4}
          value={formData.description}
          onChange={handleChange}
          onBlur={() => handleBlur("description")}
          placeholder="Enter position responsibilities, qualifications, or prerequisites..."
          className={getFieldValidationClass(touched.description, errors.description, "w-full rounded-lg border bg-surface px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none transition")}
        />
      </div>

      {/* Active Toggle */}
      <div className="flex items-center gap-2 pt-1">
        <input
          type="checkbox"
          id="isActive"
          name="isActive"
          checked={formData.isActive}
          onChange={handleChange}
          className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500"
        />
        <label htmlFor="isActive" className="text-sm font-medium text-text-primary">
          Mark as Active / Open for Applications
        </label>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
        <button
          type="button"
          onClick={onSuccess}
          disabled={loading}
          className="
            rounded-lg border border-border px-4 py-2.5
            text-sm font-medium text-text-secondary
            hover:bg-neutral-100 transition disabled:opacity-50
          "
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={loading}
          className="
            flex items-center gap-2 rounded-lg bg-primary-500 px-5 py-2.5
            text-sm font-medium text-white hover:bg-primary-600
            transition disabled:opacity-50
          "
        >
          {loading ? "Posting..." : "Post Position"}
        </button>
      </div>
    </form>
  );
};

export default AddPositionForm;
