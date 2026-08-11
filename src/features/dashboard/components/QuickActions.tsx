import ActionButton from "../../../components/buttons/ActionButton";
import {
  UserPlus,
  CalendarPlus,
  Phone,
  ClipboardPlus,
  FilePlus2,
  GraduationCap,
  UserCheck,
  Bell,
} from "lucide-react";

const QuickActions = () => {
  const actions = [
    {
      id: 1,
      title: "Create Lead",
      description: "Add a new prospective student",
      icon: UserPlus,
      onClick: () => console.log("Create Lead"),
    },
    {
      id: 2,
      title: "Schedule Interview",
      description: "Book an interview with a candidate",
      icon: CalendarPlus,
      onClick: () => console.log("Schedule Interview"),
    },
    {
      id: 3,
      title: "Log Call",
      description: "Record a counselling call",
      icon: Phone,
      onClick: () => console.log("Log Call"),
    },
    {
      id: 4,
      title: "Create Follow-up",
      description: "Add a reminder for a lead",
      icon: ClipboardPlus,
      onClick: () => console.log("Create Follow-up"),
    },
    {
      id: 5,
      title: "New Application",
      description: "Create a student application",
      icon: FilePlus2,
      onClick: () => console.log("New Application"),
    },
    {
      id: 6,
      title: "Add Admission",
      description: "Register a confirmed admission",
      icon: GraduationCap,
      onClick: () => console.log("Add Admission"),
    },
    {
      id: 7,
      title: "Assign Counsellor",
      description: "Assign a lead to a counsellor",
      icon: UserCheck,
      onClick: () => console.log("Assign Counsellor"),
    },
    {
      id: 8,
      title: "Send Notification",
      description: "Notify students or staff",
      icon: Bell,
      onClick: () => console.log("Send Notification"),
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm h-[20rem] flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-800">
          Quick Actions
        </h2>

        <p className="text-sm text-slate-500 mt-1">
          Frequently used actions
        </p>
      </div>

      {/* Scrollable Actions */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-3">
          {actions.map((action) => (
            <ActionButton
              key={action.id}
              title={action.title}
              description={action.description}
              icon={action.icon}
              onClick={action.onClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuickActions;