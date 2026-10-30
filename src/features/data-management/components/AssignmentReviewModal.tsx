import { useState, useEffect } from "react";
import {
  X,
  UserCheck,
  MapPin,
  AlertCircle,
  RefreshCw,
  Filter,
  CheckCircle2,
  Mail,
} from "lucide-react";

import type {
  EligibleProgramAdvisor,
  FilterStudentDataParams,
} from "../../../services/dataManagementService";

interface AssignmentReviewModalProps {
  selectionCount: number;
  selectionMode: "EXPLICIT" | "ALL_MATCHING";
  quantity: number | null;
  distribution: Record<string, number>;
  activeFilters: FilterStudentDataParams;
  eligibleAdvisors: EligibleProgramAdvisor[];
  onClose: () => void;
  onConfirm: (payload: {
    assignedToId: string;
  }) => Promise<void>;
  submitting: boolean;
  error: string | null;
  title?: string;
  subtitle?: string;
}

const AssignmentReviewModal = ({
  selectionCount,
  selectionMode,
  quantity,
  distribution,
  activeFilters,
  eligibleAdvisors,
  onClose,
  onConfirm,
  submitting,
  error,
  title = "Assign Selected Data",
  subtitle = "Select recipient user & confirm working-hours assignment",
}: AssignmentReviewModalProps) => {
  const [selectedAdvisorId, setSelectedAdvisorId] = useState("");

  const selectedAdvisor = eligibleAdvisors.find((a) => a.id === selectedAdvisorId);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdvisorId) return;
    onConfirm({
      assignedToId: selectedAdvisorId,
    });
  };

  const distributionEntries = Object.entries(distribution).filter(
    ([, count]) => count > 0
  );

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Right-Side Drawer Panel */}
      <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-4 sm:pl-10">
        <div className="pointer-events-auto w-screen max-w-md sm:w-[440px] bg-surface border-l border-border shadow-2xl flex flex-col justify-between h-full">
          <form onSubmit={handleSubmit} className="flex flex-col h-full justify-between">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-border p-5 bg-background/50 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center font-bold">
                  <UserCheck size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-text-primary">
                    {title}
                  </h3>
                  <p className="text-xs text-text-secondary">
                    {subtitle}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-text-muted hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-text-primary transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Error Alert */}
              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-800">
                  <AlertCircle size={16} className="shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              {/* Selection Summary Card */}
              <div className="rounded-xl border border-border bg-neutral-50/50 dark:bg-neutral-900/40 p-4 space-y-1">
                <span className="text-[11px] font-semibold uppercase text-text-secondary">
                  Selected Records for Assignment
                </span>
                <p className="text-2xl font-bold text-text-primary">
                  {selectionCount.toLocaleString()}
                </p>
                <span className="inline-block text-[11px] font-medium text-primary-600">
                  {selectionMode === "ALL_MATCHING"
                    ? quantity
                      ? `Batch Quantity: ${quantity}`
                      : "All Matching Records"
                    : "Explicitly Selected"}
                </span>
              </div>

              {/* Geographic Distribution Breakdown */}
              {distributionEntries.length > 0 && (
                <div className="rounded-xl border border-border bg-surface p-3.5 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary uppercase">
                    <MapPin size={14} className="text-primary-500" />
                    <span>Geographic Distribution Breakdown</span>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {distributionEntries.map(([state, count]) => (
                      <div
                        key={state}
                        className="flex items-center gap-1.5 rounded-lg border border-border bg-neutral-50 dark:bg-neutral-900/50 px-2.5 py-1 text-xs"
                      >
                        <span className="font-semibold text-text-primary">{state}:</span>
                        <span className="font-bold text-primary-600">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Active Filters Summary */}
              {((activeFilters.states && activeFilters.states.length > 0) ||
                (activeFilters.cities && activeFilters.cities.length > 0) ||
                activeFilters.search) && (
                  <div className="rounded-xl border border-border bg-neutral-50/30 dark:bg-neutral-900/20 p-3 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold text-text-secondary">
                      <Filter size={12} />
                      <span>Filters Applied:</span>
                    </div>
                    <div className="text-text-muted space-x-2">
                      {activeFilters.states && activeFilters.states.length > 0 && (
                        <span>State: <strong className="text-text-primary">{activeFilters.states.join(", ")}</strong></span>
                      )}
                      {activeFilters.cities && activeFilters.cities.length > 0 && (
                        <span>City: <strong className="text-text-primary">{activeFilters.cities.join(", ")}</strong></span>
                      )}
                      {activeFilters.search && (
                        <span>Search: <strong className="text-text-primary">"{activeFilters.search}"</strong></span>
                      )}
                    </div>
                  </div>
                )}

              {/* User Assignment Selection */}
              <div>
                <label className="block text-xs font-semibold uppercase text-text-secondary mb-1.5 flex items-center justify-between">
                  <span>Select Recipient User *</span>
                  <span className="text-[11px] font-normal text-text-muted">
                    {eligibleAdvisors.length} users available
                  </span>
                </label>

                {eligibleAdvisors.length === 0 ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 flex items-center gap-2">
                    <AlertCircle size={16} className="text-amber-600 shrink-0" />
                    <span>
                      No active users found in your managed teams. Please verify team members in Team Management.
                    </span>
                  </div>
                ) : (
                  <select
                    required
                    value={selectedAdvisorId}
                    onChange={(e) => setSelectedAdvisorId(e.target.value)}
                    className="w-full h-11 rounded-xl border border-border bg-surface px-3.5 text-sm text-text-primary outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100 font-medium"
                  >
                    <option value="">-- Select Recipient User --</option>
                    {eligibleAdvisors.map((advisor) => {
                      const nameStr = `${advisor.firstName} ${advisor.lastName || ""}`.trim();
                      const detailsStr = [advisor.role?.name, advisor.team?.name].filter(Boolean).join(" · ") || "Admissions Team";
                      return (
                        <option key={advisor.id} value={advisor.id}>
                          {nameStr} ({advisor.email}) — {detailsStr}
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>

              {/* Selected Advisor Info Card */}
              {selectedAdvisor && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 dark:bg-emerald-950/30 p-3.5 flex items-center justify-between text-xs animate-in fade-in duration-200">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                      {selectedAdvisor.firstName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-emerald-950 dark:text-emerald-200 text-sm">
                        {selectedAdvisor.firstName} {selectedAdvisor.lastName || ""}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-emerald-800 dark:text-emerald-300 text-[11px] mt-0.5">
                        <span className="flex items-center gap-1 font-medium">
                          <Mail size={12} /> {selectedAdvisor.email}
                        </span>
                        {selectedAdvisor.role?.name && (
                          <span className="font-semibold text-emerald-900 dark:text-emerald-200">
                            Role: {selectedAdvisor.role.name}
                          </span>
                        )}
                        <span className="font-semibold text-emerald-900 dark:text-emerald-200">
                          Team: {selectedAdvisor.team?.name || "Admissions Team"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 px-2.5 py-1 text-xs font-semibold shrink-0">
                    <CheckCircle2 size={13} /> Active User
                  </span>
                </div>
              )}
            </div>

            {/* Drawer Footer (Fixed at Bottom) */}
            <div className="border-t border-border p-5 bg-background/50 shrink-0 flex items-center justify-between gap-3">
              <span className="text-[11px] text-text-muted">
                {!selectedAdvisorId ? "Select an advisor to enable" : "Ready to assign"}
              </span>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-text-secondary hover:bg-neutral-100 transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting || !selectedAdvisorId || selectionCount <= 0}
                  className="flex items-center gap-2 rounded-xl bg-primary-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-600 transition shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Assigning Records...
                    </>
                  ) : (
                    <>
                      <UserCheck size={16} />
                      Confirm Assignment
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AssignmentReviewModal;
