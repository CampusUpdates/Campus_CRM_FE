import React from "react";
import { MapPin, PieChart as PieIcon } from "lucide-react";
import type { AdmissionsDashboardData } from "../../../services/admissionsDashboardService";

interface GeographicAndStatusSectionProps {
  geographicDist: AdmissionsDashboardData["geographicDistribution"];
  statusDist: AdmissionsDashboardData["statusDistribution"];
  loading?: boolean;
}

export const GeographicAndStatusSection: React.FC<GeographicAndStatusSectionProps> = ({
  geographicDist = [],
  statusDist = [],
  loading,
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-64 rounded-xl border border-border bg-surface p-5 animate-pulse" />
        <div className="h-64 rounded-xl border border-border bg-surface p-5 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Geographic Distribution */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-500">
              <MapPin size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary">Geographic Distribution</h3>
              <p className="text-[11px] text-text-muted">Admissions & leads breakdown by state</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto max-h-72 pr-1">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-background/50 text-xs font-semibold text-text-muted">
                <th className="px-3 py-2.5">State</th>
                <th className="px-3 py-2.5 text-right">Admissions</th>
                <th className="px-3 py-2.5 text-right">Total Leads</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {geographicDist.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-3 py-6 text-center text-xs text-text-muted">
                    No geographic distribution data found.
                  </td>
                </tr>
              ) : (
                geographicDist.map((geo) => (
                  <tr key={geo.state} className="hover:bg-surface-hover/50 transition">
                    <td className="px-3 py-2.5 font-medium text-text-primary text-xs flex items-center gap-1.5">
                      <MapPin size={12} className="text-emerald-500" />
                      {geo.state}
                    </td>
                    <td className="px-3 py-2.5 text-right text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {geo.admissionsCount}
                    </td>
                    <td className="px-3 py-2.5 text-right text-xs font-semibold text-text-primary">
                      {geo.totalLeads}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Status Distribution */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-purple-500/10 text-purple-500">
              <PieIcon size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary">Admission Status Distribution</h3>
              <p className="text-[11px] text-text-muted">Breakdown of leads by current status</p>
            </div>
          </div>
        </div>

        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
          {statusDist.length === 0 ? (
            <p className="py-8 text-center text-xs text-text-muted">No status distribution data found.</p>
          ) : (
            statusDist.map((st) => (
              <div key={st.statusId} className="rounded-lg border border-border/60 bg-background/50 p-3 space-y-1">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-text-primary font-semibold flex items-center gap-1.5">
                    <span
                      className="h-2.5 w-2.5 rounded-full inline-block"
                      style={{ backgroundColor: st.color || "#A855F7" }}
                    />
                    {st.statusName}
                  </span>
                  <span className="text-text-primary font-bold">
                    {st.count} ({st.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-border/40 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(st.percentage, 100)}%`,
                      backgroundColor: st.color || "#A855F7",
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
