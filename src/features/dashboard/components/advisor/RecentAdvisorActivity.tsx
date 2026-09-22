import { useState } from "react";
import { Users, Building2, Tag } from "lucide-react";
import type { RecentAdvisorLead } from "../../../../services/advisorDashboardService";
import ChangeStatusModal from "../../../leads/components/ChangeStatusModal";

type RecentAdvisorActivityProps = {
  leads: RecentAdvisorLead[];
  onRefresh: () => void;
};

const getStatusBadgeStyle = (statusName?: string, color?: string) => {
  const name = (statusName || "LEAD").toUpperCase();
  const c = (color || "").toLowerCase();

  if (name === "ADMISSION_DONE" || c === "green" || name.includes("ADMISSION")) {
    return "bg-emerald-100 text-emerald-800 border-emerald-300";
  }
  if (name === "LETTER_OUT" || c === "pink") {
    return "bg-pink-100 text-pink-800 border-pink-300";
  }
  if (name === "INTERVIEW_DONE" || c === "purple") {
    return "bg-purple-100 text-purple-800 border-purple-300";
  }
  if (name === "INTERVIEW_SCHEDULED" || c === "orange") {
    return "bg-orange-100 text-orange-800 border-orange-300";
  }
  if (name === "APPLICATION" || c === "yellow") {
    return "bg-amber-100 text-amber-800 border-amber-300";
  }
  if (name === "CANCELLED" || c === "red" || name.includes("CANCEL")) {
    return "bg-rose-100 text-rose-800 border-rose-300";
  }
  return "bg-blue-100 text-blue-800 border-blue-300";
};

const RecentAdvisorActivity = ({ leads, onRefresh }: RecentAdvisorActivityProps) => {
  const [changingStatusLead, setChangingStatusLead] = useState<RecentAdvisorLead | null>(null);

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-2xs space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-text-primary">
            My Recent Active Leads
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            Quick view of my latest assigned and updated student leads
          </p>
        </div>
      </div>

      {leads.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center mb-2 text-text-muted">
            <Users size={20} />
          </div>
          <p className="text-sm font-semibold text-text-primary">No recent leads found</p>
          <p className="text-xs text-text-muted mt-0.5">
            You do not have any recent leads assigned or created yet.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-neutral-50 text-left text-xs font-semibold uppercase text-text-secondary">
                <th className="px-4 py-3">Lead</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Course & Location</th>
                <th className="px-4 py-3">Application Colleges</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {leads.map((lead) => {
                const fullName = `${lead.firstName} ${lead.lastName || ""}`.trim();
                const shortId = `LD${lead.id.slice(0, 4).toUpperCase()}`;

                return (
                  <tr key={lead.id} className="hover:bg-neutral-50/50 transition">
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-text-primary">{fullName}</p>
                        <p className="text-xs text-text-muted font-mono">#{shortId}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary">
                      {lead.phone}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary">
                      <div>
                        <p className="font-medium text-text-primary">{lead.courseInterested || "N/A"}</p>
                        {lead.city && <p className="text-xs text-text-muted">{lead.city}</p>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary">
                      {lead.collegeApplications && lead.collegeApplications.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {lead.collegeApplications.map((app) => (
                            <span
                              key={app.id}
                              className="inline-flex items-center gap-1 rounded-md bg-neutral-100 border border-neutral-200 px-2 py-0.5 text-xs text-text-primary"
                            >
                              <Building2 size={11} className="text-primary-600 shrink-0" />
                              {app.college?.name || "College"}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-text-muted">None</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusBadgeStyle(lead.status?.name, lead.status?.color)}`}>
                        {lead.status?.name || "LEAD"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setChangingStatusLead(lead)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 text-xs font-semibold hover:bg-amber-100 transition"
                      >
                        <Tag size={13} />
                        Update Status
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Change Status Modal */}
      {changingStatusLead && (
        <ChangeStatusModal
          lead={changingStatusLead as any}
          onClose={() => setChangingStatusLead(null)}
          onSuccess={onRefresh}
        />
      )}
    </div>
  );
};

export default RecentAdvisorActivity;
