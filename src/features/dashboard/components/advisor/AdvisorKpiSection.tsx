import {
  Users,
  CheckCircle2,
  PhoneCall,
  Clock,
  TrendingUp,
  Building2,
  Headphones,
} from "lucide-react";
import type { AdvisorKPIs } from "../../../../services/advisorDashboardService";

type AdvisorKpiSectionProps = {
  kpis: AdvisorKPIs;
};

const AdvisorKpiSection = ({ kpis }: AdvisorKpiSectionProps) => {
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
      title: "Calls Today",
      value: (kpis.callsTodayCount ?? 0).toLocaleString(),
      subtext: "Daily Telephony Output",
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="rounded-2xl border border-border bg-surface p-5 shadow-2xs hover:shadow-md transition-shadow space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                {card.title}
              </span>
              <div className={`p-2 rounded-xl border ${card.color}`}>
                <Icon size={18} />
              </div>
            </div>

            <div>
              <p className="text-2xl font-bold text-text-primary tracking-tight">
                {card.value}
              </p>
              <p className="text-xs text-text-muted mt-1 font-medium">
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
