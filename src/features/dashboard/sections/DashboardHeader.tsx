import { Phone, Plus } from "lucide-react";

type DashboardHeaderProps = {
  onCreateLead: () => void;
};

const DashboardHeader = ({ onCreateLead }: DashboardHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      {/* Left */}
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">
          Welcome back, Damini 👋
        </h1>

        <p className="mt-1 text-sm text-text-secondary">
          Here's all you need to do today.
        </p>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        <button
          className="
            flex items-center gap-2
            rounded-lg
            border
            border-border
            bg-surface
            px-4
            py-2.5
            text-sm
            font-medium
            text-text-primary
            transition
            hover:bg-primary-25
          "
        >
          <Phone size={18} />
          Make Call
        </button>

        <button
          onClick={onCreateLead}
          className="
            flex items-center gap-2
            rounded-lg
            bg-primary-500
            px-4
            py-2.5
            text-sm
            font-medium
            text-white
            transition
            hover:bg-primary-600
          "
        >
          <Plus size={18} />
          Create Lead
        </button>
      </div>
    </div>
  );
};

export default DashboardHeader;