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

        // Default scheduled date: tomorrow at 10:00 AM
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!formData.candidateId) {
      setErrorMsg("Please select a candidate.");
      return;
    }

    if (!formData.interviewerId) {
      setErrorMsg("Please select an interviewer.");
      return;
    }

    if (!formData.scheduledAt) {
      setErrorMsg("Please select the interview date and time.");
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
    <form onSubmit={handleSubmit} className="space-y-5">
      {errorMsg && (
        <div className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600 border border-red-200">
          {errorMsg}
        </div>
      )}

      {/* Candidate Dropdown */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">
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
            required
            value={formData.candidateId}
            onChange={handleChange}
            className="
              w-full rounded-lg border border-border bg-background px-3.5 py-2.5
              text-sm text-text-primary focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500
            "
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
      </div>

      {/* Interviewer Dropdown */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">
          Assigned Interviewer <span className="text-red-500">*</span>
        </label>
        {loadingOptions ? (
          <div className="text-xs text-text-muted">Loading interviewers...</div>
        ) : (
          <select
            name="interviewerId"
            required
            value={formData.interviewerId}
            onChange={handleChange}
            className="
              w-full rounded-lg border border-border bg-background px-3.5 py-2.5
              text-sm text-text-primary focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500
            "
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
      </div>

      {/* Scheduled Date & Time */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">
          Scheduled Date & Time <span className="text-red-500">*</span>
        </label>
        <input
          type="datetime-local"
          name="scheduledAt"
          required
          value={formData.scheduledAt}
          onChange={handleChange}
          className="
            w-full rounded-lg border border-border bg-background px-3.5 py-2.5
            text-sm text-text-primary focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500
          "
        />
      </div>

      {/* Status & Result */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            Interview Status
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="
              w-full rounded-lg border border-border bg-background px-3.5 py-2.5
              text-sm text-text-primary focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500
            "
          >
            <option value="SCHEDULED">Scheduled</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            Interview Result
          </label>
          <select
            name="result"
            value={formData.result}
            onChange={handleChange}
            className="
              w-full rounded-lg border border-border bg-background px-3.5 py-2.5
              text-sm text-text-primary focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500
            "
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
        <label className="block text-sm font-medium text-text-primary mb-1">
          Feedback / Notes
        </label>
        <textarea
          name="feedback"
          rows={3}
          value={formData.feedback || ""}
          onChange={handleChange}
          placeholder="Add any interviewer instructions, round details, or feedback..."
          className="
            w-full rounded-lg border border-border bg-background px-3.5 py-2.5
            text-sm text-text-primary placeholder:text-text-muted
            focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500
          "
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
