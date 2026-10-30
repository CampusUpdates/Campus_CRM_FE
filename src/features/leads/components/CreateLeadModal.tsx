import { useState } from "react";
import { X } from "lucide-react";
import CreateLeadForm from "./CreateLeadForm";
import type { LeadItem } from "../../../services/leadService";

type CreateLeadModalProps = {
  onClose: () => void;
  initialLead?: Partial<LeadItem>;
  onSuccess?: (createdLead?: any) => void;
};

const CreateLeadModal = ({ onClose, initialLead, onSuccess }: CreateLeadModalProps) => {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
  };

  const handleAnimationEnd = () => {
    if (isClosing) {
      onClose();
    }
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

      {/* Drawer */}
      <div
        onAnimationEnd={handleAnimationEnd}
        className={`
          fixed right-0 top-0
          h-[100dvh]
          w-full sm:w-[480px] md:w-[560px] lg:w-[640px] xl:w-[45vw]
          max-w-full
          bg-surface
          shadow-2xl
          flex flex-col
          ${isClosing ? "animate-slide-out" : "animate-slide-in"}
        `}
      >

        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-4 sm:px-6 py-4 sm:py-5">

          <div className="min-w-0 pr-2">
            <h2 className="text-lg sm:text-xl font-semibold text-text-primary truncate">
              Create Lead
            </h2>

            <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-text-secondary truncate">
              Add a new lead to the CRM.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="
              shrink-0
              rounded-lg
              p-1.5 sm:p-2
              text-text-secondary
              transition
              hover:bg-neutral-100
              hover:text-text-primary
              cursor-pointer
            "
            title="Close"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>

        </div>

        {/* Scrollable Form */}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 custom-scrollbar">
          <CreateLeadForm
            initialLead={initialLead}
            onSuccess={(created) => {
              if (onSuccess) onSuccess(created);
              handleClose();
            }}
          />
        </div>

      </div>
    </div>
  );
};


export default CreateLeadModal;