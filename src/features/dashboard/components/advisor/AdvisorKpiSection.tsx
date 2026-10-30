import {
  Users,
  CheckCircle2,
  PhoneCall,
  Clock,
  TrendingUp,
  Building2,
  Headphones,
} from "lucide-react";
import type { AdvisorKPIs, AdvisorDateFilter } from "../../../../services/advisorDashboardService";

type AdvisorKpiSectionProps = {
  kpis: AdvisorKPIs;
  filter?: AdvisorDateFilter;
};

/** Returns a human-readable label for the Calls card based on the active period */
function getCallsCardTitle(filter?: AdvisorDateFilter): string {
  if (!filter) return "Calls Today";
  switch (filter.period) {
    case "today":      return "Calls Today";
    case "this_week":  return "Calls This Week";
    case "this_month": return "Calls This Month";
    case "custom":     return "Calls in Period";
    default:           return "Calls Today";
  }
}

/** Returns a human-readable subtext for the Calls card */
function getCallsCardSubtext(filter?: AdvisorDateFilter): string {
  if (!filter || filter.period === "today") return "Daily Telephony Output";
  if (filter.period === "this_week")  return "Weekly Telephony Output";
  if (filter.period === "this_month") return "Monthly Telephony Output";
  if (filter.period === "custom" && filter.startDate && filter.endDate) {
    return `${filter.startDate} → ${filter.endDate}`;
  }
  return "Telephony Output";
}

const AdvisorKpiSection = ({ kpis, filter }: AdvisorKpiSectionProps) => {
  const cards = [
    {
      title: "My Total Leads",
      value: kpis.totalLeads.toLocaleString(),
      subtext: "Assigned & Created Leads",
      icon: Users,
      color: "text-blue-600 bg-blue-50 border-blue-200",
    },
    {
      title: "Admissions Confirmed",
      value: kpis.admissionsDone.toLocaleString(),
      subtext: `${kpis.conversionRate}% Conversion Rate`,
      icon: CheckCircle2,
      color: "text-emerald-600 bg-emerald-50 border-emerald-200",
    },
    {
      title: getCallsCardTitle(filter),
      value: (kpis.callsTodayCount ?? 0).toLocaleString(),
      subtext: getCallsCardSubtext(filter),
      icon: PhoneCall,
      color: "text-cyan-600 bg-cyan-50 border-cyan-200",
    },
    {
      title: "Applications In Progress",
      value: kpis.inProgressApplications.toLocaleString(),
      subtext: "Screening & Interview Stages",
      icon: Clock,
      color: "text-amber-600 bg-amber-50 border-amber-200",
    },
    {
      title: "Conversion Rate",
      value: `${kpis.conversionRate}%`,
      subtext: "Lead to Admission Ratio",
      icon: TrendingUp,
      color: "text-indigo-600 bg-indigo-50 border-indigo-200",
    },
    {
      title: "College Pitches Approved",
      value: `${kpis.pitchesApproved} / ${kpis.pitchesTotal}`,
      subtext: "Manager Approved Pitches",
      icon: Building2,
      color: "text-purple-600 bg-purple-50 border-purple-200",
    },
    {
      title: "TPC Tasks Completed",
      value: `${kpis.tpcsCompleted} / ${kpis.tpcsTotal}`,
      subtext: "Third-Party Call Logs",
      icon: Headphones,
      color: "text-teal-600 bg-teal-50 border-teal-200",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-2xs hover:shadow-md transition-shadow space-y-2.5 sm:space-y-3 w-full min-w-0 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] sm:text-xs font-semibold text-text-secondary uppercase tracking-normal sm:tracking-wider truncate">
                {card.title}
              </span>
              <div className={`p-1.5 sm:p-2 rounded-xl border shrink-0 ${card.color}`}>
                <Icon size={16} />
              </div>
            </div>

            <div>
              <p className="text-xl sm:text-2xl font-semibold sm:font-bold text-text-primary tracking-tight">
                {card.value}
              </p>
              <p className="text-[10px] sm:text-xs text-text-muted mt-0.5 sm:mt-1 font-medium truncate">
                {card.subtext}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AdvisorKpiSection;
