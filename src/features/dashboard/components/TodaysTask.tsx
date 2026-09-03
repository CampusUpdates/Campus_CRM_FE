import { CalendarCheck } from "lucide-react";
import TaskItem from "./TaskItem";

const TodaysTasks = () => {
  const tasks = [
    {
      id: 1,
      title: "Follow up with Rahul Sharma",
      dueTime: "11:30 AM",
      priority: "high",
      completed: false,
    },
    {
      id: 2,
      title: "Verify admission documents",
      dueTime: "2:00 PM",
      priority: "medium",
      completed: true,
    },
    {
      id: 3,
      title: "Schedule interview with Aditi",
      dueTime: "4:30 PM",
      priority: "low",
      completed: false,
    },
    {
      id: 4,
      title: "Call Rohan Patel",
      dueTime: "5:00 PM",
      priority: "high",
      completed: false,
    },
    {
      id: 5,
      title: "Review new applications",
      dueTime: "6:00 PM",
      priority: "medium",
      completed: false,
    },
  ];

  return (
    <div className="bg-surface rounded-2xl border border-border shadow-sm h-[18rem] flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <h2 className="text-lg font-semibold text-text-primary">
          Today's Tasks
        </h2>

        <p className="text-sm text-text-secondary mt-1">
          Stay on top of your schedule
        </p>
      </div>

      {tasks.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
            <CalendarCheck
              className="text-text-muted"
              size={28}
            />
          </div>

          <h3 className="font-semibold text-text-primary">
            You're all caught up!
          </h3>

          <p className="text-sm text-text-secondary mt-2">
            No tasks scheduled for today.
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-6">
          <div className="divide-y divide-border">
            {tasks.map((task) => (
              <TaskItem
                key={task.id}
                title={task.title}
                dueTime={task.dueTime}
                priority={task.priority as any}
                completed={task.completed}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TodaysTasks;