import ActivityList from "../components/ActivityList";
import TodaysTasks from "../components/TodaysTask";
import QuickActions from "../components/QuickActions";

const ActivitySection = () => {
  return (
    <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
      {/* Left Column */}
      <div className="xl:col-span-2">
        <ActivityList />
      </div>

      {/* Right Column */}
      <div className="flex flex-col gap-6">
        <TodaysTasks />
        <QuickActions />
      </div>
    </section>
  );
};

export default ActivitySection;