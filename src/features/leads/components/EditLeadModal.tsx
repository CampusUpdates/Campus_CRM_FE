import { useEffect, useState } from "react";
import { X, Pencil, RefreshCw } from "lucide-react";
import CreateLeadForm from "./CreateLeadForm";
import { fetchLeadById, type LeadItem } from "../../../services/leadService";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";

type EditLeadModalProps = {
  lead: LeadItem;
  onClose: () => void;
  onSuccess: () => void;
};

const EditLeadModal = ({ lead, onClose, onSuccess }: EditLeadModalProps) => {
  const { accessToken } = useAuth();
  const toast = useToast();

  const [freshLead, setFreshLead] = useState<LeadItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (accessToken && lead.id) {
      setLoading(true);
      fetchLeadById(accessToken, lead.id)
        .then((data) => setFreshLead(data))
        .catch((err) => {
          console.error("Failed to fetch current lead details:", err);
          toast.error("Could not load latest lead data");
          setFreshLead(lead);
        })
        .finally(() => setLoading(false));
    }
  }, [accessToken, lead.id]);

  const handleClose = () => {
    setIsClosing(true);
  };

  const handleAnimationEnd = () => {
    if (isClosing) {
      onClose();
    }
  };

  const currentLead = freshLead || lead;
  const fullName = `${currentLead.firstName} ${currentLead.lastName || ""}`.trim();

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
        className={`fixed right-0 top-0 h-[100dvh] w-[40vw] min-w-[480px] bg-surface shadow-2xl flex flex-col ${
          isClosing ? "animate-slide-out" : "animate-slide-in"
        }`}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-bold">
              <Pencil size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">
                Edit Lead: {fullName}
              </h2>
              <p className="text-xs text-text-muted">
                Update details for lead #{lead.id.slice(0, 6)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-2 text-text-secondary transition hover:bg-neutral-100 hover:text-text-primary"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body invoking CreateLeadForm in Edit Mode with fresh database state */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-sm text-text-secondary">
              <RefreshCw className="animate-spin mr-2" size={18} />
              Loading current lead details from database...
            </div>
          ) : (
            <CreateLeadForm
              initialLead={currentLead}
              isEdit={true}
              onSuccess={() => {
                onSuccess();
                handleClose();
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default EditLeadModal;
