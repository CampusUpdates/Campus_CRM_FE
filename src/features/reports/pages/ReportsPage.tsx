import { useEffect, useState } from "react";
import {
  Award,
  BarChart3,
  Briefcase,
  Download,
  Filter,
  UserCheck,
  Users,
  FileText,
  FileSpreadsheet,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import {
  fetchHRReport,
  type HRReportData,
  type HRReportFilterParams,
} from "../../../services/hrReportService";
import { ManagerReportsView } from "../components/ManagerReportsView";

const HRReportsView = () => {
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
    csvContent += "INTERVIEWER EVALUATION PERFORMANCE\n";
    csvContent += "Interviewer Name,Conducted Sessions,Passed Candidates,Failed Candidates,On Hold,Pass Rate (%)\n";
    reportData.interviewerPerformance.forEach((row) => {
      csvContent += `"${row.interviewerName}",${row.totalConducted},${row.passedCount},${row.failedCount},${row.holdCount},${row.passRate}%\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `HR_Recruitment_Analytics_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-xl border border-border bg-surface p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            HR Recruitment & Hiring Analytics
          </h1>
          <p className="mt-1 text-xs text-text-secondary">
            Executive oversight of candidate pipelines, department velocities, and interviewer statistics.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={!reportData || loading}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition shadow-2xs disabled:opacity-50 shrink-0"
        >
          <Download size={16} />
          Export Executive Report (CSV)
        </button>
      </div>

      {/* Global Report Filters */}
      <div className="rounded-xl border border-border bg-surface p-4 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-primary-600" />
          <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
            HR Report Filters
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-text-secondary">Period:</label>
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              className="h-8 rounded-lg border border-border bg-surface px-2.5 text-xs font-medium text-text-primary outline-none focus:border-primary-500"
            >
              <option value="ALL">All Time</option>
              <option value="30_DAYS">Last 30 Days</option>
              <option value="90_DAYS">Last 90 Days</option>
              <option value="THIS_YEAR">This Year</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-text-secondary">Department:</label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="h-8 rounded-lg border border-border bg-surface px-2.5 text-xs font-medium text-text-primary outline-none focus:border-primary-500"
            >
              <option value="">All Departments</option>
              <option value="Engineering">Engineering</option>
              <option value="Product">Product</option>
              <option value="Design">Design</option>
              <option value="Marketing">Marketing</option>
              <option value="Sales">Sales</option>
              <option value="Operations">Operations</option>
              <option value="Human Resources">Human Resources</option>
            </select>
          </div>
        </div>
      </div>

      {loading && !reportData ? (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 rounded-xl bg-neutral-200" />
            ))}
          </div>
          <div className="h-64 rounded-xl bg-neutral-200" />
        </div>
      ) : !reportData ? (
        <div className="p-8 text-center text-xs text-text-muted">No report data available.</div>
      ) : (
        <div className="space-y-6">
          {/* Executive Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-border bg-surface p-5 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Total Applications
                </span>
                <Users size={18} className="text-indigo-600" />
              </div>
              <p className="text-2xl font-bold text-text-primary">{reportData.summary.totalApplications}</p>
              <p className="text-xs text-text-muted">Received candidate profiles</p>
            </div>

            <div className="rounded-xl border border-border bg-surface p-5 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Hired Candidates
                </span>
                <UserCheck size={18} className="text-emerald-600" />
              </div>
              <p className="text-2xl font-bold text-emerald-700">{reportData.summary.hiredCount}</p>
              <p className="text-xs text-emerald-800 font-medium">
                Selection Rate: <strong>{reportData.summary.selectionRate}%</strong>
              </p>
            </div>

            <div className="rounded-xl border border-border bg-surface p-5 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Vacancies Fill Rate
                </span>
                <Briefcase size={18} className="text-amber-600" />
              </div>
              <p className="text-2xl font-bold text-amber-700">{reportData.summary.vacanciesFillRate}%</p>
              <p className="text-xs text-text-muted">
                {reportData.summary.activePositions} positions ({reportData.summary.totalVacancies} total vacancies)
              </p>
            </div>

            <div className="rounded-xl border border-border bg-surface p-5 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Interview Pass Rate
                </span>
                <Award size={18} className="text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-purple-700">{reportData.summary.interviewPassRate}%</p>
              <p className="text-xs text-text-muted">
                Over {reportData.summary.totalInterviews} scheduled sessions
              </p>
            </div>
          </div>

          {/* Department Velocity & Interviewer Performance */}
          <section className="rounded-xl border border-border bg-surface p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-bold text-text-primary">Department Recruitment Velocity</h3>
              <BarChart3 size={16} className="text-primary-600" />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-neutral-50/80 text-text-secondary font-semibold uppercase">
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Open Positions</th>
                    <th className="px-4 py-3">Vacancies</th>
                    <th className="px-4 py-3">Applicants</th>
                    <th className="px-4 py-3">Hired</th>
                    <th className="px-4 py-3 text-right">Fill Rate (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {reportData.departmentVelocity.map((row, i) => (
                    <tr key={i} className="hover:bg-neutral-50/50">
                      <td className="px-4 py-3 font-semibold text-text-primary">{row.department}</td>
                      <td className="px-4 py-3 text-text-secondary">{row.openPositions}</td>
                      <td className="px-4 py-3 text-text-secondary">{row.vacancies}</td>
                      <td className="px-4 py-3 text-indigo-600 font-medium">{row.applicants}</td>
                      <td className="px-4 py-3 text-emerald-600 font-semibold">{row.hired}</td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-700">{row.fillRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

const ReportsPage = () => {
  const { hasRole } = useAuth();
  const isHRRole = hasRole(["HR"]);
  const isManagerOrAdmin = hasRole(["SUPER_ADMIN", "MANAGER", "PROGRAM_ADVISOR"]);

  const [activeReportType, setActiveReportType] = useState<"manager" | "hr">(
    isManagerOrAdmin || !isHRRole ? "manager" : "hr"
  );

  return (
    <div className="space-y-6">
      {/* Top Report Switcher (Only visible if user has multiple roles/access) */}
      {(isHRRole && isManagerOrAdmin) && (
        <div className="flex items-center gap-3 border-b border-border pb-3">
          <button
            onClick={() => setActiveReportType("manager")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
              activeReportType === "manager"
                ? "bg-primary-500 text-white shadow-2xs"
                : "border border-border bg-surface text-text-secondary hover:bg-neutral-50"
            }`}
          >
            <FileSpreadsheet size={16} />
            Manager Reports
          </button>

          <button
            onClick={() => setActiveReportType("hr")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
              activeReportType === "hr"
                ? "bg-primary-500 text-white shadow-2xs"
                : "border border-border bg-surface text-text-secondary hover:bg-neutral-50"
            }`}
          >
            <FileText size={16} />
            HR Recruitment Reports
          </button>
        </div>
      )}

      {/* Render Active View */}
      {activeReportType === "manager" ? <ManagerReportsView /> : <HRReportsView />}
    </div>
  );
};

export default ReportsPage;