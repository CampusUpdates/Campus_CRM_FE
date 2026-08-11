import { Clock3 } from "lucide-react";
import ActivityItem from "./ActivityItem";

const ActivityList = () => {
  const activities = [
    {
      id: 1,
      title: "Lead Created",
      description: "Rahul Sharma was added by Priya.",
      time: "2 min ago",
      type: "lead_created",
    },
    {
      id: 2,
      title: "Call Completed",
      description: "Counselling call completed with Aditi Singh.",
      time: "15 min ago",
      type: "call_completed",
    },
    {
      id: 3,
      title: "Interview Scheduled",
      description: "Technical interview scheduled for tomorrow.",
      time: "35 min ago",
      type: "interview_scheduled",
    },
    {
      id: 4,
      title: "Application Submitted",
      description: "Application submitted to SISTec.",
      time: "1 hr ago",
      type: "application_submitted",
    },
    {
      id: 5,
      title: "Lead Created",
      description: "Anjali Verma was added by Rohit.",
      time: "2 hrs ago",
      type: "lead_created",
    },
    {
      id: 6,
      title: "Call Completed",
      description: "Follow-up completed with Karan Gupta.",
      time: "3 hrs ago",
      type: "call_completed",
    },
    {
      id: 7,
      title: "Lead Created",
      description: "Priyanshu Jain was added by Aman.",
      time: "Yesterday",
      type: "lead_created",
    },
    {
      id: 8,
      title: "Application Submitted",
      description: "Application submitted to LNCT.",
      time: "Yesterday",
      type: "application_submitted",
    },
    {
      id: 9,
      title: "Interview Scheduled",
      description: "HR Round scheduled for Monday.",
      time: "Yesterday",
      type: "interview_scheduled",
    },
    {
      id: 10,
      title: "Call Completed",
      description: "Admission counselling completed.",
      time: "2 days ago",
      type: "call_completed",
    },
  ];

  const hasMore = true;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm h-[40rem] flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-800">
          Recent Activities
        </h2>

        <p className="text-sm text-slate-500 mt-1">
          Latest updates from your team
        </p>
      </div>

      {activities.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <Clock3 className="w-8 h-8 text-slate-400" />
          </div>

          <h3 className="font-semibold text-slate-700">
            No recent activities
          </h3>

          <p className="text-sm text-slate-500 text-center mt-2 max-w-sm">
            Activities like lead creation, follow-ups, interviews and
            admissions will appear here.
          </p>
        </div>
      ) : (
        <>
          {/* Scrollable Activities */}
          <div className="flex-1 overflow-y-auto px-6 py-2">
            <div className="divide-y divide-slate-100">
              {activities.map((activity) => (
                <ActivityItem
                  key={activity.id}
                  title={activity.title}
                  description={activity.description}
                  time={activity.time}
                  type={activity.type}
                />
              ))}
            </div>
          </div>

          {/* Footer */}
          {hasMore && (
            <div className="border-t border-slate-200 p-4">
              <button className="w-full text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
                Load More
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ActivityList;