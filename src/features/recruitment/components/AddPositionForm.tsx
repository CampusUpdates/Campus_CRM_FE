import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import { createPosition, type CreatePositionPayload } from "../../../services/positionService";

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

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (name === "vacancies") {
      setFormData((prev) => ({ ...prev, [name]: Number(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!formData.title.trim()) {
      setErrorMsg("Job position title is required.");
      return;
    }

    if (!formData.department.trim()) {
      setErrorMsg("Department is required.");
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
    <form onSubmit={handleSubmit} className="space-y-5">
      {errorMsg && (
        <div className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600 border border-red-200">
          {errorMsg}
        </div>
      )}

      {/* Position Title */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">
          Position Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="title"
          required
          value={formData.title}
          onChange={handleChange}
          placeholder="e.g. Senior Program Advisor, Admissions Lead"
          className="
            w-full rounded-lg border border-border bg-background px-3.5 py-2.5
            text-sm text-text-primary placeholder:text-text-muted
            focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500
          "
        />
      </div>

      {/* Department */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">
          Department <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="department"
          required
          value={formData.department}
          onChange={handleChange}
          placeholder="e.g. Sales & Admissions, Human Resources, Engineering"
          className="
            w-full rounded-lg border border-border bg-background px-3.5 py-2.5
            text-sm text-text-primary placeholder:text-text-muted
            focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500
          "
        />
      </div>

      {/* Vacancies */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">
          Open Vacancies
        </label>
        <input
          type="number"
          name="vacancies"
          min="1"
          value={formData.vacancies}
          onChange={handleChange}
          className="
            w-full rounded-lg border border-border bg-background px-3.5 py-2.5
            text-sm text-text-primary placeholder:text-text-muted
            focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500
          "
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">
          Job Description / Requirements
        </label>
        <textarea
          name="description"
          rows={4}
          value={formData.description}
          onChange={handleChange}
          placeholder="Enter position responsibilities, qualifications, or prerequisites..."
          className="
            w-full rounded-lg border border-border bg-background px-3.5 py-2.5
            text-sm text-text-primary placeholder:text-text-muted
            focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500
          "
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
