import { useState } from "react";
import { X } from "lucide-react";
import TPCForm from "./TPCForm";
import { type LeadItem } from "../../../services/leadService";

type TPCModalProps = {
  lead?: LeadItem;
  onClose: () => void;
  onSuccess: () => void;
};

const TPCModal = ({ lead, onClose, onSuccess }: TPCModalProps) => {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
  };

  const handleAnimationEnd = () => {
    if (isClosing) {
      onClose();
    }
  };

  const handleSuccess = () => {
    if (onSuccess) {
      onSuccess();
    }
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className={`
          fixed inset-0
          bg-black/50
          transition-opacity duration-300
          ${isClosing ? "opacity-0" : "opacity-100"}
        `}
      />

      {/* Drawer on the Right */}
      <div
        onAnimationEnd={handleAnimationEnd}
        className={`
          fixed right-0 top-0
          h-[100dvh]
          w-[42vw]
          min-w-[420px] max-w-[550px]
          bg-surface
          shadow-2xl border-l border-border
          flex flex-col
          ${isClosing ? "animate-slide-out-right" : "animate-slide-in-right"}
        `}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold text-text-primary">
              Assign Third Party Calling (TPC)
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              {lead
                ? `Assign TPC calls for ${lead.firstName} to team members.`
                : "Select a lead and assign TPC calls to team members."}
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="
              rounded-lg p-2 text-text-secondary transition
              hover:bg-neutral-100 hover:text-text-primary
            "
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Form */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
          <TPCForm lead={lead} onSuccess={handleSuccess} />
        </div>
      </div>
    </div>
  );
};

export default TPCModal;
