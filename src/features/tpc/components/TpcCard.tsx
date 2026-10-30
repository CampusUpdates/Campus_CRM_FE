import { CheckCircle2, Clock, FileText, HelpCircle, History, Trash2, XCircle } from "lucide-react";
import { Tooltip } from "../../../components/Tooltip";
import { type TPCUserItem, type TPCStatus } from "../../../services/tpcService";

export interface TpcCardProps {
  assignment: TPCUserItem;
  targetUserLabel: string;
  targetUserName: string;
  targetUserRole: string;
  isUpdating: boolean;

  // Actions
  onAddNote?: () => void;
  onViewHistory?: () => void;
  onReassign?: () => void;
  onDelete?: () => void;
}

export default function TpcCard({
  assignment,
  targetUserLabel,
  targetUserName,
  targetUserRole,
  isUpdating,
  onAddNote,
  onViewHistory,
  onReassign,
  onDelete,
}: TpcCardProps) {
  const lead = assignment.tpc?.lead;
  const leadName = `${lead?.firstName || "Lead"} ${lead?.lastName || ""}`.trim();

  const renderStatusBadge = (status: TPCStatus) => {
    switch (status) {
      case "COMPLETED":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-900/80 dark:text-emerald-200 dark:border-emerald-700 flex items-center gap-1 shrink-0">
            <CheckCircle2 size={13} /> Completed
          </span>
        );
      case "NO_REPLY":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-900/80 dark:text-amber-200 dark:border-amber-700 flex items-center gap-1 shrink-0">
            <HelpCircle size={13} /> No Reply
          </span>
        );
      case "NOT_INTERESTED":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-300 dark:bg-red-900/80 dark:text-red-200 dark:border-red-700 flex items-center gap-1 shrink-0">
            <XCircle size={13} /> Not Interested
          </span>
        );
      case "PENDING":
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-900/80 dark:text-blue-200 dark:border-blue-700 flex items-center gap-1 shrink-0">
            <Clock size={13} /> Pending
          </span>
        );
    }
  };

  return (
    <div className="rounded-xl border border-border bg-surface shadow-sm hover:shadow-md transition flex flex-col justify-between">
      {/* Card Content Top */}
      <div className="p-4 space-y-4">
        {/* Lead Info Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="h-10 w-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">
              {leadName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-text-primary text-base leading-tight truncate">
                {leadName}
              </h3>
              <p className="text-sm text-text-secondary mt-1 truncate">
                {[lead?.phone, lead?.email].filter(Boolean).join(" · ")}
              </p>
            </div>
          </div>
          <div className="shrink-0">
            {renderStatusBadge(assignment.status)}
          </div>
        </div>

        {/* Colleges Pitched */}
        {lead?.collegeApplications && lead.collegeApplications.length > 0 && (
          <div className="text-sm space-y-1">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Colleges Pitched
            </p>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {lead.collegeApplications.slice(0, 3).map((app) => {
                const rawColor = app.status?.color || "#3b82f6";
                return (
                  <Tooltip
                    key={app.id || app.collegeId}
                    className="w-max max-w-[250px] bg-neutral-900 border border-neutral-700 text-neutral-100 p-2 rounded-lg text-xs shadow-xl cursor-auto"
                    content={
                      <>
                        <p className="font-semibold whitespace-pre-wrap">{app.college?.name}</p>
                        {app.status?.name && (
                          <p className="mt-1 opacity-75">Status: {app.status.name}</p>
                        )}
                      </>
                    }
                  >
                    <button
                      type="button"
                      className="relative inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 text-left"
                      style={{
                        backgroundColor: `color-mix(in srgb, ${rawColor} 12%, transparent)`,
                        borderColor: `color-mix(in srgb, ${rawColor} 30%, transparent)`,
                        color: `color-mix(in srgb, ${rawColor} 90%, #ffffff)`,
                      }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: rawColor }}
                      />
                      <span className="truncate max-w-[140px]">
                        {app.college?.name || "College"}
                      </span>
                    </button>
                  </Tooltip>
                );
              })}
              {lead.collegeApplications.length > 3 && (
                <Tooltip
                  className="flex flex-col gap-1.5 w-max max-w-xs bg-neutral-900 border border-neutral-700 text-neutral-100 p-3 rounded-lg shadow-xl max-h-64 overflow-y-auto cursor-auto text-left"
                  content={
                    <>
                      {lead.collegeApplications.slice(3).map((app) => {
                        const rawColor = app.status?.color || "#3b82f6";
                        return (
                          <span
                            key={app.id || app.collegeId}
                            className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium w-full"
                            style={{
                              backgroundColor: `color-mix(in srgb, ${rawColor} 12%, transparent)`,
                              borderColor: `color-mix(in srgb, ${rawColor} 30%, transparent)`,
                              color: `color-mix(in srgb, ${rawColor} 90%, #ffffff)`,
                            }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: rawColor }}
                            />
                            <span className="truncate max-w-[180px]">
                              {app.college?.name || "College"}
                            </span>
                            {app.status?.name && (
                              <span className="opacity-75 tracking-wider uppercase text-[10px] ml-auto pl-2 font-bold shrink-0">
                                {app.status.name}
                              </span>
                            )}
                          </span>
                        );
                      })}
                    </>
                  }
                >
                  <button type="button" className="group relative inline-flex items-center justify-center rounded-md border border-border bg-neutral-100 dark:bg-neutral-800 px-2 py-1 text-[11px] font-semibold text-text-secondary cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500">
                    <span>
                      +{lead.collegeApplications.length - 3} more
                    </span>
                  </button>
                </Tooltip>
              )}
            </div>
          </div>
        )}

        {/* Assignment Detail */}
        <div className="text-sm space-y-1">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            {targetUserLabel}
          </p>
          <p className="text-text-primary">
            {targetUserName}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">
            {targetUserRole} · {new Date(assignment.assignedAt).toLocaleString(undefined, {
              month: "short",
              day: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        {/* Negative Colleges */}
        {lead?.negativeColleges && lead.negativeColleges.length > 0 && (
          <div className="text-sm space-y-1">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Negative Colleges
            </p>
            <div className="flex flex-wrap gap-1 mt-0.5">
              {lead.negativeColleges.slice(0, 3).map((c) => (
                <Tooltip
                  key={c.id}
                  className="w-max max-w-[250px] bg-neutral-900 border border-neutral-700 text-neutral-100 p-2 rounded-lg text-xs shadow-xl cursor-auto"
                  content={<p className="whitespace-pre-wrap">{c.collegeName}</p>}
                >
                  <button
                    type="button"
                    className="relative inline-flex items-center gap-1 rounded border border-neutral-200/80 bg-neutral-50/80 dark:border-neutral-700/50 dark:bg-neutral-800/50 text-neutral-700 dark:text-neutral-300 px-1.5 py-0.5 text-[10px] font-medium cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-primary-500 text-left leading-tight"
                  >
                    <span className="w-1 h-1 rounded-full bg-neutral-400 shrink-0" />
                    <span className="truncate max-w-[100px]">{c.collegeName}</span>
                  </button>
                </Tooltip>
              ))}
              {lead.negativeColleges.length > 3 && (
                <Tooltip
                  className="flex flex-col gap-1.5 w-max max-w-xs bg-neutral-900 border border-neutral-700 text-neutral-100 p-3 rounded-lg shadow-xl max-h-64 overflow-y-auto cursor-auto text-left"
                  content={
                    <>
                      {lead.negativeColleges.slice(3).map((c) => (
                        <span
                          key={c.id}
                          className="inline-flex items-center gap-1 rounded border border-neutral-600 bg-neutral-800 text-neutral-100 px-2 py-0.5 text-[10px] font-medium w-full"
                        >
                          <span className="w-1 h-1 rounded-full bg-neutral-400 shrink-0" />
                          <span className="truncate max-w-[200px]">{c.collegeName}</span>
                        </span>
                      ))}
                    </>
                  }
                >
                  <button type="button" className="group relative inline-flex items-center justify-center rounded border border-border bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 text-[10px] font-semibold text-text-secondary cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-primary-500 leading-tight">
                    <span>
                      +{lead.negativeColleges.length - 3} more
                    </span>
                  </button>
                </Tooltip>
              )}
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="text-sm space-y-1 relative">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            Notes
          </p>
          {lead?.notes ? (
            <Tooltip
              className="w-full max-w-[320px] bg-neutral-900 border border-neutral-700 text-neutral-100 p-3.5 rounded-lg shadow-xl cursor-auto"
              wrapperClassName="block w-full"
              content={
                <div className="max-h-60 overflow-y-auto pr-1">
                  <p className="whitespace-pre-wrap break-words text-[13px] text-neutral-300 leading-relaxed">
                    {lead.notes}
                  </p>
                </div>
              }
            >
              <button type="button" className="group relative block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-sm cursor-pointer">
                <p className="text-[13px] opacity-80 text-text-primary whitespace-pre-wrap break-words line-clamp-2">
                  {lead.notes}
                </p>
              </button>
            </Tooltip>
          ) : (
            <p className="text-text-secondary">
              No notes added.
            </p>
          )}
        </div>
      </div>

      {/* Card Actions Footer */}
      <div className="border-t border-border p-3 space-y-2">
        {onAddNote && (
          <button
            onClick={onAddNote}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary-600 text-white text-xs font-medium shadow-xs hover:bg-primary-700 transition"
          >
            <FileText size={14} /> Add Note
          </button>
        )}

        <div className="flex flex-wrap items-center justify-between gap-1 text-[11px]">


          <div className="flex items-center gap-1.5 ml-auto">
            {onViewHistory && (
              <button
                onClick={onViewHistory}
                title="View Interaction History"
                className="p-1 rounded text-text-secondary hover:bg-neutral-200 transition"
              >
                <History size={15} />
              </button>
            )}
            {onReassign && (
              <button
                onClick={onReassign}
                className="px-2.5 py-1.5 rounded-lg border border-primary-200 bg-primary-50 text-primary-700 text-xs font-medium hover:bg-primary-100 transition"
              >
                Reassign
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                disabled={isUpdating}
                title="Remove Assignment"
                className="p-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition disabled:opacity-50"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
