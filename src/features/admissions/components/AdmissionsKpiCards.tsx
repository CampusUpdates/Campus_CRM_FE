import React, { useState, useEffect } from "react";
import { CheckCircle2, Calendar, Award, TrendingUp, Percent, X, Users } from "lucide-react";
import type { AdmissionsDashboardData } from "../../../services/admissionsDashboardService";

interface AdmissionsKpiCardsProps {
  kpis: AdmissionsDashboardData["kpis"];
  employeePerformance?: AdmissionsDashboardData["employeePerformance"];
  loading?: boolean;
}

export const AdmissionsKpiCards: React.FC<AdmissionsKpiCardsProps> = ({
  kpis,
  employeePerformance = [],
  loading,
}) => {
  const [modalType, setModalType] = useState<"TOTAL" | "MONTH" | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setModalType(null);
      }
    };
    if (modalType) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [modalType]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-28 rounded-xl border border-border bg-surface p-5 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
        {/* Card 1: Total Admissions (Clickable) */}
        <div
          onClick={() => setModalType("TOTAL")}
          className="group relative rounded-xl border border-border bg-surface p-5 shadow-xs transition hover:border-primary-500/50 hover:shadow-md cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Total Admissions
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 group-hover:scale-105 transition-transform">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-text-primary tracking-tight">
              {kpis.totalAdmissions.toLocaleString()}
            </div>
            <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              Click to view employee breakdown →
            </p>
          </div>
        </div>

        {/* Card 2: Admissions This Month (Clickable) */}
        <div
          onClick={() => setModalType("MONTH")}
          className="group relative rounded-xl border border-border bg-surface p-5 shadow-xs transition hover:border-primary-500/50 hover:shadow-md cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              This Month
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 group-hover:scale-105 transition-transform">
              <Calendar size={20} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-text-primary tracking-tight">
              {kpis.admissionsThisMonth.toLocaleString()}
            </div>
            <p className="mt-1 text-xs text-blue-600 dark:text-blue-400 font-medium">
              Admissions completed this month
            </p>
          </div>
        </div>

        {/* Card 3: Top Counselor */}
        <div className="relative rounded-xl border border-border bg-surface p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Top Counselor
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <Award size={20} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-lg font-bold text-text-primary truncate">
              {kpis.topCounselor ? kpis.topCounselor.name : "N/A"}
            </div>
            <p className="mt-1 text-xs text-text-secondary">
              {kpis.topCounselor
                ? `${kpis.topCounselor.admissions} Admissions (${kpis.topCounselor.team})`
                : "No admissions data"}
            </p>
          </div>
        </div>

        {/* Card 4: Top Converter */}
        <div className="relative rounded-xl border border-border bg-surface p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Top Converter
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-lg font-bold text-text-primary truncate">
              {kpis.topConverter ? kpis.topConverter.name : "N/A"}
            </div>
            <p className="mt-1 text-xs text-text-secondary">
              {kpis.topConverter
                ? `${kpis.topConverter.conversionRate}% Rate (${kpis.topConverter.team})`
                : "No conversion data"}
            </p>
          </div>
        </div>

        {/* Card 5: Overall Conversion Rate */}
        <div className="relative rounded-xl border border-border bg-surface p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Conversion Rate
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-pink-500/10 text-pink-500">
              <Percent size={20} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-text-primary tracking-tight">
              {kpis.overallConversionRate}%
            </div>
            <p className="mt-1 text-xs text-text-secondary">
              From {kpis.totalLeads.toLocaleString()} Total Leads
            </p>
          </div>
        </div>
      </div>

      {/* Employee Breakdown Right-Side Sliding Drawer */}
      {modalType && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs">
          {/* Backdrop */}
          <div className="absolute inset-0" onClick={() => setModalType(null)} />

          {/* Drawer Panel */}
          <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
            <div className="pointer-events-auto w-screen max-w-md bg-surface border-l border-border shadow-2xl transition-all duration-300 ease-in-out">
              <div className="flex h-full flex-col divide-y divide-border">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 bg-background/50">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500/10 text-primary-500">
                      <Users size={18} />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-text-primary">
                        {modalType === "TOTAL"
                          ? "Employee Admission Breakdown (Total)"
                          : "Employee Admission Breakdown (This Month)"}
                      </h2>
                      <p className="text-xs text-text-muted">
                        Counselor performance & conversion statistics
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="rounded-lg p-1.5 text-text-muted hover:bg-surface-hover hover:text-text-primary transition cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Body - Independently Scrollable Employee List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-3">
                  {employeePerformance.length === 0 ? (
                    <div className="py-12 text-center text-sm text-text-muted">
                      No counselor admissions data available.
                    </div>
                  ) : (
                    employeePerformance.map((emp) => (
                      <div
                        key={emp.employeeId}
                        className="flex items-center justify-between rounded-xl border border-border/60 bg-background/60 p-4 transition hover:border-primary-500/30"
                      >
                        <div className="space-y-0.5">
                          <div className="font-semibold text-text-primary text-sm">
                            {emp.employeeName}
                          </div>
                          <div className="text-xs text-text-muted">
                            Team: {emp.teamName}
                          </div>
                        </div>
                        <div className="text-right space-y-0.5">
                          <div className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                            {emp.admissions} Admissions
                          </div>
                          <div className="text-xs text-text-muted font-medium">
                            {emp.conversionRate}% Conversion
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-background/30 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="rounded-lg bg-surface-hover px-4 py-2 text-xs font-semibold text-text-primary border border-border hover:bg-border transition cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
