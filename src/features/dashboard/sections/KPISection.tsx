import {
  Users,
  PhoneCall,
  CalendarDays,
  GraduationCap,
  FileText,
  ClipboardCheck,
  Briefcase,
  TrendingUp,
} from "lucide-react";

import StatCard from "../../../components/cards/StatCard";

const stats = [
  {
    title: "Active Leads",
    value: 248,
    subtitle: "+18 this week",
    icon: Users,
    iconBg: "bg-primary-100",
    iconColor: "text-primary-600",
  },
  {
    title: "Today's Calls",
    value: 42,
    subtitle: "Target: 60",
    icon: PhoneCall,
    iconBg: "bg-secondary-100",
    iconColor: "text-secondary-600",
  },
  {
    title: "Follow Ups",
    value: 16,
    subtitle: "5 overdue",
    icon: CalendarDays,
    iconBg: "bg-warning-100",
    iconColor: "text-warning-600",
  },
  {
    title: "Admissions",
    value: 12,
    subtitle: "+2 this month",
    icon: GraduationCap,
    iconBg: "bg-success-100",
    iconColor: "text-success-600",
  },
  {
    title: "Applications",
    value: 37,
    subtitle: "Submitted",
    icon: FileText,
    iconBg: "bg-info-100",
    iconColor: "text-info-600",
  },
  {
    title: "TPC Requests",
    value: 9,
    subtitle: "Pending",
    icon: ClipboardCheck,
    iconBg: "bg-primary-100",
    iconColor: "text-primary-600",
  },
  {
    title: "Interviews",
    value: 5,
    subtitle: "Today",
    icon: Briefcase,
    iconBg: "bg-secondary-100",
    iconColor: "text-secondary-600",
  },
  {
    title: "Conversion",
    value: "18%",
    subtitle: "Monthly",
    icon: TrendingUp,
    iconBg: "bg-success-100",
    iconColor: "text-success-600",
  },
];

const KPISection = () => {
  return (
    <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <StatCard
          key={stat.title}
          {...stat}
        />
      ))}
    </section>
  );
};

export default KPISection;