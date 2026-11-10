import { useEffect, useState } from "react";
import {
  History,
  Calendar,
  Clock,
  User,
  Tag,
  Loader2,
  ExternalLink,
  FileText,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import {
  fetchCallHistory,
  type MockCallQueueStudentItem,
  type CallRecordItem,
} from "../../../services/mockCallService";

interface CallHistoryCardProps {
  student: MockCallQueueStudentItem | null;
  refreshKey?: number;
  onOpenHistory?: () => void;
}

const OUTCOME_LABEL_MAP: Record<string, { label: string; badgeClass: string }> = {
  NO_ANSWER: {
    label: "No Answer",
    badgeClass: "border-slate-300 bg-slate-100 text-slate-800 dark:border-slate-700/80 dark:bg-slate-900/80 dark:text-slate-300",
  },
  WRONG_NUMBER: {
    label: "Wrong Number",
    badgeClass: "border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-800/80 dark:bg-rose-950/60 dark:text-rose-300",
  },
  NOT_INTERESTED: {
    label: "Not Interested",
    badgeClass: "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800/80 dark:bg-amber-950/60 dark:text-amber-300",
  },
  FOLLOW_UP: {
    label: "Follow Up",
    badgeClass: "border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-800/80 dark:bg-blue-950/60 dark:text-blue-300",
  },
  CALL_BACK_LATER: {
    label: "Call Back Later",
    badgeClass: "border-purple-300 bg-purple-50 text-purple-800 dark:border-purple-800/80 dark:bg-purple-950/60 dark:text-purple-300",
  },
  INTERESTED: {
    label: "Interested",
    badgeClass: "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 font-bold",
  },
  DISCONNECTED: {
    label: "Disconnected",
    badgeClass: "border-orange-300 bg-orange-50 text-orange-900 dark:border-orange-800/80 dark:bg-orange-950/60 dark:text-orange-300",
  },
  DROP: {
    label: "Drop",
    badgeClass: "border-red-300 bg-red-50 text-red-800 dark:border-red-800/80 dark:bg-red-950/60 dark:text-red-300",
  },
  OTHER: {
    label: "Other",
    badgeClass: "border-cyan-300 bg-cyan-50 text-cyan-900 dark:border-cyan-800/80 dark:bg-cyan-950/60 dark:text-cyan-300",
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

export const CallHistoryCard = ({
  student,
  refreshKey = 0,
  onOpenHistory,
}: CallHistoryCardProps) => {
  const { accessToken } = useAuth();
  const [historyRecords, setHistoryRecords] = useState<CallRecordItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

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
          console.error("Failed to load call dispositions:", err);
          setHistoryError("Failed to load call dispositions");
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

  const latestThreeCalls = historyRecords.slice(0, 3);

  return (
    <div className="rounded-2xl border border-border/80 bg-surface p-4 sm:p-5 shadow-2xs space-y-3.5 w-full min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/60 pb-3 min-w-0 gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
            <History size={16} className="text-primary-600 shrink-0" />
            <span className="truncate">Call Dispositions</span>
          </h3>
          <p className="text-[11px] text-text-muted mt-0.5 truncate">
            Saved outcomes for this contact
          </p>
        </div>

        {historyLoading ? (
          <div className="flex items-center gap-1.5 text-xs text-text-muted shrink-0">
            <Loader2 size={13} className="animate-spin text-primary-600" />
            <span>Updating...</span>
          </div>
        ) : (
          <span className="text-xs font-mono font-medium text-text-secondary bg-background border border-border/60 px-2.5 py-0.5 rounded-lg shrink-0">
            {historyRecords.length} {historyRecords.length === 1 ? "disposition" : "dispositions"}
          </span>
        )}
      </div>

      {/* Body: Saved Dispositions displayed as clean, readable cards */}
      {historyLoading && historyRecords.length === 0 ? (
        <div className="rounded-xl border border-border/60 bg-background/50 p-4 text-center text-xs text-text-muted flex items-center justify-center gap-2">
          <Loader2 size={16} className="animate-spin text-primary-600" />
          <span>Loading saved dispositions...</span>
        </div>
      ) : historyError ? (
        <div className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-center text-xs text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
          {historyError}
        </div>
      ) : latestThreeCalls.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/80 bg-background/30 p-5 text-center text-xs text-text-muted space-y-1">
          <FileText size={18} className="mx-auto text-text-muted opacity-60 mb-1" />
          <p className="font-semibold text-text-secondary">No dispositions recorded yet</p>
          <p className="text-[11px]">Click "Add Dispositions" to record the first outcome for this contact.</p>
        </div>
      ) : (
        <div className="space-y-2.5 w-full min-w-0">
          {latestThreeCalls.map((record) => {
            const outcomeInfo = OUTCOME_LABEL_MAP[record.outcome] || {
              label: record.outcome ? record.outcome.replace(/_/g, " ") : "Call Activity",
              badgeClass: "border-slate-300 bg-slate-100 text-slate-800 dark:border-slate-700/80 dark:bg-slate-900/80 dark:text-slate-300",
            };

            const advisorName = record.createdBy
              ? `${record.createdBy.firstName} ${record.createdBy.lastName || ""}`.trim()
              : "Advisor";

            const categoryName = record.studentData?.category?.name || "";
            const timestampFormatted = formatTimestamp(record.startedAt || record.createdAt);
            const durationFormatted = formatDuration(record.durationSeconds);

            return (
              <div
                key={record.id}
                className="rounded-xl border border-border/80 bg-background/50 p-3 sm:p-3.5 space-y-2 transition shadow-2xs hover:border-border"
              >
                {/* Row 1: Outcome Badge, Category Badge, Timestamp */}
                <div className="flex items-center justify-between gap-2 flex-wrap min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                    <span
                      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold ${outcomeInfo.badgeClass}`}
                    >
                      {outcomeInfo.label}
                    </span>
                    {categoryName && (
                      <span className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-surface px-1.5 py-0.5 text-[10px] font-medium text-text-secondary">
                        <Tag size={10} className="text-primary-600 shrink-0" />
                        <span className="truncate max-w-[120px]">{categoryName}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-[11px] text-text-muted font-mono shrink-0">
                    <Calendar size={11} className="shrink-0" />
                    <span>{timestampFormatted}</span>
                  </div>
                </div>

                {/* Row 2: Advisor Name & Duration */}
                <div className="flex items-center justify-between text-[11px] text-text-secondary pt-0.5 min-w-0">
                  <div className="flex items-center gap-1 min-w-0 truncate">
                    <User size={12} className="text-primary-600 shrink-0" />
                    <span className="truncate">
                      Advisor: <strong className="text-text-primary">{advisorName}</strong>
                    </span>
                  </div>

                  {record.durationSeconds ? (
                    <div className="flex items-center gap-1 font-mono shrink-0">
                      <Clock size={12} className="text-amber-500 shrink-0" />
                      <span>
                        Duration: <strong className="text-text-primary">{durationFormatted}</strong>
                      </span>
                    </div>
                  ) : null}
                </div>

                {/* Row 3: Notes if present */}
                {record.notes && (
                  <div className="text-xs text-text-secondary bg-surface/80 rounded-lg p-2.5 border border-border/50 break-words leading-relaxed">
                    <span className="font-semibold text-text-primary">Notes: </span>
                    {record.notes}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Footer: View Full History action */}
      {onOpenHistory && (
        <div className="pt-2 border-t border-border/60 flex items-center justify-between min-w-0">
          <span className="text-[11px] text-text-muted truncate">
            {historyRecords.length > 3
              ? `Showing latest 3 of ${historyRecords.length} records`
              : `${historyRecords.length} records available`}
          </span>
          <button
            type="button"
            onClick={onOpenHistory}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-600 hover:text-primary-700 hover:underline cursor-pointer py-0.5 shrink-0"
          >
            <span>View full history</span>
            <ExternalLink size={12} />
          </button>
        </div>
      )}
    </div>
  );
};

export default CallHistoryCard;
