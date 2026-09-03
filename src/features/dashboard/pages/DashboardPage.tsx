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

const DashboardPage = () => {
  const navigate = useNavigate();
  const { accessToken, user } = useAuth();

  const roleCode = (user?.roleCode || "").toUpperCase();

  const [hrData, setHrData] = useState<HRDashboardData | null>(null);
  const [advisorData, setAdvisorData] = useState<AdvisorDashboardData | null>(null);
  const [loading, setLoading] = useState(false);

  const loadHRStats = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchHRDashboardStats(accessToken || undefined);
      setHrData(data);
    } catch (err) {
      console.error("Failed to load HR dashboard stats:", err);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  const loadAdvisorStats = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAdvisorDashboardStats(accessToken || undefined);
      setAdvisorData(data);
    } catch (err) {
      console.error("Failed to load Program Advisor stats:", err);
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
      loadAdvisorStats();
    }
  }, [roleCode, accessToken, loadHRStats, loadAdvisorStats]);

  // 1. SUPER_ADMIN Dashboard
  if (roleCode === "SUPER_ADMIN") {
    return <SuperAdminDashboardView />;
  }

  // 2. MANAGER Dashboard
  if (roleCode === "MANAGER") {
    return <ManagerDashboardView />;
  }

  // 3. HR Dashboard
  if (roleCode === "HR") {
    return (
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">
              HR Analytics & Workforce Dashboard
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              Dynamic HR insights, recruitment pipelines, interview results, and employee statistics.
            </p>
          </div>
          <button
            onClick={loadHRStats}
            title="Refresh HR metrics"
            className="p-2.5 rounded-lg border border-border bg-surface text-text-secondary hover:bg-neutral-100 transition shadow-2xs flex items-center gap-2 text-xs font-semibold"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {loading || !hrData ? (
          <div className="flex items-center justify-center py-16 text-sm text-text-muted">
            <RefreshCw size={18} className="animate-spin mr-2" />
            Loading dynamic HR analytics & visualizations...
          </div>
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

  // 4. PROGRAM_ADVISOR / Default Advisor Dashboard
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Program Advisor Performance Dashboard
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Dynamic personal performance insights, lead pipeline stages, conversion rates, and TPC logs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(ROUTES.CALLS)}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition shadow-xs"
          >
            <PhoneCall size={15} />
            Open Call Workspace
          </button>

          <button
            onClick={loadAdvisorStats}
            title="Refresh advisor dashboard metrics"
            className="p-2.5 rounded-lg border border-border bg-surface text-text-secondary hover:bg-neutral-100 transition shadow-2xs"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {loading || !advisorData ? (
        <div className="flex items-center justify-center py-16 text-sm text-text-muted">
          <RefreshCw size={18} className="animate-spin mr-2" />
          Loading personal Program Advisor insights...
        </div>
      ) : (
        <div className="space-y-8">
          <AdvisorKpiSection kpis={advisorData.kpis} />
          <AdvisorChartsSection data={advisorData} />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2">
              <RecentAdvisorActivity
                leads={advisorData.recentLeads}
                onRefresh={loadAdvisorStats}
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
};

export default DashboardPage;