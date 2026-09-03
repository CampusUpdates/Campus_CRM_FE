import React, { useState } from "react";
import { Users, Search, ArrowUpDown, ChevronUp, ChevronDown } from "lucide-react";
import type { AdmissionsDashboardData } from "../../../services/admissionsDashboardService";

interface EmployeePerformanceTableProps {
  data: AdmissionsDashboardData["employeePerformance"];
  loading?: boolean;
}

type SortField = "admissions" | "conversionRate" | "leadsHandled";

export const EmployeePerformanceTable: React.FC<EmployeePerformanceTableProps> = ({
  data = [],
  loading,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("admissions");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const filteredData = data.filter((row) =>
    row.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.teamName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedData = [...filteredData].sort((a, b) => {
    const valA = a[sortField];
    const valB = b[sortField];
    return sortDir === "asc" ? valA - valB : valB - valA;
  });

  if (loading) {
    return <div className="h-64 rounded-xl border border-border bg-surface p-5 animate-pulse" />;
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-violet-500/10 text-violet-500">
            <Users size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary">Counselor & Employee Performance</h3>
            <p className="text-[11px] text-text-muted">Admissions conversion performance by counselor</p>
          </div>
        </div>

        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search counselor or team..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-64 rounded-lg border border-border bg-background pl-8 pr-3 py-1.5 text-xs text-text-primary focus:border-primary-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-background/50 text-xs font-semibold text-text-muted">
              <th className="px-4 py-3">Counselor</th>
              <th className="px-4 py-3">Team</th>
              <th
                onClick={() => handleSort("leadsHandled")}
                className="px-4 py-3 text-right cursor-pointer hover:text-text-primary transition"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Leads Handled</span>
                  {sortField === "leadsHandled" ? (
                    sortDir === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                  ) : (
                    <ArrowUpDown size={12} />
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort("admissions")}
                className="px-4 py-3 text-right cursor-pointer hover:text-text-primary transition"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Admissions</span>
                  {sortField === "admissions" ? (
                    sortDir === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                  ) : (
                    <ArrowUpDown size={12} />
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort("conversionRate")}
                className="px-4 py-3 text-right cursor-pointer hover:text-text-primary transition"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Conversion Rate</span>
                  {sortField === "conversionRate" ? (
                    sortDir === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                  ) : (
                    <ArrowUpDown size={12} />
                  )}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {sortedData.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-xs text-text-muted">
                  No counselor performance data found.
                </td>
              </tr>
            ) : (
              sortedData.map((row) => (
                <tr key={row.employeeId} className="hover:bg-surface-hover/50 transition">
                  <td className="px-4 py-3 font-medium text-text-primary text-xs">
                    {row.employeeName}
                  </td>
                  <td className="px-4 py-3 text-xs text-text-secondary">
                    {row.teamName}
                  </td>
                  <td className="px-4 py-3 text-right text-xs font-semibold text-text-primary">
                    {row.leadsHandled}
                  </td>
                  <td className="px-4 py-3 text-right text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {row.admissions}
                  </td>
                  <td className="px-4 py-3 text-right text-xs font-bold text-primary-500">
                    {row.conversionRate}%
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
