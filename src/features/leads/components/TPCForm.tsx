import { useEffect, useState, useRef } from "react";
import { Search, Check, RefreshCw, Users, Clock, X, ChevronDown, ChevronUp, CheckSquare, Square } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import { type UserItem } from "../../../services/userService";
import {
  assignTpc,
  fetchTpcsForLead,
  fetchTpcUsers,
  type TPCUserItem,
} from "../../../services/tpcService";
import { fetchLeads, type LeadItem } from "../../../services/leadService";

type TPCFormProps = {
  lead?: LeadItem;
  onSuccess?: () => void;
};

const TPCForm = ({ lead: initialLead, onSuccess }: TPCFormProps) => {
  const { accessToken } = useAuth();
  const toast = useToast();

  const [selectedLead, setSelectedLead] = useState<LeadItem | null>(initialLead || null);
  const [allLeads, setAllLeads] = useState<LeadItem[]>([]);
  const [leadSearchTerm, setLeadSearchTerm] = useState("");
  const [loadingLeads, setLoadingLeads] = useState(!initialLead);

  const [users, setUsers] = useState<UserItem[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [existingAssignments, setExistingAssignments] = useState<TPCUserItem[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch all leads if initialLead was not provided
  useEffect(() => {
    async function loadLeads() {
      if (initialLead || !accessToken) return;
      try {
        setLoadingLeads(true);
        const res = await fetchLeads(accessToken);
        setAllLeads(Array.isArray(res) ? res : res.data || []);
      } catch (err) {
        console.error("Failed to load leads:", err);
      } finally {
        setLoadingLeads(false);
      }
    }
    loadLeads();
  }, [accessToken, initialLead]);

  // Load users & existing TPC assignments for selected lead
  useEffect(() => {
    async function loadData() {
      if (!accessToken) return;
      try {
        setLoadingOptions(true);
        const [userData, tpcData] = await Promise.all([
          fetchTpcUsers(accessToken),
          selectedLead ? fetchTpcsForLead(accessToken, selectedLead.id) : Promise.resolve(null),
        ]);
        console.log("DEBUG_TPC_USERS:", userData);
        setUsers(userData);
        if (tpcData?.assignments) {
          setExistingAssignments(tpcData.assignments);
        } else {
          setExistingAssignments([]);
        }
      } catch (err) {
        console.error("Failed to load users for TPC:", err);
      } finally {
        setLoadingOptions(false);
      }
    }
    loadData();
  }, [accessToken, selectedLead]);

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleRemovePill = (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedUserIds((prev) => prev.filter((id) => id !== userId));
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedUserIds([]);
  };

  const filteredUsers = users.filter((u) => {
    const term = userSearchTerm.toLowerCase();
    const name = `${u.firstName} ${u.lastName || ""}`.toLowerCase();
    const email = (u.email || "").toLowerCase();
    const role = (u.role?.name || "").toLowerCase();

    return name.includes(term) || email.includes(term) || role.includes(term);
  });

  const areAllFilteredSelected =
    filteredUsers.length > 0 &&
    filteredUsers.every((u) => selectedUserIds.includes(u.id));

  const handleToggleSelectAll = () => {
    if (areAllFilteredSelected) {
      const filteredIds = new Set(filteredUsers.map((u) => u.id));
      setSelectedUserIds((prev) => prev.filter((id) => !filteredIds.has(id)));
    } else {
      const newIds = new Set([...selectedUserIds, ...filteredUsers.map((u) => u.id)]);
      setSelectedUserIds(Array.from(newIds));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!accessToken) return;

    if (!selectedLead) {
      setErrorMsg("Please select a lead to assign TPC.");
      return;
    }

    if (selectedUserIds.length === 0) {
      setErrorMsg("Please select at least one user to assign the TPC call.");
      return;
    }

    setLoading(true);

    try {
      await assignTpc(accessToken, {
        leadId: selectedLead.id,
        assignedToIds: selectedUserIds,
      });

      toast.showToast(
        `TPC assigned successfully to ${selectedUserIds.length} user(s)!`,
        "success"
      );
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to assign TPC.");
      toast.showToast(err.message || "Failed to assign TPC.", "error");
    } finally {
      setLoading(false);
    }
  };

  const filteredLeads = allLeads.filter((l) => {
    const term = leadSearchTerm.toLowerCase();
    const name = `${l.firstName} ${l.lastName || ""}`.toLowerCase();
    const phone = (l.phone || "").toLowerCase();
    const email = (l.email || "").toLowerCase();
    const course = (l.courseInterested || "").toLowerCase();
    return name.includes(term) || phone.includes(term) || email.includes(term) || course.includes(term);
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {errorMsg && (
        <div className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600 border border-red-200">
          {errorMsg}
        </div>
      )}

      {/* Lead Selection (if initialLead not provided) */}
      {!initialLead ? (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-text-primary">
            Select Lead <span className="text-red-500">*</span>
          </label>

          {selectedLead ? (
            <div className="rounded-lg border border-primary-300 bg-primary-50/40 p-3 flex items-center justify-between">
              <div>
                <p className="font-semibold text-text-primary text-sm">
                  {selectedLead.firstName} {selectedLead.lastName || ""}
                </p>
                <p className="text-xs text-text-secondary">
                  {selectedLead.phone} • {selectedLead.courseInterested || "N/A"} ({selectedLead.city || "N/A"})
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedLead(null);
                  setSelectedUserIds([]);
                  setExistingAssignments([]);
                }}
                className="text-xs font-medium text-primary-700 hover:underline"
              >
                Change Lead
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  placeholder="Search lead by name, phone, email, course..."
                  value={leadSearchTerm}
                  onChange={(e) => setLeadSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-xs focus:border-primary-500 focus:outline-none"
                />
              </div>

              {loadingLeads ? (
                <div className="flex items-center justify-center py-6 text-xs text-text-muted">
                  <RefreshCw size={14} className="animate-spin mr-2" /> Loading leads...
                </div>
              ) : (
                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1 border border-border rounded-lg p-1.5">
                  {filteredLeads.length === 0 ? (
                    <div className="p-3 text-center text-xs text-text-muted">No leads found</div>
                  ) : (
                    filteredLeads.map((l) => (
                      <div
                        key={l.id}
                        onClick={() => setSelectedLead(l)}
                        className="p-2.5 rounded-md border border-transparent hover:border-primary-300 hover:bg-primary-50/30 cursor-pointer transition text-xs flex justify-between items-center"
                      >
                        <div>
                          <p className="font-medium text-text-primary">
                            {l.firstName} {l.lastName || ""}
                          </p>
                          <p className="text-[11px] text-text-muted">
                            {l.phone} • {l.courseInterested || "Course N/A"}
                          </p>
                        </div>
                        <span className="text-[11px] font-medium text-primary-600">Select →</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Lead Info Banner (when pre-selected) */
        <div className="rounded-lg border border-border bg-neutral-50 p-4 space-y-1">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-text-primary text-sm">
              {selectedLead?.firstName} {selectedLead?.lastName || ""}
            </span>
            <span className="bg-primary-50 text-primary-700 border border-primary-200 px-2 py-0.5 rounded text-xs font-mono font-medium">
              {selectedLead?.phone}
            </span>
          </div>
          <p className="text-xs text-text-secondary">
            Course: <span className="font-medium text-text-primary">{selectedLead?.courseInterested || "N/A"}</span> • Location: <span className="font-medium text-text-primary">{selectedLead?.city || "N/A"}</span>
          </p>
        </div>
      )}

      {/* Existing Assignments Banner */}
      {selectedLead && existingAssignments.length > 0 && (
        <div className="space-y-2 border-b border-border pb-4">
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
            <Clock size={13} /> Active TPC Assignments ({existingAssignments.length})
          </label>
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {existingAssignments.map((a) => {
              const assignedName = `${a.assignedTo?.firstName || "User"} ${a.assignedTo?.lastName || ""}`.trim();
              return (
                <div
                  key={a.id}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-background text-xs"
                >
                  <div>
                    <p className="font-medium text-text-primary">{assignedName}</p>
                    <p className="text-[11px] text-text-muted">
                      {a.assignedTo?.email || "N/A"} • Role: <span className="font-medium">{a.assignedTo?.role?.name || "Member"}</span>
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-medium border ${a.status === "COMPLETED"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                  >
                    {a.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Multi-Select Dropdown for TPC Users */}
      {selectedLead && (
        <div className="space-y-1.5" ref={dropdownRef}>
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-text-primary">
              Assign TPC Users <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              {selectedUserIds.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-xs font-medium text-text-muted hover:text-red-600 transition"
                >
                  Clear all ({selectedUserIds.length})
                </button>
              )}
              <span className="text-xs font-medium text-primary-600 bg-primary-50 border border-primary-200 px-2 py-0.5 rounded-full">
                {selectedUserIds.length} Selected
              </span>
            </div>
          </div>

          {/* Searchable Input Container with Pills */}
          <div className="relative">
            <div
              onClick={() => setIsDropdownOpen(true)}
              className={`
                min-h-[44px] w-full rounded-xl border bg-background p-2 transition cursor-text
                flex flex-wrap items-center gap-1.5 pr-10
                ${isDropdownOpen
                  ? "border-primary-500 ring-2 ring-primary-500/20 shadow-sm"
                  : "border-border hover:border-neutral-400"
                }
              `}
            >
              {/* Selected User Pills */}
              {selectedUserIds.map((id) => {
                const u = users.find((item) => item.id === id);
                if (!u) return null;
                const userName = `${u.firstName} ${u.lastName || ""}`.trim();
                return (
                  <span
                    key={u.id}
                    className="
                      inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium
                      bg-primary-50 text-primary-700 border border-primary-200 shadow-sm
                      transition-all animate-in fade-in zoom-in-95
                    "
                  >
                    <span className="max-w-[140px] truncate">{userName}</span>
                    <button
                      type="button"
                      onClick={(e) => handleRemovePill(u.id, e)}
                      title={`Remove ${userName}`}
                      className="text-primary-400 hover:text-red-600 hover:bg-primary-100 rounded-full p-0.5 transition shrink-0"
                    >
                      <X size={12} strokeWidth={2.5} />
                    </button>
                  </span>
                );
              })}

              {/* Search & Typing Input */}
              <div className="flex-1 min-w-[130px] flex items-center gap-1.5 py-0.5">
                {selectedUserIds.length === 0 && (
                  <Search size={14} className="text-text-muted shrink-0 ml-1" />
                )}
                <input
                  type="text"
                  value={userSearchTerm}
                  onChange={(e) => {
                    setUserSearchTerm(e.target.value);
                    if (!isDropdownOpen) setIsDropdownOpen(true);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  placeholder={
                    selectedUserIds.length === 0
                      ? "Select or search users from DB..."
                      : "Search & add more..."
                  }
                  className="w-full bg-transparent text-xs text-text-primary focus:outline-none placeholder:text-text-muted"
                />
              </div>
            </div>

            {/* Dropdown Toggle Icon */}
            <button
              type="button"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition"
            >
              {isDropdownOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {/* Dropdown Options Popup */}
            {isDropdownOpen && (
              <div className="absolute left-0 right-0 z-50 mt-1.5 rounded-xl border border-border bg-surface shadow-2xl overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 duration-150">
                {/* Dropdown Header Actions */}
                <div className="flex items-center justify-between border-b border-border bg-neutral-50 px-3 py-2 text-xs">
                  <span className="font-medium text-text-secondary flex items-center gap-1.5">
                    <Users size={13} /> {filteredUsers.length} user(s) in DB
                  </span>

                  {filteredUsers.length > 0 && (
                    <button
                      type="button"
                      onClick={handleToggleSelectAll}
                      className="flex items-center gap-1 font-semibold text-primary-600 hover:text-primary-700 transition"
                    >
                      {areAllFilteredSelected ? (
                        <>
                          <CheckSquare size={13} /> Deselect All
                        </>
                      ) : (
                        <>
                          <Square size={13} /> Select All ({filteredUsers.length})
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Options List */}
                {loadingOptions ? (
                  <div className="flex items-center justify-center py-6 text-xs text-text-muted">
                    <RefreshCw size={14} className="animate-spin mr-2 text-primary-500" /> Loading users...
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="p-4 text-center text-xs text-text-muted space-y-1">
                    <Users size={18} className="mx-auto opacity-40" />
                    <p>No matching users found.</p>
                  </div>
                ) : (
                  <div className="max-h-56 overflow-y-auto p-1 space-y-0.5">
                    {filteredUsers.map((u) => {
                      const isSelected = selectedUserIds.includes(u.id);
                      const isAlreadyAssigned = existingAssignments.some(
                        (a) => a.assignedToId === u.id
                      );
                      const userName = `${u.firstName} ${u.lastName || ""}`.trim();

                      return (
                        <div
                          key={u.id}
                          onClick={() => toggleUserSelection(u.id)}
                          className={`
                            flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition text-xs select-none
                            ${isSelected
                              ? "bg-primary-50/70 text-primary-900 font-medium"
                              : "hover:bg-neutral-100/70 text-text-primary"
                            }
                          `}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`
                                w-4 h-4 rounded border flex items-center justify-center transition shrink-0
                                ${isSelected
                                  ? "bg-primary-600 border-primary-600 text-white"
                                  : "border-neutral-300 bg-background"
                                }
                              `}
                            >
                              {isSelected && <Check size={11} strokeWidth={3} />}
                            </div>

                            <div className="min-w-0">
                              <p className="font-medium text-xs truncate">{userName}</p>
                              <p className="text-[11px] text-text-muted truncate">
                                {u.email} • <span className="text-text-secondary">{u.role?.name || "User"}</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            {isAlreadyAssigned && (
                              <span className="text-[10px] font-medium text-amber-700 bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded">
                                Active Assignment
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Form Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
        <button
          type="button"
          onClick={onSuccess}
          disabled={loading}
          className="
            rounded-lg border border-border px-4 py-2.5
            text-sm font-medium text-text-secondary
            hover:bg-neutral-100 transition disabled:opacity-50
          "
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={loading || loadingOptions || !selectedLead || selectedUserIds.length === 0}
          className="
            flex items-center gap-2 rounded-lg bg-primary-500 px-5 py-2.5
            text-sm font-medium text-white hover:bg-primary-600
            transition disabled:opacity-50 shadow-sm
          "
        >
          {loading ? "Assigning..." : `Assign TPC (${selectedUserIds.length})`}
        </button>
      </div>
    </form>
  );
};

export default TPCForm;
