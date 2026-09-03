import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
  CartesianGrid,
} from "recharts";
import type { AdvisorDashboardData } from "../../../../services/advisorDashboardService";

type AdvisorChartsSectionProps = {
  data: AdvisorDashboardData;
};

const AdvisorChartsSection = ({ data }: AdvisorChartsSectionProps) => {
  const { pipelineBreakdown, pitchOutcomes, tpcBreakdown, monthlyTrend } = data;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl border border-border bg-surface p-3 shadow-lg text-xs space-y-1">
          <p className="font-bold text-text-primary">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="font-semibold">
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Lead Stage Funnel Bar Chart */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-2xs space-y-4">
        <div>
          <h3 className="text-base font-bold text-text-primary">
            My Lead Pipeline Stages
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            Distribution of my active leads across status stages
          </p>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={pipelineBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "#6B7280" }}
                interval={0}
                angle={-20}
                textAnchor="end"
              />
              <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="My Leads" radius={[6, 6, 0, 0]}>
                {pipelineBreakdown.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color || (index % 2 === 0 ? "#3B82F6" : "#8B5CF6")}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Monthly Intake vs Admissions Area Chart */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-2xs space-y-4">
        <div>
          <h3 className="text-base font-bold text-text-primary">
            Monthly Performance Trend
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            6-month trend of lead intake vs confirmed admissions
          </p>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorAdmissions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6B7280" }} />
              <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
              <Area
                type="monotone"
                dataKey="leads"
                name="Leads Created"
                stroke="#3B82F6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorLeads)"
              />
              <Area
                type="monotone"
                dataKey="admissions"
                name="Admissions Confirmed"
                stroke="#10B981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorAdmissions)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. College Pitch Approvals Donut Chart */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-2xs space-y-4">
        <div>
          <h3 className="text-base font-bold text-text-primary">
            College Approval Status
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            Manager review status for my application colleges
          </p>
        </div>

        <div className="h-64 w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pitchOutcomes}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={4}
                dataKey="count"
                nameKey="status"
              >
                {pitchOutcomes.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. TPC Task Resolution Donut Chart */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-2xs space-y-4">
        <div>
          <h3 className="text-base font-bold text-text-primary">
            TPC Call Task Resolution
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            Completion breakdown of third-party call logs
          </p>
        </div>

        <div className="h-64 w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={tpcBreakdown}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={4}
                dataKey="count"
                nameKey="status"
              >
                {tpcBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AdvisorChartsSection;
