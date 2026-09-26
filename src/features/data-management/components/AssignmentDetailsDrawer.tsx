import React, { useEffect, useState } from "react";
import {
  X,
  Phone,
  Mail,
  MapPin,
  Clock,
  PhoneCall,
  RotateCcw,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  fetchDataAssignmentDetails,
  type DataAssignmentDetailsResponse,
} from "../../../services/dataManagementService";

interface AssignmentDetailsDrawerProps {
  assignmentId: string;
  token: string;
  onClose: () => void;
  onReclaim?: (assignmentId: string) => void;
}

const OUTCOME_LABEL_MAP: Record<string, string> = {
  NO_ANSWER: "No Answer",
  WRONG_NUMBER: "Wrong Number",
  NOT_INTERESTED: "Not Interested",
  FOLLOW_UP: "Follow Up Required",
  CALL_BACK_LATER: "Call Back Later",
  INTERESTED: "Interested / Create Lead",
  DISCONNECTED: "Disconnected",
};

const OUTCOME_STYLE_MAP: Record<string, { bg: string; text: string; border: string }> = {
  NO_ANSWER: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
  WRONG_NUMBER: { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/20" },
  NOT_INTERESTED: { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/20" },
  FOLLOW_UP: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
  CALL_BACK_LATER: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20" },
  INTERESTED: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
  DISCONNECTED: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20" },
};

function formatCallDateTime(dateStr?: string | null): string {
  if (!dateStr) return "N/A";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d
    .toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
    .replace(",", " •");
}

function formatDuration(seconds?: number | null): string | null {
  if (seconds === null || seconds === undefined) return null;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export const AssignmentDetailsDrawer: React.FC<AssignmentDetailsDrawerProps> = ({
  assignmentId,
  token,
  onClose,
  onReclaim,
}) => {
  const [data, setData] = useState<DataAssignmentDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    fetchDataAssignmentDetails(token, assignmentId)
      .then((res) => {
        if (isMounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || "Unable to load assignment records.");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [assignmentId, token]);

  const assigneeName = data?.assignedTo
    ? `${data.assignedTo.firstName} ${data.assignedTo.lastName || ""}`.trim()
    : "Program Advisor";

  const assignerName = data?.assignedBy
    ? `${data.assignedBy.firstName} ${data.assignedBy.lastName || ""}`.trim()
    : "Super Admin";

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer Container */}
      <div className="relative w-full max-w-xl bg-[#0F172A] border-l border-slate-800 text-slate-100 shadow-2xl flex flex-col h-full z-10 animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800/80 bg-slate-900/50 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-white tracking-tight">Assignment Details</h2>
              {data && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${
                    data.status === "ACTIVE"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                  }`}
                >
                  {data.status === "RECLAIMED" && <RotateCcw size={10} />}
                  {data.status}
                </span>
              )}
            </div>

            {data && (
              <div className="mt-2 text-xs text-slate-400 space-y-1">
                <p>
                  <span className="text-slate-300 font-semibold">{assigneeName}</span>
                  {data.assignedTo?.team?.name && (
                    <span className="text-slate-500 font-normal"> ({data.assignedTo.team.name})</span>
                  )}
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400">
                  <span>Assigned By: <strong className="text-slate-300">{assignerName}</strong></span>
                  <span>Assigned: <strong className="text-slate-300">{new Date(data.assignedAt).toLocaleString()}</strong></span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {data && data.status === "ACTIVE" && onReclaim && (
              <button
                type="button"
                onClick={() => onReclaim(data.id)}
                className="px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                title="Reclaim this data assignment"
              >
                <RotateCcw size={12} /> Reclaim Data
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Close Drawer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Total Records Counter Bar */}
        {data && (
          <div className="px-6 py-2.5 bg-slate-900/80 border-b border-slate-800/60 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
              Assigned Data ({data.totalRecords})
            </span>
            <span className="text-[11px] text-slate-400">
              Showing exact historical records
            </span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3 text-slate-400">
              <Loader2 size={28} className="animate-spin text-indigo-400" />
              <p className="text-xs font-medium">Loading assigned records...</p>
            </div>
          ) : error ? (
            <div className="py-16 text-center space-y-3">
              <AlertCircle size={32} className="mx-auto text-rose-400" />
              <p className="text-sm font-semibold text-rose-300">{error}</p>
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  setError(null);
                  fetchDataAssignmentDetails(token, assignmentId)
                    .then((res) => {
                      setData(res);
                      setLoading(false);
                    })
                    .catch((err) => {
                      setError(err.message || "Unable to load assignment records.");
                      setLoading(false);
                    });
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-200 hover:bg-slate-700 transition"
              >
                Retry
              </button>
            </div>
          ) : !data || data.items.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              No student records found in this assignment.
            </div>
          ) : (
            data.items.map((item, index) => {
              const fullName = [item.firstName, item.middleName, item.lastName]
                .filter(Boolean)
                .join(" ");

              const location = [item.city, item.state].filter(Boolean).join(", ");
              const recentCall = item.recentCall;

              const outcomeLabel = recentCall
                ? OUTCOME_LABEL_MAP[recentCall.outcome] || recentCall.outcome
                : null;

              const outcomeStyle = recentCall
                ? OUTCOME_STYLE_MAP[recentCall.outcome] || {
                    bg: "bg-slate-800",
                    text: "text-slate-300",
                    border: "border-slate-700",
                  }
                : null;

              const advisorName = recentCall?.createdBy
                ? `${recentCall.createdBy.firstName} ${recentCall.createdBy.lastName || ""}`.trim()
                : null;

              const durationStr = recentCall
                ? formatDuration(recentCall.durationSeconds)
                : null;

              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3 hover:border-slate-700 transition"
                >
                  {/* Student Header */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-800/80 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-500 font-mono">
                          #{index + 1}
                        </span>
                        <h3 className="text-sm font-bold text-white tracking-tight">
                          {fullName}
                        </h3>
                      </div>

                      <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <Phone size={12} className="text-indigo-400 shrink-0" />
                          <span>{item.phone}</span>
                        </span>
                        {item.email && (
                          <span className="flex items-center gap-1.5">
                            <Mail size={12} className="text-slate-500 shrink-0" />
                            <span className="truncate max-w-[200px]">{item.email}</span>
                          </span>
                        )}
                        {location && (
                          <span className="flex items-center gap-1.5">
                            <MapPin size={12} className="text-slate-500 shrink-0" />
                            <span>{location}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Recent Call Update Box */}
                  <div className="rounded-lg bg-slate-950/60 border border-slate-800/80 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <PhoneCall size={11} className="text-indigo-400" />
                        Recent Call Update
                      </span>
                    </div>

                    {recentCall ? (
                      <div className="space-y-2 pt-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`inline-block rounded-md px-2 py-0.5 text-xs font-bold border ${outcomeStyle?.bg} ${outcomeStyle?.text} ${outcomeStyle?.border}`}
                          >
                            {outcomeLabel}
                          </span>
                          <span className="text-[11px] font-medium text-slate-400">
                            {formatCallDateTime(recentCall.startedAt || recentCall.createdAt)}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center justify-between text-xs text-slate-300 pt-1 border-t border-slate-800/40">
                          {advisorName && (
                            <span>
                              Advisor: <strong className="text-white font-semibold">{advisorName}</strong>
                            </span>
                          )}
                          {durationStr && (
                            <span className="text-slate-400 text-[11px] flex items-center gap-1">
                              <Clock size={11} />
                              <span>Duration: {durationStr}</span>
                            </span>
                          )}
                        </div>

                        {recentCall.notes && (
                          <div className="mt-1.5 rounded-md bg-slate-900/90 p-2 text-xs text-slate-300 italic border border-slate-800">
                            "{recentCall.notes}"
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic py-1">
                        No call updates yet.
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
