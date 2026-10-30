import { useEffect, useState, useCallback } from "react";
import { X, History, Clock, User, FileText, RefreshCw, AlertCircle, Tag } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import {
  fetchCallHistory,
  type CallRecordItem,
} from "../../../services/mockCallService";

interface CallHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  student: {
    studentDataId: string;
    firstName?: string;
    middleName?: string | null;
    lastName?: string | null;
    fullName?: string;
    phone?: string;
    email?: string | null;
  } | null;
  refreshKey?: number;
}

const OUTCOME_LABEL_MAP: Record<string, { label: string; badgeClass: string }> = {
  NO_ANSWER: {
    label: "No Answer",
    badgeClass: "border-slate-700/80 bg-slate-900/80 text-slate-300",
  },
  WRONG_NUMBER: {
    label: "Wrong Number",
    badgeClass: "border-rose-800/80 bg-rose-950/60 text-rose-300",
  },
  NOT_INTERESTED: {
    label: "Not Interested",
    badgeClass: "border-amber-800/80 bg-amber-950/60 text-amber-300",
  },
  FOLLOW_UP: {
    label: "Follow Up Required",
    badgeClass: "border-blue-800/80 bg-blue-950/60 text-blue-300",
  },
  CALL_BACK_LATER: {
    label: "Call Back Later",
    badgeClass: "border-purple-800/80 bg-purple-950/60 text-purple-300",
  },
  INTERESTED: {
    label: "Interested / Create Lead",
    badgeClass: "border-emerald-700 bg-emerald-950/70 text-emerald-300 font-bold",
  },
  DISCONNECTED: {
    label: "Disconnected",
    badgeClass: "border-orange-800/80 bg-orange-950/60 text-orange-300",
  },
  DROP: {
    label: "Drop",
    badgeClass: "border-red-800/80 bg-red-950/60 text-red-300",
  },
  OTHER: {
    label: "Other",
    badgeClass: "border-cyan-800/80 bg-cyan-950/60 text-cyan-300",
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

export const CallHistoryDrawer = ({
  isOpen,
  onClose,
  student,
  refreshKey = 0,
}: CallHistoryDrawerProps) => {
  const { accessToken } = useAuth();
  const [records, setRecords] = useState<CallRecordItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    if (!accessToken || !student?.studentDataId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCallHistory(accessToken, student.studentDataId);
      setRecords(data || []);
    } catch (err: any) {
      setError(err.message || "Unable to load call history.");
    } finally {
      setLoading(false);
    }
  }, [accessToken, student?.studentDataId]);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen, refreshKey, loadHistory]);

  if (!isOpen) return null;

  const studentFullName = student
    ? (student.fullName || [student.firstName, student.middleName, student.lastName].filter(Boolean).join(" ") || "Contact History")
    : "Contact History";

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-2xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Slide-in Panel from RIGHT */}
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md sm:w-[480px] bg-surface border-l border-border shadow-2xl flex flex-col transform transition-transform duration-300 animate-in slide-in-from-right">
          {/* Drawer Header */}
          <div className="flex items-start justify-between p-5 border-b border-border bg-background/60">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                <History size={16} />
                <span>Call History</span>
              </div>
              <h3 className="text-base font-bold text-text-primary mt-1">
                {studentFullName}
              </h3>
              <p className="text-xs text-text-muted mt-0.5 font-mono">
                {student?.phone} {student?.email ? `• ${student.email}` : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface transition cursor-pointer"
              title="Close drawer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-12 text-xs text-text-muted space-y-2">
                <RefreshCw size={20} className="animate-spin text-emerald-500" />
                <span>Loading unified call history...</span>
              </div>
            ) : error ? (
              <div className="rounded-xl border border-rose-900/60 bg-rose-950/40 p-4 text-center text-xs space-y-3">
                <div className="flex items-center justify-center gap-1.5 text-rose-300 font-semibold">
                  <AlertCircle size={16} />
                  <span>Unable to load call history</span>
                </div>
                <p className="text-rose-400">{error}</p>
                <button
                  type="button"
                  onClick={loadHistory}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition cursor-pointer"
                >
                  <RefreshCw size={14} />
                  <span>Retry</span>
                </button>
              </div>
            ) : records.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/80 bg-background/40 p-8 text-center text-xs text-text-muted">
                No call history yet across any category.
              </div>
            ) : (
              <div className="space-y-3.5">
                <div className="text-xs text-text-muted flex items-center justify-between">
                  <span>{records.length} total recorded {records.length === 1 ? "call" : "calls"}</span>
                  <span className="font-mono text-[11px]">Unified history</span>
                </div>

                {records.map((record) => {
                  const outcomeInfo = OUTCOME_LABEL_MAP[record.outcome] || {
                    label: record.outcome ? record.outcome.replace(/_/g, " ") : "Call Activity",
                    badgeClass: "border-slate-700/80 bg-slate-900/80 text-slate-300",
                  };

                  const advisorName = record.createdBy
                    ? `${record.createdBy.firstName} ${record.createdBy.lastName || ""}`.trim()
                    : "System / Advisor";

                  const categoryName = record.studentData?.category?.name || "Uncategorized";
                  const timestampFormatted = formatTimestamp(record.startedAt || record.createdAt);
                  const durationFormatted = formatDuration(record.durationSeconds);

                  return (
                    <div
                      key={record.id}
                      className="rounded-xl border border-border/80 bg-background/80 p-4 space-y-3 shadow-2xs hover:border-border transition"
                    >
                      {/* Top Outcome, Category, & Date Header */}
                      <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2.5 flex-wrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold ${outcomeInfo.badgeClass}`}
                          >
                            {outcomeInfo.label}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-md border border-border/70 bg-surface px-2 py-0.5 text-[10px] font-medium text-text-secondary">
                            <Tag size={10} className="text-emerald-400 shrink-0" />
                            {categoryName}
                          </span>
                        </div>
                        <span className="text-[11px] text-text-muted font-mono">
                          {timestampFormatted}
                        </span>
                      </div>

                      {/* Metadata Row: Advisor & Duration */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-1.5 text-text-secondary">
                          <User size={14} className="text-emerald-400 shrink-0" />
                          <span className="truncate">
                            Advisor: <strong className="text-text-primary">{advisorName}</strong>
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-text-secondary justify-end">
                          <Clock size={14} className="text-amber-400 shrink-0" />
                          <span className="font-mono">
                            Duration: <strong className="text-text-primary">{durationFormatted}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Notes Box */}
                      {record.notes && (
                        <div className="pt-1">
                          <span className="text-[10px] font-bold uppercase text-text-muted flex items-center gap-1 mb-1">
                            <FileText size={12} />
                            <span>Notes</span>
                          </span>
                          <p className="text-xs text-text-secondary bg-surface/90 p-2.5 rounded-lg border border-border/70 whitespace-pre-wrap leading-relaxed">
                            {record.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallHistoryDrawer;
