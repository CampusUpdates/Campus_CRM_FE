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
          bg-black/70 backdrop-blur-xs
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
          bg-slate-900
          shadow-2xl
          border-l border-slate-800
          text-slate-100
          flex flex-col
          ${isClosing ? "animate-slide-out-right" : "animate-slide-in-right"}
        `}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-800 px-6 py-5 bg-slate-900">
          <div className="flex items-center gap-2.5 text-rose-400">
            <AlertTriangle size={22} className="shrink-0" />
            <h2 className="text-xl font-bold text-slate-100">
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
              text-slate-400
              transition
              hover:bg-slate-800
              hover:text-slate-100
              disabled:opacity-50
            "
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 space-y-6 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-slate-900 [&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full">
          {/* Target Team Details Card */}
          <div className="rounded-xl border border-slate-700/80 bg-slate-800/70 p-4 space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-950 border border-emerald-700/60 text-emerald-400 font-semibold">
                <Shield size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold text-slate-100 truncate">
                  {team.name}
                </h3>
                {team.manager && (
                  <p className="text-xs text-slate-400 truncate">
                    Manager: {team.manager.firstName} {team.manager.lastName || ""}
                  </p>
                )}
              </div>
            </div>

            {team.description && (
              <p className="text-xs text-slate-300 line-clamp-2 pt-2 border-t border-slate-700/60">
                {team.description}
              </p>
            )}
          </div>

          {/* Confirmation Wording */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-200">
              Are you sure you want to delete this team?
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              This action will permanently delete the team. Any employees currently assigned to this team will be moved to <strong className="text-slate-200 font-semibold">Unassigned</strong>.
            </p>
          </div>

          {/* Warning Box: Employees Affected */}
          <div className="rounded-xl border border-amber-900/60 bg-amber-950/40 p-4 space-y-2">
            <div className="flex items-center gap-2 text-amber-300 font-semibold text-xs uppercase tracking-wider">
              <Users size={15} className="text-amber-400 shrink-0" />
              Employees affected
            </div>

            {memberCount > 0 ? (
              <p className="text-xs text-amber-200 font-medium leading-relaxed">
                <strong>{memberCount} employee{memberCount === 1 ? "" : "s"}</strong> will automatically become Unassigned.
              </p>
            ) : (
              <p className="text-xs text-amber-200 font-medium leading-relaxed">
                No employees are currently assigned to it.
              </p>
            )}

            <p className="text-[11px] text-amber-300/80 pt-1.5 border-t border-amber-900/50">
              Their leads, activities, TPCs, attendance, and other CRM data will remain unchanged.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-800 bg-slate-900 px-6 py-4">
          <button
            type="button"
            disabled={deleting}
            onClick={handleClose}
            className="
              rounded-lg
              border border-slate-700
              bg-slate-800/80
              px-4 py-2.5
              text-sm font-medium
              text-slate-300
              transition
              hover:bg-slate-800
              hover:text-white
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
              hover:bg-rose-500
              disabled:opacity-50
              shadow-sm
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
