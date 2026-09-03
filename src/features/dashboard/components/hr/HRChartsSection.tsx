import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import type {
  CandidatePipelineStage,
  DepartmentStat,
  InterviewResultStat,
  WorkforceRoleStat,
} from "../../../../services/hrDashboardService";

type HRChartsSectionProps = {
  candidatePipeline: CandidatePipelineStage[];
  departmentStats: DepartmentStat[];
  interviewResults: InterviewResultStat[];
  workforceRoles: WorkforceRoleStat[];
};

const PIE_COLORS = ["#10B981", "#6366F1", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

const HRChartsSection = ({
  candidatePipeline,
  departmentStats,
  interviewResults,
  workforceRoles,
}: HRChartsSectionProps) => {
  return (
    <section className="space-y-6">
      {/* Top Row: Pipeline & Department breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Candidate Recruitment Pipeline */}
        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-text-primary">
              Recruitment Pipeline Funnel
            </h3>
            <p className="text-xs text-text-secondary">
              Candidate distribution across application stages
            </p>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={candidatePipeline} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#6B7280" }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#6B7280" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    borderColor: "#E5E7EB",
                    borderRadius: "0.5rem",
                    fontSize: "0.875rem",
                    boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                  }}
                />
                <Bar dataKey="count" fill="#4F46E5" radius={[4, 4, 0, 0]} name="Candidates" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Openings vs Applications */}
        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-text-primary">
              Department Openings & Applicants
            </h3>
            <p className="text-xs text-text-secondary">
              Comparing open vacancies vs total applications by department
            </p>
          </div>

          <div className="h-72 w-full">
            {departmentStats.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-text-muted">
                No department data available. Post a job position to get started.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentStats} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="department" tick={{ fontSize: 11, fill: "#6B7280" }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#6B7280" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      borderColor: "#E5E7EB",
                      borderRadius: "0.5rem",
                      fontSize: "0.875rem",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "0.75rem", paddingTop: "0.5rem" }} />
                  <Bar dataKey="vacancies" fill="#F59E0B" radius={[4, 4, 0, 0]} name="Vacancies" />
                  <Bar dataKey="applicants" fill="#06B6D4" radius={[4, 4, 0, 0]} name="Applicants" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row: Interview Outcomes & Workforce Distribution */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Interview Outcomes Distribution */}
        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-text-primary">
              Interview Outcomes & Results
            </h3>
            <p className="text-xs text-text-secondary">
              Passed, pending, and failed interview evaluation rounds
            </p>
          </div>

          <div className="h-72 w-full flex items-center justify-center">
            {interviewResults.every((item) => item.count === 0) ? (
              <div className="text-xs text-text-muted">
                No interview sessions recorded yet. Schedule an interview to see analytics.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={interviewResults}
                    dataKey="count"
                    nameKey="result"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={4}
                    label={({ name, percent }: { name?: string; percent?: number }) =>
                      percent && percent > 0 ? `${name}: ${(percent * 100).toFixed(0)}%` : ""
                    }
                  >
                    {interviewResults.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: "0.75rem" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Workforce Role Distribution */}
        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-text-primary">
              Workforce Role Breakdown
            </h3>
            <p className="text-xs text-text-secondary">
              Distribution of active employee accounts across organizational roles
            </p>
          </div>

          <div className="h-72 w-full">
            {workforceRoles.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-text-muted">
                No role distribution data found.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={workforceRoles}
                  layout="vertical"
                  margin={{ top: 10, right: 20, left: 20, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#6B7280" }} />
                  <YAxis
                    type="category"
                    dataKey="role"
                    tick={{ fontSize: 11, fill: "#6B7280" }}
                    width={110}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      borderColor: "#E5E7EB",
                      borderRadius: "0.5rem",
                      fontSize: "0.875rem",
                    }}
                  />
                  <Bar dataKey="count" fill="#10B981" radius={[0, 4, 4, 0]} name="Employees" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HRChartsSection;
