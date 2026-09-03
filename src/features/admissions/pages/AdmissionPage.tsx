import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import { fetchAdmissionsDashboard } from "../../../services/admissionsDashboardService";
import type {
  AdmissionsDashboardData,
  AdmissionsFilterParams,
  RecentAdmissionRecord,
} from "../../../services/admissionsDashboardService";
import { AdmissionsHeader } from "../components/AdmissionsHeader";
import { AdmissionsFilterBar } from "../components/AdmissionsFilterBar";
import { AdmissionsKpiCards } from "../components/AdmissionsKpiCards";
import { AdmissionTrendAndCollegeChart } from "../components/AdmissionTrendAndCollegeChart";
import { EmployeePerformanceTable } from "../components/EmployeePerformanceTable";
import { TeamAndSourceSection } from "../components/TeamAndSourceSection";
import { AdmissionFunnelChart } from "../components/AdmissionFunnelChart";
import { GeographicAndStatusSection } from "../components/GeographicAndStatusSection";
import { RecentAdmissionsTable } from "../components/RecentAdmissionsTable";
import { AdmissionDetailsDrawer } from "../components/AdmissionDetailsDrawer";
import { AlertCircle, RefreshCw } from "lucide-react";

const AdmissionPage = () => {
  const { accessToken } = useAuth();
  const toast = useToast();

  const [filters, setFilters] = useState<AdmissionsFilterParams & { datePreset?: string }>({
    datePreset: "ALL",
    page: 1,
    limit: 10,
  });

  const [data, setData] = useState<AdmissionsDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedAdmission, setSelectedAdmission] = useState<RecentAdmissionRecord | null>(null);

  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    if (!accessToken) return;

    const controller = new AbortController();

    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchAdmissionsDashboard(
          accessToken,
          filters,
          controller.signal
        );
        setData(res);
      } catch (err: any) {
        if (err.name === "AbortError" || controller.signal.aborted) {
          return;
        }
        console.error("Failed to load admissions dashboard stats:", err);
        const msg = err.message || "Failed to load admissions metrics";
        setError(msg);
        toast.showToast(msg, "error");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      controller.abort();
    };
  }, [
    accessToken,
    reloadTick,
    filters.datePreset,
    filters.startDate,
    filters.endDate,
    filters.collegeId,
    filters.course,
    filters.teamId,
    filters.employeeId,
    filters.source,
    filters.statusId,
    filters.page,
  ]);

  const handleRetry = () => {
    setReloadTick((prev) => prev + 1);
  };

  const handleFilterChange = (updated: Partial<AdmissionsFilterParams & { datePreset?: string }>) => {
    setFilters((prev) => ({
      ...prev,
      ...updated,
      page: updated.page !== undefined ? updated.page : 1,
    }));
  };

  const handleFilterReset = () => {
    setFilters({
      datePreset: "ALL",
      page: 1,
      limit: 10,
    });
  };

  // Export CSV Helper
  const handleExport = (type: "ALL" | "COLLEGES" | "EMPLOYEES" | "TEAMS" | "FUNNEL") => {
    if (!data) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    let filename = `Admissions_${type}_Report_${new Date().toISOString().slice(0, 10)}.csv`;

    if (type === "ALL") {
      csvContent += "COLLEGE ADMISSIONS SUMMARY & RECENT RECORDS\n";
      csvContent += "Metric,Value\n";
      csvContent += `Total Admissions,${data.kpis.totalAdmissions}\n`;
      csvContent += `Admissions This Month,${data.kpis.admissionsThisMonth}\n`;
      csvContent += `Total Leads,${data.kpis.totalLeads}\n`;
      csvContent += `Overall Conversion Rate,${data.kpis.overallConversionRate}%\n\n`;

      csvContent += "RECENT ADMISSIONS ROSTER\n";
      csvContent += "Student Name,Phone,Email,College,Course,Counselor,Team,Admission Date,Status\n";
      data.recentAdmissions.data.forEach((row) => {
        csvContent += `"${row.studentName}","${row.phone}","${row.email}","${row.collegeName}","${row.coursePitched}","${row.counselorName}","${row.teamName}","${row.admissionDate}","${row.statusName}"\n`;
      });
    } else if (type === "COLLEGES") {
      csvContent += "COLLEGE ADMISSIONS PERFORMANCE REPORT\n";
      csvContent += "College Name,Applications Pitched,Confirmed Admissions,Conversion Rate (%)\n";
      data.collegeDistribution.forEach((row) => {
        csvContent += `"${row.collegeName}",${row.applications},${row.admissions},${row.conversionRate}%\n`;
      });
    } else if (type === "EMPLOYEES") {
      csvContent += "COUNSELOR & EMPLOYEE ADMISSION PERFORMANCE LEADERBOARD\n";
      csvContent += "Counselor Name,Team,Leads Handled,Confirmed Admissions,Conversion Rate (%)\n";
      data.employeePerformance.forEach((row) => {
        csvContent += `"${row.employeeName}","${row.teamName}",${row.leadsHandled},${row.admissions},${row.conversionRate}%\n`;
      });
    } else if (type === "TEAMS") {
      csvContent += "TEAM ADMISSIONS PERFORMANCE REPORT\n";
      csvContent += "Team Name,Manager Name,Member Count,Leads Handled,Confirmed Admissions,Conversion Rate (%)\n";
      data.teamPerformance.forEach((row) => {
        csvContent += `"${row.teamName}","${row.managerName}",${row.memberCount},${row.leadsHandled},${row.admissions},${row.conversionRate}%\n`;
      });
    } else if (type === "FUNNEL") {
      csvContent += "ADMISSION PIPELINE FUNNEL STAGE REPORT\n";
      csvContent += "Stage Order,Stage Code,Stage Name,Leads Count,Conversion From Prev (%)\n";
      data.admissionFunnel.forEach((row) => {
        csvContent += `${row.displayOrder},"${row.code}","${row.stageName}",${row.count},${row.conversionFromPrevious}%\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.showToast(`Exported ${type.replace("_", " ")} report to CSV successfully!`, "success");
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden space-y-6 pb-12">
      {/* 1. Header */}
      <AdmissionsHeader onExport={handleExport} loading={loading} />

      {/* 2. Global Filters Bar */}
      <AdmissionsFilterBar
        filters={filters}
        meta={data?.filtersMeta}
        onChange={handleFilterChange}
        onReset={handleFilterReset}
      />

      {/* Error Banner */}
      {error && (
        <div className="flex items-center justify-between rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-600 dark:text-red-400">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={handleRetry}
            className="flex items-center gap-1 text-xs font-bold underline hover:text-red-500 cursor-pointer"
          >
            <RefreshCw size={12} /> Retry
          </button>
        </div>
      )}

      {/* 3. KPI Cards */}
      <AdmissionsKpiCards
        kpis={
          data?.kpis || {
            totalAdmissions: 0,
            admissionsThisMonth: 0,
            totalLeads: 0,
            overallConversionRate: 0,
            topCounselor: null,
            topConverter: null,
          }
        }
        employeePerformance={data?.employeePerformance}
        loading={loading}
      />

      {/* 4. Admission Trend + College Distribution */}
      <AdmissionTrendAndCollegeChart
        trend={data?.admissionTrend || []}
        collegeDist={data?.collegeDistribution || []}
        loading={loading}
      />

      {/* 5. Employee Performance Table */}
      <EmployeePerformanceTable
        data={data?.employeePerformance || []}
        loading={loading}
      />

      {/* 6. Team Performance + Source Conversion */}
      <TeamAndSourceSection
        teamPerformance={data?.teamPerformance || []}
        sourceConversion={data?.sourceConversion || []}
        loading={loading}
      />

      {/* 7. Admission Funnel */}
      <AdmissionFunnelChart
        funnel={data?.admissionFunnel || []}
        onExportFunnel={() => handleExport("FUNNEL")}
        loading={loading}
      />

      {/* 8. Geographic Distribution + Admission Status */}
      <GeographicAndStatusSection
        geographicDist={data?.geographicDistribution || []}
        statusDist={data?.statusDistribution || []}
        loading={loading}
      />

      {/* 9. Recent Admissions Table (Paginated) */}
      <RecentAdmissionsTable
        data={data?.recentAdmissions.data || []}
        total={data?.recentAdmissions.total || 0}
        page={data?.recentAdmissions.page || 1}
        totalPages={data?.recentAdmissions.totalPages || 1}
        onPageChange={(newPage) => handleFilterChange({ page: newPage })}
        onSelectAdmission={(record) => setSelectedAdmission(record)}
        loading={loading}
      />

      {/* 10. Admission Details Slide-over Drawer */}
      <AdmissionDetailsDrawer
        admission={selectedAdmission}
        onClose={() => setSelectedAdmission(null)}
      />
    </div>
  );
};

export default AdmissionPage;