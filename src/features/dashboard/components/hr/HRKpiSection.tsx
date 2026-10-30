import { Briefcase, CalendarCheck, CheckCircle2, UserCheck, Users } from "lucide-react";
import type { HRKpiStats } from "../../../../services/hrDashboardService";

type HRKpiSectionProps = {
  kpis: HRKpiStats;
};

const HRKpiSection = ({ kpis }: HRKpiSectionProps) => {
  return (
    <section className="grid grid-cols-1 gap-3.5 sm:gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
      {/* Total Employees */}
      <div className="rounded-xl border border-border bg-surface p-4 sm:p-5 shadow-sm transition hover:shadow-md min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-normal sm:tracking-wider text-text-muted truncate">
            Workforce
          </span>
          <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 shrink-0">
            <UserCheck size={16} />
          </div>
        </div>
        <div className="mt-2.5 sm:mt-3">
          <h3 className="text-xl sm:text-2xl font-semibold sm:font-bold text-text-primary">
            {kpis.totalEmployees}
          </h3>
          <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-text-secondary">
            Active Employee Accounts
          </p>
        </div>
      </div>

      {/* Open Positions */}
      <div className="rounded-xl border border-border bg-surface p-4 sm:p-5 shadow-sm transition hover:shadow-md min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-normal sm:tracking-wider text-text-muted truncate">
            Job Openings
          </span>
          <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-600 shrink-0">
            <Briefcase size={16} />
          </div>
        </div>
        <div className="mt-2.5 sm:mt-3">
          <h3 className="text-xl sm:text-2xl font-semibold sm:font-bold text-text-primary">
            {kpis.openPositions}
          </h3>
          <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-text-secondary">
            {kpis.totalVacancies} Open Vacancies
          </p>
        </div>
      </div>

      {/* Total Candidates */}
      <div className="rounded-xl border border-border bg-surface p-4 sm:p-5 shadow-sm transition hover:shadow-md min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-normal sm:tracking-wider text-text-muted truncate">
            Candidates
          </span>
          <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
            <Users size={16} />
          </div>
        </div>
        <div className="mt-2.5 sm:mt-3">
          <h3 className="text-xl sm:text-2xl font-semibold sm:font-bold text-text-primary">
            {kpis.totalCandidates}
          </h3>
          <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-text-secondary">
            Total Applicant Profiles
          </p>
        </div>
      </div>

      {/* Scheduled Interviews */}
      <div className="rounded-xl border border-border bg-surface p-4 sm:p-5 shadow-sm transition hover:shadow-md min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-normal sm:tracking-wider text-text-muted truncate">
            Interviews
          </span>
          <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600 shrink-0">
            <CalendarCheck size={16} />
          </div>
        </div>
        <div className="mt-2.5 sm:mt-3">
          <h3 className="text-xl sm:text-2xl font-semibold sm:font-bold text-text-primary">
            {kpis.scheduledInterviews}
          </h3>
          <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-text-secondary">
            Upcoming Scheduled Rounds
          </p>
        </div>
      </div>

      {/* Hiring Success Rate */}
      <div className="rounded-xl border border-border bg-surface p-4 sm:p-5 shadow-sm transition hover:shadow-md min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-normal sm:tracking-wider text-text-muted truncate">
            Hiring Rate
          </span>
          <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
            <CheckCircle2 size={16} />
          </div>
        </div>
        <div className="mt-2.5 sm:mt-3">
          <h3 className="text-xl sm:text-2xl font-semibold sm:font-bold text-emerald-600">
            {kpis.hiringRate}%
          </h3>
          <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-text-secondary">
            {kpis.hiredCount} Candidates Hired
          </p>
        </div>
      </div>
    </section>
  );
};

export default HRKpiSection;
