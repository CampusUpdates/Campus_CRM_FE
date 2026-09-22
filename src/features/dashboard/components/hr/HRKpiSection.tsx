import { Briefcase, CalendarCheck, CheckCircle2, UserCheck, Users } from "lucide-react";
import type { HRKpiStats } from "../../../../services/hrDashboardService";

type HRKpiSectionProps = {
  kpis: HRKpiStats;
};

const HRKpiSection = ({ kpis }: HRKpiSectionProps) => {
  return (
    <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
      {/* Total Employees */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm transition hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            Workforce
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <UserCheck size={18} />
          </div>
        </div>
        <div className="mt-3">
          <h3 className="text-2xl font-bold text-text-primary">
            {kpis.totalEmployees}
          </h3>
          <p className="mt-1 text-xs text-text-secondary">
            Active Employee Accounts
          </p>
        </div>
      </div>

      {/* Open Positions */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm transition hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            Job Openings
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
            <Briefcase size={18} />
          </div>
        </div>
        <div className="mt-3">
          <h3 className="text-2xl font-bold text-text-primary">
            {kpis.openPositions}
          </h3>
          <p className="mt-1 text-xs text-text-secondary">
            {kpis.totalVacancies} Open Vacancies
          </p>
        </div>
      </div>

      {/* Total Candidates */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm transition hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            Candidates
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <Users size={18} />
          </div>
        </div>
        <div className="mt-3">
          <h3 className="text-2xl font-bold text-text-primary">
            {kpis.totalCandidates}
          </h3>
          <p className="mt-1 text-xs text-text-secondary">
            Total Applicant Profiles
          </p>
        </div>
      </div>

      {/* Scheduled Interviews */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm transition hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            Interviews
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <CalendarCheck size={18} />
          </div>
        </div>
        <div className="mt-3">
          <h3 className="text-2xl font-bold text-text-primary">
            {kpis.scheduledInterviews}
          </h3>
          <p className="mt-1 text-xs text-text-secondary">
            Upcoming Scheduled Rounds
          </p>
        </div>
      </div>

      {/* Hiring Success Rate */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm transition hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            Hiring Rate
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={18} />
          </div>
        </div>
        <div className="mt-3">
          <h3 className="text-2xl font-bold text-emerald-600">
            {kpis.hiringRate}%
          </h3>
          <p className="mt-1 text-xs text-text-secondary">
            {kpis.hiredCount} Candidates Hired
          </p>
        </div>
      </div>
    </section>
  );
};

export default HRKpiSection;
