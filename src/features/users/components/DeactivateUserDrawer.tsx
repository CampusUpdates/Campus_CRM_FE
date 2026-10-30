import { useEffect, useState } from "react";
import { X, RefreshCw, UserX, ShieldAlert } from "lucide-react";
import type { UserItem } from "../../../services/userService";

type DeactivateUserDrawerProps = {
  user: UserItem;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isSubmitting?: boolean;
};

export const DeactivateUserDrawer = ({
  user,
  onClose,
  onConfirm,
  isSubmitting = false,
}: DeactivateUserDrawerProps) => {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    if (isSubmitting) return;
    setIsClosing(true);
  };

  const handleAnimationEnd = () => {
    if (isClosing) {
      onClose();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSubmitting]);

  const fullName = `${user.firstName} ${user.lastName || ""}`.trim();
  const roleName = user.role?.name || `Role #${user.roleId}`;
  const teamName = user.team?.name || (user.teamId ? `Team #${user.teamId}` : "Unassigned");

  return (
    <div className="fixed inset-0 z-[110]">
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

      {/* Right-Side Sliding Panel */}
      <div
        onAnimationEnd={handleAnimationEnd}
        className={`
          fixed right-0 top-0
          h-[100dvh]
          w-full sm:w-[460px]
          max-w-[100vw] sm:max-w-[90vw]
          bg-surface
          shadow-2xl
          border-l border-border
          flex flex-col
          z-10
          ${isClosing ? "animate-slide-out" : "animate-slide-in"}
        `}
      >
        {/* Drawer Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-5 bg-surface">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60">
              <UserX size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary">
                Deactivate Employee
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Revoke login access while preserving CRM history.
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleClose}
            aria-label="Close drawer"
            className="
              rounded-lg
              p-2
              text-text-muted
              transition
              hover:bg-neutral-100 dark:hover:bg-neutral-800
              hover:text-text-primary
              disabled:opacity-50
            "
          >
            <X size={20} />
          </button>
        </div>

        {/* Drawer Body - Scrollable with comfortable padding */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 custom-scrollbar">
          {/* Target Employee Info Card */}
          <div className="rounded-xl border border-border bg-neutral-50/70 dark:bg-neutral-900/50 p-4 space-y-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              Employee Account
            </span>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300 font-bold text-sm">
                {`${user.firstName[0] || ""}${user.lastName ? user.lastName[0] : ""}`.toUpperCase() || "U"}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-text-primary truncate">
                  {fullName}
                </h3>
                <p className="text-xs text-text-secondary truncate mt-0.5">
                  @{user.username} • {user.email}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-border/60 text-xs">
              <div>
                <span className="text-[10px] uppercase font-semibold text-text-muted block">Role</span>
                <span className="font-medium text-text-primary">{roleName}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-text-muted block">Team</span>
                <span className="font-medium text-text-primary">{teamName}</span>
              </div>
            </div>
          </div>

          {/* Confirmation Notice */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-text-primary">
              Are you sure you want to deactivate {fullName}?
            </h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              Once deactivated, this employee will no longer be able to sign in or perform operations in Campus CRM. Any active sessions will be invalidated.
            </p>
          </div>

          {/* Retention & Non-destructive Notice Box */}
          <div className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 p-4 space-y-2">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-semibold text-xs">
              <ShieldAlert size={16} className="shrink-0" />
              <span>Historical Records & Data Retention</span>
            </div>
            <p className="text-xs text-amber-900/90 dark:text-amber-200/90 leading-relaxed font-normal">
              Their existing leads, student assignments, activity logs, interview evaluations, attendance records, and performance metrics will <strong className="font-semibold">remain completely intact</strong>.
            </p>
            <p className="text-[11px] text-amber-700/80 dark:text-amber-300/70 pt-1 border-t border-amber-200/60 dark:border-amber-900/40">
              You can reactivate this employee account at any time from the User Management dashboard.
            </p>
          </div>
        </div>

        {/* Drawer Footer Actions */}
        <div className="flex shrink-0 items-center justify-end gap-3 border-t border-border px-6 py-4 bg-surface">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleClose}
            className="
              px-4 py-2.5 rounded-xl
              border border-border
              text-xs font-semibold
              text-text-secondary
              hover:bg-neutral-100 dark:hover:bg-neutral-800
              hover:text-text-primary
              transition
              disabled:opacity-50
              cursor-pointer
            "
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={onConfirm}
            className="
              flex items-center gap-2
              px-5 py-2.5 rounded-xl
              bg-rose-600 hover:bg-rose-700
              text-xs font-semibold
              text-white
              shadow-sm transition
              disabled:opacity-50
              cursor-pointer
            "
          >
            {isSubmitting && <RefreshCw size={14} className="animate-spin" />}
            Deactivate Employee
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeactivateUserDrawer;
