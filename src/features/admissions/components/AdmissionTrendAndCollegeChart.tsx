import React from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { TrendingUp, Building2 } from "lucide-react";
import type { AdmissionsDashboardData } from "../../../services/admissionsDashboardService";

interface AdmissionTrendAndCollegeChartProps {
  trend: AdmissionsDashboardData["admissionTrend"];
  collegeDist: AdmissionsDashboardData["collegeDistribution"];
  loading?: boolean;
}

export const AdmissionTrendAndCollegeChart: React.FC<AdmissionTrendAndCollegeChartProps> = ({
  trend = [],
  collegeDist = [],
  loading,
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-80 rounded-xl border border-border bg-surface p-5 animate-pulse" />
        <div className="h-80 rounded-xl border border-border bg-surface p-5 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Chart 1: Admission Trend */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-xs space-y-4 min-w-0">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-500">
              <TrendingUp size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary">Admission Trend</h3>
              <p className="text-[11px] text-text-muted">Monthly lead intake vs confirmed admissions</p>
            </div>
          </div>
        </div>

        <div className="h-64 w-full min-w-0">
          {trend.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-text-muted">
              No trend data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="trendLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="trendAdmissions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#888888" />
                <YAxis tick={{ fontSize: 11 }} stroke="#888888" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    borderColor: "#334155",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="leads" name="Total Leads" stroke="#3B82F6" fillOpacity={1} fill="url(#trendLeads)" />
                <Area type="monotone" dataKey="admissions" name="Admissions" stroke="#10B981" fillOpacity={1} fill="url(#trendAdmissions)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Chart 2: Admissions by College */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-xs space-y-4 min-w-0">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-500/10 text-blue-500">
              <Building2 size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary">Admissions by College</h3>
              <p className="text-[11px] text-text-muted">Applications vs confirmed admissions per college</p>
            </div>
          </div>
        </div>

        <div className="h-64 w-full min-w-0">
          {collegeDist.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-text-muted">
              No college admissions data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={collegeDist} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="#888888" />
                <YAxis dataKey="collegeName" type="category" width={100} tick={{ fontSize: 11 }} stroke="#888888" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    borderColor: "#334155",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="applications" name="Pitched Applications" fill="#6366F1" radius={[0, 4, 4, 0]} barSize={12} />
                <Bar dataKey="admissions" name="Admissions Done" fill="#10B981" radius={[0, 4, 4, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};
