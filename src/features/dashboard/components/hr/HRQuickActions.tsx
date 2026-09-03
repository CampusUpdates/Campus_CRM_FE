import { Briefcase, CalendarCheck, UserPlus, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../../../app/router/routes";

type HRQuickActionsProps = {
  onOpenPosition: () => void;
  onOpenCandidate: () => void;
  onOpenInterview: () => void;
};

const HRQuickActions = ({
  onOpenPosition,
  onOpenCandidate,
  onOpenInterview,
}: HRQuickActionsProps) => {
  const navigate = useNavigate();

  return (
    <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
      <h3 className="text-base font-semibold text-text-primary mb-4">
        HR Quick Actions
      </h3>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <button
          onClick={onOpenPosition}
          className="
            flex flex-col items-center justify-center rounded-xl border border-border
            bg-background p-4 text-center transition hover:border-primary-500 hover:bg-primary-50/50
          "
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600 mb-2">
            <Briefcase size={20} />
          </div>
          <span className="text-xs font-semibold text-text-primary">Post Position</span>
          <span className="text-[11px] text-text-muted mt-0.5">Open new job role</span>
        </button>

        <button
          onClick={onOpenCandidate}
          className="
            flex flex-col items-center justify-center rounded-xl border border-border
            bg-background p-4 text-center transition hover:border-primary-500 hover:bg-primary-50/50
          "
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 mb-2">
            <UserPlus size={20} />
          </div>
          <span className="text-xs font-semibold text-text-primary">Add Candidate</span>
          <span className="text-[11px] text-text-muted mt-0.5">Register applicant</span>
        </button>

        <button
          onClick={onOpenInterview}
          className="
            flex flex-col items-center justify-center rounded-xl border border-border
            bg-background p-4 text-center transition hover:border-primary-500 hover:bg-primary-50/50
          "
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600 mb-2">
            <CalendarCheck size={20} />
          </div>
          <span className="text-xs font-semibold text-text-primary">Schedule Interview</span>
          <span className="text-[11px] text-text-muted mt-0.5">Book round</span>
        </button>

        <button
          onClick={() => navigate(ROUTES.USERS)}
          className="
            flex flex-col items-center justify-center rounded-xl border border-border
            bg-background p-4 text-center transition hover:border-primary-500 hover:bg-primary-50/50
          "
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 mb-2">
            <Users size={20} />
          </div>
          <span className="text-xs font-semibold text-text-primary">Manage Users</span>
          <span className="text-[11px] text-text-muted mt-0.5">Employees & accounts</span>
        </button>
      </div>
    </div>
  );
};

export default HRQuickActions;
