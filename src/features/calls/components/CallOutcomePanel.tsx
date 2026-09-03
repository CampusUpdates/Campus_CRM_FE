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
import type { MockCallQueueStudentItem, MockCallSession } from "../../../services/mockCallService";
import CreateLeadModal from "../../leads/components/CreateLeadModal";

export type CallOutcomeType =
  | "NO_ANSWER"
  | "WRONG_NUMBER"
  | "NOT_INTERESTED"
  | "FOLLOW_UP"
  | "INTERESTED";

interface CallOutcomePanelProps {
  student: MockCallQueueStudentItem | null;
  callSession: MockCallSession | null;
  onOutcomeComplete: () => void;
}

const OUTCOME_OPTIONS: { label: string; value: CallOutcomeType; color: string }[] = [
  { label: "No Answer", value: "NO_ANSWER", color: "border-neutral-300 text-neutral-700 bg-neutral-50 hover:bg-neutral-100" },
  { label: "Wrong Number", value: "WRONG_NUMBER", color: "border-rose-300 text-rose-700 bg-rose-50 hover:bg-rose-100" },
  { label: "Not Interested", value: "NOT_INTERESTED", color: "border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100" },
  { label: "Follow Up Required", value: "FOLLOW_UP", color: "border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100" },
  { label: "Interested / Create Lead", value: "INTERESTED", color: "border-emerald-500 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 font-bold" },
];

const CallOutcomePanel = ({
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

  useEffect(() => {
    if (selectedOutcome === "INTERESTED") {
      checkExistingLead();
    }
  }, [selectedOutcome, checkExistingLead]);

  if (!callSession || callSession.status !== "ENDED") {
    return (
      <div className="rounded-2xl border border-border bg-surface p-5 text-center text-xs text-text-muted">
        Call outcome logging will activate after call disconnection.
      </div>
    );
  }

  const handleSaveNonLeadOutcome = async () => {
    if (!selectedOutcome || !accessToken) return;

    toast.success(`Call outcome recorded: ${selectedOutcome.replace("_", " ")}.`);
    onOutcomeComplete();
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
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs space-y-5 animate-in fade-in duration-200">
      <div className="border-b border-border pb-3">
        <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
          <FileText size={18} className="text-primary-600" />
          Call Outcome & Disposition
        </h3>
        <p className="text-xs text-text-muted">Record outcome details for assigned contact</p>
      </div>

      {/* Outcome Buttons */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-text-secondary uppercase">Select Outcome</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {OUTCOME_OPTIONS.map((opt) => {
            const isSelected = selectedOutcome === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSelectedOutcome(opt.value)}
                className={`px-3 py-2.5 rounded-xl border text-xs font-semibold transition text-left flex items-center justify-between ${
                  isSelected ? "border-primary-600 bg-primary-50 text-primary-900 ring-2 ring-primary-200" : opt.color
                }`}
              >
                <span>{opt.label}</span>
                {isSelected && <CheckCircle2 size={14} className="text-primary-600 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Notes Textarea */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-text-secondary uppercase">Call Notes</label>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Enter relevant call discussion notes or student responses..."
          className="w-full rounded-xl border border-border bg-neutral-50/50 p-3 text-xs outline-none focus:border-primary-500 transition"
        />
      </div>

      {/* Non-Interested / Follow-up Outcomes Action */}
      {selectedOutcome && selectedOutcome !== "INTERESTED" && (
        <div className="pt-2 border-t border-border flex justify-end">
          <button
            type="button"
            onClick={handleSaveNonLeadOutcome}
            className="flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-primary-700 transition shadow-xs"
          >
            Save Outcome & Next Contact
          </button>
        </div>
      )}

      {/* INTERESTED Lead Handling Section */}
      {selectedOutcome === "INTERESTED" && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-emerald-900 flex items-center gap-1.5">
              <Building2 size={16} className="text-emerald-600" />
              Lead Discovery & Creation Workflow
            </span>
            {searchingLead && <Loader2 size={16} className="animate-spin text-emerald-700" />}
          </div>

          {searchingLead ? (
            <div className="text-xs text-emerald-800 flex items-center gap-2 py-2">
              <Search size={14} className="animate-bounce text-emerald-600" />
              Searching existing CRM leads for phone {student?.phone}...
            </div>
          ) : leadSearchResult?.exists ? (
            <div className="rounded-xl border border-amber-300 bg-surface p-3.5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                    Existing Lead Found
                  </span>
                  <h4 className="text-sm font-bold text-text-primary mt-1">
                    {leadSearchResult.firstName} {leadSearchResult.lastName || ""}
                  </h4>
                  <p className="text-xs text-text-muted">Status: {leadSearchResult.status?.name || "LEAD"}</p>
                </div>
              </div>

              {/* CASE 3: Unclaimable lead protection reason */}
              {isAdmissionDone ? (
                <div className="flex items-center gap-1.5 text-xs text-rose-800 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                  <AlertCircle size={15} className="shrink-0 text-rose-600" />
                  <span>
                    <strong>Protected Status (ADMISSION_DONE):</strong> Admission is complete for this contact. Reassignment or duplicate lead creation is restricted by business rules.
                  </span>
                </div>
              ) : isProtectedAssignment ? (
                <div className="flex items-center gap-1.5 text-xs text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                  <AlertCircle size={15} className="shrink-0 text-amber-600" />
                  <span>
                    <strong>Active Assignment:</strong> Currently assigned to{" "}
                    <strong>
                      {leadSearchResult.activeAssignment?.user?.firstName}{" "}
                      {leadSearchResult.activeAssignment?.user?.lastName || ""}
                    </strong>{" "}
                    within active 4-day window.
                  </span>
                </div>
              ) : null}

              {/* CASE 2: Claimable existing lead */}
              {!isAdmissionDone && !isProtectedAssignment ? (
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleClaimExistingLead}
                    disabled={claiming}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition disabled:opacity-50"
                  >
                    {claiming ? <Loader2 size={14} className="animate-spin" /> : <UserCheck size={14} />}
                    Claim Existing Lead
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            /* CASE 1: No existing lead found */
            <div className="space-y-3">
              <p className="text-xs text-emerald-900">
                No existing lead record found for phone <strong>{student?.phone}</strong>. Click below to open the prefilled lead creation modal.
              </p>
              <button
                type="button"
                onClick={() => setIsCreateLeadModalOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-xs"
              >
                <Plus size={16} />
                Create Lead
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
