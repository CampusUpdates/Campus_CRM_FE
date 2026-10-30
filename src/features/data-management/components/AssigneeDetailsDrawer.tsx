import React, { useEffect, useState, useCallback, useRef } from "react";
import { X, RotateCcw, Loader2, AlertCircle, Database, CheckCircle2 } from "lucide-react";
import {
  fetchAssigneeDetails,
  reclaimAssignmentById,
  type AssigneeDetailsResponse,
} from "../../../services/dataManagementService";

interface AssigneeDetailsDrawerProps {
  assigneeId: string;
  token: string;
  onClose: () => void;
  onAssignmentReclaimed?: () => void;
}

function formatDateFormatted(dateStr?: string | null): string {
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

export const AssigneeDetailsDrawer: React.FC<AssigneeDetailsDrawerProps> = ({
  assigneeId,
  token,
  onClose,
  onAssignmentReclaimed,
}) => {
  const [data, setData] = useState<AssigneeDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reclaimingId, setReclaimingId] = useState<string | null>(null);
  const [reclaimSuccessMsg, setReclaimSuccessMsg] = useState<string | null>(null);

  // Track whether a call was made while drawer was open (via hidden state)
  const wasHiddenRef = useRef(false);

  const loadAssigneeDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAssigneeDetails(token, assigneeId);
      setData(res);
    } catch (err: any) {
      setError(err.message || "Failed to load assignee details.");
    } finally {
      setLoading(false);
    }
  }, [token, assigneeId]);

  // Initial load
  useEffect(() => {
    loadAssigneeDetails();
  }, [loadAssigneeDetails]);

  // Silently refresh contacted counts when the user returns to the page
  // (e.g. after making calls in the calls module). This is NOT polling —
  // it only fires on focus/visibility-restore events.
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        wasHiddenRef.current = true;
      } else if (wasHiddenRef.current) {
        // Page became visible again after being hidden — silently refresh
        wasHiddenRef.current = false;
        fetchAssigneeDetails(token, assigneeId)
          .then((res) => setData(res))
          .catch(() => {/* silent — don't disrupt UI on background refresh failure */});
      }
    };

    const handleWindowFocus = () => {
      if (wasHiddenRef.current) {
        wasHiddenRef.current = false;
        fetchAssigneeDetails(token, assigneeId)
          .then((res) => setData(res))
          .catch(() => {/* silent */});
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleWindowFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [token, assigneeId]);

  const handleReclaimAssignment = async (assignmentId: string) => {
    setReclaimingId(assignmentId);
    setReclaimSuccessMsg(null);
    try {
      const res = await reclaimAssignmentById(token, assignmentId);
      setReclaimSuccessMsg(res.message || "Assignment successfully reclaimed.");
      await loadAssigneeDetails();
      if (onAssignmentReclaimed) {
        onAssignmentReclaimed();
      }
      setTimeout(() => setReclaimSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || "Failed to reclaim assignment.");
    } finally {
      setReclaimingId(null);
    }
  };

  const assigneeName = data?.assignee.fullName || "Assignee Details";
  const roleAndTeam = [data?.assignee.roleName, data?.assignee.teamName]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      {/* Backdrop click to close */}
      <div className="absolute inset-0 cursor-pointer" onClick={onClose} />

      {/* Drawer Container */}
      <div className="relative w-full max-w-md bg-[#0F172A] border-l border-slate-800 text-slate-100 shadow-2xl flex flex-col h-full z-10 animate-in slide-in-from-right duration-300">
        {/* Simple Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-900/60 flex items-start justify-between">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-white tracking-tight">
              Assignment Details
            </h2>
            {data && (
              <>
                <p className="text-sm font-semibold text-indigo-400">
                  {assigneeName}
                </p>
                {roleAndTeam && (
                  <p className="text-xs text-slate-400 font-medium">
                    {roleAndTeam}
                  </p>
                )}
                <div className="pt-1 flex items-center gap-2 text-xs font-semibold text-slate-300">
                  <span className="inline-flex items-center gap-1 rounded-md bg-slate-800 px-2 py-0.5 text-xs text-slate-200 border border-slate-700">
                    <Database size={12} className="text-indigo-400" />
                    {data.datasetsCount} datasets · {data.totalAssignedRecords} records
                  </span>
                </div>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Close Drawer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Success Toast Banner */}
        {reclaimSuccessMsg && (
          <div className="px-5 py-2.5 bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 size={14} className="shrink-0" />
            <span>{reclaimSuccessMsg}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3.5">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3 text-slate-400">
              <Loader2 size={24} className="animate-spin text-indigo-400" />
              <p className="text-xs font-medium">Loading assignment records...</p>
            </div>
          ) : error ? (
            <div className="py-16 text-center space-y-3">
              <AlertCircle size={28} className="mx-auto text-rose-400" />
              <p className="text-xs font-semibold text-rose-300">{error}</p>
              <button
                type="button"
                onClick={loadAssigneeDetails}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-200 hover:bg-slate-700 transition"
              >
                Retry
              </button>
            </div>
          ) : !data || data.assignments.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              No assignment operations found for this advisor.
            </div>
          ) : (
            data.assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-3 hover:border-slate-700 transition shadow-2xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                      <Database size={14} className="text-indigo-400 shrink-0" />
                      {assignment.fileName}
                    </h3>
                    <p className="mt-1 text-xs text-slate-300 font-semibold flex items-center gap-2">
                      <span>{assignment.recordsCount} records</span>
                      <span className="text-slate-500">•</span>
                      <span>{assignment.contactedRecords} contacted</span>
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      Assigned: {formatDateFormatted(assignment.assignedAt)}
                    </p>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                      assignment.status === "ACTIVE"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                    }`}
                  >
                    {assignment.status === "RECLAIMED" && <RotateCcw size={10} />}
                    {assignment.status}
                  </span>
                </div>

                {assignment.status === "ACTIVE" && (
                  <div className="pt-2 border-t border-slate-800 flex justify-end">
                    <button
                      type="button"
                      disabled={reclaimingId === assignment.id}
                      onClick={() => handleReclaimAssignment(assignment.id)}
                      className="px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {reclaimingId === assignment.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <RotateCcw size={12} />
                      )}
                      <span>Reclaim</span>
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
