import { useEffect, useState, useCallback } from "react";
import {
  CheckCircle2,
  AlertCircle,
  UserCheck,
  Plus,
  Search,
  Loader2,
  FileText,
  Building2,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import {
  searchLeadByPhone,
  claimLead,
  type PhoneSearchResult,
} from "../../../services/leadService";
import { createInteraction } from "../../../services/interactionService";
import {
  recordCallOutcome,
  type MockCallQueueStudentItem,
  type MockCallSession,
} from "../../../services/mockCallService";
import CreateLeadModal from "../../leads/components/CreateLeadModal";

export type CallOutcomeType =
  | "NO_ANSWER"
  | "WRONG_NUMBER"
  | "NOT_INTERESTED"
  | "FOLLOW_UP"
  | "CALL_BACK_LATER"
  | "INTERESTED"
  | "DISCONNECTED"
  | "OTHER";

interface CallOutcomePanelProps {
  student: MockCallQueueStudentItem | null;
  callSession: MockCallSession | null;
  onOutcomeComplete: () => void;
}

const OUTCOME_OPTIONS: { label: string; value: CallOutcomeType; defaultClass: string }[] = [
  {
    label: "No Answer",
    value: "NO_ANSWER",
    defaultClass: "border-slate-700/80 bg-slate-900/80 text-slate-300 hover:border-slate-500 hover:bg-slate-800",
  },
  {
    label: "Wrong Number",
    value: "WRONG_NUMBER",
    defaultClass: "border-rose-900/60 bg-rose-950/30 text-rose-300 hover:border-rose-700 hover:bg-rose-950/60",
  },
  {
    label: "Not Interested",
    value: "NOT_INTERESTED",
    defaultClass: "border-amber-900/60 bg-amber-950/30 text-amber-300 hover:border-amber-700 hover:bg-amber-950/60",
  },
  {
    label: "Follow Up Required",
    value: "FOLLOW_UP",
    defaultClass: "border-blue-900/60 bg-blue-950/30 text-blue-300 hover:border-blue-700 hover:bg-blue-950/60",
  },
  {
    label: "Call Back Later",
    value: "CALL_BACK_LATER",
    defaultClass: "border-purple-900/60 bg-purple-950/30 text-purple-300 hover:border-purple-700 hover:bg-purple-950/60",
  },
  {
    label: "Interested / Create Lead",
    value: "INTERESTED",
    defaultClass: "border-emerald-800/80 bg-emerald-950/40 text-emerald-300 hover:border-emerald-600 hover:bg-emerald-950/70 font-semibold",
  },
  {
    label: "Disconnected",
    value: "DISCONNECTED",
    defaultClass: "border-orange-900/60 bg-orange-950/30 text-orange-300 hover:border-orange-700 hover:bg-orange-950/60",
  },
  {
    label: "Other",
    value: "OTHER",
    defaultClass: "border-cyan-900/60 bg-cyan-950/30 text-cyan-300 hover:border-cyan-700 hover:bg-cyan-950/60",
  },
];

export const CallOutcomePanel = ({
  student,
  callSession,
  onOutcomeComplete,
}: CallOutcomePanelProps) => {
  const { accessToken } = useAuth();
  const toast = useToast();

  const [selectedOutcome, setSelectedOutcome] = useState<CallOutcomeType | null>(null);
  const [notes, setNotes] = useState("");
  const [searchingLead, setSearchingLead] = useState(false);
  const [leadSearchResult, setLeadSearchResult] = useState<PhoneSearchResult | null>(null);
  const [claiming, setClaiming] = useState(false);

  const [isCreateLeadModalOpen, setIsCreateLeadModalOpen] = useState(false);

  const checkExistingLead = useCallback(async () => {
    if (!accessToken || !student?.phone) return;
    setSearchingLead(true);
    try {
      const result = await searchLeadByPhone(accessToken, student.phone);
      setLeadSearchResult(result);
    } catch (err: any) {
      console.error("Failed to search existing lead:", err);
    } finally {
      setSearchingLead(false);
    }
  }, [accessToken, student]);

  // Reset outcome panel state whenever the student or call session changes
  useEffect(() => {
    setSelectedOutcome(null);
    setNotes("");
    setSearchingLead(false);
    setLeadSearchResult(null);
    setClaiming(false);
    setIsCreateLeadModalOpen(false);
  }, [student?.studentDataId, callSession?.callId]);

  useEffect(() => {
    if (selectedOutcome === "INTERESTED") {
      checkExistingLead();
    }
  }, [selectedOutcome, checkExistingLead]);

  // Only display active Call Outcome & Disposition form after current call has been ended/disconnected
  const isCallEnded =
    callSession &&
    (callSession.status === "ENDED" ||
      callSession.status === "FAILED" ||
      (callSession.status as string) === "DISCONNECTED");

  if (!isCallEnded) {
    return (
      <div className="rounded-2xl border border-border/80 bg-surface p-4 sm:p-5 shadow-xs flex flex-col items-center justify-center min-h-[120px] text-center space-y-1.5 w-full min-w-0">
        <div className="w-8 h-8 rounded-full bg-background border border-border/60 flex items-center justify-center text-text-muted">
          <FileText size={16} />
        </div>
        <h4 className="text-xs font-bold text-text-primary">Call Outcome & Disposition</h4>
        <p className="text-[11px] text-text-muted max-w-xs leading-relaxed">
          Disposition controls will appear here once the call is completed.
        </p>
      </div>
    );
  }

  const handleSaveNonLeadOutcome = async () => {
    if (!selectedOutcome || !accessToken || !student?.studentDataId) return;

    try {
      await recordCallOutcome(accessToken, {
        studentDataId: student.studentDataId,
        outcome: selectedOutcome,
        notes: notes ? notes.trim() : undefined,
        startedAt: callSession?.startedAt ? new Date(callSession.startedAt).toISOString() : undefined,
        endedAt: callSession?.endedAt ? new Date(callSession.endedAt).toISOString() : undefined,
        durationSeconds: callSession?.durationSeconds || 0,
      });
      toast.success(`Call outcome recorded: ${selectedOutcome.replace(/_/g, " ")}.`);
      onOutcomeComplete();
    } catch (err: any) {
      toast.error(err.message || "Failed to record call outcome.");
    }
  };

  const handleClaimExistingLead = async () => {
    if (!accessToken || !leadSearchResult?.leadId || claiming) return;
    setClaiming(true);
    try {
      await claimLead(accessToken, leadSearchResult.leadId);

      // Create interaction for claimed lead
      const duration = callSession.durationSeconds || 0;
      await createInteraction(accessToken, {
        leadId: leadSearchResult.leadId,
        title: "Call",
        description: `Mock call completed. Outcome: INTERESTED. Duration: ${duration}s. ${notes ? `Notes: ${notes}` : ""}`.trim(),
      }).catch(() => {});

      // Record persistent CallRecord for claimed lead
      if (student?.studentDataId) {
        await recordCallOutcome(accessToken, {
          studentDataId: student.studentDataId,
          leadId: leadSearchResult.leadId,
          outcome: "INTERESTED",
          notes: notes ? notes.trim() : undefined,
          startedAt: callSession.startedAt ? new Date(callSession.startedAt).toISOString() : undefined,
          endedAt: callSession.endedAt ? new Date(callSession.endedAt).toISOString() : undefined,
          durationSeconds: duration,
        }).catch((err) => console.error("Failed to record call record for claimed lead:", err));
      }

      toast.success("Lead claimed successfully!");
      onOutcomeComplete();
    } catch (err: any) {
      toast.error(err.message || "Failed to claim lead.");
    } finally {
      setClaiming(false);
    }
  };

  const handleLeadCreated = async (createdLead?: any) => {
    setIsCreateLeadModalOpen(false);

    let targetLeadId = createdLead?.id;

    if (!targetLeadId && accessToken && student?.phone) {
      try {
        const result = await searchLeadByPhone(accessToken, student.phone);
        if (result?.exists && result.leadId) {
          targetLeadId = result.leadId;
        }
      } catch {
        // Fallback
      }
    }

    if (accessToken && targetLeadId) {
      const duration = callSession.durationSeconds || 0;
      await createInteraction(accessToken, {
        leadId: targetLeadId,
        title: "Call - Interested",
        description: `Student contacted through assigned dataset (${student?.upload?.fileName || "Data Upload"}). Call outcome: Interested. Duration: ${duration}s. ${notes ? `Advisor notes: ${notes}` : ""}`.trim(),
      }).catch(() => {});
    }

    // Record persistent CallRecord for created lead
    if (accessToken && student?.studentDataId) {
      const duration = callSession.durationSeconds || 0;
      await recordCallOutcome(accessToken, {
        studentDataId: student.studentDataId,
        leadId: targetLeadId || undefined,
        outcome: "INTERESTED",
        notes: notes ? notes.trim() : undefined,
        startedAt: callSession.startedAt ? new Date(callSession.startedAt).toISOString() : undefined,
        endedAt: callSession.endedAt ? new Date(callSession.endedAt).toISOString() : undefined,
        durationSeconds: duration,
      }).catch((err) => console.error("Failed to record call record for created lead:", err));
    }

    toast.success(`Lead created successfully for ${student?.firstName || "contact"}! Loading next student...`);
    onOutcomeComplete();
  };

  const initialLeadData = student
    ? {
        firstName: student.firstName,
        lastName: student.lastName || "",
        phone: student.phone,
        email: student.email || "",
        city: student.city || "",
        state: student.state || "",
        source: "DATA_UPLOAD",
      }
    : undefined;

  const isAdmissionDone = leadSearchResult?.status?.name === "ADMISSION_DONE";
  const isProtectedAssignment = Boolean(leadSearchResult?.activeAssignment);

  return (
    <div className="rounded-2xl border border-border/80 bg-surface p-3.5 sm:p-4.5 shadow-xs space-y-3 animate-in fade-in duration-200 w-full min-w-0">
      {/* Header */}
      <div className="border-b border-border/60 pb-2 min-w-0">
        <h3 className="text-xs sm:text-sm font-bold text-text-primary flex items-center gap-1.5">
          <FileText size={15} className="text-emerald-500 shrink-0" />
          <span className="truncate">Call Outcome & Disposition</span>
        </h3>
        <p className="text-[11px] text-text-muted mt-0.5 truncate">
          Record outcome details for assigned contact
        </p>
      </div>

      {/* Outcome Buttons: 3-Column Equal-Width Responsive Grid */}
      <div className="space-y-1 w-full min-w-0">
        <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">
          Select Outcome
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 w-full min-w-0">
          {OUTCOME_OPTIONS.map((opt) => {
            const isSelected = selectedOutcome === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSelectedOutcome(opt.value)}
                className={`min-h-[38px] px-2 sm:px-2.5 py-1.5 rounded-lg border text-[11px] sm:text-xs font-medium transition text-left flex items-center justify-between gap-1 cursor-pointer w-full min-w-0 ${
                  isSelected
                    ? "border-emerald-500 bg-emerald-950/80 text-emerald-200 ring-1 ring-emerald-500/70 shadow-xs"
                    : opt.defaultClass
                }`}
              >
                <span className="leading-tight break-words flex-1 min-w-0 text-left">
                  {opt.label}
                </span>
                {isSelected && (
                  <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Notes Textarea (Compact, Deep Dark Background) */}
      <div className="space-y-1 w-full min-w-0">
        <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">
          Call Notes
        </label>
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Enter call discussion notes or student responses..."
          className="w-full rounded-lg border border-border/80 bg-background p-2 text-xs text-text-primary placeholder:text-text-muted outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition resize-y min-h-[46px]"
        />
      </div>

      {/* Non-Interested / Follow-up Outcomes Action */}
      {selectedOutcome && selectedOutcome !== "INTERESTED" && (
        <div className="pt-1 border-t border-border/60 flex justify-end">
          <button
            type="button"
            onClick={handleSaveNonLeadOutcome}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <span>Save Outcome & Next Contact</span>
          </button>
        </div>
      )}

      {/* INTERESTED Lead Handling Section */}
      {selectedOutcome === "INTERESTED" && (
        <div className="rounded-xl border border-emerald-900/60 bg-emerald-950/30 p-3 space-y-3 pt-3 border-t w-full min-w-0">
          <div className="flex items-center justify-between min-w-0">
            <span className="text-xs font-bold uppercase text-emerald-300 flex items-center gap-1.5 truncate">
              <Building2 size={15} className="text-emerald-400 shrink-0" />
              <span>Lead Discovery & Creation</span>
            </span>
            {searchingLead && <Loader2 size={13} className="animate-spin text-emerald-400 shrink-0" />}
          </div>

          {searchingLead ? (
            <div className="text-xs text-emerald-300 flex items-center gap-2 py-1">
              <Search size={13} className="animate-bounce text-emerald-400 shrink-0" />
              <span className="truncate">Searching existing CRM leads for phone {student?.phone}...</span>
            </div>
          ) : leadSearchResult?.exists ? (
            <div className="rounded-xl border border-amber-800/60 bg-background/90 p-3 space-y-2.5 w-full min-w-0">
              <div className="flex items-start justify-between min-w-0">
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-bold text-amber-300 bg-amber-950/70 border border-amber-800/60 px-2 py-0.5 rounded">
                    Existing Lead Found
                  </span>
                  <h4 className="text-xs font-bold text-text-primary mt-1 truncate">
                    {leadSearchResult.firstName} {leadSearchResult.lastName || ""}
                  </h4>
                  <p className="text-[11px] text-text-muted">Status: {leadSearchResult.status?.name || "LEAD"}</p>
                </div>
              </div>

              {/* CASE 3: Unclaimable lead protection reason */}
              {isAdmissionDone ? (
                <div className="flex items-center gap-1.5 text-xs text-rose-300 bg-rose-950/40 p-2 rounded-lg border border-rose-900/60">
                  <AlertCircle size={14} className="shrink-0 text-rose-400" />
                  <span className="text-[11px]">
                    <strong>Protected Status (ADMISSION_DONE):</strong> Admission is complete for this contact.
                  </span>
                </div>
              ) : isProtectedAssignment ? (
                <div className="flex items-center gap-1.5 text-xs text-amber-300 bg-amber-950/40 p-2 rounded-lg border border-amber-900/60">
                  <AlertCircle size={14} className="shrink-0 text-amber-400" />
                  <span className="text-[11px]">
                    <strong>Active Assignment:</strong> Assigned to{" "}
                    <strong>
                      {leadSearchResult.activeAssignment?.user?.firstName}{" "}
                      {leadSearchResult.activeAssignment?.user?.lastName || ""}
                    </strong>{" "}
                    (4-day window).
                  </span>
                </div>
              ) : null}

              {/* CASE 2: Claimable existing lead */}
              {!isAdmissionDone && !isProtectedAssignment ? (
                <div className="flex items-center gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={handleClaimExistingLead}
                    disabled={claiming}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                  >
                    {claiming ? <Loader2 size={12} className="animate-spin" /> : <UserCheck size={12} />}
                    <span>Claim Existing Lead</span>
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            /* CASE 1: No existing lead found */
            <div className="space-y-2.5 w-full min-w-0">
              <p className="text-xs text-text-secondary leading-relaxed">
                No existing lead found for <strong className="text-text-primary">{student?.phone}</strong>. Open the prefilled lead creation modal:
              </p>
              <button
                type="button"
                onClick={() => setIsCreateLeadModalOpen(true)}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <Plus size={14} />
                <span>Create Lead</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* In-workspace modal for creating lead prefilled with StudentData */}
      {isCreateLeadModalOpen && (
        <CreateLeadModal
          initialLead={initialLeadData}
          onClose={() => setIsCreateLeadModalOpen(false)}
          onSuccess={handleLeadCreated}
        />
      )}
    </div>
  );
};

export default CallOutcomePanel;
