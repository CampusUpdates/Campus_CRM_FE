import { useEffect, useState } from "react";
import {
  User,
  Phone,
  Mail,
  MapPin,
  FileSpreadsheet,
  Clock,
  ShieldCheck,
  History,
  FileText,
  Tag,
  Loader2,
  Calendar,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import {
  fetchCallHistory,
  type MockCallQueueStudentItem,
  type CallRecordItem,
} from "../../../services/mockCallService";

interface StudentDetailsCardProps {
  student: MockCallQueueStudentItem | null;
  totalAssigned: number;
  currentIndex: number;
  phonePosition?: number;
  refreshKey?: number;
  onOpenHistory?: () => void;
}

const OUTCOME_LABEL_MAP: Record<string, { label: string; badgeClass: string }> = {
  NO_ANSWER: {
    label: "No Answer",
    badgeClass: "border-neutral-300 text-neutral-700 bg-neutral-100",
  },
  WRONG_NUMBER: {
    label: "Wrong Number",
    badgeClass: "border-rose-300 text-rose-700 bg-rose-50",
  },
  NOT_INTERESTED: {
    label: "Not Interested",
    badgeClass: "border-amber-300 text-amber-700 bg-amber-50",
  },
  FOLLOW_UP: {
    label: "Follow Up",
    badgeClass: "border-blue-300 text-blue-700 bg-blue-50",
  },
  CALL_BACK_LATER: {
    label: "Call Back Later",
    badgeClass: "border-purple-300 text-purple-700 bg-purple-50",
  },
  INTERESTED: {
    label: "Interested",
    badgeClass: "border-emerald-500 text-emerald-800 bg-emerald-50 font-bold",
  },
  DISCONNECTED: {
    label: "Disconnected",
    badgeClass: "border-orange-300 text-orange-700 bg-orange-50",
  },
  DROP: {
    label: "Drop",
    badgeClass: "border-red-300 text-red-700 bg-red-50",
  },
  OTHER: {
    label: "Other",
    badgeClass: "border-cyan-300 text-cyan-700 bg-cyan-50",
  },
};

const formatDuration = (seconds?: number | null): string => {
  if (seconds === undefined || seconds === null) {
    return "N/A";
  }
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const pad = (num: number) => String(num).padStart(2, "0");
  if (hrs > 0) return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  return `${pad(mins)}:${pad(secs)}`;
};

const formatTimestamp = (dateStr?: string | null): string => {
  if (!dateStr) return "N/A";
  try {
    const d = new Date(dateStr);
    const dateFormatted = d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const timeFormatted = d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    return `${dateFormatted} • ${timeFormatted}`;
  } catch {
    return dateStr;
  }
};

const StudentDetailsCard = ({
  student,
  totalAssigned,
  currentIndex,
  phonePosition = 1,
  refreshKey = 0,
  onOpenHistory,
}: StudentDetailsCardProps) => {
  const { accessToken } = useAuth();
  const [historyRecords, setHistoryRecords] = useState<CallRecordItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // Unified Call History: Query combined history for the contact across all categories
  useEffect(() => {
    let isCancelled = false;

    if (!accessToken || !student?.studentDataId) {
      setHistoryRecords([]);
      setHistoryLoading(false);
      return;
    }

    setHistoryLoading(true);
    setHistoryError(null);

    fetchCallHistory(accessToken, student.studentDataId)
      .then((records) => {
        if (!isCancelled) {
          setHistoryRecords(records || []);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          console.error("Failed to load unified call history:", err);
          setHistoryError("Failed to load call history");
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setHistoryLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [accessToken, student?.studentDataId, refreshKey]);

  if (!student) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs flex flex-col items-center justify-center min-h-[300px] text-center">
        <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mb-3 text-text-muted">
          <User size={24} />
        </div>
        <p className="text-sm font-semibold text-text-primary">No student record selected</p>
        <p className="text-xs text-text-muted mt-1">Select or load contacts from your assigned queue.</p>
      </div>
    );
  }

  const fullName = [student.firstName, student.middleName, student.lastName]
    .filter(Boolean)
    .join(" ");

  // Take the latest 3 combined history entries (backend already sorts newest first)
  const latestThreeCalls = historyRecords.slice(0, 3);

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs space-y-5">
      {/* Header Info - Separate Call History button removed */}
      <div className="flex items-start justify-between border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 rounded-md bg-primary-50 px-2 py-0.5 text-[11px] font-bold text-primary-700 border border-primary-200">
              <ShieldCheck size={12} />
              Assigned Record #{currentIndex + 1} of {totalAssigned}
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-bold text-text-secondary border border-border font-mono">
              Phone Attempt #{phonePosition}
            </span>
            {student.category && (
              <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-700 border border-indigo-200">
                <Tag size={11} />
                {student.category.name}
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold text-text-primary mt-1.5">{fullName}</h2>
          <p className="text-xs text-text-muted">Assigned student prospect</p>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div className="flex items-center gap-2.5 p-3 rounded-xl border border-border bg-neutral-50/50">
          <Phone size={16} className="text-primary-600 shrink-0" />
          <div className="overflow-hidden">
            <span className="text-[10px] uppercase font-semibold text-text-muted block">Phone Number</span>
            <span className="font-semibold text-text-primary font-mono text-xs">{student.phone}</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-3 rounded-xl border border-border bg-neutral-50/50">
          <Mail size={16} className="text-purple-600 shrink-0" />
          <div className="overflow-hidden">
            <span className="text-[10px] uppercase font-semibold text-text-muted block">Email Address</span>
            <span className="font-semibold text-text-primary truncate block">{student.email || "N/A"}</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-3 rounded-xl border border-border bg-neutral-50/50">
          <MapPin size={16} className="text-emerald-600 shrink-0" />
          <div>
            <span className="text-[10px] uppercase font-semibold text-text-muted block">Location</span>
            <span className="font-semibold text-text-primary">
              {[student.city, student.state].filter(Boolean).join(", ") || "Unspecified"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-3 rounded-xl border border-border bg-neutral-50/50">
          <FileSpreadsheet size={16} className="text-amber-600 shrink-0" />
          <div className="overflow-hidden">
            <span className="text-[10px] uppercase font-semibold text-text-muted block">Dataset File</span>
            <span className="font-semibold text-text-primary truncate block">{student.upload?.fileName || "Uploaded Dataset"}</span>
          </div>
        </div>
      </div>

      {/* Assignment Expiry & Metadata */}
      {student.assignment && (
        <div className="rounded-xl border border-amber-200/60 bg-amber-50/40 p-3 flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <Clock size={15} className="text-amber-600 shrink-0" />
            <span>Assignment Status: <strong>{student.assignment.status}</strong></span>
          </div>
          <span className="text-[11px] font-semibold text-amber-700">Permanent Window</span>
        </div>
      )}

      {/* Combined Unified Call History Section (Latest 3 across all categories) */}
      <div className="border-t border-border pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History size={16} className="text-primary-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">
              Unified Call History
            </h3>
            <span className="text-[10px] text-text-muted">
              (Across All Categories)
            </span>
          </div>
          {historyLoading ? (
            <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
              <Loader2 size={13} className="animate-spin text-primary-600" />
              <span>Updating...</span>
            </div>
          ) : (
            <span className="text-[11px] text-text-muted font-medium">
              {historyRecords.length > 0
                ? `Latest ${Math.min(3, historyRecords.length)} of ${historyRecords.length} ${historyRecords.length === 1 ? "call" : "calls"
                }`
                : "No call records"}
            </span>
          )}
        </div>

        {historyLoading && historyRecords.length === 0 ? (
          <div className="rounded-xl border border-border bg-neutral-50/50 p-4 text-center text-xs text-text-muted flex items-center justify-center gap-2">
            <Loader2 size={14} className="animate-spin text-primary-600" />
            <span>Loading combined call history...</span>
          </div>
        ) : historyError ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-3 text-center text-xs text-rose-700">
            {historyError}
          </div>
        ) : latestThreeCalls.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-neutral-50/30 p-4 text-center text-xs text-text-muted">
            No previous calls recorded for this student across any category.
          </div>
        ) : (
          <div className="space-y-2.5">
            {latestThreeCalls.map((record) => {
              const outcomeInfo = OUTCOME_LABEL_MAP[record.outcome] || {
                label: record.outcome ? record.outcome.replace(/_/g, " ") : "Call Activity",
                badgeClass: "border-neutral-300 text-neutral-700 bg-neutral-50",
              };

              const advisorName = record.createdBy
                ? `${record.createdBy.firstName} ${record.createdBy.lastName || ""}`.trim()
                : "Advisor";

              const categoryName =
                record.studentData?.category?.name || "Uncategorized";

              const timestampFormatted = formatTimestamp(
                record.startedAt || record.createdAt
              );

              const durationFormatted = formatDuration(record.durationSeconds);

              return (
                <div
                  key={record.id}
                  className="rounded-xl border border-border bg-surface p-3 space-y-2 shadow-2xs hover:border-neutral-300 transition"
                >
                  {/* Top Bar: Outcome, Category, Timestamp */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold ${outcomeInfo.badgeClass}`}
                      >
                        {outcomeInfo.label}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 text-[10px] font-medium text-text-secondary">
                        <Tag size={10} className="text-primary-500" />
                        {categoryName}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-text-muted font-mono">
                      <Calendar size={11} className="shrink-0" />
                      <span>{timestampFormatted}</span>
                    </div>
                  </div>

                  {/* Metadata: Advisor & Duration */}
                  <div className="flex items-center justify-between text-[11px] text-text-secondary pt-0.5">
                    <div className="flex items-center gap-1">
                      <User size={12} className="text-primary-600 shrink-0" />
                      <span>
                        Advisor: <strong className="text-text-primary">{advisorName}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-1 font-mono">
                      <Clock size={12} className="text-amber-600 shrink-0" />
                      <span>
                        Duration: <strong className="text-text-primary">{durationFormatted}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Notes / Response if present */}
                  {record.notes && (
                    <div className="bg-neutral-50 rounded-lg border border-border p-2 text-xs text-text-primary">
                      <div className="flex items-center gap-1 text-[10px] font-bold uppercase text-text-muted mb-0.5">
                        <FileText size={10} />
                        <span>Notes</span>
                      </div>
                      <p className="whitespace-pre-wrap text-[11px]">{record.notes}</p>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Optional drawer trigger if more than 3 calls exist */}
            {historyRecords.length > 3 && onOpenHistory && (
              <div className="text-right pt-1">
                <button
                  type="button"
                  onClick={onOpenHistory}
                  className="text-xs font-semibold text-primary-600 hover:text-primary-700 hover:underline cursor-pointer"
                >
                  View full history ({historyRecords.length} calls) &rarr;
                </button>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
};

export default StudentDetailsCard;
