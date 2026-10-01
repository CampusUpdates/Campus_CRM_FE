import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import {
  updateInterview,
  type Interview,
  type InterviewResultType,
  type InterviewStatusType,
  type UpdateInterviewPayload,
} from "../../../services/interviewService";
import { fetchUsers, type UserItem } from "../../../services/userService";
import { getFieldValidationClass } from "../../../utils/formValidation";

type EditInterviewFormProps = {
  interview: Interview;
  onSuccess?: () => void;
};

const EditInterviewForm = ({ interview, onSuccess }: EditInterviewFormProps) => {
  const { accessToken } = useAuth();
  const toast = useToast();

  const [interviewers, setInterviewers] = useState<UserItem[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const initialDate = interview.scheduledAt
    ? new Date(
        new Date(interview.scheduledAt).getTime() -
          new Date(interview.scheduledAt).getTimezoneOffset() * 60000
      )
        .toISOString()
        .slice(0, 16)
    : "";

  const [formData, setFormData] = useState<UpdateInterviewPayload>({
    interviewerId: interview.interviewerId || "",
    scheduledAt: initialDate,
    status: interview.status || "SCHEDULED",
    result: interview.result || "PENDING",
    feedback: interview.feedback || "",
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadInterviewers() {
      try {
        if (accessToken) {
          const userData = await fetchUsers(accessToken);
          setInterviewers(userData);
        }
      } catch (err) {
        console.error("Failed to load interviewers list:", err);
      } finally {
        setLoadingOptions(false);
      }
    }
    loadInterviewers();
  }, [accessToken]);

  const validateEditInterviewField = (name: string, value: any): string | null => {
    if (name === "interviewerId" && !value) {
      return "Please select an assigned interviewer.";
    }
    if (name === "scheduledAt" && !value) {
      return "Please select scheduled date and time.";
    }
    return null;
  };

  const handleBlur = (name: string) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    const err = validateEditInterviewField(name, (formData as any)[name]);
    setErrors((prev) => ({ ...prev, [name]: err }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const nextData = { ...formData, [name]: value };
    setFormData(nextData);

    if (touched[name]) {
      const err = validateEditInterviewField(name, value);
      setErrors((prev) => ({ ...prev, [name]: err }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const allFields = ["interviewerId", "scheduledAt", "status", "result", "feedback"];
    const newTouched: Record<string, boolean> = {};
    const newErrors: Record<string, string | null> = {};
    let hasError = false;

    allFields.forEach((f) => {
      newTouched[f] = true;
      const err = validateEditInterviewField(f, (formData as any)[f]);
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
      const payload: UpdateInterviewPayload = {
        interviewerId: formData.interviewerId,
        scheduledAt: formData.scheduledAt ? new Date(formData.scheduledAt).toISOString() : new Date().toISOString(),
        status: (formData.status as InterviewStatusType) || "SCHEDULED",
        result: (formData.result as InterviewResultType) || "PENDING",
        feedback: formData.feedback?.trim() || undefined,
      };

      await updateInterview(accessToken, interview.id, payload);
      toast.showToast("Interview session & candidate status updated!", "success");
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update interview session.");
      toast.showToast(err.message || "Failed to update interview session.", "error");
    } finally {
      setLoading(false);
    }
  };

  const candidateName = interview.candidate
    ? `${interview.candidate.firstName} ${interview.candidate.lastName || ""}`
    : "Candidate #" + interview.candidateId;

  const positionTitle = interview.candidate?.position
    ? `${interview.candidate.position.title} (${interview.candidate.position.department})`
    : "Applicant";

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {errorMsg && (
        <div className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600 border border-red-200">
          {errorMsg}
        </div>
      )}

      {/* Read-Only Candidate Information Card */}
      <div className="rounded-xl border border-border bg-neutral-50 p-4">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
          Candidate Profile
        </span>
        <h4 className="mt-1 text-base font-bold text-text-primary">{candidateName}</h4>
        <p className="text-xs text-text-secondary">{positionTitle}</p>
        {interview.candidate?.phone && (
          <p className="mt-1 text-xs text-text-muted">Phone: {interview.candidate.phone}</p>
        )}
      </div>

      {/* Interviewer Dropdown */}
      <div>
        <label className="block text-xs font-semibold text-text-secondary mb-1">
          Assigned Interviewer <span className="text-red-500">*</span>
        </label>
        {loadingOptions ? (
          <div className="text-xs text-text-muted">Loading interviewers...</div>
        ) : (
          <select
            name="interviewerId"
            value={formData.interviewerId}
            onChange={handleChange}
            onBlur={() => handleBlur("interviewerId")}
            className={getFieldValidationClass(touched.interviewerId, errors.interviewerId, "w-full rounded-lg border bg-surface px-3.5 py-2.5 text-sm text-text-primary outline-none transition")}
          >
            <option value="" disabled>
              Select Interviewer
            </option>
            {interviewers.map((usr) => (
              <option key={usr.id} value={usr.id}>
                {usr.firstName} {usr.lastName || ""} ({usr.role?.name || usr.username})
              </option>
            ))}
          </select>
        )}
        {touched.interviewerId && errors.interviewerId && (
          <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.interviewerId}</p>
        )}
      </div>

      {/* Scheduled Date & Time */}
      <div>
        <label className="block text-xs font-semibold text-text-secondary mb-1">
          Scheduled Date & Time <span className="text-red-500">*</span>
        </label>
        <input
          type="datetime-local"
          name="scheduledAt"
          value={formData.scheduledAt}
          onChange={handleChange}
          onBlur={() => handleBlur("scheduledAt")}
          className={getFieldValidationClass(touched.scheduledAt, errors.scheduledAt, "w-full rounded-lg border bg-surface px-3.5 py-2.5 text-sm text-text-primary outline-none transition")}
        />
        {touched.scheduledAt && errors.scheduledAt && (
          <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.scheduledAt}</p>
        )}
      </div>

      {/* Status & Result Selectors */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1">
            Interview Status
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            onBlur={() => handleBlur("status")}
            className={getFieldValidationClass(touched.status, errors.status, "w-full rounded-lg border bg-surface px-3.5 py-2.5 text-sm text-text-primary outline-none transition")}
          >
            <option value="SCHEDULED">Scheduled</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1">
            Interview Result
          </label>
          <select
            name="result"
            value={formData.result}
            onChange={handleChange}
            onBlur={() => handleBlur("result")}
            className={getFieldValidationClass(touched.result, errors.result, "w-full rounded-lg border bg-surface px-3.5 py-2.5 text-sm text-text-primary outline-none transition")}
          >
            <option value="PENDING">Pending</option>
            <option value="PASSED">Passed (Selection)</option>
            <option value="FAILED">Failed (Rejection)</option>
            <option value="ON_HOLD">On Hold</option>
          </select>
        </div>
      </div>

      {/* Feedback / Evaluation Notes */}
      <div>
        <label className="block text-xs font-semibold text-text-secondary mb-1">
          Feedback / Evaluation Notes
        </label>
        <textarea
          name="feedback"
          rows={4}
          value={formData.feedback || ""}
          onChange={handleChange}
          onBlur={() => handleBlur("feedback")}
          placeholder="Record candidate strengths, technical assessment, soft skills, or interview score..."
          className={getFieldValidationClass(touched.feedback, errors.feedback, "w-full rounded-lg border bg-surface px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none transition")}
        />
      </div>

      {/* Sync Banner */}
      <div className="rounded-lg bg-blue-50 p-3 text-xs text-blue-800 border border-blue-200">
        💡 Updating result to <strong>PASSED</strong> will mark the candidate as <strong>SELECTED</strong>. Updating result to <strong>FAILED</strong> will mark the candidate as <strong>REJECTED</strong>.
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
          disabled={loading || loadingOptions}
          className="
            flex items-center gap-2 rounded-lg bg-primary-500 px-5 py-2.5
            text-sm font-medium text-white hover:bg-primary-600
            transition disabled:opacity-50
          "
        >
          {loading ? "Saving Changes..." : "Update Interview"}
        </button>
      </div>
    </form>
  );
};

export default EditInterviewForm;
