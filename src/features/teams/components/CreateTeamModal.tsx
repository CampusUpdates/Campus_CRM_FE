import { useEffect, useState, useRef } from "react";
import { X, Loader2, AlertCircle, Search, ChevronDown, Check } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import {
  createTeam,
  fetchEligibleManagers,
  fetchEligibleMembers,
  type EligibleManager,
  type EligibleMember,
} from "../../../services/teamService";

interface CreateTeamModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const CreateTeamModal = ({ onClose, onSuccess }: CreateTeamModalProps) => {
  const { accessToken } = useAuth();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [managerId, setManagerId] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  const [managers, setManagers] = useState<EligibleManager[]>([]);
  const [members, setMembers] = useState<EligibleMember[]>([]);

  const [loadingManagers, setLoadingManagers] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Member dropdown & search state
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [isMemberDropdownOpen, setIsMemberDropdownOpen] = useState(false);
  const memberDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadData() {
      if (!accessToken) return;
      try {
        setLoadingManagers(true);
        setLoadingMembers(true);
        const [managersData, membersData] = await Promise.all([
          fetchEligibleManagers(accessToken),
          fetchEligibleMembers(accessToken),
        ]);
        setManagers(managersData);
        setMembers(membersData);
      } catch (err) {
        console.error("Failed to load initial form data:", err);
        setError("Failed to load eligible managers or members. Please try again.");
      } finally {
        setLoadingManagers(false);
        setLoadingMembers(false);
      }
    }
    loadData();
  }, [accessToken]);

  // Close member dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        memberDropdownRef.current &&
        !memberDropdownRef.current.contains(event.target as Node)
      ) {
        setIsMemberDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleToggleMember = (memberId: string) => {
    if (selectedMemberIds.includes(memberId)) {
      setSelectedMemberIds(selectedMemberIds.filter((id) => id !== memberId));
    } else {
      setSelectedMemberIds([...selectedMemberIds, memberId]);
    }
  };

  const handleRemoveMember = (memberId: string) => {
    setSelectedMemberIds(selectedMemberIds.filter((id) => id !== memberId));
  };

  const selectedMemberObjects = members.filter((m) =>
    selectedMemberIds.includes(m.id)
  );

  const filteredMembers = members.filter((m) => {
    const fullName = `${m.firstName} ${m.lastName || ""}`.toLowerCase();
    const email = m.email.toLowerCase();
    const query = memberSearchQuery.toLowerCase().trim();
    return fullName.includes(query) || email.includes(query);
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Team Name is required.");
      return;
    }

    if (!managerId) {
      setError("Please select a Manager for the team.");
      return;
    }

    if (!accessToken) return;

    try {
      setIsSubmitting(true);
      await createTeam(accessToken, {
        name: trimmedName,
        description: description.trim() || undefined,
        managerId,
        memberIds: selectedMemberIds,
      });
      onSuccess();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred while creating the team.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm transition-opacity duration-300">
      <div className="h-full w-full max-w-md bg-white border-l border-border shadow-2xl flex flex-col transform transition-transform duration-300 ease-out animate-in slide-in-from-right">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-6 bg-surface">
          <div>
            <h2 className="text-xl font-semibold text-text-primary">
              Create Team
            </h2>
            <p className="mt-0.5 text-xs text-text-secondary">
              Add a new operational team and assign a team manager and members.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-1.5 text-text-muted hover:bg-neutral-100 hover:text-text-primary transition disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col justify-between overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Error Alert */}
            {error && (
              <div className="flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                <AlertCircle size={16} className="shrink-0 text-rose-600 mt-0.5" />
                <div className="flex-1">{error}</div>
              </div>
            )}

            {/* Team Name */}
            <div>
              <label className="block text-xs font-semibold text-text-primary uppercase tracking-wider mb-1.5">
                Team Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. MBA Admissions"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSubmitting}
                className="
                  w-full h-10 rounded-lg border border-border bg-surface px-3.5 text-sm
                  outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100
                  disabled:opacity-60
                "
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-text-primary uppercase tracking-wider mb-1.5">
                Description
              </label>
              <textarea
                rows={3}
                placeholder="Handles MBA and PGDM admissions..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSubmitting}
                className="
                  w-full rounded-lg border border-border bg-surface p-3 text-sm
                  outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100
                  disabled:opacity-60 resize-none
                "
              />
            </div>

            {/* Manager Select */}
            <div>
              <label className="block text-xs font-semibold text-text-primary uppercase tracking-wider mb-1.5">
                Team Manager <span className="text-rose-500">*</span>
              </label>
              {loadingManagers ? (
                <div className="flex items-center gap-2 h-10 px-3.5 rounded-lg border border-border bg-neutral-50 text-xs text-text-muted">
                  <Loader2 size={14} className="animate-spin" />
                  Loading eligible managers...
                </div>
              ) : (
                <select
                  value={managerId}
                  onChange={(e) => setManagerId(e.target.value)}
                  disabled={isSubmitting}
                  className="
                    w-full h-10 rounded-lg border border-border bg-surface px-3.5 text-sm
                    outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100
                    disabled:opacity-60
                  "
                >
                  <option value="">Select manager</option>
                  {managers.map((m) => {
                    const nameStr = `${m.firstName} ${m.lastName || ""}`.trim();
                    return (
                      <option key={m.id} value={m.id}>
                        {nameStr} ({m.email})
                      </option>
                    );
                  })}
                </select>
              )}
            </div>

            {/* Team Members Multi-Select */}
            <div className="relative" ref={memberDropdownRef}>
              <label className="block text-xs font-semibold text-text-primary uppercase tracking-wider mb-1.5">
                Team Members
              </label>

              {/* Search / Select trigger input */}
              <div
                className="relative flex items-center cursor-pointer"
                onClick={() => setIsMemberDropdownOpen(true)}
              >
                <Search size={16} className="absolute left-3 text-text-muted pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search and select members..."
                  value={memberSearchQuery}
                  onChange={(e) => {
                    setMemberSearchQuery(e.target.value);
                    setIsMemberDropdownOpen(true);
                  }}
                  onFocus={() => setIsMemberDropdownOpen(true)}
                  disabled={isSubmitting || loadingMembers}
                  className="
                    w-full h-10 rounded-lg border border-border bg-surface pl-9 pr-9 text-sm
                    outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100
                    disabled:opacity-60
                  "
                />
                <ChevronDown
                  size={16}
                  className={`absolute right-3 text-text-muted transition-transform duration-200 pointer-events-none ${
                    isMemberDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </div>

              {/* Selected Members Chips */}
              {selectedMemberObjects.length > 0 && (
                <div className="mt-3">
                  <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                    Selected Members ({selectedMemberObjects.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedMemberObjects.map((m) => {
                      const nameStr = `${m.firstName} ${m.lastName || ""}`.trim();
                      return (
                        <span
                          key={m.id}
                          className="
                            inline-flex items-center gap-1.5 rounded-full bg-primary-50 border border-primary-200
                            px-3 py-1 text-xs font-medium text-primary-800 animate-in fade-in zoom-in-95 duration-150
                          "
                        >
                          <span>{nameStr}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(m.id)}
                            disabled={isSubmitting}
                            className="rounded-full p-0.5 text-primary-600 hover:bg-primary-200/60 hover:text-primary-900 transition"
                          >
                            <X size={13} />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Dropdown Menu */}
              {isMemberDropdownOpen && (
                <div className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto rounded-lg border border-border bg-surface shadow-lg py-1 animate-in fade-in slide-in-from-top-1 duration-150">
                  {loadingMembers ? (
                    <div className="flex items-center gap-2 p-3 text-xs text-text-muted">
                      <Loader2 size={14} className="animate-spin" />
                      Loading eligible members...
                    </div>
                  ) : filteredMembers.length === 0 ? (
                    <div className="p-3 text-xs text-text-muted text-center">
                      {members.length === 0
                        ? "No eligible members available (all active users belong to a team)."
                        : "No matching members found."}
                    </div>
                  ) : (
                    filteredMembers.map((m) => {
                      const isSelected = selectedMemberIds.includes(m.id);
                      const nameStr = `${m.firstName} ${m.lastName || ""}`.trim();
                      return (
                        <div
                          key={m.id}
                          onClick={() => handleToggleMember(m.id)}
                          className={`
                            flex items-center justify-between px-3.5 py-2 text-xs cursor-pointer transition
                            ${
                              isSelected
                                ? "bg-primary-50/70 text-primary-900 font-medium"
                                : "hover:bg-neutral-50 text-text-primary"
                            }
                          `}
                        >
                          <div>
                            <p className="font-medium">{nameStr}</p>
                            <p className="text-text-muted text-[11px]">{m.email}</p>
                          </div>
                          {isSelected && <Check size={15} className="text-primary-600 shrink-0" />}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sticky Actions Bar */}
          <div className="border-t border-border p-4 bg-surface flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="
                rounded-lg border border-border px-4 py-2 text-sm font-medium
                text-text-secondary hover:bg-neutral-100 transition disabled:opacity-50
              "
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || loadingManagers}
              className="
                flex items-center gap-2 rounded-lg bg-primary-500 px-5 py-2 text-sm font-medium
                text-white transition hover:bg-primary-600 disabled:opacity-50
              "
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              Create Team
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTeamModal;

