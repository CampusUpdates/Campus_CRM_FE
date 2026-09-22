import { useEffect, useState } from "react";
import { X, Users, RefreshCw, AlertCircle } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import {
  fetchTeams,
  updateUserTeam,
  type UserItem,
  type UserTeam,
} from "../../../services/userService";

type AssignTeamDrawerProps = {
  user: UserItem;
  onClose: () => void;
  onSuccess: (updatedUser: UserItem) => void;
};

const AssignTeamModal = ({ user, onClose, onSuccess }: AssignTeamDrawerProps) => {
  const { accessToken } = useAuth();
  const toast = useToast();

  const [isClosing, setIsClosing] = useState(false);
  const [teams, setTeams] = useState<UserTeam[]>([]);
  const initialTeamId = user.teamId ? String(user.teamId) : "";
  const [selectedTeamId, setSelectedTeamId] = useState<string>(initialTeamId);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleClose = () => {
    if (saving) return;
    setIsClosing(true);
  };

  const handleAnimationEnd = () => {
    if (isClosing) {
      onClose();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [saving]);

  useEffect(() => {
    if (accessToken) {
      setLoadingTeams(true);
      fetchTeams(accessToken)
        .then((data) => {
          setTeams(data);
        })
        .catch((err) => {
          console.error("Failed to load teams:", err);
          setErrorMsg("Failed to load active teams.");
        })
        .finally(() => {
          setLoadingTeams(false);
        });
    }
  }, [accessToken]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!accessToken) return;

    const targetTeamId = selectedTeamId ? Number(selectedTeamId) : null;

    setSaving(true);
    setErrorMsg(null);

    try {
      const updatedUser = await updateUserTeam(accessToken, user.id, targetTeamId);
      const userName = `${user.firstName} ${user.lastName || ""}`.trim();

      if (targetTeamId === null) {
        toast.success(`Removed ${userName} from team.`);
      } else {
        const teamObj = teams.find((t) => t.id === targetTeamId);
        const teamName = teamObj ? teamObj.name : "team";
        toast.success(`Assigned ${userName} to ${teamName}.`);
      }

      onSuccess(updatedUser);
      onClose();
    } catch (err: any) {
      const msg = err.message || "Failed to update team assignment";
      setErrorMsg(msg);
      toast.error(msg);
      setSaving(false);
    }
  };

  const currentTeamName = user.team?.name || (user.teamId ? `Team #${user.teamId}` : "Unassigned");
  const isUnchanged = selectedTeamId === initialTeamId;

  const getSubmitButtonLabel = () => {
    if (selectedTeamId === "" && initialTeamId !== "") {
      return "Remove Team Assignment";
    }
    if (initialTeamId !== "") {
      return "Update Team";
    }
    return "Assign Team";
  };

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

      {/* Right-Side Sliding Drawer */}
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
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-100 text-primary-700 font-semibold shadow-2xs">
              <Users size={20} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-text-primary">
                Assign Team
              </h2>
              <p className="mt-0.5 text-xs text-text-secondary">
                Assign this employee to an operational department team.
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={saving}
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

        {/* Content Form Body */}
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col justify-between overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {errorMsg && (
              <div className="flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700">
                <AlertCircle size={16} className="shrink-0 text-rose-600 mt-0.5" />
                <div className="flex-1">{errorMsg}</div>
              </div>
            )}

            {/* Read-Only Employee Summary Card */}
            <div className="rounded-xl border border-border-light bg-neutral-50/70 p-4 space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                Employee
              </p>
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-text-primary">
                  {user.firstName} {user.lastName || ""}
                </p>
                <p className="text-xs text-text-muted">
                  @{user.username} • {user.email}
                </p>
              </div>

              <div className="mt-3 flex items-center gap-2 text-xs font-medium text-text-secondary pt-2.5 border-t border-border-light">
                <Users size={15} className="text-text-muted shrink-0" />
                <span>Current Team:</span>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                    user.team || user.teamId
                      ? "bg-purple-50 text-purple-700 border-purple-200"
                      : "bg-neutral-100 text-neutral-600 border-neutral-200"
                  }`}
                >
                  {currentTeamName}
                </span>
              </div>
            </div>

            {/* Team Dropdown Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-text-primary uppercase tracking-wider">
                Select Team
              </label>

              {loadingTeams ? (
                <div className="flex items-center gap-2 h-11 px-4 rounded-lg border border-border bg-neutral-50 text-xs text-text-muted">
                  <RefreshCw size={14} className="animate-spin" />
                  Loading active teams...
                </div>
              ) : (
                <select
                  value={selectedTeamId}
                  disabled={saving}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  className="
                    h-11
                    w-full
                    rounded-lg
                    border border-border
                    bg-surface
                    px-4
                    text-sm text-text-primary
                    outline-none
                    transition
                    focus:border-primary-500
                    focus:ring-2
                    focus:ring-primary-100
                    disabled:opacity-60
                  "
                >
                  <option value="">Unassigned</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              )}

              <p className="text-[11px] text-text-muted">
                Select "Unassigned" to remove team assignment.
              </p>
            </div>
          </div>

          {/* Fixed Footer Actions */}
          <div className="flex shrink-0 items-center justify-end gap-3 border-t border-border px-6 py-4 bg-surface">
            <button
              type="button"
              disabled={saving}
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
              type="submit"
              disabled={saving || loadingTeams || isUnchanged}
              className="
                flex items-center gap-2
                rounded-lg
                bg-primary-500
                px-5 py-2.5
                text-sm font-medium
                text-white
                transition
                hover:bg-primary-600
                disabled:opacity-50
              "
            >
              {saving && <RefreshCw size={15} className="animate-spin" />}
              {getSubmitButtonLabel()}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignTeamModal;
