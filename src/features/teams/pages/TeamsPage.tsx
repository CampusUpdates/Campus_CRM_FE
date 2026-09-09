import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, RefreshCw, Shield, UserCheck, CheckCircle2, Users } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { fetchTeams, type TeamItem } from "../../../services/teamService";
import CreateTeamModal from "../components/CreateTeamModal";

const TeamsPage = () => {
  const navigate = useNavigate();
  const { accessToken, hasRole } = useAuth();

  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const canCreateTeam = hasRole(["SUPER_ADMIN", "HR"]);

  const loadTeams = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const data = await fetchTeams(accessToken);
      setTeams(data);
    } catch (err) {
      console.error("Failed to load teams:", err);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false);
    setSuccessToast("Team created successfully.");
    loadTeams();
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const filteredTeams = teams.filter((t) => {
    const term = searchTerm.toLowerCase();
    const teamName = t.name.toLowerCase();
    const desc = (t.description || "").toLowerCase();
    const managerName = t.manager
      ? `${t.manager.firstName} ${t.manager.lastName || ""}`.toLowerCase()
      : "";
    const managerEmail = t.manager ? t.manager.email.toLowerCase() : "";

    return (
      teamName.includes(term) ||
      desc.includes(term) ||
      managerName.includes(term) ||
      managerEmail.includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 shadow-lg animate-in slide-in-from-top-2 duration-300">
          <CheckCircle2 size={18} className="text-emerald-600" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">
            Teams Management
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Manage company teams and their designated team managers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadTeams}
            title="Refresh teams"
            className="p-2.5 rounded-lg border border-border bg-surface text-text-secondary hover:bg-neutral-100 transition"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>

          {canCreateTeam && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="
                flex items-center gap-2
                rounded-lg
                bg-primary-500
                px-4 py-2.5
                text-sm font-medium
                text-white
                transition
                hover:bg-primary-600
              "
            >

              <Plus size={18} />
              Create Team
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="text"
            placeholder="Search teams by name, description, or manager..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="
              h-11
              w-full
              rounded-lg
              border
              border-border
              bg-surface
              pl-11
              pr-4
              text-sm
              outline-none
              transition
              focus:border-primary-500
              focus:ring-2
              focus:ring-primary-100
            "
          />
        </div>
      </div>

      {/* Teams Card Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, idx) => (
            <div
              key={idx}
              className="flex flex-col justify-between rounded-xl border border-border bg-surface p-5 shadow-xs animate-pulse space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-neutral-200" />
                  <div className="space-y-1.5">
                    <div className="h-4 w-32 rounded bg-neutral-200" />
                  </div>
                </div>
                <div className="h-5 w-16 rounded-full bg-neutral-200" />
              </div>

              <div className="space-y-2">
                <div className="h-3.5 w-full rounded bg-neutral-200" />
                <div className="h-3.5 w-2/3 rounded bg-neutral-200" />
              </div>

              <div className="rounded-lg border border-border-light bg-neutral-50/60 p-3 space-y-2">
                <div className="h-2.5 w-14 rounded bg-neutral-200" />
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-full bg-neutral-200" />
                  <div className="space-y-1 flex-1">
                    <div className="h-3.5 w-28 rounded bg-neutral-200" />
                    <div className="h-3 w-36 rounded bg-neutral-200" />
                  </div>
                </div>
              </div>

              <div className="h-4 w-24 rounded bg-neutral-200" />

              <div className="pt-3 border-t border-border-light flex items-center justify-between">
                <div className="h-3.5 w-20 rounded bg-neutral-200" />
                <div className="h-7 w-24 rounded-lg bg-neutral-200" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredTeams.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface p-12 text-center shadow-xs">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-text-muted">
            <Shield size={24} />
          </div>
          <h3 className="text-base font-semibold text-text-primary">
            No teams found
          </h3>
          <p className="mt-1 max-w-sm text-sm text-text-secondary">
            {searchTerm
              ? "No teams matched your search criteria."
              : "Create your first team to get started."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeams.map((team) => {
            const managerName = team.manager
              ? `${team.manager.firstName} ${team.manager.lastName || ""}`.trim()
              : "Unassigned";
            const createdDateStr = new Date(team.createdAt).toLocaleDateString(
              undefined,
              { year: "numeric", month: "short", day: "numeric" }
            );
            const memberCount = team.memberCount ?? 0;

            return (
              <div
                key={team.id}
                className="flex flex-col justify-between rounded-xl border border-border bg-surface p-5 shadow-xs transition-all duration-200 hover:border-primary-200 hover:shadow-md group"
              >
                <div>
                  {/* HEADER */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-700 font-semibold shadow-2xs">
                        <Shield size={20} />
                      </div>
                      <h3 className="text-base font-semibold text-text-primary truncate" title={team.name}>
                        {team.name}
                      </h3>
                    </div>

                    <span
                      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                        team.isActive
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                          : "bg-neutral-100 text-neutral-600 border-neutral-200/60"
                      }`}
                    >
                      {team.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {/* DESCRIPTION */}
                  <div className="mb-4 text-sm text-text-secondary line-clamp-2 min-h-[2.5rem]">
                    {team.description ? (
                      team.description
                    ) : (
                      <span className="text-text-muted italic">No description</span>
                    )}
                  </div>

                  {/* MANAGER SECTION */}
                  <div className="mb-4 rounded-lg border border-border-light bg-neutral-50/70 p-3 transition group-hover:bg-neutral-50">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-1.5">
                      Manager
                    </p>
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-700 text-xs font-semibold">
                        {team.manager ? (
                          `${team.manager.firstName[0]}${(team.manager.lastName || "")[0] || ""}`.toUpperCase()
                        ) : (
                          <UserCheck size={14} />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-text-primary truncate">
                          {managerName}
                        </p>
                        {team.manager?.email ? (
                          <p className="text-xs text-text-muted truncate">
                            {team.manager.email}
                          </p>
                        ) : (
                          <p className="text-xs text-text-muted italic truncate">
                            No email available
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* TEAM STATS */}
                  <div className="flex items-center gap-2 text-sm font-medium text-text-secondary mb-4">
                    <Users size={16} className="text-text-muted" />
                    <span>
                      {memberCount} {memberCount === 1 ? "Member" : "Members"}
                    </span>
                  </div>
                </div>

                {/* FOOTER */}
                <div className="pt-3 border-t border-border-light flex items-center justify-between text-xs text-text-muted">
                  <span>{createdDateStr}</span>
                  <button
                    onClick={() => navigate(`/teams/${team.id}`)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-primary-200 bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-700 hover:bg-primary-100 transition shadow-2xs group-hover:border-primary-300"
                  >
                    View Team →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Team Modal */}
      {isCreateModalOpen && (
        <CreateTeamModal
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
    </div>
  );
};

export default TeamsPage;
