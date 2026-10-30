import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import { fetchCandidates, type Candidate } from "../../../services/candidateService";
import {
  createInterview,
  type CreateInterviewPayload,
  type InterviewResultType,
  type InterviewStatusType,
} from "../../../services/interviewService";
import { fetchUsers, type UserItem } from "../../../services/userService";
import { getFieldValidationClass } from "../../../utils/formValidation";

type ScheduleInterviewFormProps = {
  onSuccess?: () => void;
};

const ScheduleInterviewForm = ({ onSuccess }: ScheduleInterviewFormProps) => {
  const { accessToken, user: currentUser } = useAuth();
  const toast = useToast();

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [interviewers, setInterviewers] = useState<UserItem[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const [formData, setFormData] = useState<CreateInterviewPayload>({
    candidateId: "",
    interviewerId: "",
    scheduledAt: "",
    status: "SCHEDULED",
    result: "PENDING",
    feedback: "",
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadOptions() {
      try {
        const [candData, userData] = await Promise.all([
          fetchCandidates(accessToken || undefined),
          accessToken ? fetchUsers(accessToken) : Promise.resolve([]),
        ]);
        setCandidates(candData);
        setInterviewers(userData);

        const initialCandidateId = candData.length > 0 ? candData[0].id : "";
        const initialInterviewerId =
          userData.length > 0
            ? currentUser?.sub && userData.some((u) => u.id === currentUser.sub)
              ? currentUser.sub
              : userData[0].id
            : "";

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(10, 0, 0, 0);
        const localIsoString = new Date(
          tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60000
        )
          .toISOString()
          .slice(0, 16);

        setFormData((prev) => ({
          ...prev,
          candidateId: initialCandidateId,
          interviewerId: initialInterviewerId,
          scheduledAt: localIsoString,
        }));
      } catch (err) {
        console.error("Failed to load candidates or interviewers:", err);
      } finally {
        setLoadingOptions(false);
      }
    }
    loadOptions();
  }, [accessToken, currentUser]);

  const validateInterviewField = (name: string, value: any): string | null => {
    if (name === "candidateId" && !value) {
      return "Please select a candidate.";
    }
    if (name === "interviewerId" && !value) {
      return "Please select an interviewer.";
    }
    if (name === "scheduledAt" && !value) {
      return "Please select the interview date and time.";
    }
    return null;
  };

  const handleBlur = (name: string) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    const err = validateInterviewField(name, (formData as any)[name]);
    setErrors((prev) => ({ ...prev, [name]: err }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const nextData = { ...formData, [name]: value };
    setFormData(nextData);

    if (touched[name]) {
      const err = validateInterviewField(name, value);
      setErrors((prev) => ({ ...prev, [name]: err }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const allFields = ["candidateId", "interviewerId", "scheduledAt", "status", "result", "feedback"];
    const newTouched: Record<string, boolean> = {};
    const newErrors: Record<string, string | null> = {};
    let hasError = false;

    allFields.forEach((f) => {
      newTouched[f] = true;
      const err = validateInterviewField(f, (formData as any)[f]);
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
      const payload: CreateInterviewPayload = {
        candidateId: formData.candidateId,
        interviewerId: formData.interviewerId,
        scheduledAt: new Date(formData.scheduledAt).toISOString(),
        status: (formData.status as InterviewStatusType) || "SCHEDULED",
        result: (formData.result as InterviewResultType) || "PENDING",
        feedback: formData.feedback?.trim() || undefined,
      };

      await createInterview(accessToken, payload);
      toast.showToast("Interview scheduled successfully!", "success");
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to schedule interview.");
      toast.showToast(err.message || "Failed to schedule interview.", "error");
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

      {/* Candidate Dropdown */}
      <div>
        <label className="block text-xs font-semibold text-text-secondary mb-1">
          Select Candidate <span className="text-red-500">*</span>
        </label>
        {loadingOptions ? (
          <div className="text-xs text-text-muted">Loading candidate list...</div>
        ) : candidates.length === 0 ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            No candidates registered yet. Please add a candidate first.
          </div>
        ) : (
          <select
            name="candidateId"
            value={formData.candidateId}
            onChange={handleChange}
            onBlur={() => handleBlur("candidateId")}
            className={getFieldValidationClass(touched.candidateId, errors.candidateId, "w-full rounded-lg border bg-surface px-3.5 py-2.5 text-sm text-text-primary outline-none transition")}
          >
            <option value="" disabled>
              Select Candidate
            </option>
            {candidates.map((cand) => (
              <option key={cand.id} value={cand.id}>
                {cand.firstName} {cand.lastName || ""} — {cand.position?.title || "Applicant"} ({cand.phone})
              </option>
            ))}
          </select>
        )}
        {touched.candidateId && errors.candidateId && (
          <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.candidateId}</p>
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

      {/* Status & Result */}
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
            <option value="PASSED">Passed</option>
            <option value="FAILED">Failed</option>
            <option value="ON_HOLD">On Hold</option>
          </select>
        </div>
      </div>

      {/* Feedback / Notes */}
      <div>
        <label className="block text-xs font-semibold text-text-secondary mb-1">
          Feedback / Notes
        </label>
        <textarea
          name="feedback"
          rows={3}
          value={formData.feedback || ""}
          onChange={handleChange}
          onBlur={() => handleBlur("feedback")}
          placeholder="Add any interviewer instructions, round details, or feedback..."
          className={getFieldValidationClass(touched.feedback, errors.feedback, "w-full rounded-lg border bg-surface px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none transition")}
        />
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
          disabled={loading || loadingOptions || candidates.length === 0}
          className="
            flex items-center gap-2 rounded-lg bg-primary-500 px-5 py-2.5
            text-sm font-medium text-white hover:bg-primary-600
            transition disabled:opacity-50
          "
        >
          {loading ? "Scheduling..." : "Schedule Interview"}
        </button>
      </div>
    </form>
  );
};

export default ScheduleInterviewForm;
