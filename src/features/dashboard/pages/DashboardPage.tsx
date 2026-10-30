import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw, PhoneCall } from "lucide-react";
import { ROUTES } from "../../../app/router/routes";
import { useAuth } from "../../../context/AuthContext";
import {
  fetchHRDashboardStats,
  type HRDashboardData,
} from "../../../services/hrDashboardService";
import {
  fetchAdvisorDashboardStats,
  type AdvisorDashboardData,
  type AdvisorDateFilter,
} from "../../../services/advisorDashboardService";
import HRChartsSection from "../components/hr/HRChartsSection";
import HRKpiSection from "../components/hr/HRKpiSection";
import RecentHRActivity from "../components/hr/RecentHRActivity";
import AdvisorKpiSection from "../components/advisor/AdvisorKpiSection";
import AdvisorChartsSection from "../components/advisor/AdvisorChartsSection";
import RecentAdvisorActivity from "../components/advisor/RecentAdvisorActivity";
import TodayTodosSection from "../components/TodayTodosSection";
import ManagerDashboardView from "../components/manager/ManagerDashboardView";
import SuperAdminDashboardView from "../components/superadmin/SuperAdminDashboardView";
import DateRangeFilter from "../components/advisor/DateRangeFilter";
import { PageLoadingState, PageErrorState } from "../../../components/common";

const DashboardPage = () => {
  const navigate = useNavigate();
  const { accessToken, user } = useAuth();

  const roleCode = (user?.roleCode || "").toUpperCase();

  const [hrData, setHrData] = useState<HRDashboardData | null>(null);
  const [advisorData, setAdvisorData] = useState<AdvisorDashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Date filter state — default to "today"
  const [advisorFilter, setAdvisorFilter] = useState<AdvisorDateFilter>({ period: "today" });

  const loadHRStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchHRDashboardStats(accessToken || undefined);
      setHrData(data);
    } catch (err: any) {
      console.error("Failed to load HR dashboard stats:", err);
      setError(err.message || "Failed to load HR dashboard statistics.");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  const loadAdvisorStats = useCallback(async (filter?: AdvisorDateFilter) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdvisorDashboardStats(accessToken || undefined, filter);
      setAdvisorData(data);
    } catch (err: any) {
      console.error("Failed to load Program Advisor stats:", err);
      setError(err.message || "Failed to load Program Advisor statistics.");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (roleCode === "HR") {
      loadHRStats();
    } else if (
      roleCode === "PROGRAM_ADVISOR" ||
      roleCode === "ADVISOR" ||
      roleCode.includes("SALES")
    ) {
      loadAdvisorStats(advisorFilter);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleCode, accessToken, loadHRStats, loadAdvisorStats]);

  // Re-fetch when the filter changes (only for advisor role)
  const handleAdvisorFilterChange = useCallback(
    (newFilter: AdvisorDateFilter) => {
      setAdvisorFilter(newFilter);
      loadAdvisorStats(newFilter);
    },
    [loadAdvisorStats],
  );

  // 1. SUPER_ADMIN Dashboard
  if (roleCode === "SUPER_ADMIN") {
    return <SuperAdminDashboardView />;
  }

  // 2. MANAGER Dashboard
  if (roleCode === "MANAGER") {
    return <ManagerDashboardView />;
  }

  // 3. TEAM_LEAD Dashboard
  if (roleCode === "TEAM_LEAD" || roleCode === "TEAMLEAD" || roleCode.includes("LEAD")) {
    return <ManagerDashboardView isTeamLeadView={true} />;
  }

  // 4. HR Dashboard
  if (roleCode === "HR") {
    return (
      <div className="space-y-8">
        <div className="border-b border-border pb-4 sm:pb-5">
          <div>
            <div className="flex items-center justify-between gap-3">
              <h1 className="text-lg sm:text-2xl font-semibold sm:font-bold text-text-primary">
                Dashboard
              </h1>
              <button
                onClick={loadHRStats}
                disabled={loading}
                title="Refresh dashboard data"
                aria-label="Refresh dashboard data"
                className="inline-flex items-center justify-center p-1.5 sm:p-2 rounded-lg border border-border bg-surface text-text-secondary hover:bg-neutral-100 dark:hover:bg-slate-800 transition shadow-2xs disabled:opacity-50 shrink-0 cursor-pointer"
              >
                <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              </button>
            </div>
            <p className="mt-1 text-[11px] sm:text-sm text-text-secondary leading-relaxed sm:leading-normal">
              HR analytics, workforce metrics, recruitment pipelines, and employee statistics.
            </p>
          </div>
        </div>

        {loading || !hrData ? (
          error ? (
            <PageErrorState
              title="Unable to load HR dashboard"
              message={error}
              onRetry={loadHRStats}
              minHeight="min-h-[380px]"
            />
          ) : (
            <PageLoadingState
              message="Loading HR analytics & visualizations..."
              description="Aggregating workforce metrics, candidate pipelines, and employee statistics"
              minHeight="min-h-[380px]"
            />
          )
        ) : (
          <div className="space-y-8">
            <HRKpiSection kpis={hrData.kpis} />
            <HRChartsSection
              candidatePipeline={hrData.candidatePipeline}
              departmentStats={hrData.departmentStats}
              interviewResults={hrData.interviewResults}
              workforceRoles={hrData.workforceRoles}
            />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              <div className="lg:col-span-2">
                <RecentHRActivity
                  recentCandidates={hrData.recentCandidates}
                  upcomingInterviews={hrData.upcomingInterviews}
                />
              </div>
              <div className="lg:col-span-1">
                <TodayTodosSection />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 5. PROGRAM_ADVISOR Dashboard
  if (
    roleCode === "PROGRAM_ADVISOR" ||
    roleCode === "ADVISOR" ||
    roleCode.includes("ADVISOR") ||
    roleCode.includes("SALES")
  ) {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="border-b border-border pb-4 sm:pb-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            {/* Title & Description */}
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-semibold sm:font-bold text-text-primary">
                Dashboard
              </h1>
              <p className="mt-1 text-[11px] sm:text-sm text-text-secondary leading-relaxed sm:leading-normal">
                Personal performance insights, lead pipeline stages, conversion rates, and call logs.
              </p>
            </div>

            {/* Action Controls: Open Call Workspace, Date Filter, Refresh */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {/* Desktop: Open Call Workspace */}
              <button
                onClick={() => navigate(ROUTES.CALLS)}
                className="hidden sm:flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3.5 h-9 text-xs font-semibold text-white hover:bg-emerald-700 transition shadow-xs cursor-pointer shrink-0"
              >
                <PhoneCall size={15} />
                Open Call Workspace
              </button>

              {/* Date range filter */}
              <DateRangeFilter
                filter={advisorFilter}
                onChange={handleAdvisorFilterChange}
                disabled={loading}
              />

              {/* Refresh button */}
              <button
                onClick={() => loadAdvisorStats(advisorFilter)}
                disabled={loading}
                title="Refresh dashboard data"
                aria-label="Refresh dashboard data"
                className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-border bg-surface text-text-secondary hover:bg-neutral-100 dark:hover:bg-slate-800 transition shadow-2xs disabled:opacity-50 shrink-0 cursor-pointer"
              >
                <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              </button>
            </div>
          </div>

          {/* Mobile: Open Call Workspace (full width below controls) */}
          <button
            onClick={() => navigate(ROUTES.CALLS)}
            className="flex sm:hidden items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3.5 h-9 text-xs font-semibold text-white hover:bg-emerald-700 transition shadow-xs w-full cursor-pointer mt-2.5"
          >
            <PhoneCall size={15} />
            Open Call Workspace
          </button>
        </div>

        {loading || !advisorData ? (
          error ? (
            <PageErrorState
              title="Unable to load Advisor insights"
              message={error}
              onRetry={() => loadAdvisorStats(advisorFilter)}
              minHeight="min-h-[380px]"
            />
          ) : (
            <PageLoadingState
              message="Loading personal Program Advisor insights..."
              description="Fetching lead allocations, conversions, call stats, and pending follow-ups"
              minHeight="min-h-[380px]"
            />
          )
        ) : (
          <div className="space-y-8">
            <AdvisorKpiSection kpis={advisorData.kpis} filter={advisorFilter} />
            <AdvisorChartsSection data={advisorData} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              <div className="lg:col-span-2">
                <RecentAdvisorActivity
                  leads={advisorData.recentLeads}
                  onRefresh={() => loadAdvisorStats(advisorFilter)}
                />
              </div>
              <div className="lg:col-span-1">
                <TodayTodosSection />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Safe Fallback: Default to Team Lead / Manager view for unclassified organizational roles
  return <ManagerDashboardView isTeamLeadView={true} />;
};

export default DashboardPage;