import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, GitCommit, Check, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import { fetchActiveColleges, type College } from "../../../services/collegeService";
import {
  updateLeadPipeline,
  type LeadItem,
  type LeadStatusItem,
  type UpdateLeadPipelinePayload,
} from "../../../services/leadService";
import { getFieldValidationClass } from "../../../utils/formValidation";

type LeadPipelineDrawerProps = {
  lead: LeadItem;
  targetStatus: LeadStatusItem;
  onClose: () => void;
  onSuccess: (updatedLead?: any) => void;
};

const getStatusBadgeStyle = (statusName?: string, color?: string) => {
  const name = (statusName || "LEAD").toUpperCase();
  const c = (color || "").toLowerCase();

  if (name === "ADMISSION_DONE" || c === "green" || name.includes("ADMISSION")) {
    return "bg-emerald-100 text-emerald-800 border-emerald-300";
  }
  if (name === "LETTER_OUT" || c === "pink") {
    return "bg-pink-100 text-pink-800 border-pink-300";
  }
  if (name === "INTERVIEW_DONE" || c === "purple") {
    return "bg-purple-100 text-purple-800 border-purple-300";
  }
  if (name === "INTERVIEW_SCHEDULED" || c === "orange") {
    return "bg-orange-100 text-orange-800 border-orange-300";
  }
  if (name === "APPLICATION" || c === "yellow") {
    return "bg-amber-100 text-amber-800 border-amber-300";
  }
  if (name === "CANCELLED" || c === "red" || name.includes("CANCEL")) {
    return "bg-rose-100 text-rose-800 border-rose-300";
  }
  return "bg-blue-100 text-blue-800 border-blue-300";
};

const getStageExplanation = (statusName: string) => {
  switch (statusName) {
    case "APPLICATION":
      return "Create an official college application record with an Application ID.";
    case "INTERVIEW_SCHEDULED":
      return "Schedule a student interview date.";
    case "INTERVIEW_DONE":
      return "Record the interview result, conducted date, and evaluator feedback.";
    case "LETTER_OUT":
      return "Issue an admission selection letter with key dates and document URL.";
    case "ADMISSION_DONE":
      return "Confirm final admission by entering payment amount and transaction reference.";
    case "CANCELLED":
      return "Cancel a college application with mandatory justification.";
    default:
      return "Update pipeline details for the selected status stage.";
  }
};

const LeadPipelineDrawer = ({
  lead,
  targetStatus,
  onClose,
  onSuccess,
}: LeadPipelineDrawerProps) => {
  const { accessToken } = useAuth();
  const toast = useToast();

  const [isClosing, setIsClosing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [activeColleges, setActiveColleges] = useState<College[]>([]);

  // Pipeline form fields state (isolated)
  const statusName = (targetStatus.name || "").toUpperCase();

  // Selected college
  const existingApps = lead.collegeApplications || [];
  const defaultCollegeId =
    existingApps.length === 1 && existingApps[0].college?.id
      ? existingApps[0].college.id
      : "";

  const [selectedCollegeId, setSelectedCollegeId] = useState<string>(defaultCollegeId);

  // APPLICATION fields
  const [applicationId, setApplicationId] = useState("");
  const [applicationIdTouched, setApplicationIdTouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleApplicationIdKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      e.key.length > 1 ||
      e.ctrlKey ||
      e.metaKey ||
      e.altKey
    ) {
      return;
    }
    if (!/^[A-Za-z0-9_-]$/.test(e.key)) {
      e.preventDefault();
      setApplicationIdTouched(true);
    }
  };

  const getApplicationIdError = (val: string, isTouchedOrSubmitted: boolean): string | null => {
    if (!isTouchedOrSubmitted && val.length === 0) return null;
    const trimmed = val.trim();
    if (!trimmed) {
      return "Application ID is required.";
    }
    if (!/^[A-Za-z0-9_-]+$/.test(trimmed)) {
      return "Application ID can contain only letters, numbers, hyphens (-), and underscores (_).";
    }
    return null;
  };

  const isAppIdTouchedOrSubmitted = applicationIdTouched || submitted;
  const appIdError = getApplicationIdError(applicationId, isAppIdTouchedOrSubmitted);

  // INTERVIEW_SCHEDULED fields
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewTime, setInterviewTime] = useState("10:00");

  // INTERVIEW_DONE fields
  const [interviewResult, setInterviewResult] = useState<string>("PASSED");
  const [interviewFeedback, setInterviewFeedback] = useState("");
  const [conductedDate, setConductedDate] = useState("");
  const [conductedTime, setConductedTime] = useState("12:00");

  // LETTER_OUT fields
  const [letterIssuedDate, setLetterIssuedDate] = useState("");
  const [admissionLastDate, setAdmissionLastDate] = useState("");
  const [letterUrl, setLetterUrl] = useState("");

  // ADMISSION_DONE fields
  const [admissionAmount, setAdmissionAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [paymentMode, setPaymentMode] = useState("ONLINE");
  const [transactionRef, setTransactionRef] = useState("");

  // CANCELLED fields
  const [cancellationReason, setCancellationReason] = useState("");

  useEffect(() => {
    if (accessToken) {
      setFetchingData(true);
      fetchActiveColleges(accessToken)
        .catch(() => [])
        .then((collegesList) => {
          setActiveColleges(collegesList);

          if (statusName === "APPLICATION") {
            const pitchedUnapplied = existingApps.find(
              (app) => !app.applicationId
            );
            if (pitchedUnapplied) {
              const colId = pitchedUnapplied.college?.id || pitchedUnapplied.collegeId || "";
              if (colId) setSelectedCollegeId(colId);
            } else if (existingApps.length > 0) {
              const firstColId = existingApps[0].college?.id || existingApps[0].collegeId || "";
              if (firstColId) setSelectedCollegeId(firstColId);
            } else {
              const unapplied = collegesList.filter(
                (c) => !existingApps.some((app) => (app.college?.id || app.collegeId) === c.id)
              );
              if (unapplied.length === 1) {
                setSelectedCollegeId(unapplied[0].id);
              }
            }
          } else if (existingApps.length > 0) {
            const firstColId = existingApps[0].college?.id || existingApps[0].collegeId || "";
            if (firstColId) {
              setSelectedCollegeId(firstColId);
            }
          }
        })
        .finally(() => setFetchingData(false));
    }
  }, [accessToken, statusName, existingApps.length]);

  const handleClose = () => {
    setIsClosing(true);
  };

  const handleAnimationEnd = () => {
    if (isClosing) {
      onClose();
    }
  };

  // Basic frontend validation for enabling primary submit button
  const isValid = () => {
    if (!selectedCollegeId) return false;

    switch (statusName) {
      case "APPLICATION":
        return applicationId.trim().length > 0 && /^[A-Za-z0-9_-]+$/.test(applicationId.trim());
      case "INTERVIEW_SCHEDULED":
        return interviewDate.length > 0;
      case "INTERVIEW_DONE":
        return interviewResult.length > 0;
      case "LETTER_OUT":
        return letterIssuedDate.length > 0 && admissionLastDate.length > 0;
      case "ADMISSION_DONE":
        return Boolean(admissionAmount) && Number(admissionAmount) > 0;
      case "CANCELLED":
        return cancellationReason.trim().length > 0;
      default:
        return true;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (statusName === "APPLICATION") {
      setApplicationIdTouched(true);
    }
    if (!accessToken) return;
    if (!isValid()) return;

    setLoading(true);
    setErrorMsg(null);

    const payload: UpdateLeadPipelinePayload = {
      statusId: targetStatus.id,
      collegeId: selectedCollegeId,
    };

    // Include the exact LeadCollege record ID for precise targeting
    const matchedApp = existingApps.find(
      (app) => (app.college?.id || app.collegeId) === selectedCollegeId
    );
    if (matchedApp) {
      payload.leadCollegeId = matchedApp.id;
    }

    try {
      if (statusName === "APPLICATION") {
        payload.applicationId = applicationId.trim();
      } else if (statusName === "INTERVIEW_SCHEDULED") {
        const scheduledAt = new Date(
          `${interviewDate}T${interviewTime || "10:00"}`
        ).toISOString();
        payload.interview = {
          scheduledAt,
        };
      } else if (statusName === "INTERVIEW_DONE") {
        const conductedAt = conductedDate
          ? new Date(`${conductedDate}T${conductedTime || "12:00"}`).toISOString()
          : new Date().toISOString();
        payload.interviewResult = {
          result: interviewResult,
          feedback: interviewFeedback.trim() || undefined,
          conductedAt,
        };
      } else if (statusName === "LETTER_OUT") {
        payload.selectionLetter = {
          issuedAt: new Date(letterIssuedDate).toISOString(),
          admissionLastDate: new Date(admissionLastDate).toISOString(),
          letterUrl: letterUrl.trim() || undefined,
        };
      } else if (statusName === "ADMISSION_DONE") {
        const paidAt = paymentDate
          ? new Date(paymentDate).toISOString()
          : new Date().toISOString();
        payload.admission = {
          amount: Number(admissionAmount),
          paymentMode,
          transactionRef: transactionRef.trim() || undefined,
          paidAt,
        };
      } else if (statusName === "CANCELLED") {
        payload.cancellation = {
          reason: cancellationReason.trim(),
        };
      }

      const updatedLead = await updateLeadPipeline(accessToken, lead.id, payload);
      toast.showToast(`Lead pipeline updated to ${targetStatus.name}!`, "success");
      onSuccess(updatedLead);
      handleClose();
    } catch (err: any) {
      let message = err.message || "Failed to update pipeline status";
      const isDuplicateAppError = message.includes("already exists for this lead") || message.includes("409");
      
      if (isDuplicateAppError) {
        message = "This lead already has an application for this college.";
      } else {
        // Only set inline error for other types of errors
        setErrorMsg(message);
      }
      
      toast.showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const fullName = `${lead.firstName} ${lead.lastName || ""}`.trim();
  const badgeStyle = getStatusBadgeStyle(targetStatus.name, targetStatus.color);

  return createPortal(
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className={`fixed inset-0 bg-black/50 transition-opacity duration-300 ${isClosing ? "opacity-0" : "opacity-100"
          }`}
      />

      {/* Standardized Right-Side Sliding Drawer */}
      <div
        onAnimationEnd={handleAnimationEnd}
        className={`
          fixed right-0 top-0
          h-[100dvh]
          w-[42vw]
          min-w-[480px]
          bg-surface
          shadow-2xl
          flex flex-col
          ${isClosing ? "animate-slide-out" : "animate-slide-in"}
        `}
      >
        {/* Drawer Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shadow-2xs">
              <GitCommit size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold text-text-primary">
                  Edit Lead Pipeline
                </h2>
                <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badgeStyle}`}>
                  {targetStatus.name}
                </span>
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                {fullName} (#{lead.id.slice(0, 6).toUpperCase()})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-2 text-text-secondary transition hover:bg-neutral-100 hover:text-text-primary"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Explanation Banner */}
          <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-4">
            <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-1">
              Stage Information: {targetStatus.name}
            </h4>
            <p className="text-xs text-blue-700 leading-relaxed">
              {getStageExplanation(statusName)}
            </p>
          </div>

          {/* Server Error Alert Banner */}
          {errorMsg && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 flex items-start gap-3 text-rose-800 text-xs font-medium">
              <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {fetchingData ? (
            <div className="flex items-center justify-center py-12 text-sm text-text-muted">
              <Loader2 size={20} className="animate-spin mr-2 text-amber-500" />
              Loading pipeline configuration...
            </div>
          ) : (
            <form id="pipeline-form" onSubmit={handleSubmit} className="space-y-5">
              {/* College Selection */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  College Application <span className="text-rose-500">*</span>
                </label>

                {statusName === "APPLICATION" ? (
                  /* Available Active Colleges for Application */
                  <select
                    value={selectedCollegeId}
                    onChange={(e) => setSelectedCollegeId(e.target.value)}
                    required
                    className="h-11 w-full rounded-lg border border-border bg-surface px-4 text-sm text-text-primary outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                  >
                    <option value="">-- Select College for Application --</option>
                    {existingApps.length > 0 && (
                      <optgroup label="Pitched Colleges">
                        {existingApps.map((app) => {
                          const colId = app.college?.id || app.collegeId || app.id;
                          const colName = app.college?.name || "College";
                          const appIdStr = app.applicationId
                            ? ` (App ID: ${app.applicationId})`
                            : " (Pitched)";
                          return (
                            <option key={app.id} value={colId}>
                              {colName}{appIdStr}
                            </option>
                          );
                        })}
                      </optgroup>
                    )}
                    <optgroup label="Other Available Colleges">
                      {activeColleges
                        .filter(
                          (c) =>
                            !existingApps.some(
                              (app) => (app.college?.id || app.collegeId) === c.id
                            )
                        )
                        .map((college) => (
                          <option key={college.id} value={college.id}>
                            {college.name} {college.city ? `(${college.city})` : ""}
                          </option>
                        ))}
                    </optgroup>
                  </select>
                ) : (
                  /* Existing Lead Applications for Pipeline Progression */
                  <select
                    value={selectedCollegeId}
                    onChange={(e) => setSelectedCollegeId(e.target.value)}
                    required
                    className="h-11 w-full rounded-lg border border-border bg-surface px-4 text-sm text-text-primary outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                  >
                    <option value="">-- Select Existing College Application --</option>
                    {existingApps.length > 0 ? (
                      existingApps.map((app) => {
                        const colId = app.college?.id || app.collegeId || app.id;
                        const colName = app.college?.name || "College";
                        const appIdStr = app.applicationId ? ` (App ID: ${app.applicationId})` : "";
                        const curStatusStr = app.status?.name ? ` [Stage: ${app.status.name}]` : "";

                        return (
                          <option key={app.id} value={colId}>
                            {colName}{appIdStr}{curStatusStr}
                          </option>
                        );
                      })
                    ) : (
                      /* Fallback to Active Colleges if no existing app registered */
                      activeColleges.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.city ? `(${c.city})` : ""}
                        </option>
                      ))
                    )}
                  </select>
                )}
                <p className="mt-1 text-[11px] text-text-muted">
                  {statusName === "APPLICATION"
                    ? "Select the target college to register a new application."
                    : "Select which college application stage is being progressed."}
                </p>

                {(() => {
                  const selectedApp = existingApps.find(
                    (app) => (app.college?.id || app.collegeId) === selectedCollegeId
                  );
                  if (selectedApp?.approvalStatus === "PENDING") {
                    return (
                      <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 flex items-start gap-2">
                        <AlertCircle size={15} className="shrink-0 text-amber-600 mt-0.5" />
                        <span>This college pitch is awaiting manager approval. The pipeline cannot be changed until it is approved.</span>
                      </div>
                    );
                  }
                  if (selectedApp?.approvalStatus === "REJECTED") {
                    return (
                      <div className="mt-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 flex items-start gap-2">
                        <AlertCircle size={15} className="shrink-0 text-rose-600 mt-0.5" />
                        <span>This college pitch was rejected by the manager. Pipeline changes are not allowed.</span>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              {/* DYNAMIC PIPELINE FIELDS */}

              {/* 1. APPLICATION STAGE */}
              {statusName === "APPLICATION" && (
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Application ID <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={applicationId}
                    onChange={(e) => {
                      setApplicationId(e.target.value);
                      setApplicationIdTouched(true);
                    }}
                    onBlur={() => setApplicationIdTouched(true)}
                    onKeyDown={handleApplicationIdKeyDown}
                    placeholder="e.g. APP-12345 or REG-987"
                    required
                    className={getFieldValidationClass(
                      isAppIdTouchedOrSubmitted || applicationId.length > 0,
                      appIdError,
                      "h-11 w-full rounded-lg border bg-surface px-4 text-sm text-text-primary outline-none transition placeholder:text-text-muted"
                    )}
                  />
                  {appIdError ? (
                    <p className="mt-1.5 text-[11px] font-medium text-rose-500 dark:text-red-400">
                      {appIdError}
                    </p>
                  ) : (
                    <p className="mt-1.5 text-[11px] text-text-muted">
                      Official registration/application number provided by the college.
                    </p>
                  )}
                </div>
              )}

              {/* 2. INTERVIEW_SCHEDULED STAGE */}
              {statusName === "INTERVIEW_SCHEDULED" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Interview Date <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={interviewDate}
                        onChange={(e) => setInterviewDate(e.target.value)}
                        required
                        className="h-11 w-full rounded-lg border border-border bg-surface px-4 text-sm text-text-primary outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Interview Time
                      </label>
                      <input
                        type="time"
                        value={interviewTime}
                        onChange={(e) => setInterviewTime(e.target.value)}
                        className="h-11 w-full rounded-lg border border-border bg-surface px-4 text-sm text-text-primary outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 3. INTERVIEW_DONE STAGE */}
              {statusName === "INTERVIEW_DONE" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Interview Result <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={interviewResult}
                      onChange={(e) => setInterviewResult(e.target.value)}
                      required
                      className="h-11 w-full rounded-lg border border-border bg-surface px-4 text-sm text-text-primary outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                    >
                      <option value="PASSED">Passed</option>
                      <option value="FAILED">Failed</option>
                      <option value="ON_HOLD">On Hold</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Conducted Date
                      </label>
                      <input
                        type="date"
                        value={conductedDate}
                        onChange={(e) => setConductedDate(e.target.value)}
                        className="h-11 w-full rounded-lg border border-border bg-surface px-4 text-sm text-text-primary outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Conducted Time
                      </label>
                      <input
                        type="time"
                        value={conductedTime}
                        onChange={(e) => setConductedTime(e.target.value)}
                        className="h-11 w-full rounded-lg border border-border bg-surface px-4 text-sm text-text-primary outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Evaluator Feedback
                    </label>
                    <textarea
                      rows={3}
                      value={interviewFeedback}
                      onChange={(e) => setInterviewFeedback(e.target.value)}
                      placeholder="Add notes about candidate performance..."
                      className="w-full rounded-lg border border-border bg-surface p-3 text-sm text-text-primary outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 placeholder:text-text-muted"
                    />
                  </div>
                </div>
              )}

              {/* 4. LETTER_OUT STAGE */}
              {statusName === "LETTER_OUT" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Letter Issued Date <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={letterIssuedDate}
                        onChange={(e) => setLetterIssuedDate(e.target.value)}
                        required
                        className="h-11 w-full rounded-lg border border-border bg-surface px-4 text-sm text-text-primary outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Admission Last Date <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={admissionLastDate}
                        onChange={(e) => setAdmissionLastDate(e.target.value)}
                        required
                        className="h-11 w-full rounded-lg border border-border bg-surface px-4 text-sm text-text-primary outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Letter Document URL (Optional)
                    </label>
                    <input
                      type="url"
                      value={letterUrl}
                      onChange={(e) => setLetterUrl(e.target.value)}
                      placeholder="https://storage.example.com/letters/offer.pdf"
                      className="h-11 w-full rounded-lg border border-border bg-surface px-4 text-sm text-text-primary outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 placeholder:text-text-muted"
                    />
                  </div>
                </div>
              )}

              {/* 5. ADMISSION_DONE STAGE */}
              {statusName === "ADMISSION_DONE" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Amount Submitted (₹) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="any"
                      value={admissionAmount}
                      onChange={(e) => setAdmissionAmount(e.target.value)}
                      placeholder="e.g. 50000"
                      required
                      className="h-11 w-full rounded-lg border border-border bg-surface px-4 text-sm text-text-primary outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 placeholder:text-text-muted"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Payment Date
                      </label>
                      <input
                        type="date"
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                        className="h-11 w-full rounded-lg border border-border bg-surface px-4 text-sm text-text-primary outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Payment Mode
                      </label>
                      <select
                        value={paymentMode}
                        onChange={(e) => setPaymentMode(e.target.value)}
                        className="h-11 w-full rounded-lg border border-border bg-surface px-4 text-sm text-text-primary outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                      >
                        <option value="ONLINE">Online Payment</option>
                        <option value="UPI">UPI</option>
                        <option value="BANK_TRANSFER">Bank Transfer</option>
                        <option value="CHEQUE">Cheque</option>
                        <option value="DEMAND_DRAFT">Demand Draft</option>
                        <option value="CASH">Cash</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Transaction Reference
                    </label>
                    <input
                      type="text"
                      value={transactionRef}
                      onChange={(e) => setTransactionRef(e.target.value)}
                      placeholder="e.g. TXN987654321"
                      className="h-11 w-full rounded-lg border border-border bg-surface px-4 text-sm text-text-primary outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 placeholder:text-text-muted"
                    />
                  </div>
                </div>
              )}

              {/* 6. CANCELLED STAGE */}
              {statusName === "CANCELLED" && (
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Cancellation Reason <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    placeholder="Provide mandatory reason why this application was cancelled..."
                    required
                    className="w-full rounded-lg border border-border bg-surface p-3 text-sm text-text-primary outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 placeholder:text-text-muted"
                  />
                </div>
              )}
            </form>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-neutral-50/50 shrink-0">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2.5 text-sm font-medium border border-border rounded-lg hover:bg-neutral-100 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            form="pipeline-form"
            type="submit"
            disabled={loading || fetchingData || !isValid()}
            className="px-5 py-2.5 text-sm font-medium bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition shadow-sm flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Saving Changes...
              </>
            ) : (
              <>
                <Check size={16} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default LeadPipelineDrawer;
