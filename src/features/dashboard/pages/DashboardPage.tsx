import DashboardHeader from "../sections/DashboardHeader";
import KPISection from "../sections/KPISection";
import ChartSection from "../sections/ChartSection";
import ActivitySection from "../sections/ActivitySection";
import CreateLeadModal from "../../leads/components/CreateLeadModal";
import { useState } from "react"; 

const DashboardPage = () => {
  const [isCreateLeadOpen, setIsCreateLeadOpen] = useState(false);
  return (
    <div className="space-y-10">
      <DashboardHeader
        onCreateLead={() => setIsCreateLeadOpen(true)}
      />

      {isCreateLeadOpen && (
        <CreateLeadModal
          onClose={() => setIsCreateLeadOpen(false)}
        />
      )}
      <KPISection />

      <ChartSection />
      <ActivitySection />
    </div>
  );
};

export default DashboardPage;