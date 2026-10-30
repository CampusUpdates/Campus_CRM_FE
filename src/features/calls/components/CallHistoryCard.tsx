import { useEffect, useState } from "react";
import {
  History,
  Calendar,
  Clock,
  User,
  Tag,
  Loader2,
  ExternalLink,
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
    label: "Follow Up",
    badgeClass: "border-blue-800/80 bg-blue-950/60 text-blue-300",
  },
  CALL_BACK_LATER: {
    label: "Call Back Later",
    badgeClass: "border-purple-800/80 bg-purple-950/60 text-purple-300",
  },
  INTERESTED: {
    label: "Interested",
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

  const latestThreeCalls = historyRecords.slice(0, 3);

  return (
    <div className="rounded-2xl border border-border/80 bg-surface p-4 sm:p-5 shadow-xs space-y-3 w-full min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/60 pb-2.5 min-w-0">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
            <History size={16} className="text-emerald-500 shrink-0" />
            <span className="truncate">Call History</span>
          </h3>
          <p className="text-[11px] text-text-muted mt-0.5 truncate">
            Latest 3 calls • Unified across categories
          </p>
        </div>

        {historyLoading ? (
          <div className="flex items-center gap-1.5 text-xs text-text-muted shrink-0">
            <Loader2 size={13} className="animate-spin text-emerald-500" />
            <span>Updating...</span>
          </div>
        ) : (
          <span className="text-xs font-mono font-medium text-text-secondary bg-background border border-border/60 px-2 py-0.5 rounded-lg shrink-0">
            {historyRecords.length} {historyRecords.length === 1 ? "call" : "calls"}
          </span>
        )}
      </div>

      {/* Body: Recent call records separated by thin horizontal dividers (No individual bordered cards) */}
      {historyLoading && historyRecords.length === 0 ? (
        <div className="rounded-xl border border-border/60 bg-background/50 p-4 text-center text-xs text-text-muted flex items-center justify-center gap-2">
          <Loader2 size={16} className="animate-spin text-emerald-500" />
          <span>Loading unified call history...</span>
        </div>
      ) : historyError ? (
        <div className="rounded-xl border border-rose-900/60 bg-rose-950/40 p-3 text-center text-xs text-rose-300">
          {historyError}
        </div>
      ) : latestThreeCalls.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-background/40 p-4 text-center text-xs text-text-muted">
          No previous call records found for this contact across any category.
        </div>
      ) : (
        <div className="divide-y divide-border/60 w-full min-w-0">
          {latestThreeCalls.map((record) => {
            const outcomeInfo = OUTCOME_LABEL_MAP[record.outcome] || {
              label: record.outcome ? record.outcome.replace(/_/g, " ") : "Call Activity",
              badgeClass: "border-slate-700/80 bg-slate-900/80 text-slate-300",
            };

            const advisorName = record.createdBy
              ? `${record.createdBy.firstName} ${record.createdBy.lastName || ""}`.trim()
              : "Advisor";

            const categoryName = record.studentData?.category?.name || "Uncategorized";
            const timestampFormatted = formatTimestamp(record.startedAt || record.createdAt);
            const durationFormatted = formatDuration(record.durationSeconds);

            return (
              <div key={record.id} className="py-2 first:pt-0.5 last:pb-0.5 space-y-1 w-full min-w-0">
                {/* Row 1: Outcome Badge, Category Badge, Timestamp */}
                <div className="flex items-center justify-between gap-2 flex-wrap min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                    <span
                      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold ${outcomeInfo.badgeClass}`}
                    >
                      {outcomeInfo.label}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-background px-1.5 py-0.5 text-[10px] font-medium text-text-secondary">
                      <Tag size={10} className="text-emerald-400 shrink-0" />
                      <span className="truncate max-w-[110px]">{categoryName}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] text-text-muted font-mono shrink-0">
                    <Calendar size={11} className="shrink-0" />
                    <span>{timestampFormatted}</span>
                  </div>
                </div>

                {/* Row 2: Advisor Name & Duration */}
                <div className="flex items-center justify-between text-[11px] text-text-secondary pt-0.5 min-w-0">
                  <div className="flex items-center gap-1 min-w-0 truncate">
                    <User size={12} className="text-emerald-400 shrink-0" />
                    <span className="truncate">
                      Advisor: <strong className="text-text-primary">{advisorName}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-1 font-mono shrink-0">
                    <Clock size={12} className="text-amber-400 shrink-0" />
                    <span>
                      Duration: <strong className="text-text-primary">{durationFormatted}</strong>
                    </span>
                  </div>
                </div>

                {/* Row 3: Notes if present */}
                {record.notes && (
                  <p className="text-xs text-text-muted line-clamp-2 break-words pt-0.5 pl-3 border-l-2 border-border/60">
                    <span className="font-semibold text-text-secondary">Notes: </span>
                    {record.notes}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Footer: View Full History action */}
      {onOpenHistory && (
        <div className="pt-2.5 border-t border-border/60 flex items-center justify-between min-w-0">
          <span className="text-[11px] text-text-muted truncate">
            {historyRecords.length > 3
              ? `Showing latest 3 of ${historyRecords.length} calls`
              : `${historyRecords.length} records available`}
          </span>
          <button
            type="button"
            onClick={onOpenHistory}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer py-0.5 shrink-0"
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
