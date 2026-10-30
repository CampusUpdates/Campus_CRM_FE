import { useEffect, useState } from "react";
import {
  X,
  History,
  CheckCircle2,
  Clock,
  Share2,
  RefreshCw,
  UserCheck,
  Building2,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import {
  fetchLeadShares,
  acknowledgeLead,
  type LeadItem,
  type LeadAcknowledgementItem,
} from "../../../services/leadService";

type ShareHistoryDrawerProps = {
  lead: LeadItem;
  currentUserId?: string;
  onClose: () => void;
  onOpenNewShare: () => void;
  onAcknowledgeSuccess: (updatedAck: LeadAcknowledgementItem) => void;
};

export default function ShareHistoryDrawer({
  lead,
  currentUserId: _currentUserId,
  onClose,
  onOpenNewShare,
  onAcknowledgeSuccess,
}: ShareHistoryDrawerProps) {
  const { accessToken, user } = useAuth();
  const toast = useToast();

  const roleName = (
    typeof user?.role === "string" ? user.role : user?.role?.name || ""
  )
    .toUpperCase()
    .replace(/\s+/g, "_");
  const isSuperAdmin = ["SUPER_ADMIN", "SUPERADMIN", "ADMIN"].includes(roleName);
  const isManager = roleName.includes("MANAGER");
  const isTeamLead =
    roleName.includes("TEAM_LEAD") || roleName.includes("TEAMLEAD");
  const isAuthorizedToAcknowledge = isSuperAdmin || isManager || isTeamLead;

  const [shares, setShares] = useState<LeadAcknowledgementItem[]>(
    lead.acknowledgements || []
  );
  const [loading, setLoading] = useState(true);
  const [acknowledgingShareId, setAcknowledgingShareId] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (accessToken && lead.id) {
      setLoading(true);
      fetchLeadShares(accessToken, lead.id)
        .then((data) => {
          if (isMounted) {
            setShares(data);
          }
        })
        .catch((err) => {
          console.warn("Could not fetch latest share history:", err);
          if (isMounted) {
            setShares(lead.acknowledgements || []);
          }
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [accessToken, lead.id]);

  const handleClose = () => {
    setIsClosing(true);
  };

  const handleAnimationEnd = () => {
    if (isClosing) {
      onClose();
    }
  };

  const handleAcknowledge = async (shareId: string, collegeName?: string) => {
    if (!accessToken) return;
    if (!isAuthorizedToAcknowledge) {
      toast.error("Only an authorized Manager or Team Lead can acknowledge lead posting.");
      return;
    }

    const confirmed = window.confirm(
      `Confirm that you have verified this lead was posted in the appropriate college group${
        collegeName ? ` (${collegeName})` : ""
      }?`
    );
    if (!confirmed) return;

    setAcknowledgingShareId(shareId);
    try {
      const res = await acknowledgeLead(accessToken, lead.id, shareId);
      toast.success("Lead posting verified and acknowledged successfully");
      const updatedAck = res.acknowledgement;
      setShares((prev) =>
        prev.map((s) => (s.id === shareId ? { ...s, ...updatedAck } : s))
      );
      onAcknowledgeSuccess(updatedAck);
    } catch (err: any) {
      toast.error(err.message || "Failed to acknowledge lead posting");
    } finally {
      setAcknowledgingShareId(null);
    }
  };

  const fullName = `${lead.firstName} ${lead.lastName || ""}`.trim();

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className={`fixed inset-0 bg-black/50 transition-opacity duration-300 ${
          isClosing ? "opacity-0" : "opacity-100"
        }`}
      />

      {/* Drawer */}
      <div
        onAnimationEnd={handleAnimationEnd}
        className={`fixed right-0 top-0 h-[100dvh] w-full sm:w-[500px] md:w-[560px] bg-surface shadow-2xl flex flex-col ${
          isClosing ? "animate-slide-out-right" : "animate-slide-in-right"
        }`}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center font-bold">
              <History size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">
                Share & Acknowledgement History
              </h2>
              <p className="text-xs text-text-muted">
                {fullName} (#{lead.id.slice(0, 6).toUpperCase()})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-2 text-text-secondary transition hover:bg-neutral-100 hover:text-text-primary cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Lead Quick Overview Bar */}
        <div className="bg-neutral-50 border-b border-border px-6 py-3 flex items-center justify-between text-xs text-text-secondary">
          <div>
            <span className="text-text-muted">Course: </span>
            <span className="font-medium text-text-primary">
              {lead.courseInterested || "N/A"}
            </span>
          </div>
          <div>
            <span className="text-text-muted">Phone: </span>
            <span className="font-mono text-text-primary">{lead.phone}</span>
          </div>
          <div>
            <span className="text-text-muted">Location: </span>
            <span className="text-text-primary">
              {[lead.city, lead.state].filter(Boolean).join(", ") || "N/A"}
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-text-muted text-sm gap-2">
              <RefreshCw size={22} className="animate-spin text-primary-600" />
              <span>Loading share history...</span>
            </div>
          ) : shares.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mb-3 text-text-muted">
                <Share2 size={22} />
              </div>
              <h3 className="text-sm font-semibold text-text-primary">
                No share records yet
              </h3>
              <p className="text-xs text-text-muted mt-1 max-w-xs">
                This lead has not been shared through the lead sharing workflow yet.
              </p>
              <button
                type="button"
                onClick={() => {
                  handleClose();
                  onOpenNewShare();
                }}
                className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition cursor-pointer"
              >
                <Share2 size={13} />
                <span>Start WhatsApp Share</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Chronological Shares ({shares.length})
                </span>
                <span className="text-[11px] text-text-muted">Newest at top</span>
              </div>

              <div className="space-y-3">
                {shares.map((share, idx) => {
                  const isLatest = idx === 0;
                  const isAcked = Boolean(share.acknowledgedAt);
                  const ackName = share.acknowledgedBy
                    ? `${share.acknowledgedBy.firstName} ${share.acknowledgedBy.lastName || ""}`.trim()
                    : share.recipient
                      ? `${share.recipient.firstName} ${share.recipient.lastName || ""}`.trim()
                      : "Recipient";

                  const ackDateStr = share.acknowledgedAt
                    ? new Date(share.acknowledgedAt).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })
                    : "";

                  const sharedDateStr = share.sharedAt
                    ? new Date(share.sharedAt).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })
                    : share.createdAt
                      ? new Date(share.createdAt).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      : "Recently";

                  const sharedByName = share.sharedBy
                    ? `${share.sharedBy.firstName} ${share.sharedBy.lastName || ""}`.trim()
                    : "Manager";

                  const recipientName = share.recipient
                    ? `${share.recipient.firstName} ${share.recipient.lastName || ""}`.trim()
                    : "Assigned Advisor";

                  const collegeName = share.college?.name || share.context;
                  const canAcknowledgeThis = !isAcked && isAuthorizedToAcknowledge;

                  return (
                    <div
                      key={share.id}
                      className={`p-4 rounded-xl border transition ${
                        isLatest
                          ? "border-primary-200 bg-primary-50/20"
                          : "border-border bg-surface"
                      }`}
                    >
                      {/* Top row: Share tag, college tag, and timestamp */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Share2 size={11} />
                            <span>{share.channel || "WhatsApp"}</span>
                          </span>
                          {collegeName && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                              <Building2 size={11} />
                              <span className="max-w-[140px] truncate">{collegeName}</span>
                            </span>
                          )}
                          {isLatest && (
                            <span className="text-[10px] font-bold text-primary-700 uppercase tracking-wider">
                              Latest
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-text-muted font-mono">
                          {sharedDateStr}
                        </span>
                      </div>

                      {/* Details */}
                      <div className="text-xs space-y-1 mb-3 text-text-secondary">
                        <div className="flex items-center gap-1.5">
                          <UserCheck size={12} className="text-text-muted shrink-0" />
                          <span>
                            <strong className="text-text-primary">Shared by:</strong>{" "}
                            {sharedByName} →{" "}
                            <strong className="text-text-primary">Recipient:</strong>{" "}
                            {recipientName}
                          </span>
                        </div>

                        {collegeName && (
                          <div className="flex items-center gap-1.5">
                            <Building2 size={12} className="text-emerald-600 shrink-0" />
                            <span>
                              <strong className="text-text-primary">Target College / Context:</strong>{" "}
                              <span className="font-semibold text-text-primary">{collegeName}</span>
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Acknowledgement Status Bar */}
                      <div className="pt-2.5 border-t border-border flex items-center justify-between gap-2">
                        {isAcked ? (
                          <span
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md"
                            title={`Acknowledged on ${ackDateStr}`}
                          >
                            <CheckCircle2 size={13} className="text-emerald-600" />
                            <span>Acknowledged by {ackName} ({ackDateStr})</span>
                          </span>
                        ) : (
                          <div className="flex items-center justify-between w-full">
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md">
                              <Clock size={13} className="text-amber-500" />
                              <span>Pending Manager / Team Lead verification</span>
                            </span>

                            {canAcknowledgeThis && (
                              <button
                                type="button"
                                onClick={() => handleAcknowledge(share.id, collegeName || undefined)}
                                disabled={acknowledgingShareId === share.id}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition disabled:opacity-50 cursor-pointer shadow-xs"
                                title="Verify that lead was posted in college group and acknowledge"
                              >
                                <CheckCircle2 size={13} />
                                <span>
                                  {acknowledgingShareId === share.id
                                    ? "Verifying..."
                                    : "Verify & Acknowledge"}
                                </span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-surface">
          <button
            type="button"
            onClick={() => {
              handleClose();
              onOpenNewShare();
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition cursor-pointer"
          >
            <Share2 size={13} className="text-emerald-600" />
            <span>Initiate New Share</span>
          </button>

          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-xs font-medium rounded-lg border border-border text-text-secondary hover:bg-neutral-50 transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
