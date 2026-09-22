import { useState } from "react";
import { X } from "lucide-react";
import AddCandidateForm from "./AddCandidateForm";

type AddCandidateModalProps = {
  onClose: () => void;
  onSuccess?: () => void;
};

const AddCandidateModal = ({ onClose, onSuccess }: AddCandidateModalProps) => {
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

      {/* Drawer */}
      <div
        onAnimationEnd={handleAnimationEnd}
        className={`
          fixed right-0 top-0
          h-[100dvh]
          w-[42vw]
          min-w-[450px]
          bg-surface
          shadow-2xl
          flex flex-col
          ${isClosing ? "animate-slide-out" : "animate-slide-in"}
        `}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold text-text-primary">
              Add Candidate
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              Register a new job applicant for open recruitment positions.
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
          <AddCandidateForm onSuccess={handleSuccess} />
        </div>
      </div>
    </div>
  );
};

export default AddCandidateModal;
