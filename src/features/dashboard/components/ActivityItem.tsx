import {
  Activity,
  Bell,
  Briefcase,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock,
  PhoneCall,
  UserCheck,
  UserPlus,
} from "lucide-react";

export type ActivityType =
  | "LEAD"
  | "USER"
  | "COLLEGE"
  | "ATTENDANCE"
  | "CANDIDATE"
  | "INTERVIEW"
  | "NOTIFICATION"
  | "TPC"
  | "DATA_UPLOAD"
  | "DATA_ASSIGNMENT"
  | "SYSTEM"
  | "lead_created"
  | "call_completed"
  | "interview_scheduled"
  | "application_submitted"
  | "task_completed";

interface ActivityItemProps {
  title: string;
  description: string;
  time: string;
  type: string;
}

const getIcon = (type?: string) => {
  const normalized = (type || "").toUpperCase();
  switch (normalized) {
    case "LEAD":
    case "LEAD_CREATED":
      return UserPlus;
    case "USER":
      return UserCheck;
    case "COLLEGE":
      return Building2;
    case "ATTENDANCE":
      return CalendarDays;
    case "CANDIDATE":
      return Briefcase;
    case "INTERVIEW":
    case "INTERVIEW_SCHEDULED":
      return Clock;
    case "NOTIFICATION":
      return Bell;
    case "TPC":
    case "TASK_COMPLETED":
      return CheckCircle2;
    case "CALL_COMPLETED":
      return PhoneCall;
    default:
      return Activity;
  }
};

const getColorClass = (type?: string) => {
  const normalized = (type || "").toUpperCase();
  switch (normalized) {
    case "LEAD":
    case "LEAD_CREATED":
      return "bg-blue-100 text-blue-600";
    case "USER":
      return "bg-purple-100 text-purple-600";
    case "COLLEGE":
      return "bg-indigo-100 text-indigo-600";
    case "ATTENDANCE":
      return "bg-amber-100 text-amber-600";
    case "CANDIDATE":
      return "bg-teal-100 text-teal-600";
    case "INTERVIEW":
    case "INTERVIEW_SCHEDULED":
      return "bg-pink-100 text-pink-600";
    case "NOTIFICATION":
      return "bg-yellow-100 text-yellow-600";
    case "TPC":
    case "TASK_COMPLETED":
      return "bg-emerald-100 text-emerald-600";
    default:
      return "bg-slate-100 text-slate-600";
  }
};

const ActivityItem = ({
  title,
  description,
  time,
  type,
}: ActivityItemProps) => {
  const Icon = getIcon(type);
  const colorStyle = getColorClass(type);

  return (
    <div className="flex items-start gap-4 py-4 border-b border-border last:border-none">
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${colorStyle}`}
      >
        <Icon size={20} />
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-text-primary truncate">{title}</h4>
        <p className="text-sm text-text-secondary mt-1 break-words">
          {description}
        </p>
      </div>

      <span className="text-xs text-text-muted whitespace-nowrap shrink-0">
        {time}
      </span>
    </div>
  );
};

export default ActivityItem;