import React from "react";
import { UserCheck, ChevronLeft, ChevronRight, Eye, GraduationCap } from "lucide-react";
import type { RecentAdmissionRecord } from "../../../services/admissionsDashboardService";
import { SectionLoadingState, PageEmptyState } from "../../../components/common";

interface RecentAdmissionsTableProps {
  data: RecentAdmissionRecord[];
  total: number;
  page: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  onSelectAdmission: (record: RecentAdmissionRecord) => void;
  loading?: boolean;
}

export const RecentAdmissionsTable: React.FC<RecentAdmissionsTableProps> = ({
  data = [],
  total = 0,
  page = 1,
  totalPages = 1,
  onPageChange,
  onSelectAdmission,
  loading,
}) => {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-500">
            <UserCheck size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary">Recent Admissions</h3>
            <p className="text-[11px] text-text-muted">Confirmed admissions roster with student & college details</p>
          </div>
        </div>

        <div className="text-xs font-medium text-text-muted">
          Showing <span className="text-text-primary font-bold">{data.length}</span> of{" "}
          <span className="text-text-primary font-bold">{total}</span> records
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-background/50 text-xs font-semibold text-text-muted">
              <th className="px-4 py-3">Student Name</th>
              <th className="px-4 py-3">College</th>
              <th className="px-4 py-3">Course</th>
              <th className="px-4 py-3">Counselor</th>
              <th className="px-4 py-3">Team</th>
              <th className="px-4 py-3">Admission Date</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {loading ? (
              <SectionLoadingState
                isTableRow
                colSpan={8}
                message="Loading recent admissions..."
                description="Retrieving confirmed student rosters and enrollment records"
              />
            ) : data.length === 0 ? (
              <PageEmptyState
                isTableRow
                colSpan={8}
                icon={GraduationCap}
                title="No recent admission records found"
                description="No admissions match your selected date or college filters."
              />
            ) : (
              data.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => onSelectAdmission(row)}
                  className="hover:bg-surface-hover/60 transition cursor-pointer group"
                >
                  <td className="px-4 py-3 font-semibold text-text-primary text-xs">
                    <div>{row.studentName}</div>
                    <div className="text-[10px] text-text-muted font-normal">{row.phone}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-text-secondary font-medium">
                    {row.collegeName}
                  </td>
                  <td className="px-4 py-3 text-xs text-text-muted">
                    {row.coursePitched}
                  </td>
                  <td className="px-4 py-3 text-xs text-text-primary">
                    {row.counselorName}
                  </td>
                  <td className="px-4 py-3 text-xs text-text-muted">
                    {row.teamName}
                  </td>
                  <td className="px-4 py-3 text-xs text-text-muted whitespace-nowrap">
                    {new Date(row.admissionDate).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      {row.statusName}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectAdmission(row);
                      }}
                      className="inline-flex items-center gap-1 text-xs text-primary-500 hover:text-primary-600 font-medium group-hover:underline"
                    >
                      <Eye size={14} /> View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border pt-3">
          <div className="text-xs text-text-muted">
            Page <span className="font-semibold text-text-primary">{page}</span> of{" "}
            <span className="font-semibold text-text-primary">{totalPages}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-primary hover:bg-surface-hover transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft size={14} /> Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-primary hover:bg-surface-hover transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
