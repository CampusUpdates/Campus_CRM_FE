import React from "react";
import { useNavigate } from "react-router-dom";
import { UserCheck } from "lucide-react";
import { ROUTES } from "../../../app/router/routes";

export interface AdvisorPerformanceRecord {
  userId: string;
  advisorName: string;
  teamName: string;
  teamId?: number | null;
  assignedDataCount: number;
  callsCount: number;
  answeredCallsCount: number;
  notAnsweredCallsCount: number;
}

interface TeamMemberCallPerformanceTableProps {
  data: AdvisorPerformanceRecord[];
  title?: string;
  description?: string;
  badgeLabel?: string;
}

export const TeamMemberCallPerformanceTable: React.FC<TeamMemberCallPerformanceTableProps> = ({
  data,
  title = "Team Member Call Performance",
  description = "Click team member name to inspect user profile context.",
  badgeLabel = "Team Member(s)",
}) => {
  const navigate = useNavigate();

  return (
    <div className="rounded-2xl border border-border bg-surface shadow-2xs overflow-hidden w-full">
      <div className="border-b border-border px-4 py-3.5 sm:px-6 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
        <div className="min-w-0">
          <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
            <UserCheck className="text-emerald-600 shrink-0" size={18} />
            <span className="truncate">{title}</span>
          </h2>
          <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">
            {description}
          </p>
        </div>
        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/80 border border-emerald-200/60 px-3 py-1 rounded-lg shrink-0 self-start sm:self-auto">
          {data.length} {badgeLabel}
        </span>
      </div>

      <div className="overflow-x-auto custom-scrollbar w-full">
        <table className="w-full min-w-[700px] text-left text-xs">
          <thead>
            <tr className="border-b border-border bg-neutral-50/80 dark:bg-slate-800/60 text-text-secondary font-semibold uppercase tracking-wider text-[11px]">
              <th className="px-4 sm:px-6 py-3.5">Advisor</th>
              <th className="px-4 sm:px-6 py-3.5">Team</th>
              <th className="px-4 sm:px-6 py-3.5 text-right">Assigned Data</th>
              <th className="px-4 sm:px-6 py-3.5 text-right">Calls Today</th>
              <th className="px-4 sm:px-6 py-3.5 text-right">Answered Calls</th>
              <th className="px-4 sm:px-6 py-3.5 text-right">Not Answered</th>
              <th className="px-4 sm:px-6 py-3.5 text-center">Calling Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-text-muted">
                  No active team members found.
                </td>
              </tr>
            ) : (
              data.map((adv) => {
                const hasCalls = (adv.callsCount || 0) > 0;
                return (
                  <tr
                    key={adv.userId}
                    className="hover:bg-neutral-50/50 dark:hover:bg-slate-800/40 transition border-b border-border"
                  >
                    <td className="px-4 sm:px-6 py-4 font-semibold text-text-primary">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `${ROUTES.USERS}?search=${encodeURIComponent(adv.advisorName)}`
                          )
                        }
                        className="hover:text-primary-600 hover:underline text-left block truncate max-w-[170px]"
                        title={adv.advisorName}
                      >
                        {adv.advisorName}
                      </button>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-text-secondary font-medium">
                      <span className="block truncate max-w-[140px]" title={adv.teamName}>
                        {adv.teamName}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-right font-semibold text-text-primary">
                      {adv.assignedDataCount}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-right font-semibold text-text-primary">
                      {adv.callsCount}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-right font-semibold text-text-primary">
                      {adv.answeredCallsCount || 0}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-right font-semibold text-text-primary">
                      {adv.notAnsweredCallsCount || 0}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-center">
                      {hasCalls ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/80 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-semibold">
                          Active Calling
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/80 border border-rose-200 px-2.5 py-0.5 text-[11px] font-semibold">
                          0 Calls Logged
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TeamMemberCallPerformanceTable;
