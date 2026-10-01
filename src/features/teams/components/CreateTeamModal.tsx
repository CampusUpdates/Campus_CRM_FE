import { useEffect, useState, useRef } from "react";
import {
  X,
  Loader2,
  AlertCircle,
  Search,
  ChevronDown,
  Check,
  UserCheck,
  Shield,
  Plus,
  Users,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import {
  createTeam,
  updateTeam,
  fetchEligibleManagers,
  fetchEligibleMembers,
  fetchTeamMembers,
  fetchTeamLeads,
  fetchTeamLeadAdvisors,
  type EligibleManager,
  type EligibleMember,
  type TeamItem,
  type TeamLeadAdvisorAssignment,
} from "../../../services/teamService";

interface CreateTeamModalProps {
  teamToEdit?: TeamItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

const isTeamLeadRole = (roleName?: string) => {
  if (!roleName) return false;
  const clean = roleName.toUpperCase().replace(/\s+/g, "_");
  return clean === "TEAM_LEAD" || clean === "TEAMLEAD";
};

const isProgramAdvisorRole = (roleName?: string) => {
  if (!roleName) return false;
  const clean = roleName.toUpperCase().replace(/\s+/g, "_");
  return ["PROGRAM_ADVISOR", "PROGRAMADVISOR", "PA", "ADVISOR"].includes(clean);
};

const CreateTeamModal = ({
  teamToEdit,
  onClose,
  onSuccess,
}: CreateTeamModalProps) => {
  const { accessToken } = useAuth();
  const isEditMode = !!teamToEdit;

  const [name, setName] = useState(teamToEdit?.name || "");
  const [description, setDescription] = useState(teamToEdit?.description || "");
  const [managerId, setManagerId] = useState(teamToEdit?.managerId || "");

  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [selectedTeamLeadIds, setSelectedTeamLeadIds] = useState<string[]>([]);
  const [teamLeadAdvisorAssignments, setTeamLeadAdvisorAssignments] = useState<
    TeamLeadAdvisorAssignment[]
  >([]);

  const [managers, setManagers] = useState<EligibleManager[]>([]);
  const [members, setMembers] = useState<EligibleMember[]>([]);

  const [loadingManagers, setLoadingManagers] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [loadingTeamLeads, setLoadingTeamLeads] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Field validation state
  interface ValidationErrors {
    name?: string;
    managerId?: string;
  }
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  // Dropdowns & Search state
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [isMemberDropdownOpen, setIsMemberDropdownOpen] = useState(false);
  const memberDropdownRef = useRef<HTMLDivElement>(null);

  const [teamLeadSearchQuery, setTeamLeadSearchQuery] = useState("");
  const [isTeamLeadDropdownOpen, setIsTeamLeadDropdownOpen] = useState(false);
  const teamLeadDropdownRef = useRef<HTMLDivElement>(null);

  // Active popover state for assigning PAs to a Team Lead
  const [activeAdvisorPopoverTLId, setActiveAdvisorPopoverTLId] = useState<
    string | null
  >(null);
  const advisorPopoverRef = useRef<HTMLDivElement>(null);
  const [advisorSearchQuery, setAdvisorSearchQuery] = useState("");

  useEffect(() => {
    async function loadData() {
      if (!accessToken) return;
      try {
        setLoadingManagers(true);
        setLoadingMembers(true);
        setValidationErrors({});
        setHasAttemptedSubmit(false);

        const [managersData, membersData] = await Promise.all([
          fetchEligibleManagers(accessToken),
          fetchEligibleMembers(accessToken),
        ]);

        setManagers(managersData);

        const memberMap = new Map<string, EligibleMember>();
        membersData.forEach((m) => {
          memberMap.set(m.id, m);
        });

        if (isEditMode && teamToEdit) {
          setLoadingTeamLeads(true);

          const [currentTeamMembersData, currentTeamLeadsData] =
            await Promise.all([
              fetchTeamMembers(accessToken, teamToEdit.id),
              fetchTeamLeads(accessToken, teamToEdit.id).catch(() => []),
            ]);

          const currentMemberIds = currentTeamMembersData.map((m) => m.id);
          const currentTLIds = currentTeamLeadsData.map((tl) => tl.id);

          // Update member map with current team info
          currentTeamMembersData.forEach((cm) => {
            if (memberMap.has(cm.id)) {
              const existing = memberMap.get(cm.id)!;
              memberMap.set(cm.id, {
                ...existing,
                teamId: teamToEdit.id,
                team: { id: teamToEdit.id, name: teamToEdit.name },
              });
            } else {
              memberMap.set(cm.id, {
                ...cm,
                teamId: teamToEdit.id,
                team: { id: teamToEdit.id, name: teamToEdit.name },
              });
            }
          });

          // Fetch supervised advisors for each Team Lead
          const assignments: TeamLeadAdvisorAssignment[] = [];
          await Promise.all(
            currentTLIds.map(async (tlId) => {
              try {
                const supervisedAdvisors = await fetchTeamLeadAdvisors(
                  accessToken,
                  teamToEdit.id,
                  tlId
                );
                assignments.push({
                  teamLeadId: tlId,
                  advisorIds: supervisedAdvisors.map((adv) => adv.id),
                });
              } catch {
                assignments.push({ teamLeadId: tlId, advisorIds: [] });
              }
            })
          );

          setSelectedMemberIds(
            Array.from(new Set([...currentMemberIds, ...currentTLIds]))
          );
          setSelectedTeamLeadIds(currentTLIds);
          setTeamLeadAdvisorAssignments(assignments);
          setLoadingTeamLeads(false);
        }

        setMembers(Array.from(memberMap.values()));
      } catch (err) {
        console.error("Failed to load form data:", err);
        setError("Failed to load managers or team members. Please try again.");
      } finally {
        setLoadingManagers(false);
        setLoadingMembers(false);
      }
    }
    loadData();
  }, [accessToken, teamToEdit, isEditMode]);

  // Click outside handlers
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        memberDropdownRef.current &&
        !memberDropdownRef.current.contains(event.target as Node)
      ) {
        setIsMemberDropdownOpen(false);
      }
      if (
        teamLeadDropdownRef.current &&
        !teamLeadDropdownRef.current.contains(event.target as Node)
      ) {
        setIsTeamLeadDropdownOpen(false);
      }
      if (
        advisorPopoverRef.current &&
        !advisorPopoverRef.current.contains(event.target as Node)
      ) {
        setActiveAdvisorPopoverTLId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Team Lead selection handler
  const handleToggleTeamLead = (tlId: string) => {
    let updatedTLs: string[];
    if (selectedTeamLeadIds.includes(tlId)) {
      updatedTLs = selectedTeamLeadIds.filter((id) => id !== tlId);
    } else {
      updatedTLs = [...selectedTeamLeadIds, tlId];
      if (!selectedMemberIds.includes(tlId)) {
        setSelectedMemberIds((prev) => [...prev, tlId]);
      }
    }
    setSelectedTeamLeadIds(updatedTLs);

    setTeamLeadAdvisorAssignments((prev) =>
      prev.filter((assignment) => updatedTLs.includes(assignment.teamLeadId))
    );
  };

  const handleRemoveTeamLead = (tlId: string) => {
    const updatedTLs = selectedTeamLeadIds.filter((id) => id !== tlId);
    setSelectedTeamLeadIds(updatedTLs);
    setTeamLeadAdvisorAssignments((prev) =>
      prev.filter((assignment) => updatedTLs.includes(assignment.teamLeadId))
    );
  };

  // Team Member selection handler
  const handleToggleMember = (memberId: string) => {
    let updatedMembers: string[];
    if (selectedMemberIds.includes(memberId)) {
      updatedMembers = selectedMemberIds.filter((id) => id !== memberId);
    } else {
      updatedMembers = [...selectedMemberIds, memberId];
    }
    setSelectedMemberIds(updatedMembers);

    setTeamLeadAdvisorAssignments((prev) =>
      prev.map((a) => ({
        ...a,
        advisorIds: a.advisorIds.filter((advId) => updatedMembers.includes(advId)),
      }))
    );
  };

  const handleRemoveMember = (memberId: string) => {
    const updatedMembers = selectedMemberIds.filter((id) => id !== memberId);
    setSelectedMemberIds(updatedMembers);

    setTeamLeadAdvisorAssignments((prev) =>
      prev.map((a) => ({
        ...a,
        advisorIds: a.advisorIds.filter((advId) => updatedMembers.includes(advId)),
      }))
    );
  };

  // Supervision handlers
  const handleToggleAdvisorForTL = (teamLeadId: string, advisorId: string) => {
    setTeamLeadAdvisorAssignments((prev) => {
      const existingIndex = prev.findIndex((a) => a.teamLeadId === teamLeadId);
      if (existingIndex >= 0) {
        const existing = prev[existingIndex];
        const isSelected = existing.advisorIds.includes(advisorId);
        const updatedAdvisorIds = isSelected
          ? existing.advisorIds.filter((id) => id !== advisorId)
          : [...existing.advisorIds, advisorId];

        const copy = [...prev];
        copy[existingIndex] = { ...existing, advisorIds: updatedAdvisorIds };
        return copy;
      } else {
        return [...prev, { teamLeadId, advisorIds: [advisorId] }];
      }
    });
  };

  // Filtering users
  const eligibleTeamLeadOptions = members.filter((m) =>
    isTeamLeadRole(m.role?.name)
  );

  const filteredTeamLeads = eligibleTeamLeadOptions.filter((m) => {
    const fullName = `${m.firstName} ${m.lastName || ""}`.toLowerCase();
    const email = m.email.toLowerCase();
    const query = teamLeadSearchQuery.toLowerCase().trim();
    return fullName.includes(query) || email.includes(query);
  });

  const selectedMemberObjects = members.filter((m) =>
    selectedMemberIds.includes(m.id)
  );

  const selectedTeamLeadObjects = members.filter((m) =>
    selectedTeamLeadIds.includes(m.id)
  );

  const filteredMembers = members.filter((m) => {
    const fullName = `${m.firstName} ${m.lastName || ""}`.toLowerCase();
    const email = m.email.toLowerCase();
    const teamName = (m.team?.name || "").toLowerCase();
    const roleName = (m.role?.name || "").toLowerCase();
    const query = memberSearchQuery.toLowerCase().trim();
    return (
      fullName.includes(query) ||
      email.includes(query) ||
      teamName.includes(query) ||
      roleName.includes(query)
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setHasAttemptedSubmit(true);

    const trimmedName = name.trim();
    const newValidationErrors: ValidationErrors = {};

    if (!trimmedName) {
      newValidationErrors.name = "Team name is required.";
    }

    if (!managerId) {
      newValidationErrors.managerId = "Manager is required.";
    }

    setValidationErrors(newValidationErrors);

    if (Object.keys(newValidationErrors).length > 0) {
      return;
    }

    if (!accessToken) return;

    const cleanedAssignments = teamLeadAdvisorAssignments
      .filter((a) => selectedTeamLeadIds.includes(a.teamLeadId))
      .map((a) => ({
        teamLeadId: a.teamLeadId,
        advisorIds: a.advisorIds.filter((advId) =>
          selectedMemberIds.includes(advId)
        ),
      }));

    try {
      setIsSubmitting(true);

      const payload = {
        name: trimmedName,
        description: description.trim() || undefined,
        managerId,
        memberIds: Array.from(new Set(selectedMemberIds)),
        teamLeadIds: selectedTeamLeadIds,
        teamLeadAdvisorAssignments: cleanedAssignments,
      };

      if (isEditMode && teamToEdit) {
        await updateTeam(accessToken, teamToEdit.id, payload);
      } else {
        await createTeam(accessToken, payload);
      }
      onSuccess();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          `An unexpected error occurred while ${
            isEditMode ? "updating" : "creating"
          } the team.`
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-xs transition-opacity duration-300">
      <div className="h-full w-full max-w-xl bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col transform transition-transform duration-300 ease-out animate-in slide-in-from-right text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 p-6 bg-slate-900 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Users size={22} className="text-emerald-400" />
              {isEditMode ? "Edit Team" : "Create Team"}
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              {isEditMode
                ? "Update team details, manager, members, team leads, and supervision structure."
                : "Create a new team, assign a manager, members, team leads, and supervision."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col justify-between overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto p-6 space-y-6 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-slate-900 [&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full">
            {/* Error Alert */}
            {error && (
              <div className="flex items-start gap-2.5 rounded-lg border border-rose-900/60 bg-rose-950/40 p-3.5 text-xs text-rose-300">
                <AlertCircle
                  size={16}
                  className="shrink-0 text-rose-400 mt-0.5"
                />
                <div className="flex-1 font-medium">{error}</div>
              </div>
            )}

            {/* SECTION 1: TEAM DETAILS */}
            <div className="space-y-4">
              <div className="border-b border-slate-800 pb-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Team Details
                </h3>
              </div>

              {/* Team Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Team Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Team Mohit / MBA Admissions"
                  value={name}
                  onChange={(e) => {
                    const val = e.target.value;
                    setName(val);
                    if (hasAttemptedSubmit || touchedFields.name) {
                      setValidationErrors((prev) => ({
                        ...prev,
                        name: !val.trim() ? "Team name is required." : undefined,
                      }));
                    }
                  }}
                  onBlur={() => {
                    setTouchedFields((prev) => ({ ...prev, name: true }));
                    setValidationErrors((prev) => ({
                      ...prev,
                      name: !name.trim() ? "Team name is required." : undefined,
                    }));
                  }}
                  disabled={isSubmitting}
                  className={`
                    w-full h-10 rounded-lg border bg-slate-800/90 px-3.5 text-sm text-slate-100 placeholder:text-slate-500
                    outline-none transition focus:ring-2 disabled:opacity-50
                    ${
                      !(hasAttemptedSubmit || touchedFields.name)
                        ? "border-slate-700 focus:border-primary-500 focus:ring-primary-500/20"
                        : validationErrors.name || !name.trim()
                        ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20"
                        : "border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500/20"
                    }
                  `}
                />
                {(hasAttemptedSubmit || touchedFields.name) && (validationErrors.name || !name.trim()) && (
                  <p className="mt-1 text-[11px] font-medium text-rose-400">
                    {validationErrors.name || "Team name is required."}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Handles MBA admissions and counseling..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isSubmitting}
                  className="
                    w-full rounded-lg border border-slate-700 bg-slate-800/90 p-3 text-sm text-slate-100 placeholder:text-slate-500
                    outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20
                    disabled:opacity-50 resize-none
                  "
                />
              </div>
            </div>

            {/* SECTION 2: TEAM MANAGER */}
            <div className="space-y-4">
              <div className="border-b border-slate-800 pb-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Team Manager
                </h3>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Manager <span className="text-rose-400">*</span>
                </label>
                {loadingManagers ? (
                  <div className="flex items-center gap-2 h-10 px-3.5 rounded-lg border border-slate-700 bg-slate-800/50 text-xs text-slate-400">
                    <Loader2 size={14} className="animate-spin text-emerald-400" />
                    Loading managers...
                  </div>
                ) : (
                  <select
                    value={managerId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setManagerId(val);
                      if (hasAttemptedSubmit || touchedFields.managerId) {
                        setValidationErrors((prev) => ({
                          ...prev,
                          managerId: !val ? "Manager is required." : undefined,
                        }));
                      }
                    }}
                    onBlur={() => {
                      setTouchedFields((prev) => ({ ...prev, managerId: true }));
                      setValidationErrors((prev) => ({
                        ...prev,
                        managerId: !managerId ? "Manager is required." : undefined,
                      }));
                    }}
                    disabled={isSubmitting}
                    className={`
                      w-full h-10 rounded-lg border bg-slate-800/90 px-3.5 text-sm text-slate-100
                      outline-none transition focus:ring-2 disabled:opacity-50
                      ${
                        !(hasAttemptedSubmit || touchedFields.managerId)
                          ? "border-slate-700 focus:border-primary-500 focus:ring-primary-500/20"
                          : validationErrors.managerId || !managerId
                          ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20"
                          : "border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500/20"
                      }
                    `}
                  >
                    <option value="" className="bg-slate-800 text-slate-300">
                      Select manager...
                    </option>
                    {managers.map((m) => {
                      const nameStr = `${m.firstName} ${m.lastName || ""}`.trim();
                      return (
                        <option
                          key={m.id}
                          value={m.id}
                          className="bg-slate-800 text-slate-100"
                        >
                          {nameStr} ({m.email})
                        </option>
                      );
                    })}
                  </select>
                )}
                {validationErrors.managerId && (
                  <p className="mt-1 text-[11px] font-medium text-rose-400">
                    {validationErrors.managerId}
                  </p>
                )}
              </div>
            </div>


            {/* SECTION 3: TEAM LEADS */}
            <div className="space-y-4">
              <div className="border-b border-slate-800 pb-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Team Leads</span>
                  <span className="text-[10px] font-normal normal-case text-slate-500">
                    Assigned Team Leads to this team
                  </span>
                </h3>
              </div>

              <div className="relative" ref={teamLeadDropdownRef}>
                <div
                  className="relative flex items-center cursor-pointer"
                  onClick={() => setIsTeamLeadDropdownOpen(true)}
                >
                  <Search
                    size={16}
                    className="absolute left-3 text-slate-400 pointer-events-none"
                  />
                  <input
                    type="text"
                    placeholder="Search and assign Team Leads..."
                    value={teamLeadSearchQuery}
                    onChange={(e) => {
                      setTeamLeadSearchQuery(e.target.value);
                      setIsTeamLeadDropdownOpen(true);
                    }}
                    onFocus={() => setIsTeamLeadDropdownOpen(true)}
                    disabled={isSubmitting || loadingMembers || loadingTeamLeads}
                    className="
                      w-full h-10 rounded-lg border border-slate-700 bg-slate-800/90 pl-9 pr-9 text-sm text-slate-100 placeholder:text-slate-500
                      outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20
                      disabled:opacity-50
                    "
                  />
                  <ChevronDown
                    size={16}
                    className={`absolute right-3 text-slate-400 transition-transform duration-200 pointer-events-none ${
                      isTeamLeadDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </div>

                {/* Selected Team Leads Chips */}
                {selectedTeamLeadObjects.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {selectedTeamLeadObjects.map((tl) => {
                      const nameStr = `${tl.firstName} ${tl.lastName || ""}`.trim();
                      return (
                        <span
                          key={tl.id}
                          className="inline-flex items-center gap-1.5 rounded-full border border-indigo-700/60 bg-indigo-950/80 px-3 py-1 text-xs font-medium text-indigo-200 animate-in fade-in zoom-in-95 duration-150"
                        >
                          <Shield size={12} className="text-indigo-400 shrink-0" />
                          <span>{nameStr}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTeamLead(tl.id)}
                            disabled={isSubmitting}
                            className="rounded-full p-0.5 text-indigo-400 hover:bg-indigo-900 hover:text-white transition"
                          >
                            <X size={13} />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Dropdown Menu */}
                {isTeamLeadDropdownOpen && (
                  <div className="absolute z-30 mt-1 w-full max-h-56 overflow-y-auto rounded-lg border border-slate-700 bg-slate-800 shadow-2xl py-1 animate-in fade-in slide-in-from-top-1 duration-150">
                    {loadingMembers || loadingTeamLeads ? (
                      <div className="flex items-center gap-2 p-3 text-xs text-slate-400">
                        <Loader2 size={14} className="animate-spin text-emerald-400" />
                        Loading Team Leads...
                      </div>
                    ) : filteredTeamLeads.length === 0 ? (
                      <div className="p-3 text-xs text-slate-400 text-center">
                        {eligibleTeamLeadOptions.length === 0
                          ? "No eligible Team Leads available"
                          : "No matching Team Leads found."}
                      </div>
                    ) : (
                      filteredTeamLeads.map((tl) => {
                        const isSelected = selectedTeamLeadIds.includes(tl.id);
                        const nameStr = `${tl.firstName} ${tl.lastName || ""}`.trim();

                        return (
                          <div
                            key={tl.id}
                            onClick={() => handleToggleTeamLead(tl.id)}
                            className={`
                              flex items-center justify-between px-3.5 py-2 text-xs cursor-pointer transition border-b border-slate-700/40 last:border-0
                              ${
                                isSelected
                                  ? "bg-indigo-950/70 text-indigo-200 font-medium"
                                  : "hover:bg-slate-700/80 text-slate-200"
                              }
                            `}
                          >
                            <div>
                              <div className="flex items-center gap-1.5">
                                <p className="font-medium text-slate-100">{nameStr}</p>
                                <span className="rounded bg-indigo-900/80 border border-indigo-700/50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-300">
                                  Team Lead
                                </span>
                              </div>
                              <p className="text-slate-400 text-[11px] mt-0.5">{tl.email}</p>
                            </div>
                            {isSelected && (
                              <Check size={15} className="text-indigo-400 shrink-0" />
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 4: TEAM LEAD SUPERVISION */}
            <div className="space-y-4">
              <div className="border-b border-slate-800 pb-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Team Lead Supervision</span>
                  <span className="text-[10px] font-normal normal-case text-slate-500">
                    Assign Program Advisors to Team Leads
                  </span>
                </h3>
              </div>

              {selectedTeamLeadIds.length === 0 ? (
                <div className="rounded-xl border border-slate-800 bg-slate-800/50 p-6 text-center space-y-2">
                  <UserCheck size={22} className="mx-auto text-slate-500" />
                  <p className="text-xs font-semibold text-slate-300">
                    No Team Leads assigned
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                    Select Team Leads above to configure Program Advisor supervision.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedTeamLeadObjects.map((tl) => {
                    const nameStr = `${tl.firstName} ${tl.lastName || ""}`.trim();
                    const assignmentObj = teamLeadAdvisorAssignments.find(
                      (a) => a.teamLeadId === tl.id
                    );
                    const assignedAdvisorIds = assignmentObj?.advisorIds || [];
                    const assignedAdvisorObjects = members.filter((m) =>
                      assignedAdvisorIds.includes(m.id)
                    );

                    const availablePAsForThisTL = members.filter(
                      (m) =>
                        selectedMemberIds.includes(m.id) &&
                        isProgramAdvisorRole(m.role?.name) &&
                        m.id !== tl.id
                    );

                    const filteredAdvisors = availablePAsForThisTL.filter((m) => {
                      const fullName = `${m.firstName} ${m.lastName || ""}`.toLowerCase();
                      const email = m.email.toLowerCase();
                      const query = advisorSearchQuery.toLowerCase().trim();
                      return fullName.includes(query) || email.includes(query);
                    });

                    const isPopoverOpen = activeAdvisorPopoverTLId === tl.id;

                    return (
                      <div
                        key={tl.id}
                        className="rounded-xl border border-slate-700/80 bg-slate-800/70 p-4 space-y-3 transition hover:border-slate-600"
                      >
                        {/* TL Card Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-lg bg-indigo-950 border border-indigo-700/60 text-indigo-300 flex items-center justify-center font-bold text-xs">
                              {tl.firstName[0]}
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-slate-100">
                                {nameStr}
                              </h4>
                              <p className="text-[10px] text-slate-400">{tl.email}</p>
                            </div>
                          </div>
                          <span className="rounded bg-indigo-950 border border-indigo-700/60 px-2 py-0.5 text-[10px] font-semibold text-indigo-300">
                            Team Lead
                          </span>
                        </div>

                        {/* Assigned Program Advisors Pills */}
                        <div>
                          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                            Program Advisors ({assignedAdvisorObjects.length})
                          </p>

                          {assignedAdvisorObjects.length === 0 ? (
                            <p className="text-xs text-slate-500 italic py-1">
                              No Program Advisors assigned
                            </p>
                          ) : (
                            <div className="flex flex-wrap gap-1.5">
                              {assignedAdvisorObjects.map((adv) => {
                                const advName = `${adv.firstName} ${adv.lastName || ""}`.trim();
                                return (
                                  <span
                                    key={adv.id}
                                    className="inline-flex items-center gap-1.5 rounded-full border border-emerald-700/50 bg-emerald-950/80 px-2.5 py-1 text-xs font-medium text-emerald-200"
                                  >
                                    <span>{advName}</span>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleToggleAdvisorForTL(tl.id, adv.id)
                                      }
                                      disabled={isSubmitting}
                                      className="rounded-full p-0.5 text-emerald-400 hover:bg-emerald-900 hover:text-white transition"
                                    >
                                      <X size={12} />
                                    </button>
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Assign Program Advisors Button & Popover */}
                        <div
                          className="relative"
                          ref={isPopoverOpen ? advisorPopoverRef : null}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              if (isPopoverOpen) {
                                setActiveAdvisorPopoverTLId(null);
                              } else {
                                setActiveAdvisorPopoverTLId(tl.id);
                                setAdvisorSearchQuery("");
                              }
                            }}
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 bg-slate-800 hover:bg-slate-700/80 px-3 py-1.5 rounded-lg border border-emerald-500/40 transition"
                          >
                            <Plus size={14} />
                            <span>Assign Program Advisors</span>
                          </button>

                          {/* Advisor Selector Popover */}
                          {isPopoverOpen && (
                            <div className="absolute left-0 z-40 mt-2 w-72 max-h-60 overflow-y-auto rounded-xl border border-slate-700 bg-slate-800 shadow-2xl p-2 space-y-2 animate-in fade-in zoom-in-95 duration-150">
                              <div className="relative flex items-center">
                                <Search
                                  size={14}
                                  className="absolute left-2.5 text-slate-400 pointer-events-none"
                                />
                                <input
                                  type="text"
                                  placeholder="Search team Program Advisors..."
                                  value={advisorSearchQuery}
                                  onChange={(e) =>
                                    setAdvisorSearchQuery(e.target.value)
                                  }
                                  className="w-full h-8 rounded-lg border border-slate-700 bg-slate-900 pl-8 pr-2.5 text-xs text-slate-100 placeholder:text-slate-500 outline-none focus:border-emerald-500"
                                />
                              </div>

                              <div className="space-y-1">
                                {availablePAsForThisTL.length === 0 ? (
                                  <p className="p-3 text-xs text-slate-400 text-center">
                                    No Program Advisors available in this team
                                  </p>
                                ) : filteredAdvisors.length === 0 ? (
                                  <p className="p-3 text-xs text-slate-400 text-center">
                                    No matching Program Advisors found
                                  </p>
                                ) : (
                                  filteredAdvisors.map((adv) => {
                                    const isAssigned = assignedAdvisorIds.includes(
                                      adv.id
                                    );
                                    const advName = `${adv.firstName} ${
                                      adv.lastName || ""
                                    }`.trim();

                                    return (
                                      <div
                                        key={adv.id}
                                        onClick={() =>
                                          handleToggleAdvisorForTL(tl.id, adv.id)
                                        }
                                        className={`
                                          flex items-center justify-between px-3 py-1.5 text-xs rounded-lg cursor-pointer transition
                                          ${
                                            isAssigned
                                              ? "bg-emerald-950/80 text-emerald-200 font-medium"
                                              : "hover:bg-slate-700/80 text-slate-200"
                                          }
                                        `}
                                      >
                                        <div>
                                          <p className="font-medium">{advName}</p>
                                          <p className="text-[10px] text-slate-400">{adv.email}</p>
                                        </div>
                                        {isAssigned && (
                                          <Check
                                            size={14}
                                            className="text-emerald-400 shrink-0"
                                          />
                                        )}
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* SECTION 5: TEAM MEMBERS */}
            <div className="space-y-4">
              <div className="border-b border-slate-800 pb-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Team Members
                </h3>
              </div>

              <div className="relative" ref={memberDropdownRef}>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Search & Select Members
                </label>

                {/* Search / Select trigger input */}
                <div
                  className="relative flex items-center cursor-pointer"
                  onClick={() => setIsMemberDropdownOpen(true)}
                >
                  <Search
                    size={16}
                    className="absolute left-3 text-slate-400 pointer-events-none"
                  />
                  <input
                    type="text"
                    placeholder="Search and select team members..."
                    value={memberSearchQuery}
                    onChange={(e) => {
                      setMemberSearchQuery(e.target.value);
                      setIsMemberDropdownOpen(true);
                    }}
                    onFocus={() => setIsMemberDropdownOpen(true)}
                    disabled={isSubmitting || loadingMembers}
                    className="
                      w-full h-10 rounded-lg border border-slate-700 bg-slate-800/90 pl-9 pr-9 text-sm text-slate-100 placeholder:text-slate-500
                      outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20
                      disabled:opacity-50
                    "
                  />
                  <ChevronDown
                    size={16}
                    className={`absolute right-3 text-slate-400 transition-transform duration-200 pointer-events-none ${
                      isMemberDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </div>

                {/* Selected Members Chips */}
                {selectedMemberObjects.length > 0 && (
                  <div className="mt-3">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Selected Team Members ({selectedMemberObjects.length})
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedMemberObjects.map((m) => {
                        const nameStr = `${m.firstName} ${m.lastName || ""}`.trim();
                        const isFromOtherTeam =
                          m.team && teamToEdit && m.team.id !== teamToEdit.id;
                        return (
                          <span
                            key={m.id}
                            className={`
                              inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium animate-in fade-in zoom-in-95 duration-150
                              ${
                                isFromOtherTeam
                                  ? "bg-amber-950/80 border-amber-700/60 text-amber-200"
                                  : "bg-slate-800 border-slate-700 text-slate-200"
                              }
                            `}
                            title={
                              isFromOtherTeam
                                ? `Moved from ${m.team?.name}`
                                : undefined
                            }
                          >
                            <span>{nameStr}</span>
                            {m.role?.name && (
                              <span className="text-[10px] opacity-75 font-normal">
                                ({m.role.name})
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveMember(m.id)}
                              disabled={isSubmitting}
                              className="rounded-full p-0.5 text-slate-400 hover:bg-slate-700 hover:text-white transition"
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
                  <div className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto rounded-lg border border-slate-700 bg-slate-800 shadow-2xl py-1 animate-in fade-in slide-in-from-top-1 duration-150">
                    {loadingMembers ? (
                      <div className="flex items-center gap-2 p-3 text-xs text-slate-400">
                        <Loader2 size={14} className="animate-spin text-emerald-400" />
                        Loading eligible members...
                      </div>
                    ) : filteredMembers.length === 0 ? (
                      <div className="p-3 text-xs text-slate-400 text-center">
                        {members.length === 0
                          ? "No eligible members available."
                          : "No matching members found."}
                      </div>
                    ) : (
                      filteredMembers.map((m) => {
                        const isSelected = selectedMemberIds.includes(m.id);
                        const nameStr = `${m.firstName} ${m.lastName || ""}`.trim();
                        const isOtherTeam =
                          m.team && (!teamToEdit || m.team.id !== teamToEdit.id);
                        const isCurrentTeam =
                          m.team && teamToEdit && m.team.id === teamToEdit.id;

                        return (
                          <div
                            key={m.id}
                            onClick={() => handleToggleMember(m.id)}
                            className={`
                              flex items-center justify-between px-3.5 py-2 text-xs cursor-pointer transition border-b border-slate-700/40 last:border-0
                              ${
                                isSelected
                                  ? "bg-emerald-950/60 text-emerald-200 font-medium"
                                  : "hover:bg-slate-700/80 text-slate-200"
                              }
                            `}
                          >
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="font-medium text-slate-100">{nameStr}</p>
                                {m.role?.name && (
                                  <span className="text-[10px] text-slate-400 font-normal">
                                    ({m.role.name})
                                  </span>
                                )}
                                {isOtherTeam && (
                                  <span
                                    className="rounded bg-amber-950/80 border border-amber-700/60 px-1.5 py-0.5 text-[10px] font-medium text-amber-200"
                                    title={`Currently assigned to ${m.team?.name}. Selecting will move member to this team.`}
                                  >
                                    {m.team?.name}
                                  </span>
                                )}
                                {isCurrentTeam && (
                                  <span className="rounded bg-emerald-950/80 border border-emerald-700/60 px-1.5 py-0.5 text-[10px] font-medium text-emerald-300">
                                    This team
                                  </span>
                                )}
                                {!m.team && (
                                  <span className="rounded bg-slate-800 border border-slate-700 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
                                    Unassigned
                                  </span>
                                )}
                              </div>
                              <p className="text-slate-400 text-[11px] mt-0.5">
                                {m.email}
                              </p>
                            </div>
                            {isSelected && (
                              <Check
                                size={15}
                                className="text-emerald-400 shrink-0"
                              />
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sticky Actions Footer */}
          <div className="border-t border-slate-800 p-4 bg-slate-900 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="
                rounded-lg border border-slate-700 bg-slate-800/80 px-4 py-2 text-sm font-medium
                text-slate-300 hover:bg-slate-800 hover:text-white transition disabled:opacity-50
              "
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || loadingManagers}
              className="
                flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium
                text-white transition hover:bg-emerald-500 disabled:opacity-50 shadow-sm
              "
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {isEditMode ? "Save Changes" : "Create Team"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTeamModal;
