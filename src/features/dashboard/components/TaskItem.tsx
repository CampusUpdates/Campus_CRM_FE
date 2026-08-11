import {
  CalendarClock,
  Circle,
  CircleCheckBig,
  Flag,
} from "lucide-react";

type Priority = "low" | "medium" | "high";

interface TaskItemProps {
  title: string;
  dueTime: string;
  priority: Priority;
  completed?: boolean;
}

const priorityColors = {
  low: "text-emerald-600 bg-emerald-50",
  medium: "text-amber-600 bg-amber-50",
  high: "text-red-600 bg-red-50",
};

const TaskItem = ({
  title,
  dueTime,
  priority,
  completed = false,
}: TaskItemProps) => {
  return (
    <div className="flex items-start gap-4 py-4 border-b border-slate-100 last:border-none">
      <button className="mt-1 text-slate-400 hover:text-indigo-600 transition-colors">
        {completed ? (
          <CircleCheckBig size={20} className="text-emerald-500" />
        ) : (
          <Circle size={20} />
        )}
      </button>

      <div className="flex-1">
        <h4
          className={`text-sm font-medium ${
            completed
              ? "line-through text-slate-400"
              : "text-slate-800"
          }`}
        >
          {title}
        </h4>

        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <CalendarClock size={14} />
            {dueTime}
          </div>

          <span
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${priorityColors[priority]}`}
          >
            <Flag size={12} />
            {priority}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TaskItem;