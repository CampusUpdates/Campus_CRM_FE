import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, RefreshCw, Shield, UserCheck, CheckCircle2 } from "lucide-react";
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

      {/* Teams Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center p-12 text-sm text-text-secondary">
            <RefreshCw className="animate-spin mr-2" size={18} />
            Loading company teams...
          </div>
        ) : filteredTeams.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mb-3 text-text-muted">
              <Shield size={24} />
            </div>
            <h3 className="text-base font-semibold text-text-primary">
              No teams found
            </h3>
            <p className="text-sm text-text-secondary mt-1 max-w-sm">
              {searchTerm
                ? "No teams matched your search criteria."
                : "Create your first team to get started."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-neutral-50/80">
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    Team Name
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    Description
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    Manager
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    Members
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    Status
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    Created Date
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
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
                    <tr
                      key={team.id}
                      className="border-b border-border last:border-0 hover:bg-neutral-50/50 transition"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-100 text-primary-700 font-semibold text-xs shrink-0">
                            <Shield size={18} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-text-primary">
                              {team.name}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm text-text-secondary max-w-xs truncate">
                        {team.description || <span className="text-text-muted italic">No description</span>}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-100 text-purple-700 text-xs font-medium shrink-0">
                            <UserCheck size={14} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-text-primary">
                              {managerName}
                            </p>
                            {team.manager && (
                              <p className="text-xs text-text-muted">
                                {team.manager.email}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm text-text-secondary font-medium">
                        {memberCount} {memberCount === 1 ? "Member" : "Members"}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            team.isActive
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-neutral-100 text-neutral-600"
                          }`}
                        >
                          {team.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm text-text-secondary">
                        {createdDateStr}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => navigate(`/teams/${team.id}`)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-primary-200 bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-700 hover:bg-primary-100 transition shadow-2xs"
                        >
                          View Team →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>


        )}
      </div>

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
