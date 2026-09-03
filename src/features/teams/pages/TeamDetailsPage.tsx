import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Shield,
  PhoneCall,
  RefreshCw,
  AlertCircle,
  Search,
  BarChart2,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { useAuth } from "../../../context/AuthContext";
import {
  fetchTeamById,
  fetchTeamMembers,
  type TeamItem,
  type EligibleMember,
} from "../../../services/teamService";
import {
  fetchManagerDashboardStats,
  type ManagerDashboardData,
} from "../../../services/managerDashboardService";
import ActivityList from "../../dashboard/components/ActivityList";
import { ROUTES } from "../../../app/router/routes";

const TeamDetailsPage = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const { accessToken } = useAuth();

  const [activeTab, setActiveTab] = useState<"overview" | "members" | "leads" | "tpcs" | "activity">("overview");

  const [team, setTeam] = useState<TeamItem | null>(null);
  const [members, setMembers] = useState<EligibleMember[]>([]);
  const [dashboardData, setDashboardData] = useState<ManagerDashboardData | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search member term for Members tab
  const [memberSearchTerm, setMemberSearchTerm] = useState("");

  const loadTeamData = useCallback(async () => {
    if (!accessToken || !teamId) return;
    setLoading(true);
    setError(null);
    try {
      const [teamRes, membersRes, dashRes] = await Promise.all([
        fetchTeamById(accessToken, teamId),
        fetchTeamMembers(accessToken, teamId),
        fetchManagerDashboardStats(accessToken, { teamId }).catch(() => null),
      ]);
      setTeam(teamRes);
      setMembers(membersRes);
      setDashboardData(dashRes);
    } catch (err: unknown) {
      console.error("Failed to load team workspace details:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unable to load team details.");
      }
    } finally {
      setLoading(false);
    }
  }, [accessToken, teamId]);

  useEffect(() => {
    loadTeamData();
  }, [loadTeamData]);

  if (loading && !team) {
    return (
      <div className="space-y-6 animate-pulse p-6">
        <div className="h-10 w-48 bg-neutral-200 rounded-lg"></div>
        <div className="h-32 w-full bg-neutral-200 rounded-xl"></div>
        <div className="h-64 w-full bg-neutral-200 rounded-xl"></div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="flex flex-col items-center justify-center p-12 rounded-xl border border-rose-200 bg-rose-50 text-center">
        <AlertCircle size={36} className="text-rose-600 mb-3" />
        <h3 className="text-base font-semibold text-rose-900">Team Workspace Error</h3>
        <p className="text-xs text-rose-700 mt-1 max-w-md">{error || "Team not found or access forbidden."}</p>
        <button
          onClick={() => navigate(ROUTES.TEAMS)}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-xs font-medium text-white hover:bg-rose-700 transition"
        >
          <ArrowLeft size={14} />
          Back to Teams
        </button>
      </div>
    );
  }

  const managerName = team.manager
    ? `${team.manager.firstName} ${team.manager.lastName || ""}`.trim()
    : "Unassigned";

  const filteredMembers = members.filter((m) => {
    const fullName = `${m.firstName} ${m.lastName || ""}`.toLowerCase();
    const email = m.email.toLowerCase();
    const term = memberSearchTerm.toLowerCase().trim();
    return fullName.includes(term) || email.includes(term);
  });

  const leadPipeline = dashboardData?.leadPipeline || [];
  const memberPerf = dashboardData?.memberPerformance || [];
  const tpcOverview = dashboardData?.tpcOverview;
  const recentActivity = dashboardData?.recentActivity || [];

  const tpcPieData = [
    { name: "Pending", value: tpcOverview?.byStatus.PENDING || 0, color: "#6366F1" },
    { name: "Completed", value: tpcOverview?.byStatus.COMPLETED || 0, color: "#10B981" },
    { name: "No Reply", value: tpcOverview?.byStatus.NO_REPLY || 0, color: "#F59E0B" },
    { name: "Not Interested", value: tpcOverview?.byStatus.NOT_INTERESTED || 0, color: "#EF4444" },
    { name: "Cancelled", value: tpcOverview?.byStatus.CANCELLED || 0, color: "#9CA3AF" },
  ].filter((i) => i.value > 0);

  return (
    <div className="space-y-6">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(ROUTES.TEAMS)}
          className="inline-flex items-center gap-2 text-xs font-medium text-text-secondary hover:text-text-primary transition"
        >
          <ArrowLeft size={16} />
          Back to Teams
        </button>
        <button
          onClick={loadTeamData}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-semibold text-text-secondary hover:bg-neutral-50 transition shadow-2xs disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin text-primary-600" : ""} />
          Refresh
        </button>
      </div>

      {/* Team Header Banner */}
      <div className="rounded-xl border border-border bg-surface p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-primary-700 font-bold text-lg shrink-0">
            <Shield size={24} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-text-primary">{team.name}</h1>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  team.isActive ? "bg-emerald-100 text-emerald-700" : "bg-neutral-100 text-neutral-600"
                }`}
              >
                {team.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            {team.description && (
              <p className="mt-1 text-xs text-text-secondary max-w-xl">{team.description}</p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-text-muted">
              <span>
                Manager: <strong className="text-text-primary">{managerName}</strong> ({team.manager?.email})
              </span>
              <span>•</span>
              <span>
                Created: <strong className="text-text-primary">{new Date(team.createdAt).toLocaleDateString()}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Quick KPI Badges */}
        <div className="flex items-center gap-3 shrink-0 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6">
          <div className="text-center px-3">
            <p className="text-xs text-text-muted uppercase font-semibold">Members</p>
            <p className="text-xl font-bold text-text-primary mt-0.5">{team.memberCount ?? members.length}</p>
          </div>
          <div className="text-center px-3 border-l border-border">
            <p className="text-xs text-text-muted uppercase font-semibold">Leads</p>
            <p className="text-xl font-bold text-primary-700 mt-0.5">
              {dashboardData?.overview.totalLeads ?? 0}
            </p>
          </div>
          <div className="text-center px-3 border-l border-border">
            <p className="text-xs text-text-muted uppercase font-semibold">TPCs</p>
            <p className="text-xl font-bold text-purple-700 mt-0.5">
              {dashboardData?.overview.totalTpcs ?? 0}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="border-b border-border flex items-center gap-6 text-xs font-semibold">
        {(["overview", "members", "leads", "tpcs", "activity"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 capitalize transition border-b-2 ${
              activeTab === tab
                ? "border-primary-500 text-primary-700 font-bold"
                : "border-transparent text-text-secondary hover:text-text-primary"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}

      {/* 1. OVERVIEW TAB */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Lead Pipeline Bar Chart */}
            <div className="lg:col-span-2 rounded-xl border border-border bg-surface p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-sm font-bold text-text-primary">Team Lead Pipeline</h3>
                <BarChart2 size={16} className="text-primary-600" />
              </div>
              {leadPipeline.length > 0 ? (
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={leadPipeline} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(val: any) => [`${val} Leads`, "Count"]} />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {leadPipeline.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color || "#6366F1"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-xs text-text-muted text-center py-12">No lead pipeline metrics found.</p>
              )}
            </div>

            {/* TPC Status Pie Chart */}
            <div className="lg:col-span-1 rounded-xl border border-border bg-surface p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-sm font-bold text-text-primary">TPC Status Distribution</h3>
                <PhoneCall size={16} className="text-purple-600" />
              </div>
              {tpcPieData.length > 0 ? (
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={tpcPieData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} dataKey="value">
                        {tpcPieData.map((e, idx) => (
                          <Cell key={`tpc-${idx}`} fill={e.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val: any) => [`${val} Calls`, "Count"]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-xs text-text-muted text-center py-12">No TPC calls assigned yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. MEMBERS TAB */}
      {activeTab === "members" && (
        <div className="rounded-xl border border-border bg-surface shadow-2xs space-y-4 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
            <div>
              <h3 className="text-sm font-bold text-text-primary">Team Members ({members.length})</h3>
              <p className="text-xs text-text-secondary mt-0.5">Active users currently assigned to this team.</p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search member name or email..."
                value={memberSearchTerm}
                onChange={(e) => setMemberSearchTerm(e.target.value)}
                className="w-full h-9 rounded-lg border border-border bg-surface pl-9 pr-3 text-xs outline-none focus:border-primary-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-neutral-50/80 text-text-secondary font-semibold uppercase tracking-wider">
                  <th className="px-4 py-3">Member Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-text-muted">
                      No members match your search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((m) => (
                    <tr key={m.id} className="hover:bg-neutral-50/50 transition">
                      <td className="px-4 py-3.5 font-semibold text-text-primary">
                        {m.firstName} {m.lastName || ""}
                      </td>
                      <td className="px-4 py-3.5 text-text-secondary">{m.email}</td>
                      <td className="px-4 py-3.5 text-text-muted">{(m as any).phone || "N/A"}</td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex rounded-full bg-purple-50 px-2.5 py-0.5 text-[11px] font-medium text-purple-700">
                          {(m as any).role?.name || "Member"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. LEADS TAB */}
      {activeTab === "leads" && (
        <div className="rounded-xl border border-border bg-surface p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3 className="text-sm font-bold text-text-primary">Assigned Member Leads</h3>
              <p className="text-xs text-text-secondary mt-0.5">Leads assigned to members of {team.name}.</p>
            </div>
            <Link
              to={ROUTES.LEADS}
              className="text-xs font-semibold text-primary-600 hover:underline"
            >
              Open Full Leads Page →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-neutral-50/80 text-text-secondary font-semibold uppercase tracking-wider">
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">Assigned Leads</th>
                  <th className="px-4 py-3">Contacted Leads</th>
                  <th className="px-4 py-3">Conversions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {memberPerf.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-text-muted">
                      No lead assignments found for this team.
                    </td>
                  </tr>
                ) : (
                  memberPerf.map((mp) => (
                    <tr key={mp.id} className="hover:bg-neutral-50/50 transition">
                      <td className="px-4 py-3.5 font-semibold text-text-primary">{mp.firstName} {mp.lastName || ""}</td>
                      <td className="px-4 py-3.5 font-bold text-text-primary">{mp.assignedLeadsCount}</td>
                      <td className="px-4 py-3.5 font-medium text-emerald-700">{mp.contactedLeadsCount}</td>
                      <td className="px-4 py-3.5 font-bold text-primary-700">{mp.convertedLeadsCount}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. TPCS TAB */}
      {activeTab === "tpcs" && (
        <div className="rounded-xl border border-border bg-surface p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3 className="text-sm font-bold text-text-primary">Team TPC Overview</h3>
              <p className="text-xs text-text-secondary mt-0.5">Telephonic pitch call assignments by member.</p>
            </div>
            <Link
              to={ROUTES.TPC}
              className="text-xs font-semibold text-purple-600 hover:underline"
            >
              Open Full TPC Page →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {memberPerf.map((mp) => (
              <div key={mp.id} className="p-4 rounded-lg border border-border bg-neutral-50/50 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-text-primary">{mp.firstName} {mp.lastName || ""}</p>
                  <p className="text-[11px] text-text-muted mt-0.5">{mp.email}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-purple-700 block">{mp.tpcsCount} TPCs</span>
                  <span className="text-[11px] text-text-muted">Assigned</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. ACTIVITY TAB */}
      {activeTab === "activity" && (
        <div className="space-y-4">
          <ActivityList
            title={`Recent Activity - ${team.name}`}
            subtitle="Activity logs and logged interactions for team members"
            items={recentActivity}
            onRefresh={loadTeamData}
            isLoading={loading}
          />
        </div>
      )}
    </div>
  );
};

export default TeamDetailsPage;
