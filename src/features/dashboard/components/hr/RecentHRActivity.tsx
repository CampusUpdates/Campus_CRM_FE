import { Briefcase, Clock, UserCheck, UserPlus } from "lucide-react";
import type { Candidate } from "../../../../services/candidateService";
import type { Interview } from "../../../../services/interviewService";

type RecentHRActivityProps = {
  recentCandidates: Candidate[];
  upcomingInterviews: Interview[];
};

const RecentHRActivity = ({
  recentCandidates,
  upcomingInterviews,
}: RecentHRActivityProps) => {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Recent Candidate Applications */}
      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-text-primary">
              Recent Applications
            </h3>
            <p className="text-xs text-text-secondary">
              Latest candidate submissions
            </p>
          </div>
          <UserPlus size={18} className="text-primary-500" />
        </div>

        <div className="space-y-3">
          {recentCandidates.length === 0 ? (
            <p className="py-6 text-center text-xs text-text-muted">
              No recent candidate submissions found.
            </p>
          ) : (
            recentCandidates.map((cand) => (
              <div
                key={cand.id}
                className="flex items-center justify-between rounded-lg border border-border bg-background p-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-50 text-primary-600 font-semibold">
                    {cand.firstName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary">
                      {cand.firstName} {cand.lastName || ""}
                    </p>
                    <p className="text-text-muted flex items-center gap-1">
                      <Briefcase size={12} />
                      {cand.position?.title || "Applicant"}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-flex rounded-full bg-blue-50 px-2 py-0.5 font-semibold text-blue-700">
                    {cand.status.replace("_", " ")}
                  </span>
                  <p className="mt-0.5 text-[10px] text-text-muted">
                    {new Date(cand.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Upcoming Interviews */}
      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-text-primary">
              Upcoming Interviews
            </h3>
            <p className="text-xs text-text-secondary">
              Scheduled interview sessions
            </p>
          </div>
          <Clock size={18} className="text-amber-500" />
        </div>

        <div className="space-y-3">
          {upcomingInterviews.length === 0 ? (
            <p className="py-6 text-center text-xs text-text-muted">
              No upcoming interview rounds scheduled.
            </p>
          ) : (
            upcomingInterviews.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border border-border bg-background p-3 text-xs"
              >
                <div>
                  <p className="font-semibold text-text-primary">
                    {item.candidate ? `${item.candidate.firstName} ${item.candidate.lastName || ""}` : "Candidate"}
                  </p>
                  <p className="text-text-muted flex items-center gap-1">
                    <UserCheck size={12} className="text-primary-500" />
                    Interviewer: {item.interviewer ? `${item.interviewer.firstName} ${item.interviewer.lastName || ""}` : "Assigned"}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-medium text-text-primary flex items-center gap-1 justify-end">
                    <Clock size={12} className="text-text-muted" />
                    {new Date(item.scheduledAt).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                  <span className="inline-flex rounded-full bg-purple-50 px-2 py-0.5 font-semibold text-purple-700 mt-0.5">
                    {item.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default RecentHRActivity;
