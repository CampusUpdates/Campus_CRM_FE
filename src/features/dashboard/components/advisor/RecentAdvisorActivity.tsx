import { useState } from "react";
import { Users, Building2, Pencil } from "lucide-react";
import type { RecentAdvisorLead } from "../../../../services/advisorDashboardService";
import ChangeStatusModal from "../../../leads/components/ChangeStatusModal";

type RecentAdvisorActivityProps = {
  leads: RecentAdvisorLead[];
  onRefresh: () => void;
};

// ─── Status pill ─────────────────────────────────────────────────────────────
// Maps lead status names/colors to pill token classes that work in both light
// and dark mode. We use /20 alpha backgrounds so the surface card shows through.

type PillTokens = {
  bg: string;
  border: string;
  text: string;
};

const getStatusPillTokens = (statusName?: string, color?: string): PillTokens => {
  const name = (statusName || "LEAD").toUpperCase();
  const c = (color || "").toLowerCase();

  if (name.includes("ADMISSION") || c === "green") {
    return {
      bg: "bg-emerald-500/10 dark:bg-emerald-400/10",
      border: "border-emerald-500/30 dark:border-emerald-400/30",
      text: "text-emerald-700 dark:text-emerald-400",
    };
  }
  if (name === "LETTER_OUT" || c === "pink") {
    return {
      bg: "bg-pink-500/10 dark:bg-pink-400/10",
      border: "border-pink-500/30 dark:border-pink-400/30",
      text: "text-pink-700 dark:text-pink-400",
    };
  }
  if (name === "INTERVIEW_DONE" || c === "purple") {
    return {
      bg: "bg-purple-500/10 dark:bg-purple-400/10",
      border: "border-purple-500/30 dark:border-purple-400/30",
      text: "text-purple-700 dark:text-purple-400",
    };
  }
  if (name === "INTERVIEW_SCHEDULED" || c === "orange") {
    return {
      bg: "bg-orange-500/10 dark:bg-orange-400/10",
      border: "border-orange-500/30 dark:border-orange-400/30",
      text: "text-orange-700 dark:text-orange-400",
    };
  }
  if (name === "APPLICATION" || c === "yellow" || c === "violet") {
    return {
      bg: "bg-violet-500/10 dark:bg-violet-400/10",
      border: "border-violet-500/30 dark:border-violet-400/30",
      text: "text-violet-700 dark:text-violet-400",
    };
  }
  if (name.includes("CANCEL") || c === "red") {
    return {
      bg: "bg-rose-500/10 dark:bg-rose-400/10",
      border: "border-rose-500/30 dark:border-rose-400/30",
      text: "text-rose-700 dark:text-rose-400",
    };
  }
  // Default — LEAD and any unknown status → blue
  return {
    bg: "bg-blue-500/10 dark:bg-blue-400/10",
    border: "border-blue-500/30 dark:border-blue-400/30",
    text: "text-blue-700 dark:text-blue-400",
  };
};

const StatusPill = ({ name, color }: { name?: string; color?: string }) => {
  const { bg, border, text } = getStatusPillTokens(name, color);
  const label = name || "LEAD";
  return (
    <span
      className={[
        "inline-flex items-center justify-center whitespace-nowrap",
        "rounded-full border px-3 py-[3px]",
        "text-[11px] font-semibold tracking-wide",
        bg, border, text,
      ].join(" ")}
    >
      {label}
    </span>
  );
};

// ─── College chip ─────────────────────────────────────────────────────────────
const CollegeChip = ({ name }: { name: string }) => (
  <span
    title={name}
    className="inline-flex items-center gap-1 rounded-full border border-border bg-neutral-100/60 dark:bg-white/5 px-2.5 py-0.5 max-w-[180px]"
  >
    <Building2 size={10} className="shrink-0 text-text-muted" />
    <span className="truncate text-[11px] font-medium text-text-secondary leading-none">
      {name}
    </span>
  </span>
);

// ─── Main component ───────────────────────────────────────────────────────────
const RecentAdvisorActivity = ({ leads, onRefresh }: RecentAdvisorActivityProps) => {
  const [changingStatusLead, setChangingStatusLead] = useState<RecentAdvisorLead | null>(null);

  return (
    <div className="rounded-2xl border border-border bg-surface shadow-2xs overflow-hidden">
      {/* Card header */}
      <div className="px-5 py-4 border-b border-border">
        <h3 className="text-base font-bold text-text-primary">My Recent Active Leads</h3>
        <p className="text-xs text-text-muted mt-0.5">
          Quick view of my latest assigned and updated student leads
        </p>
      </div>

      {/* Empty state */}
      {leads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
          <div className="w-11 h-11 rounded-full bg-neutral-100 dark:bg-white/5 flex items-center justify-center mb-3 text-text-muted">
            <Users size={20} />
          </div>
          <p className="text-sm font-semibold text-text-primary">No recent leads found</p>
          <p className="text-xs text-text-muted mt-1">
            You do not have any recent leads assigned or created yet.
          </p>
        </div>
      ) : (
        /* Scroll wrapper — only the table scrolls, not the page */
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse">
            {/* Table header */}
            <thead>
              <tr className="border-b border-border">
                {/* Lead — fixed comfortable width */}
                <th className="px-5 py-3 text-left w-[180px]">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
                    Lead
                  </span>
                </th>
                {/* Phone */}
                <th className="px-4 py-3 text-left w-[130px]">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
                    Phone
                  </span>
                </th>
                {/* Course & Location */}
                <th className="px-4 py-3 text-left w-[170px]">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
                    Course &amp; Location
                  </span>
                </th>
                {/* Colleges — widest column */}
                <th className="px-4 py-3 text-left">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
                    Colleges
                  </span>
                </th>
                {/* Status */}
                <th className="px-4 py-3 text-left w-[150px]">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
                    Status
                  </span>
                </th>
                {/* Action */}
                <th className="px-5 py-3 text-right w-[120px]">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
                    Action
                  </span>
                </th>
              </tr>
            </thead>

            {/* Table body */}
            <tbody className="divide-y divide-border">
              {leads.map((lead) => {
                const fullName = `${lead.firstName} ${lead.lastName || ""}`.trim();
                const shortId = `LD-${lead.id.slice(0, 6).toUpperCase()}`;
                const colleges = lead.collegeApplications ?? [];

                return (
                  <tr
                    key={lead.id}
                    className="group transition-colors hover:bg-neutral-50/40 dark:hover:bg-white/[0.025]"
                  >
                    {/* Lead name + ID */}
                    <td className="px-5 py-3.5 align-middle">
                      <p className="text-sm font-semibold text-text-primary leading-snug truncate max-w-[160px]">
                        {fullName}
                      </p>
                      <p className="text-[10px] text-text-muted font-mono mt-0.5 tabular-nums">
                        {shortId}
                      </p>
                    </td>

                    {/* Phone */}
                    <td className="px-4 py-3.5 align-middle">
                      <span className="text-xs text-text-secondary tabular-nums whitespace-nowrap">
                        {lead.phone}
                      </span>
                    </td>

                    {/* Course & Location */}
                    <td className="px-4 py-3.5 align-middle">
                      <p className="text-xs font-medium text-text-primary leading-snug truncate max-w-[155px]">
                        {lead.courseInterested || "—"}
                      </p>
                      {lead.city && (
                        <p className="text-[10px] text-text-muted mt-0.5 truncate max-w-[155px]">
                          {lead.city}
                        </p>
                      )}
                    </td>

                    {/* College chips */}
                    <td className="px-4 py-3.5 align-middle">
                      {colleges.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {colleges.map((app) => (
                            <CollegeChip
                              key={app.id}
                              name={app.college?.name || "Unknown College"}
                            />
                          ))}
                        </div>
                      ) : (
                        <span className="text-[11px] text-text-muted italic">None</span>
                      )}
                    </td>

                    {/* Status pill */}
                    <td className="px-4 py-3.5 align-middle">
                      <StatusPill
                        name={lead.status?.name}
                        color={lead.status?.color}
                      />
                    </td>

                    {/* Action button */}
                    <td className="px-5 py-3.5 align-middle text-right">
                      <button
                        type="button"
                        onClick={() => setChangingStatusLead(lead)}
                        className={[
                          "inline-flex items-center justify-center gap-1.5",
                          "rounded-full border border-border",
                          "bg-transparent px-3 py-1.5",
                          "text-[11px] font-semibold text-text-secondary",
                          "whitespace-nowrap",
                          "transition-colors",
                          "hover:border-emerald-500/40 hover:bg-emerald-500/8 hover:text-emerald-600",
                          "dark:hover:border-emerald-400/30 dark:hover:bg-emerald-400/8 dark:hover:text-emerald-400",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
                          "cursor-pointer",
                        ].join(" ")}
                      >
                        <Pencil size={12} className="shrink-0" />
                        Update
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
