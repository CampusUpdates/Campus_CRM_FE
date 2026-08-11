import {
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  PhoneCall,
  UserPlus,
} from "lucide-react";

type ActivityType =
  | "lead_created"
  | "call_completed"
  | "interview_scheduled"
  | "application_submitted"
  | "task_completed";

interface ActivityItemProps {
  title: string;
  description: string;
  time: string;
  type: ActivityType;
}

const iconMap = {
  lead_created: UserPlus,
  call_completed: PhoneCall,
  interview_scheduled: CalendarDays,
  application_submitted: ClipboardCheck,
  task_completed: CheckCircle2,
};

const colorMap = {
  lead_created: "bg-blue-100 text-blue-600",
  call_completed: "bg-green-100 text-green-600",
  interview_scheduled: "bg-purple-100 text-purple-600",
  application_submitted: "bg-amber-100 text-amber-600",
  task_completed: "bg-emerald-100 text-emerald-600",
};

const ActivityItem = ({
  title,
  description,
  time,
  type,
}: ActivityItemProps) => {
  const Icon = iconMap[type];

  return (
    <div className="flex items-start gap-4 py-4 border-b border-slate-100 last:border-none">
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center ${colorMap[type]}`}
      >
        <Icon size={20} />
      </div>

      <div className="flex-1">
        <h4 className="text-sm font-semibold text-slate-800">{title}</h4>

        <p className="text-sm text-slate-500 mt-1">
          {description}
        </p>
      </div>

      <span className="text-xs text-slate-400 whitespace-nowrap">
        {time}
      </span>
    </div>
  );
};

export default ActivityItem;