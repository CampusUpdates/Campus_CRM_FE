import { useState, useEffect, useMemo } from "react";
import {
  X,
  Send,
  Eye,
  Users,
  Building,
  Shield,
  Search,
  CheckSquare,
  Square,
  Loader2,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import { fetchTeams, fetchUsers, type UserItem, type UserTeam } from "../../../services/userService";
import {
  previewBroadcastRecipients,
  sendBroadcast,
  type RecipientUser,
} from "../../../services/broadcastService";

interface CreateBroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ROLES = [
  { id: 1, name: "SUPER_ADMIN", label: "Super Admin" },
  { id: 2, name: "PROGRAM_ADVISOR", label: "Program Advisor" },
  { id: 3, name: "MANAGER", label: "Manager" },
  { id: 4, name: "HR", label: "HR" },
  { id: 5, name: "TEAM_LEAD", label: "Team Lead" },
];

export const CreateBroadcastModal = ({
  isOpen,
  onClose,
  onSuccess,
}: CreateBroadcastModalProps) => {
  const { accessToken, user } = useAuth();
  const toast = useToast();
  const isManager = user?.roleCode === "MANAGER";

  const availableRoles = useMemo(() => {
    if (isManager) {
      return ROLES.filter((r) => r.name === "PROGRAM_ADVISOR" || r.name === "TEAM_LEAD");
    }
    return ROLES;
  }, [isManager]);

  const [isClosing, setIsClosing] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [targetAll, setTargetAll] = useState(true);
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
  const [selectedTeamIds, setSelectedTeamIds] = useState<number[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Search & filter for employees selection
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [users, setUsers] = useState<UserItem[]>([]);
  const [teams, setTeams] = useState<UserTeam[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Preview state
  const [activeTab, setActiveTab] = useState<"compose" | "preview">("compose");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [previewList, setPreviewList] = useState<RecipientUser[]>([]);
  const [previewSearch, setPreviewSearch] = useState("");

  const [submitting, setSubmitting] = useState(false);

  // Smooth slide out close handler
  const handleClose = () => {
    if (submitting) return;
    setIsClosing(true);
  };

  const handleAnimationEnd = () => {
    if (isClosing) {
      setIsClosing(false);
      onClose();
    }
  };

  // Keyboard escape key support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting && isOpen) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [submitting, isOpen]);

  // Load teams and users once
  useEffect(() => {
    if (!isOpen || !accessToken) return;
    setLoadingData(true);
    Promise.all([fetchUsers(accessToken), fetchTeams(accessToken)])
      .then(([usersData, teamsData]) => {
        setUsers(usersData.filter((u) => u.status === "ACTIVE"));
        setTeams(teamsData);
      })
      .catch((err) => {
        console.error("Failed to load users/teams", err);
        toast.error("Failed to load employee directory");
      })
      .finally(() => setLoadingData(false));
  }, [isOpen, accessToken, toast]);

  // Load live recipient preview when targeting changes
  useEffect(() => {
    if (!isOpen || !accessToken) return;

    let isCancelled = false;
    const fetchPreview = async () => {
      setPreviewLoading(true);
      try {
        const payload = {
          targetAll,
          targetRoles: !targetAll ? selectedRoleIds : [],
          targetTeams: !targetAll ? selectedTeamIds : [],
          targetUserIds: !targetAll ? selectedUserIds : [],
        };
        const res = await previewBroadcastRecipients(accessToken, payload);
        if (!isCancelled) {
          setPreviewCount(res.count);
          setPreviewList(res.recipients);
        }
      } catch (err) {
        if (!isCancelled) {
          console.error("Preview error", err);
        }
      } finally {
        if (!isCancelled) setPreviewLoading(false);
      }
    };

    const timer = setTimeout(fetchPreview, 250);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [
    isOpen,
    accessToken,
    targetAll,
    selectedRoleIds,
    selectedTeamIds,
    selectedUserIds,
  ]);

  const toggleRole = (id: number) => {
    setSelectedRoleIds((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const toggleTeam = (id: number) => {
    setSelectedTeamIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const toggleUser = (id: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id]
    );
  };

  // Filtered employees for individual selection
  const filteredEmployees = useMemo(() => {
    if (!employeeSearch.trim()) return users;
    const q = employeeSearch.toLowerCase();
    return users.filter(
      (u) =>
        `${u.firstName} ${u.lastName || ""}`.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.phone.includes(q)
    );
  }, [users, employeeSearch]);

  // Filtered preview list
  const filteredPreviewList = useMemo(() => {
    if (!previewSearch.trim()) return previewList;
    const q = previewSearch.toLowerCase();
    return previewList.filter(
      (u) =>
        `${u.firstName} ${u.lastName || ""}`.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.team?.name || "").toLowerCase().includes(q) ||
        (u.role?.name || "").toLowerCase().includes(q)
    );
  }, [previewList, previewSearch]);

  const handleSend = async () => {
    if (!title.trim()) {
      toast.error("Please provide an announcement title.");
      return;
    }
    if (!body.trim()) {
      toast.error("Please provide the message body.");
      return;
    }
    if (previewCount === 0) {
      toast.error("Targeting resolved 0 recipients. Please select at least one recipient.");
      return;
    }

    setSubmitting(true);
    try {
      await sendBroadcast(accessToken!, {
        title: title.trim(),
        body: body.trim(),
        targetAll,
        targetRoles: !targetAll ? selectedRoleIds : [],
        targetTeams: !targetAll ? selectedTeamIds : [],
        targetUserIds: !targetAll ? selectedUserIds : [],
      });

      toast.success(`Broadcast successfully sent to ${previewCount} employee${previewCount === 1 ? "" : "s"}!`);
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to send broadcast");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className={`
          fixed inset-0
          bg-black/60 backdrop-blur-xs
          transition-opacity duration-300
          ${isClosing ? "opacity-0" : "opacity-100"}
        `}
      />

      {/* Right-Side Drawer Container */}
      <div
        onAnimationEnd={handleAnimationEnd}
        className={`
          relative
          h-[100dvh]
          w-full sm:w-[540px] md:w-[580px] lg:w-[620px]
          max-w-[100vw]
          bg-surface
          shadow-2xl
          border-l border-border
          flex flex-col
          z-10
          ${isClosing ? "animate-slide-out" : "animate-slide-in"}
        `}
      >
        {/* Drawer Header */}
        <div className="flex shrink-0 items-center justify-between px-5 sm:px-6 py-4.5 border-b border-border bg-surface">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-500/10 text-primary-500 border border-primary-500/20 shadow-2xs">
              <Send size={19} />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-text-primary truncate">
                New Broadcast Announcement
              </h2>
              <p className="text-xs text-text-secondary truncate mt-0.5">
                {isManager
                  ? "Publish targeted announcements to your managed teams with acknowledgement tracking."
                  : "Publish company-wide or targeted messages with acknowledgement tracking."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Close drawer"
            className="
              shrink-0 ml-2 p-2 rounded-lg
              text-text-secondary hover:text-text-primary
              hover:bg-neutral-100 dark:hover:bg-neutral-800
              transition cursor-pointer
            "
          >
            <X size={19} />
          </button>
        </div>

        {/* Tab navigation: Compose vs Preview */}
        <div className="flex items-center gap-2 px-5 sm:px-6 pt-3 border-b border-border bg-neutral-50/50 dark:bg-neutral-800/30 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("compose")}
            className={`flex items-center gap-2 pb-3 px-2 text-xs sm:text-sm font-medium border-b-2 transition cursor-pointer ${activeTab === "compose"
                ? "border-primary-500 text-primary-600 dark:text-primary-400 font-semibold"
                : "border-transparent text-text-secondary hover:text-text-primary"
              }`}
          >
            Compose Message
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("preview")}
            className={`flex items-center gap-2 pb-3 px-2 text-xs sm:text-sm font-medium border-b-2 transition cursor-pointer ${activeTab === "preview"
                ? "border-primary-500 text-primary-600 dark:text-primary-400 font-semibold"
                : "border-transparent text-text-secondary hover:text-text-primary"
              }`}
          >
            <Eye size={15} />
            Preview & Recipients
            {previewCount !== null && (
              <span className="ml-1 px-2 py-0.5 text-[11px] font-semibold rounded-full bg-primary-500/15 text-primary-600 dark:text-primary-400 border border-primary-500/30">
                {previewCount}
              </span>
            )}
          </button>
        </div>

        {/* Drawer Body - Scrollable content area */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-6 custom-scrollbar bg-surface">
          {activeTab === "compose" ? (
            <div className="space-y-5">
              {/* Message Details */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
                    Broadcast Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mandatory Compliance Training or Townhall Update"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="
                      w-full h-11 px-3.5 rounded-xl
                      border border-border
                      bg-surface
                      text-sm text-text-primary
                      placeholder:text-text-muted
                      outline-none
                      focus:border-primary-500
                      focus:ring-2 focus:ring-primary-500/20
                      transition
                    "
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
                    Message Body <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={5}
                    placeholder="Write your announcement message in detail. Employees will be asked to read and explicitly acknowledge this message."
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    className="
                      w-full p-3.5 rounded-xl
                      border border-border
                      bg-surface
                      text-sm text-text-primary
                      placeholder:text-text-muted
                      outline-none
                      focus:border-primary-500
                      focus:ring-2 focus:ring-primary-500/20
                      transition custom-scrollbar
                    "
                  />
                </div>
              </div>

              {/* Recipient Targeting Card */}
              <div className="rounded-xl border border-border bg-neutral-50/50 dark:bg-neutral-800/40 p-4 sm:p-5 space-y-4.5 shadow-2xs">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Users size={17} className="text-primary-500 shrink-0" />
                    <h3 className="text-xs sm:text-sm font-semibold text-text-primary truncate">
                      Recipient Targeting
                    </h3>
                  </div>

                  {/* Resolved Live Counter Badge */}
                  <div className="flex items-center gap-1.5 text-xs font-medium shrink-0">
                    {previewLoading ? (
                      <span className="flex items-center gap-1.5 text-text-muted">
                        <Loader2 size={13} className="animate-spin text-primary-500" />
                        Resolving...
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                        <CheckCircle2 size={15} />
                        {previewCount} employee{previewCount === 1 ? "" : "s"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Target All toggle */}
                <div className="flex items-start gap-3 p-3.5 rounded-xl border border-border bg-surface">
                  <input
                    type="checkbox"
                    id="targetAll"
                    checked={targetAll}
                    onChange={(e) => setTargetAll(e.target.checked)}
                    className="h-4 w-4 mt-0.5 rounded border-border bg-surface text-primary-500 focus:ring-primary-500 cursor-pointer accent-primary-600 shrink-0"
                  />
                  <label
                    htmlFor="targetAll"
                    className="text-xs sm:text-sm font-medium text-text-primary cursor-pointer flex-1"
                  >
                    {isManager ? "Broadcast to All Team Members (My Scope)" : "Broadcast to All Active Employees"}
                    <span className="block text-[11px] font-normal text-text-muted mt-0.5">
                      {isManager
                        ? "Sends to all active advisors and team leads across your managed teams. Overrides individual filters."
                        : "Sends to all active staff across all departments and teams. Overrides individual filters."}
                    </span>
                  </label>
                </div>

                {/* Specific Targeting options when targetAll is false */}
                {!targetAll && (
                  <div className="space-y-4.5 pt-1 animate-in fade-in duration-200">
                    {/* Roles Targeting */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
                          <Shield size={13} className="text-primary-500" /> Filter by Roles
                          {selectedRoleIds.length > 0 && (
                            <span className="text-primary-600 dark:text-primary-400 font-bold ml-1">
                              ({selectedRoleIds.length})
                            </span>
                          )}
                        </label>
                        {selectedRoleIds.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setSelectedRoleIds([])}
                            className="text-[11px] text-text-muted hover:text-rose-500 transition cursor-pointer"
                          >
                            Clear roles
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {availableRoles.map((r) => {
                          const isSelected = selectedRoleIds.includes(r.id);
                          return (
                            <button
                              type="button"
                              key={r.id}
                              onClick={() => toggleRole(r.id)}
                              className={`
                                inline-flex items-center gap-1.5
                                rounded-full px-3 py-1.5
                                text-xs font-medium
                                border transition cursor-pointer
                                ${isSelected
                                  ? "bg-primary-500 text-white font-semibold border-primary-500 shadow-2xs"
                                  : "bg-surface border-border text-text-secondary hover:border-primary-500/40 hover:text-text-primary"
                                }
                              `}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${isSelected ? "bg-white" : "bg-text-muted"
                                  }`}
                              />
                              <span>{r.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Teams Targeting - Compact Rounded Pill Controls */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
                          <Building size={13} className="text-primary-500" /> Filter by Teams
                          {selectedTeamIds.length > 0 && (
                            <span className="text-primary-600 dark:text-primary-400 font-bold ml-1">
                              ({selectedTeamIds.length})
                            </span>
                          )}
                        </label>
                        {selectedTeamIds.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setSelectedTeamIds([])}
                            className="text-[11px] text-text-muted hover:text-rose-500 transition cursor-pointer"
                          >
                            Clear teams
                          </button>
                        )}
                      </div>
                      {teams.length === 0 ? (
                        <p className="text-xs text-text-muted">No teams found.</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5 sm:gap-2 max-h-36 overflow-y-auto custom-scrollbar p-0.5">
                          {teams.map((t) => {
                            const isSelected = selectedTeamIds.includes(t.id);
                            return (
                              <button
                                type="button"
                                key={t.id}
                                onClick={() => toggleTeam(t.id)}
                                className={`
                                  inline-flex items-center gap-1.5
                                  rounded-full px-3 py-1.5
                                  text-xs font-medium
                                  border transition cursor-pointer
                                  ${isSelected
                                    ? "bg-primary-500 text-white font-semibold border-primary-500 shadow-2xs"
                                    : "bg-surface border-border text-text-secondary hover:border-primary-500/40 hover:text-text-primary"
                                  }
                                `}
                              >
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${isSelected ? "bg-white" : "bg-text-muted"
                                    }`}
                                />
                                <span className="truncate max-w-[160px]">{t.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Individual Employee Selection with Multi-Select Pills */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
                          <Users size={13} className="text-primary-500" /> Individual Employees
                          {selectedUserIds.length > 0 && (
                            <span className="text-primary-600 dark:text-primary-400 font-bold ml-1">
                              ({selectedUserIds.length} selected)
                            </span>
                          )}
                        </label>
                        {selectedUserIds.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setSelectedUserIds([])}
                            className="text-xs text-rose-500 hover:text-rose-600 transition cursor-pointer font-medium"
                          >
                            Clear All
                          </button>
                        )}
                      </div>

                      {/* Selected Recipient Pills Container */}
                      <div className="rounded-xl border border-border bg-surface p-2.5 sm:p-3 transition">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-medium text-text-secondary">
                            Selected Recipients ({selectedUserIds.length})
                          </span>
                          {selectedUserIds.length > 0 && (
                            <span className="text-[11px] text-text-muted">
                              Click <span className="text-primary-500 font-semibold">×</span> to remove
                            </span>
                          )}
                        </div>

                        {selectedUserIds.length === 0 ? (
                          <div className="py-2.5 px-3 text-xs text-text-muted italic bg-neutral-50 dark:bg-neutral-800/40 rounded-lg border border-border text-center sm:text-left">
                            No individual employees selected. Choose from the list below.
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 max-h-36 overflow-y-auto custom-scrollbar p-1">
                            {selectedUserIds.map((id) => {
                              const emp = users.find((u) => u.id === id);
                              const displayName = emp
                                ? `${emp.firstName} ${emp.lastName || ""}`.trim()
                                : id;
                              return (
                                <span
                                  key={id}
                                  className="
                                    inline-flex items-center gap-1.5
                                    rounded-full
                                    bg-primary-500/15
                                    border border-primary-500/40
                                    px-2.5 sm:px-3 py-1
                                    text-[11px] sm:text-xs font-medium text-primary-600 dark:text-primary-300
                                    shadow-2xs
                                    max-w-full
                                    animate-in fade-in zoom-in-95 duration-150
                                  "
                                >
                                  <span className="truncate max-w-[150px] sm:max-w-[200px]" title={displayName}>
                                    {displayName}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleUser(id);
                                    }}
                                    className="rounded-full p-0.5 hover:bg-primary-500/30 hover:text-primary-700 dark:hover:text-white transition shrink-0 cursor-pointer"
                                    title={`Remove ${displayName}`}
                                  >
                                    <X size={12} className="sm:w-3.5 sm:h-3.5" />
                                  </button>
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Employee search input */}
                      <div className="relative">
                        <Search
                          size={14}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                        />
                        <input
                          type="text"
                          placeholder="Search directory by name, email, or phone..."
                          value={employeeSearch}
                          onChange={(e) => setEmployeeSearch(e.target.value)}
                          className="
                            w-full h-9 pl-9 pr-8 rounded-lg
                            border border-border
                            bg-surface
                            text-xs text-text-primary
                            placeholder:text-text-muted
                            outline-none
                            focus:border-primary-500
                            transition
                          "
                        />
                        {employeeSearch && (
                          <button
                            type="button"
                            onClick={() => setEmployeeSearch("")}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-0.5 cursor-pointer"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>

                      {/* Employee selection scroll list with dark hierarchy and synchronized state */}
                      <div className="max-h-48 overflow-y-auto rounded-xl border border-border bg-surface divide-y divide-border custom-scrollbar shadow-inner">
                        {loadingData ? (
                          <div className="p-5 text-center text-xs text-text-muted flex items-center justify-center gap-2">
                            <Loader2 size={14} className="animate-spin text-primary-500" />
                            Loading employee directory...
                          </div>
                        ) : filteredEmployees.length === 0 ? (
                          <div className="p-5 text-center text-xs text-text-muted">
                            No matching employees found.
                          </div>
                        ) : (
                          filteredEmployees.map((emp) => {
                            const isSelected = selectedUserIds.includes(emp.id);
                            return (
                              <div
                                key={emp.id}
                                onClick={() => toggleUser(emp.id)}
                                className={`
                                  flex items-center justify-between p-2.5 text-xs cursor-pointer transition
                                  ${isSelected
                                    ? "bg-primary-500/10 hover:bg-primary-500/15"
                                    : "hover:bg-neutral-50 dark:hover:bg-neutral-800/40"
                                  }
                                `}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  {isSelected ? (
                                    <CheckSquare size={15} className="text-primary-500 shrink-0" />
                                  ) : (
                                    <Square size={15} className="text-text-muted shrink-0" />
                                  )}
                                  <div className="min-w-0">
                                    <p
                                      className={`font-semibold truncate ${isSelected ? "text-primary-600 dark:text-primary-300" : "text-text-primary"
                                        }`}
                                    >
                                      {emp.firstName} {emp.lastName || ""}
                                    </p>
                                    <p className="text-[11px] text-text-muted truncate">
                                      {emp.email} • {emp.role?.name || "No Role"}
                                      {emp.team?.name ? ` • ${emp.team.name}` : ""}
                                    </p>
                                  </div>
                                </div>

                                <span
                                  className={`
                                    text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0
                                    ${isSelected
                                      ? "bg-primary-500 text-white font-semibold shadow-2xs"
                                      : "text-text-secondary hover:text-text-primary"
                                    }
                                  `}
                                >
                                  {isSelected ? "Selected" : "Select"}
                                </span>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Preview Tab */
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Message Preview Card */}
              <div className="rounded-xl border border-primary-500/30 bg-primary-500/5 p-4 sm:p-5 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                  <Eye size={14} /> Message Preview
                </div>
                <h3 className="text-base sm:text-lg font-bold text-text-primary leading-snug">
                  {title || "Untitled Announcement"}
                </h3>
                <div className="p-3.5 rounded-lg bg-surface border border-border text-xs sm:text-sm text-text-primary whitespace-pre-line leading-relaxed shadow-2xs">
                  {body || "No message content provided yet."}
                </div>
              </div>

              {/* Resolved Recipients List */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold text-text-primary">
                      Resolved Recipient List ({previewList.length})
                    </h4>
                    <p className="text-[11px] text-text-secondary">
                      Active employees targeted for this announcement. Overlaps are deduplicated.
                    </p>
                  </div>

                  <div className="relative w-full sm:w-56">
                    <Search
                      size={14}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted"
                    />
                    <input
                      type="text"
                      placeholder="Filter list..."
                      value={previewSearch}
                      onChange={(e) => setPreviewSearch(e.target.value)}
                      className="w-full h-8 pl-8 pr-3 rounded-lg border border-border bg-surface text-xs text-text-primary outline-none focus:border-primary-500 placeholder:text-text-muted"
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-2xs">
                  <div className="max-h-60 overflow-y-auto custom-scrollbar">
                    {previewLoading ? (
                      <div className="p-8 text-center text-xs text-text-muted flex items-center justify-center gap-2">
                        <Loader2 size={15} className="animate-spin text-primary-500" />
                        Resolving recipient list...
                      </div>
                    ) : filteredPreviewList.length === 0 ? (
                      <div className="p-8 text-center text-xs text-text-muted">
                        No employees match the filter.
                      </div>
                    ) : (
                      <table className="w-full text-xs">
                        <thead className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-border text-text-secondary font-semibold uppercase">
                          <tr>
                            <th className="px-3.5 py-2.5 text-left">Employee</th>
                            <th className="px-3.5 py-2.5 text-left">Role</th>
                            <th className="px-3.5 py-2.5 text-left">Team</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {filteredPreviewList.map((rec) => (
                            <tr
                              key={rec.id}
                              className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition"
                            >
                              <td className="px-3.5 py-2.5">
                                <p className="font-medium text-text-primary">
                                  {rec.firstName} {rec.lastName || ""}
                                </p>
                                <p className="text-[10px] text-text-muted">{rec.email}</p>
                              </td>
                              <td className="px-3.5 py-2.5 text-text-secondary whitespace-nowrap">
                                <span className="inline-block px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-[11px] font-medium text-text-secondary border border-border">
                                  {rec.role?.name || "N/A"}
                                </span>
                              </td>
                              <td className="px-3.5 py-2.5 text-text-secondary whitespace-nowrap">
                                {rec.team?.name || "Unassigned"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer Actions */}
        <div className="flex shrink-0 items-center justify-between px-5 sm:px-6 py-4 border-t border-border bg-surface">
          <div className="text-xs text-text-secondary truncate mr-2">
            {previewCount !== null && (
              <span>
                Targeting: <strong className="text-text-primary">{previewCount}</strong> employee{previewCount === 1 ? "" : "s"}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {activeTab === "preview" ? (
              <button
                type="button"
                onClick={() => setActiveTab("compose")}
                disabled={submitting}
                className="
                  flex items-center gap-1.5
                  px-3.5 py-2.5 rounded-xl
                  border border-border
                  text-xs font-semibold
                  text-text-secondary
                  hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-text-primary
                  transition
                  disabled:opacity-50
                  cursor-pointer
                "
              >
                <ArrowLeft size={14} />
                Back to Edit
              </button>
            ) : (
              <button
                type="button"
                onClick={handleClose}
                disabled={submitting}
                className="
                  px-4 py-2.5 rounded-xl
                  border border-border
                  text-xs font-semibold
                  text-text-secondary
                  hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-text-primary
                  transition
                  disabled:opacity-50
                  cursor-pointer
                "
              >
                Cancel
              </button>
            )}

            {activeTab === "compose" ? (
              <button
                type="button"
                onClick={() => setActiveTab("preview")}
                className="
                  flex items-center gap-1.5
                  px-4 py-2.5 rounded-xl
                  border border-primary-500/40
                  bg-primary-500/15
                  hover:bg-primary-500/25
                  text-xs font-semibold text-primary-300
                  transition cursor-pointer
                "
              >
                <Eye size={14} />
                Preview & Recipients
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSend}
                disabled={submitting || previewCount === 0 || !title.trim() || !body.trim()}
                className="
                  flex items-center gap-1.5
                  px-5 py-2.5 rounded-xl
                  bg-primary-600 hover:bg-primary-700
                  text-xs font-semibold text-white
                  shadow-sm transition
                  disabled:opacity-50
                  cursor-pointer
                "
              >
                {submitting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Send size={14} />
                )}
                Send Broadcast
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
