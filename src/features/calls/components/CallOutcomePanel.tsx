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
  Bookmark,
  X,
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
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onOutcomeComplete: () => void;
}

const OUTCOME_OPTIONS: { label: string; value: CallOutcomeType; desc: string }[] = [
  {
    label: "No Answer",
    value: "NO_ANSWER",
    desc: "Phone rang with no response",
  },
  {
    label: "Wrong Number",
    value: "WRONG_NUMBER",
    desc: "Number does not belong to student",
  },
  {
    label: "Not Interested",
    value: "NOT_INTERESTED",
    desc: "Student declined program offering",
  },
  {
    label: "Follow Up Required",
    value: "FOLLOW_UP",
    desc: "Creates 24-hr priority bookmark",
  },
  {
    label: "Call Back Later",
    value: "CALL_BACK_LATER",
    desc: "Creates 24-hr priority bookmark",
  },
  {
    label: "Interested / Create Lead",
    value: "INTERESTED",
    desc: "Student interested in admission",
  },
  {
    label: "Disconnected",
    value: "DISCONNECTED",
    desc: "Call got disconnected prematurely",
  },
  {
    label: "Other",
    value: "OTHER",
    desc: "Other disposition or special scenario",
  },
];

export const CallOutcomePanel = ({
  student,
  isOpen,
  onOpen,
  onClose,
  onOutcomeComplete,
}: CallOutcomePanelProps) => {
  const { accessToken } = useAuth();
  const toast = useToast();

  const [selectedOutcome, setSelectedOutcome] = useState<CallOutcomeType | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
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

  // Reset outcome form state whenever the student changes
  useEffect(() => {
    setSelectedOutcome(null);
    setNotes("");
    setSearchingLead(false);
    setLeadSearchResult(null);
    setClaiming(false);
    setIsCreateLeadModalOpen(false);
  }, [student?.studentDataId]);

  useEffect(() => {
    if (selectedOutcome === "INTERESTED") {
      checkExistingLead();
    }
  }, [selectedOutcome, checkExistingLead]);

  const handleSaveNonLeadOutcome = async () => {
    if (!selectedOutcome || !accessToken || !student?.studentDataId || submitting) return;

    setSubmitting(true);
    try {
      await recordCallOutcome(accessToken, {
        studentDataId: student.studentDataId,
        outcome: selectedOutcome,
        notes: notes ? notes.trim() : undefined,
      });

      const isBookmark = selectedOutcome === "FOLLOW_UP" || selectedOutcome === "CALL_BACK_LATER";
      toast.success(
        `Call disposition recorded: ${selectedOutcome.replace(/_/g, " ")}${
          isBookmark ? " (24-hour bookmark created)" : ""
        }.`
      );
      setSelectedOutcome(null);
      setNotes("");
      onOutcomeComplete();
    } catch (err: any) {
      toast.error(err.message || "Failed to record call outcome.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClaimExistingLead = async () => {
    if (!accessToken || !leadSearchResult?.leadId || claiming) return;
    setClaiming(true);
    try {
      await claimLead(accessToken, leadSearchResult.leadId);

      // Create interaction for claimed lead
      await createInteraction(accessToken, {
        leadId: leadSearchResult.leadId,
        title: "Call",
        description: `Call disposition recorded: INTERESTED. ${notes ? `Notes: ${notes}` : ""}`.trim(),
      }).catch(() => {});

      // Record persistent CallRecord for claimed lead
      if (student?.studentDataId) {
        await recordCallOutcome(accessToken, {
          studentDataId: student.studentDataId,
          leadId: leadSearchResult.leadId,
          outcome: "INTERESTED",
          notes: notes ? notes.trim() : undefined,
        }).catch((err) => console.error("Failed to record call record for claimed lead:", err));
      }

      toast.success("Lead claimed successfully!");
      setSelectedOutcome(null);
      setNotes("");
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
      await createInteraction(accessToken, {
        leadId: targetLeadId,
        title: "Call - Interested",
        description: `Student contacted through assigned dataset (${student?.upload?.fileName || "Data Upload"}). Call outcome: Interested. ${notes ? `Advisor notes: ${notes}` : ""}`.trim(),
      }).catch(() => {});
    }

    // Record persistent CallRecord for created lead
    if (accessToken && student?.studentDataId) {
      await recordCallOutcome(accessToken, {
        studentDataId: student.studentDataId,
        leadId: targetLeadId || undefined,
        outcome: "INTERESTED",
        notes: notes ? notes.trim() : undefined,
      }).catch((err) => console.error("Failed to record call record for created lead:", err));
    }

    toast.success(`Lead created successfully for ${student?.firstName || "contact"}!`);
    setSelectedOutcome(null);
    setNotes("");
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
  const isBookmarkOutcome = selectedOutcome === "FOLLOW_UP" || selectedOutcome === "CALL_BACK_LATER";

  // When form is NOT open, display the Add Dispositions button card
  if (!isOpen) {
    return (
      <div
        id="call-disposition-section"
        className="rounded-2xl border border-border/80 bg-surface p-4 sm:p-5 shadow-2xs space-y-3 w-full min-w-0"
      >
        <div className="flex items-center justify-between border-b border-border/60 pb-3 min-w-0">
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <FileText size={16} className="text-primary-600 shrink-0" />
              <span className="truncate">Call Disposition</span>
            </h3>
            <p className="text-[11px] text-text-muted mt-0.5 truncate">
              Record interaction outcome, remarks, and follow-ups
            </p>
          </div>
        </div>

        <div className="py-2 space-y-3">
          <p className="text-xs text-text-secondary leading-relaxed">
            Ready to log an outcome for{" "}
            <strong className="text-text-primary">
              {student ? [student.firstName, student.lastName].filter(Boolean).join(" ") : "this student"}
            </strong>
            ? Click the button below to display the disposition form.
          </p>

          <button
            type="button"
            onClick={onOpen}
            disabled={!student}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold px-4 py-2.5 text-xs transition shadow-2xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={15} />
            <span>Add Dispositions</span>
          </button>
        </div>
      </div>
    );
  }

  // When form IS open, display the active disposition form
  return (
    <div
      id="call-disposition-section"
      className="rounded-2xl border border-border/80 bg-surface p-4 sm:p-5 shadow-2xs space-y-4 animate-in fade-in duration-200 w-full min-w-0"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/60 pb-3 min-w-0">
        <div className="min-w-0">
          <h3 className="text-sm sm:text-base font-bold text-text-primary flex items-center gap-2">
            <FileText size={16} className="text-primary-600 shrink-0" />
            <span className="truncate">Add Call Disposition</span>
          </h3>
          <p className="text-[11px] text-text-muted mt-0.5 truncate">
            Record outcome details for {student?.firstName || "contact"}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-text-muted hover:bg-neutral-100 hover:text-text-primary transition cursor-pointer shrink-0"
          title="Close disposition form"
        >
          <X size={16} />
        </button>
      </div>

      {/* Outcome Selection Buttons */}
      <div className="space-y-1.5 w-full min-w-0">
        <label className="text-xs font-semibold text-text-secondary dark:text-slate-300 uppercase tracking-wider block">
          Select Outcome *
        </label>
        {/* Mobile: stacked vertically (grid-cols-1), Tablet/Desktop: 2 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full min-w-0">
          {OUTCOME_OPTIONS.map((opt) => {
            const isSelected = selectedOutcome === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSelectedOutcome(opt.value)}
                className={`min-h-[44px] sm:min-h-[40px] px-3 py-2 rounded-xl border text-xs text-left flex items-center justify-between gap-2 cursor-pointer w-full min-w-0 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 ${
                  isSelected
                    ? "border-emerald-500 bg-emerald-50/90 dark:border-emerald-600/70 dark:bg-emerald-950/40 shadow-2xs"
                    : "border-border bg-surface hover:bg-neutral-50 hover:border-neutral-300 dark:border-slate-700/80 dark:bg-slate-900/60 dark:hover:bg-slate-800/60 dark:hover:border-slate-600"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div
                    className={`leading-tight truncate ${
                      isSelected
                        ? "font-bold text-emerald-950 dark:text-emerald-200"
                        : "font-medium text-text-primary dark:text-slate-100"
                    }`}
                  >
                    {opt.label}
                  </div>
                  <div
                    className={`text-[10px] truncate mt-0.5 ${
                      isSelected
                        ? "font-medium text-emerald-800/90 dark:text-emerald-300/80"
                        : "text-text-muted dark:text-slate-400"
                    }`}
                  >
                    {opt.desc}
                  </div>
                </div>
                {isSelected && (
                  <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 24-hr Bookmark Notice for Follow-up Outcomes */}
      {isBookmarkOutcome && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/80 dark:border-blue-800/60 dark:bg-blue-950/40 p-3 text-xs text-blue-900 dark:text-blue-200 flex items-center gap-2">
          <Bookmark size={15} className="text-blue-600 shrink-0" />
          <span className="leading-relaxed">
            Saving <strong>{selectedOutcome?.replace(/_/g, " ")}</strong> will activate or refresh a 24-hour priority bookmark on this contact.
          </span>
        </div>
      )}

      {/* Notes Textarea */}
      <div className="space-y-1.5 w-full min-w-0">
        <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
          Call Notes / Remarks
        </label>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Enter call discussion notes, student responses, or follow-up details..."
          className="w-full rounded-xl border border-border bg-background p-3 text-xs text-text-primary placeholder:text-text-muted outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/50 transition resize-y min-h-[64px]"
        />
      </div>

      {/* INTERESTED Lead Handling Section */}
      {selectedOutcome === "INTERESTED" && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/60 dark:bg-emerald-950/30 p-3.5 space-y-3 border-t w-full min-w-0">
          <div className="flex items-center justify-between min-w-0">
            <span className="text-xs font-bold uppercase text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 truncate">
              <Building2 size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Lead Discovery & Creation</span>
            </span>
            {searchingLead && <Loader2 size={13} className="animate-spin text-emerald-600 dark:text-emerald-400 shrink-0" />}
          </div>

          {searchingLead ? (
            <div className="text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2 py-1">
              <Search size={13} className="animate-bounce text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="truncate">Searching existing CRM leads for phone {student?.phone}...</span>
            </div>
          ) : leadSearchResult?.exists ? (
            <div className="rounded-xl border border-amber-300 bg-background/95 dark:border-amber-800/60 dark:bg-background/90 p-3 space-y-2.5 w-full min-w-0 shadow-xs">
              <div className="flex items-start justify-between min-w-0">
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-bold text-amber-900 bg-amber-100 border border-amber-300 dark:text-amber-300 dark:bg-amber-950/70 dark:border-amber-800/60 px-2 py-0.5 rounded">
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
                <div className="flex items-center gap-1.5 text-xs text-rose-800 bg-rose-50 dark:text-rose-300 dark:bg-rose-950/40 p-2 rounded-lg border border-rose-200 dark:border-rose-900/60">
                  <AlertCircle size={14} className="shrink-0 text-rose-600 dark:text-rose-400" />
                  <span className="text-[11px]">
                    <strong>Protected Status (ADMISSION_DONE):</strong> Admission is complete for this contact.
                  </span>
                </div>
              ) : isProtectedAssignment ? (
                <div className="flex items-center gap-1.5 text-xs text-amber-800 bg-amber-50 dark:text-amber-300 dark:bg-amber-950/40 p-2 rounded-lg border border-amber-200 dark:border-amber-900/60">
                  <AlertCircle size={14} className="shrink-0 text-amber-600 dark:text-amber-400" />
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
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 text-xs font-bold transition disabled:opacity-50 cursor-pointer shadow-2xs"
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
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-bold transition shadow-2xs cursor-pointer"
              >
                <Plus size={14} />
                <span>Create Lead</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Action Footer: Cancel and Save buttons (Stacked on mobile, row on tablet/desktop) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-3 border-t border-border/60">
        <span className="text-[11px] text-text-muted text-center sm:text-left">
          {!selectedOutcome ? "Select an outcome to save" : "Ready to submit disposition"}
        </span>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 sm:flex-initial rounded-xl border border-border bg-surface px-4 py-2 text-xs font-semibold text-text-secondary hover:bg-neutral-100 transition cursor-pointer text-center"
          >
            Cancel
          </button>

          {selectedOutcome !== "INTERESTED" && (
            <button
              type="button"
              onClick={handleSaveNonLeadOutcome}
              disabled={!selectedOutcome || submitting}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 text-xs font-bold transition shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} />
                  <span>Save Disposition</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

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
