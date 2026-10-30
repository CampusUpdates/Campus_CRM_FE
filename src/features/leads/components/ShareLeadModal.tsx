import { useState } from "react";
import { X, Share2, Send, Building2, UserCircle, FileText } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import {
  shareLead,
  type LeadItem,
  type LeadAcknowledgementItem,
} from "../../../services/leadService";
import { type UserItem } from "../../../services/userService";

type ShareLeadModalProps = {
  lead: LeadItem;
  users: UserItem[];
  onClose: () => void;
  onSuccess: (newShare: LeadAcknowledgementItem) => void;
};

export default function ShareLeadModal({
  lead,
  users,
  onClose,
  onSuccess,
}: ShareLeadModalProps) {
  const { accessToken } = useAuth();
  const toast = useToast();

  const [isClosing, setIsClosing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Pitched colleges for context choices
  const pitchedColleges = (lead.collegeApplications || [])
    .filter((ca: any) => ca.approvalStatus !== "REJECTED" && ca.cancellationReason == null)
    .map((ca: any) => ({
      id: ca.college?.id,
      name: ca.college?.name,
    }))
    .filter((c: any) => Boolean(c.name));

  const [selectedCollegeId, setSelectedCollegeId] = useState<string>(
    pitchedColleges.length > 0 ? pitchedColleges[0].id : ""
  );
  const [context, setContext] = useState(
    pitchedColleges.length > 0 ? pitchedColleges[0].name : ""
  );

  // Recipient selection
  const activeAssignment = lead.assignments?.find(
    (a) => a.status === "ACTIVE" && a.expiresAt && new Date(a.expiresAt).getTime() > Date.now()
  );
  const defaultRecipientId =
    activeAssignment?.userId ||
    activeAssignment?.user?.id ||
    lead.assignments?.[0]?.userId ||
    "";

  const [recipientId, setRecipientId] = useState<string>(defaultRecipientId);

  // Find recipient object for phone/name
  const selectedUser = users.find((u) => u.id === recipientId) || activeAssignment?.user;
  const recipientPhone = (selectedUser as any)?.phone || lead.phone || "";

  const studentName = `${lead.firstName} ${lead.lastName || ""}`.trim();
  const phone = lead.phone || "N/A";
  const email = lead.email || "N/A";
  const course = lead.courseInterested || (lead as any).courseInterestedOther || "N/A";
  const location = [lead.city, lead.state].filter(Boolean).join(", ") || "N/A";
  const prefLocation = [lead.preferredCity, lead.preferredState].filter(Boolean).join(", ");
  const generatedMessage = [
    `*Campus Updates — Lead Details*`,
    `• *Student Name:* ${studentName}`,
    `• *Phone:* ${phone}`,
    `• *Email:* ${email}`,
    `• *Course Interested:* ${course}`,
    `• *Residential Location:* ${location}`,
    prefLocation ? `• *Preferred Study Location:* ${prefLocation}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const handleClose = () => {
    setIsClosing(true);
  };

  const handleAnimationEnd = () => {
    if (isClosing) {
      onClose();
    }
  };

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    setSubmitting(true);
    try {
      // 1. Record the new share event in the backend with the specified context, recipient, and college
      const res = await shareLead(
        accessToken,
        lead.id,
        "WHATSAPP",
        context.trim() || undefined,
        recipientId || undefined,
        selectedCollegeId || undefined,
      );

      // 2. Build WhatsApp URL
      const cleanDigits = recipientPhone ? recipientPhone.replace(/\D/g, "") : "";
      let whatsappUrl = `https://wa.me/?text=${encodeURIComponent(generatedMessage)}`;
      if (cleanDigits && cleanDigits.length >= 10) {
        const formattedPhone = cleanDigits.length === 10 ? `91${cleanDigits}` : cleanDigits;
        whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(generatedMessage)}`;
      }

      // 3. Open WhatsApp in new tab
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");

      toast.success("New share initiated on WhatsApp");
      if (res.share) {
        onSuccess(res.share);
      }
      handleClose();
    } catch (err: any) {
      console.error("Failed to share lead:", err);
      toast.error(err.message || "Failed to initiate lead share");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className={`fixed inset-0 bg-black/50 transition-opacity duration-300 ${isClosing ? "opacity-0" : "opacity-100"
          }`}
      />

      {/* Drawer */}
      <div
        onAnimationEnd={handleAnimationEnd}
        className={`fixed right-0 top-0 h-[100dvh] w-full sm:w-[480px] bg-surface shadow-2xl flex flex-col ${isClosing ? "animate-slide-out-right" : "animate-slide-in-right"
          }`}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Share2 size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">
                Share Lead on WhatsApp
              </h2>
              <p className="text-xs text-text-muted">
                {studentName} (#{lead.id.slice(0, 6).toUpperCase()})
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

        {/* Form Body */}
        <form onSubmit={handleShare} className="min-h-0 flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-5">
          {/* Recipient Selection */}
          <div>
            <label className="block text-xs font-semibold text-text-primary uppercase tracking-wider mb-1.5">
              Recipient Advisor
            </label>
            <div className="relative">
              <select
                value={recipientId}
                onChange={(e) => setRecipientId(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-primary-500 focus:outline-none transition"
              >
                <option value="">Default (Active Assigned Advisor)</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.firstName} {u.lastName || ""} {u.role?.name ? `(${u.role.name})` : ""}
                  </option>
                ))}
              </select>
            </div>
            {selectedUser && (
              <p className="text-xs text-text-muted mt-1 flex items-center gap-1">
                <UserCircle size={13} className="shrink-0 text-text-muted" />
                <span>
                  {selectedUser.firstName} {selectedUser.lastName || ""}
                  {(selectedUser as any).phone ? ` • ${(selectedUser as any).phone}` : ""}
                </span>
              </p>
            )}
          </div>

          {/* Context / College Selection */}
          <div>
            <label className="block text-xs font-semibold text-text-primary uppercase tracking-wider mb-1.5">
              College / Pitch Context
            </label>
            {pitchedColleges.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {pitchedColleges.map((col) => (
                  <button
                    key={col.id || col.name}
                    type="button"
                    onClick={() => {
                      setContext(col.name);
                      setSelectedCollegeId(col.id || "");
                    }}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border transition cursor-pointer ${context === col.name
                      ? "bg-primary-50 text-primary-700 border-primary-300"
                      : "bg-neutral-50 text-text-secondary border-border hover:bg-neutral-100"
                      }`}
                  >
                    <Building2 size={12} />
                    <span>{col.name}</span>
                  </button>
                ))}
              </div>
            )}
            <input
              type="text"
              value={context}
              onChange={(e) => {
                setContext(e.target.value);
                const matchingCol = pitchedColleges.find(
                  (c) => c.name.toLowerCase() === e.target.value.toLowerCase().trim()
                );
                setSelectedCollegeId(matchingCol?.id || "");
              }}
              placeholder="e.g. Pitched College, Special Notes, or Program"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-primary-500 focus:outline-none transition"
            />
          </div>

          {/* Preview Box */}
          <div>
            <label className="block text-xs font-semibold text-text-primary uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <FileText size={13} />
              <span>WhatsApp Message Preview</span>
            </label>
            <div className="rounded-lg bg-neutral-50 border border-border p-3.5 text-xs text-text-secondary font-mono whitespace-pre-wrap leading-relaxed">
              {generatedMessage}
            </div>
            <p className="text-[11px] text-text-muted mt-1.5">
              Opening WhatsApp starts a new share record. Acknowledgement remains pending until verified and acknowledged by an authorized Manager or Team Lead in Campus CRM.
            </p>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-border text-text-secondary hover:bg-neutral-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition disabled:opacity-50 cursor-pointer shadow-xs"
            >
              <Send size={15} />
              <span>{submitting ? "Initiating..." : "Open WhatsApp & Share"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
