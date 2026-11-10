import React from "react";
import { RotateCcw } from "lucide-react";
import type { AdmissionsFilterParams } from "../../../services/admissionsDashboardService";

interface AdmissionsFilterBarProps {
  filters: AdmissionsFilterParams & { datePreset?: string };
  meta?: {
    colleges: Array<{ id: string; name: string }>;
    courses: string[];
    teams: Array<{ id: number; name: string }>;
    employees: Array<{ id: string; name: string }>;
    sources: string[];
    statuses: Array<{ id: number; name: string; code: string }>;
  };
  onChange: (updated: Partial<AdmissionsFilterParams & { datePreset?: string }>) => void;
  onReset: () => void;
}

export const AdmissionsFilterBar: React.FC<AdmissionsFilterBarProps> = ({
  filters,
  meta,
  onChange,
  onReset,
}) => {
  const handleDatePresetChange = (preset: string) => {
    const now = new Date();
    let startDate: string | undefined = undefined;
    let endDate: string | undefined = undefined;

    if (preset === "TODAY") {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      startDate = today.toISOString();
    } else if (preset === "YESTERDAY") {
      const yest = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      const yestEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59);
      startDate = yest.toISOString();
      endDate = yestEnd.toISOString();
    } else if (preset === "THIS_WEEK") {
      const firstDay = new Date(now.setDate(now.getDate() - now.getDay()));
      startDate = firstDay.toISOString();
    } else if (preset === "THIS_MONTH") {
      const firstMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      startDate = firstMonth.toISOString();
    } else if (preset === "LAST_MONTH") {
      const firstLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      startDate = firstLastMonth.toISOString();
      endDate = lastLastMonth.toISOString();
    } else if (preset === "LAST_3_MONTHS") {
      const last3 = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      startDate = last3.toISOString();
    } else if (preset === "THIS_YEAR") {
      const startYr = new Date(now.getFullYear(), 0, 1);
      startDate = startYr.toISOString();
    }

    onChange({ datePreset: preset, startDate, endDate });
  };

  const hasActiveFilters = Boolean(
    (filters.datePreset && filters.datePreset !== "ALL") ||
    filters.collegeId ||
    filters.course ||
    filters.teamId ||
    filters.employeeId ||
    filters.source ||
    filters.statusId
  );

  return (
    <div className="space-y-2.5 sm:space-y-3">
      {hasActiveFilters && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-rose-600 hover:text-rose-700 transition cursor-pointer"
          >
            <RotateCcw size={12} />
            <span>Reset Filters</span>
          </button>
        </div>
      )}

      {/* Responsive Filter Grid: 2 columns on mobile, adapts naturally on larger viewports */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-7 gap-2 sm:gap-3">
        {/* Row 1: Date Range | College */}
        <div className="col-span-1 min-w-0">
          <select
            value={filters.datePreset || "ALL"}
            onChange={(e) => handleDatePresetChange(e.target.value)}
            className="w-full h-9 sm:h-10 rounded-lg sm:rounded-xl border border-border bg-surface px-2.5 sm:px-3 text-xs font-medium text-text-primary focus:outline-none focus:border-primary-500 truncate"
          >
            <option value="ALL">All Time</option>
            <option value="TODAY">Today</option>
            <option value="YESTERDAY">Yesterday</option>
            <option value="THIS_WEEK">This Week</option>
            <option value="THIS_MONTH">This Month</option>
            <option value="LAST_MONTH">Last Month</option>
            <option value="LAST_3_MONTHS">Last 3 Months</option>
            <option value="THIS_YEAR">This Year</option>
          </select>
        </div>

        <div className="col-span-1 min-w-0">
          <select
            value={filters.collegeId || ""}
            onChange={(e) => onChange({ collegeId: e.target.value || undefined })}
            className="w-full h-9 sm:h-10 rounded-lg sm:rounded-xl border border-border bg-surface px-2.5 sm:px-3 text-xs font-medium text-text-primary focus:outline-none focus:border-primary-500 truncate"
          >
            <option value="">All Colleges</option>
            {meta?.colleges.map((col) => (
              <option key={col.id} value={col.id}>
                {col.name}
              </option>
            ))}
          </select>
        </div>

        {/* Row 2: Course | Team */}
        <div className="col-span-1 min-w-0">
          <select
            value={filters.course || ""}
            onChange={(e) => onChange({ course: e.target.value || undefined })}
            className="w-full h-9 sm:h-10 rounded-lg sm:rounded-xl border border-border bg-surface px-2.5 sm:px-3 text-xs font-medium text-text-primary focus:outline-none focus:border-primary-500 truncate"
          >
            <option value="">All Courses</option>
            {meta?.courses.map((crs) => (
              <option key={crs} value={crs}>
                {crs}
              </option>
            ))}
          </select>
        </div>

        <div className="col-span-1 min-w-0">
          <select
            value={filters.teamId || ""}
            onChange={(e) => onChange({ teamId: e.target.value || undefined })}
            className="w-full h-9 sm:h-10 rounded-lg sm:rounded-xl border border-border bg-surface px-2.5 sm:px-3 text-xs font-medium text-text-primary focus:outline-none focus:border-primary-500 truncate"
          >
            <option value="">All Teams</option>
            {meta?.teams.map((tm) => (
              <option key={tm.id} value={tm.id}>
                {tm.name}
              </option>
            ))}
          </select>
        </div>

        {/* Row 3: Counselor | Lead Source */}
        <div className="col-span-1 min-w-0">
          <select
            value={filters.employeeId || ""}
            onChange={(e) => onChange({ employeeId: e.target.value || undefined })}
            className="w-full h-9 sm:h-10 rounded-lg sm:rounded-xl border border-border bg-surface px-2.5 sm:px-3 text-xs font-medium text-text-primary focus:outline-none focus:border-primary-500 truncate"
          >
            <option value="">All Counselors</option>
            {meta?.employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name}
              </option>
            ))}
          </select>
        </div>

        <div className="col-span-1 min-w-0">
          <select
            value={filters.source || ""}
            onChange={(e) => onChange({ source: e.target.value || undefined })}
            className="w-full h-9 sm:h-10 rounded-lg sm:rounded-xl border border-border bg-surface px-2.5 sm:px-3 text-xs font-medium text-text-primary focus:outline-none focus:border-primary-500 truncate"
          >
            <option value="">All Sources</option>
            {meta?.sources.map((src) => (
              <option key={src} value={src}>
                {src.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>

        {/* Next: Status */}
        <div className="col-span-1 min-w-0">
          <select
            value={filters.statusId || ""}
            onChange={(e) => onChange({ statusId: e.target.value || undefined })}
            className="w-full h-9 sm:h-10 rounded-lg sm:rounded-xl border border-border bg-surface px-2.5 sm:px-3 text-xs font-medium text-text-primary focus:outline-none focus:border-primary-500 truncate"
          >
            <option value="">All Statuses</option>
            {meta?.statuses.map((st) => (
              <option key={st.id} value={st.id}>
                {st.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
