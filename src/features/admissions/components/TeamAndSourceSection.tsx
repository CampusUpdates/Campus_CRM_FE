import React from "react";
import { Layers } from "lucide-react";
import type { AdmissionsDashboardData } from "../../../services/admissionsDashboardService";

interface TeamAndSourceSectionProps {
  teamPerformance: AdmissionsDashboardData["teamPerformance"];
  sourceConversion?: AdmissionsDashboardData["sourceConversion"];
  loading?: boolean;
}

export const TeamAndSourceSection: React.FC<TeamAndSourceSectionProps> = ({
  teamPerformance = [],
  loading,
}) => {
  if (loading) {
    return (
      <div className="h-64 rounded-xl border border-border bg-surface p-5 animate-pulse" />
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-500/10 text-amber-500">
            <Layers size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary">Team Performance</h3>
            <p className="text-[11px] text-text-muted">Admissions and conversion metrics by team</p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[500px] text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-background/50 text-xs font-semibold text-text-muted">
              <th className="px-3 py-2.5">Team</th>
              <th className="px-3 py-2.5">Manager</th>
              <th className="px-3 py-2.5 text-right">Members</th>
              <th className="px-3 py-2.5 text-right">Leads</th>
              <th className="px-3 py-2.5 text-right">Admissions</th>
              <th className="px-3 py-2.5 text-right">Conv %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {teamPerformance.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-xs text-text-muted">
                  No team performance data found.
                </td>
              </tr>
            ) : (
              teamPerformance.map((team) => (
                <tr key={team.teamId} className="hover:bg-surface-hover/50 transition">
                  <td className="px-3 py-2.5 font-medium text-text-primary text-xs">
                    {team.teamName}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-text-secondary">
                    {team.managerName}
                  </td>
                  <td className="px-3 py-2.5 text-right text-xs text-text-muted">
                    {team.memberCount}
                  </td>
                  <td className="px-3 py-2.5 text-right text-xs font-medium text-text-primary">
                    {team.leadsHandled}
                  </td>
                  <td className="px-3 py-2.5 text-right text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {team.admissions}
                  </td>
                  <td className="px-3 py-2.5 text-right text-xs font-bold text-primary-500">
                    {team.conversionRate}%
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
