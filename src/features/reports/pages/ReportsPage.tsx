import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Award,
  BarChart3,
  Briefcase,
  Calendar,
  CheckCircle2,
  Download,
  Filter,
  UserCheck,
  Users,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import {
  fetchHRReport,
  type HRReportData,
  type HRReportFilterParams,
} from "../../../services/hrReportService";

const ReportsPage = () => {
  const { accessToken } = useAuth();
  const toast = useToast();

  const [periodFilter, setPeriodFilter] = useState<string>("ALL");
  const [selectedDept, setSelectedDept] = useState<string>("");

  const [reportData, setReportData] = useState<HRReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const getFilterParams = (): HRReportFilterParams => {
    const params: HRReportFilterParams = {};
    if (selectedDept) {
      params.department = selectedDept;
    }

    const now = new Date();
    if (periodFilter === "30_DAYS") {
      const past30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      params.startDate = past30.toISOString();
    } else if (periodFilter === "90_DAYS") {
      const past90 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      params.startDate = past90.toISOString();
    } else if (periodFilter === "THIS_YEAR") {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      params.startDate = startOfYear.toISOString();
    }

    return params;
  };

  const loadReport = async () => {
    setLoading(true);
    try {
      const data = await fetchHRReport(accessToken || undefined, getFilterParams());
      setReportData(data);
    } catch (err: any) {
      console.error("Failed to load HR report data:", err);
      toast.showToast("Failed to load HR report metrics", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [accessToken, periodFilter, selectedDept]);

  const handleExportCSV = () => {
    if (!reportData) return;

    let csvContent = "data:text/csv;charset=utf-8,";

    // Section 1: Executive Summary
    csvContent += "EXECUTIVE HR SUMMARY METRICS\n";
    csvContent += "Metric,Value\n";
    csvContent += `Total Applications,${reportData.summary.totalApplications}\n`;
    csvContent += `Hired Candidates,${reportData.summary.hiredCount}\n`;
    csvContent += `Selection Rate (%),${reportData.summary.selectionRate}%\n`;
    csvContent += `Active Open Positions,${reportData.summary.activePositions}\n`;
    csvContent += `Total Vacancies,${reportData.summary.totalVacancies}\n`;
    csvContent += `Vacancies Fill Rate (%),${reportData.summary.vacanciesFillRate}%\n`;
    csvContent += `Total Scheduled/Conducted Interviews,${reportData.summary.totalInterviews}\n`;
    csvContent += `Interview Pass Rate (%),${reportData.summary.interviewPassRate}%\n\n`;

    // Section 2: Department Velocity
    csvContent += "DEPARTMENT RECRUITMENT VELOCITY\n";
    csvContent += "Department,Open Positions,Vacancies,Total Applicants,Hired,Fill Rate (%)\n";
    reportData.departmentVelocity.forEach((row) => {
      csvContent += `"${row.department}",${row.openPositions},${row.vacancies},${row.applicants},${row.hired},${row.fillRate}%\n`;
    });
    csvContent += "\n";

    // Section 3: Interviewer Performance
    csvContent += "INTERVIEWER EVALUATION PERFORMANCE LEADERBOARD\n";
    csvContent += "Interviewer Name,Total Conducted,Passed,Failed,On Hold,Pass Rate (%)\n";
    reportData.interviewerPerformance.forEach((row) => {
      csvContent += `"${row.interviewerName}",${row.totalConducted},${row.passedCount},${row.failedCount},${row.holdCount},${row.passRate}%\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `HR_Analytics_Report_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.showToast("HR Report exported to CSV successfully!", "success");
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            HR Analytics & Recruitment Reports
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Comprehensive real-time reports on recruitment velocity, interview performance, and workforce demographics.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCSV}
          disabled={loading || !reportData}
          className="
            flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2.5
            text-sm font-medium text-white transition hover:bg-primary-600
            shadow-sm disabled:opacity-50
          "
        >
          <Download size={18} />
          Export CSV Report
        </button>
      </div>

      {/* Control & Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-surface p-4 shadow-xs">
        <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
          <Filter size={18} className="text-primary-500" />
          <span>Report Filters</span>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Time Period Filter */}
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-text-muted" />
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              className="
                rounded-lg border border-border bg-background px-3 py-1.5
                text-xs font-medium text-text-primary focus:border-primary-500 focus:outline-none
              "
            >
              <option value="ALL">All Time</option>
              <option value="30_DAYS">Last 30 Days</option>
              <option value="90_DAYS">Last 90 Days</option>
              <option value="THIS_YEAR">This Year</option>
            </select>
          </div>

          {/* Department Filter */}
          {reportData?.allDepartments && reportData.allDepartments.length > 0 && (
            <div className="flex items-center gap-2">
              <Briefcase size={16} className="text-text-muted" />
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="
                  rounded-lg border border-border bg-background px-3 py-1.5
                  text-xs font-medium text-text-primary focus:border-primary-500 focus:outline-none
                "
              >
                <option value="">All Departments</option>
                {reportData.allDepartments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {loading || !reportData ? (
        <div className="flex items-center justify-center py-16 text-sm text-text-muted">
          Generating dynamic HR analytics report...
        </div>
      ) : (
        <div className="space-y-8">
          {/* HR Executive KPI Cards */}
          <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {/* Total Applications */}
            <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Total Applications
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <Users size={18} />
                </div>
              </div>
              <div className="mt-3">
                <h3 className="text-2xl font-bold text-text-primary">
                  {reportData.summary.totalApplications}
                </h3>
                <p className="mt-1 text-xs text-text-secondary">
                  {reportData.summary.hiredCount} Candidates Hired
                </p>
              </div>
            </div>

            {/* Selection Rate */}
            <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Selection Rate
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <CheckCircle2 size={18} />
                </div>
              </div>
              <div className="mt-3">
                <h3 className="text-2xl font-bold text-emerald-600">
                  {reportData.summary.selectionRate}%
                </h3>
                <p className="mt-1 text-xs text-text-secondary">
                  {reportData.summary.selectedCount} Candidates Selected
                </p>
              </div>
            </div>

            {/* Vacancies Fill Rate */}
            <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Vacancies Fill Rate
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                  <Briefcase size={18} />
                </div>
              </div>
              <div className="mt-3">
                <h3 className="text-2xl font-bold text-text-primary">
                  {reportData.summary.vacanciesFillRate}%
                </h3>
                <p className="mt-1 text-xs text-text-secondary">
                  {reportData.summary.activePositions} Active Job Roles
                </p>
              </div>
            </div>

            {/* Interview Pass Rate */}
            <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Interview Pass Rate
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <Award size={18} />
                </div>
              </div>
              <div className="mt-3">
                <h3 className="text-2xl font-bold text-amber-600">
                  {reportData.summary.interviewPassRate}%
                </h3>
                <p className="mt-1 text-xs text-text-secondary">
                  {reportData.summary.passedInterviews} / {reportData.summary.totalInterviews} Passed Rounds
                </p>
              </div>
            </div>
          </section>

          {/* Recharts Analytics Charts Section */}
          <section className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Monthly Hiring & Application Trend Area Chart */}
              <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
                <div className="mb-4">
                  <h3 className="text-base font-semibold text-text-primary flex items-center gap-2">
                    <BarChart3 size={18} className="text-primary-500" />
                    Monthly Application & Hiring Trends
                  </h3>
                  <p className="text-xs text-text-secondary">
                    Total candidates vs hired applicants over time
                  </p>
                </div>

                <div className="h-72 w-full">
                  {reportData.monthlyTrends.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-xs text-text-muted">
                      No monthly trend data recorded yet.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={reportData.monthlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                        <defs>
                          <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.0} />
                          </linearGradient>
                          <linearGradient id="colorHired" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6B7280" }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#6B7280" }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#FFFFFF",
                            borderColor: "#E5E7EB",
                            borderRadius: "0.5rem",
                            fontSize: "0.875rem",
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: "0.75rem" }} />
                        <Area
                          type="monotone"
                          dataKey="applications"
                          stroke="#4F46E5"
                          fillOpacity={1}
                          fill="url(#colorApps)"
                          name="Applications"
                        />
                        <Area
                          type="monotone"
                          dataKey="hired"
                          stroke="#10B981"
                          fillOpacity={1}
                          fill="url(#colorHired)"
                          name="Hired"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Department Recruitment Bar Chart */}
              <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
                <div className="mb-4">
                  <h3 className="text-base font-semibold text-text-primary flex items-center gap-2">
                    <Briefcase size={18} className="text-purple-500" />
                    Department Recruitment
                  </h3>
                  <p className="text-xs text-text-secondary">
                    Open vacancies vs candidate applicants by department
                  </p>
                </div>

                <div className="h-72 w-full">
                  {reportData.departmentVelocity.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-xs text-text-muted">
                      No department velocity metrics found.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={reportData.departmentVelocity} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="department" tick={{ fontSize: 11, fill: "#6B7280" }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#6B7280" }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#FFFFFF",
                            borderColor: "#E5E7EB",
                            borderRadius: "0.5rem",
                            fontSize: "0.875rem",
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: "0.75rem" }} />
                        <Bar dataKey="vacancies" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="Vacancies" />
                        <Bar dataKey="applicants" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Applicants" />
                        <Bar dataKey="hired" fill="#10B981" radius={[4, 4, 0, 0]} name="Hired" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>

            {/* Row 2: Interviewer Leaderboard & Stage Funnel */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Interviewer Evaluation Performance Chart */}
              <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
                <div className="mb-4">
                  <h3 className="text-base font-semibold text-text-primary flex items-center gap-2">
                    <UserCheck size={18} className="text-amber-500" />
                    Interviewer Evaluation Performance
                  </h3>
                  <p className="text-xs text-text-secondary">
                    Total conducted rounds and pass/fail evaluation outcomes
                  </p>
                </div>

                <div className="h-72 w-full">
                  {reportData.interviewerPerformance.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-xs text-text-muted">
                      No interviewer evaluation records found.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={reportData.interviewerPerformance}
                        layout="vertical"
                        margin={{ top: 10, right: 20, left: 20, bottom: 10 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#6B7280" }} />
                        <YAxis
                          type="category"
                          dataKey="interviewerName"
                          tick={{ fontSize: 11, fill: "#6B7280" }}
                          width={120}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#FFFFFF",
                            borderColor: "#E5E7EB",
                            borderRadius: "0.5rem",
                            fontSize: "0.875rem",
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: "0.75rem" }} />
                        <Bar dataKey="passedCount" stackId="a" fill="#10B981" name="Passed" />
                        <Bar dataKey="failedCount" stackId="a" fill="#EF4444" name="Failed" />
                        <Bar dataKey="holdCount" stackId="a" fill="#F59E0B" name="On Hold" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Candidate Pipeline Stage Distribution */}
              <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
                <div className="mb-4">
                  <h3 className="text-base font-semibold text-text-primary flex items-center gap-2">
                    <Users size={18} className="text-indigo-500" />
                    Candidate Stage Breakdown
                  </h3>
                  <p className="text-xs text-text-secondary">
                    Total pool distribution across recruitment stages
                  </p>
                </div>

                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData.stageBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="stage" tick={{ fontSize: 10, fill: "#6B7280" }} interval={0} angle={-15} textAnchor="end" />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#6B7280" }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#FFFFFF",
                          borderColor: "#E5E7EB",
                          borderRadius: "0.5rem",
                          fontSize: "0.875rem",
                        }}
                      />
                      <Bar dataKey="count" fill="#6366F1" radius={[4, 4, 0, 0]} name="Candidates" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </section>

          {/* Detailed Report Tables */}
          <section className="space-y-6">
            {/* Department Velocity Breakdown Table */}
            <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-xs">
              <div className="border-b border-border bg-neutral-50 px-6 py-4">
                <h3 className="text-base font-semibold text-text-primary">
                  Department Recruitment Report
                </h3>
                <p className="text-xs text-text-secondary">
                  Detailed vacancies, applicants, and position fill rate per department
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-neutral-50/50">
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-text-secondary">
                        Department
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-text-secondary">
                        Open Positions
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-text-secondary">
                        Total Vacancies
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-text-secondary">
                        Applicants
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-text-secondary">
                        Hired Candidates
                      </th>
                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase text-text-secondary">
                        Fill Rate (%)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.departmentVelocity.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-6 text-center text-xs text-text-muted">
                          No department recruitment data available.
                        </td>
                      </tr>
                    ) : (
                      reportData.departmentVelocity.map((row) => (
                        <tr key={row.department} className="border-b border-border last:border-0 hover:bg-neutral-50/50">
                          <td className="px-5 py-3 text-sm font-semibold text-text-primary">
                            {row.department}
                          </td>
                          <td className="px-5 py-3 text-sm text-text-secondary font-medium">
                            {row.openPositions} Active
                          </td>
                          <td className="px-5 py-3 text-sm text-text-secondary font-medium">
                            {row.vacancies} Seats
                          </td>
                          <td className="px-5 py-3 text-sm text-text-secondary">
                            {row.applicants} Applicants
                          </td>
                          <td className="px-5 py-3 text-sm text-emerald-600 font-semibold">
                            {row.hired} Hired
                          </td>
                          <td className="px-5 py-3 text-right text-sm font-bold text-primary-600">
                            {row.fillRate}%
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Interviewer Evaluation Performance Table */}
            <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-xs">
              <div className="border-b border-border bg-neutral-50 px-6 py-4">
                <h3 className="text-base font-semibold text-text-primary">
                  Interviewer Evaluation Performance Leaderboard
                </h3>
                <p className="text-xs text-text-secondary">
                  Assessment activity, evaluation pass/fail outcomes, and interviewer pass rate
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-neutral-50/50">
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-text-secondary">
                        Interviewer Name
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-text-secondary">
                        Total Conducted
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-text-secondary">
                        Passed
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-text-secondary">
                        Failed
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-text-secondary">
                        On Hold
                      </th>
                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase text-text-secondary">
                        Pass Rate (%)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.interviewerPerformance.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-6 text-center text-xs text-text-muted">
                          No interviewer performance metrics available yet.
                        </td>
                      </tr>
                    ) : (
                      reportData.interviewerPerformance.map((row) => (
                        <tr key={row.interviewerId} className="border-b border-border last:border-0 hover:bg-neutral-50/50">
                          <td className="px-5 py-3 text-sm font-semibold text-text-primary">
                            {row.interviewerName}
                          </td>
                          <td className="px-5 py-3 text-sm text-text-secondary font-medium">
                            {row.totalConducted} Sessions
                          </td>
                          <td className="px-5 py-3 text-sm text-emerald-600 font-semibold">
                            {row.passedCount} Passed
                          </td>
                          <td className="px-5 py-3 text-sm text-rose-600 font-semibold">
                            {row.failedCount} Failed
                          </td>
                          <td className="px-5 py-3 text-sm text-amber-600 font-medium">
                            {row.holdCount} On Hold
                          </td>
                          <td className="px-5 py-3 text-right text-sm font-bold text-emerald-600">
                            {row.passRate}%
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;