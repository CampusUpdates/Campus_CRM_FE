import { useEffect, useState } from "react";
import { X, Shield, Users, AlertTriangle, RefreshCw } from "lucide-react";
import type { TeamItem } from "../../../services/teamService";

type DeleteTeamDrawerProps = {
  team: TeamItem;
  onClose: () => void;
  onConfirm: (team: TeamItem) => Promise<void>;
};

const DeleteTeamDrawer = ({ team, onClose, onConfirm }: DeleteTeamDrawerProps) => {
  const [isClosing, setIsClosing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const memberCount = team.memberCount ?? 0;

  const handleClose = () => {
    if (deleting) return;
    setIsClosing(true);
  };

  const handleAnimationEnd = () => {
    if (isClosing) {
      onClose();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !deleting) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [deleting]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onConfirm(team);
    } catch {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className={`
          fixed inset-0
          bg-black/60 backdrop-blur-xs
          transition-opacity duration-300
          ${isClosing ? "opacity-0" : "opacity-100"}
        `}
      />

      {/* Right Sliding Drawer */}
      <div
        onAnimationEnd={handleAnimationEnd}
        className={`
          fixed right-0 top-0
          h-[100dvh]
          w-[420px]
          max-w-[90vw]
          bg-surface
          shadow-2xl
          border-l border-border
          flex flex-col
          ${isClosing ? "animate-slide-out" : "animate-slide-in"}
        `}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-5">
          <div className="flex items-center gap-2.5 text-rose-600">
            <AlertTriangle size={22} className="shrink-0" />
            <h2 className="text-xl font-semibold text-text-primary">
              Delete Team
            </h2>
          </div>

          <button
            type="button"
            disabled={deleting}
            onClick={handleClose}
            aria-label="Close drawer"
            className="
              rounded-lg
              p-2
              text-text-secondary
              transition
              hover:bg-neutral-100
              hover:text-text-primary
              disabled:opacity-50
            "
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Target Team Details Card */}
          <div className="rounded-xl border border-border bg-neutral-50/70 p-4 space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-700 font-semibold">
                <Shield size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-semibold text-text-primary truncate">
                  {team.name}
                </h3>
                {team.manager && (
                  <p className="text-xs text-text-muted truncate">
                    Manager: {team.manager.firstName} {team.manager.lastName || ""}
                  </p>
                )}
              </div>
            </div>

            {team.description && (
              <p className="text-xs text-text-secondary line-clamp-2 pt-1 border-t border-border-light">
                {team.description}
              </p>
            )}
          </div>

          {/* Confirmation Wording */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-text-primary">
              Are you sure you want to delete this team?
            </h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              This action will permanently delete the team. Any employees currently assigned to this team will be moved to <strong className="text-text-primary">Unassigned</strong>.
            </p>
          </div>

          {/* Warning Box: Employees Affected */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 space-y-2">
            <div className="flex items-center gap-2 text-amber-800 font-semibold text-xs uppercase tracking-wider">
              <Users size={15} className="text-amber-600 shrink-0" />
              Employees affected
            </div>

            {memberCount > 0 ? (
              <p className="text-xs text-amber-900 font-medium leading-relaxed">
                <strong>{memberCount} employee{memberCount === 1 ? "" : "s"}</strong> will automatically become Unassigned.
              </p>
            ) : (
              <p className="text-xs text-amber-900 font-medium leading-relaxed">
                No employees are currently assigned to it.
              </p>
            )}

            <p className="text-[11px] text-amber-700 pt-1.5 border-t border-amber-200/60">
              Their leads, activities, TPCs, attendance, and other CRM data will remain unchanged.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex shrink-0 items-center justify-end gap-3 border-t border-border px-6 py-4">
          <button
            type="button"
            disabled={deleting}
            onClick={handleClose}
            className="
              rounded-lg
              border border-border
              px-4 py-2.5
              text-sm font-medium
              text-text-secondary
              transition
              hover:bg-neutral-100
              disabled:opacity-50
            "
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={deleting}
            onClick={handleDelete}
            className="
              flex items-center gap-2
              rounded-lg
              bg-rose-600
              px-5 py-2.5
              text-sm font-medium
              text-white
              transition
              hover:bg-rose-700
              disabled:opacity-50
            "
          >
            {deleting && <RefreshCw size={15} className="animate-spin" />}
            Delete Team
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteTeamDrawer;
