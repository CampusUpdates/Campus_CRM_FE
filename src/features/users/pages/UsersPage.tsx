import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Plus,
  Search,
  UserCheck,
  UserX,
  UserPlus,
  Edit3,
  RefreshCw,
  Users,
  Filter,
} from "lucide-react";

import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import {
  fetchUsers,
  fetchTeams,
  updateUserStatus,
  type UserItem,
  type UserTeam,
} from "../../../services/userService";
import CreateUserModal from "../components/CreateUserModal";
import AssignTeamModal from "../components/AssignTeamModal";
import DeactivateUserDrawer from "../components/DeactivateUserDrawer";
import {
  SectionLoadingState,
  PageErrorState,
  PageEmptyState,
} from "../../../components/common";

const UsersPage = () => {
  const { accessToken, hasRole } = useAuth();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const paramSearch = searchParams.get("search");

  const [users, setUsers] = useState<UserItem[]>([]);
  const [teams, setTeams] = useState<UserTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState(paramSearch || "");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [teamFilter, setTeamFilter] = useState<string>("ALL");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<UserItem | null>(null);

  const [assigningTeamUser, setAssigningTeamUser] = useState<UserItem | null>(null);

  const [deactivatingUser, setDeactivatingUser] = useState<UserItem | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const canAddUser = hasRole(["SUPER_ADMIN", "HR", "MANAGER"]);

  const loadUsers = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchUsers(accessToken);
      setUsers(data);
    } catch (err: any) {
      console.error("Failed to load users:", err);
      const errMsg = err.message || "Failed to load system users.";
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  }, [accessToken, toast]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    if (accessToken) {
      fetchTeams(accessToken)
        .then((data) => setTeams(data))
        .catch((err) => console.error("Failed to load teams for filter:", err));
    }
  }, [accessToken]);

  const handleOpenCreate = () => {
    setUserToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: UserItem) => {
    setUserToEdit(user);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setUserToEdit(null);
  };

  const handleUserSaved = (updatedUser?: UserItem) => {
    if (updatedUser) {
      setUsers((prev) =>
        prev.map((u) => (u.id === updatedUser.id ? updatedUser : u))
      );
    } else {
      loadUsers();
    }
  };

  const handleConfirmDeactivate = async () => {
    if (!accessToken || !deactivatingUser) return;
    const isSuperAdminUser =
      deactivatingUser.role?.name?.toUpperCase() === "SUPER_ADMIN" ||
      deactivatingUser.roleId === 1;

    if (isSuperAdminUser) {
      toast.error("Super Admin accounts cannot be deactivated.");
      setDeactivatingUser(null);
      return;
    }

    setStatusUpdating(true);
    try {
      const updated = await updateUserStatus(
        accessToken,
        deactivatingUser.id,
        "INACTIVE"
      );
      setUsers((prev) =>
        prev.map((u) => (u.id === updated.id ? updated : u))
      );
      toast.success(
        `Deactivated employee ${deactivatingUser.firstName} ${deactivatingUser.lastName || ""}`.trim()
      );
      setDeactivatingUser(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to deactivate employee.");
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleActivateUser = async (user: UserItem) => {
    if (!accessToken) return;
    setStatusUpdating(true);
    try {
      const updated = await updateUserStatus(accessToken, user.id, "ACTIVE");
      setUsers((prev) =>
        prev.map((u) => (u.id === updated.id ? updated : u))
      );
      toast.success(
        `Activated employee ${user.firstName} ${user.lastName || ""}`.trim()
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to activate employee.");
    } finally {
      setStatusUpdating(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const term = searchTerm.toLowerCase();
    const fullName = `${u.firstName} ${u.lastName || ""}`.toLowerCase();
    const email = u.email.toLowerCase();
    const username = u.username.toLowerCase();
    const phone = u.phone.toLowerCase();

    const matchesSearch =
      fullName.includes(term) ||
      email.includes(term) ||
      username.includes(term) ||
      phone.includes(term);

    const matchesStatus =
      statusFilter === "ALL" || (u.status || "ACTIVE") === statusFilter;

    let matchesTeam = true;
    if (teamFilter === "UNASSIGNED") {
      matchesTeam = !u.team && !u.teamId;
    } else if (teamFilter !== "ALL") {
      const targetId = Number(teamFilter);
      matchesTeam = u.teamId === targetId || u.team?.id === targetId;
    }

    return matchesSearch && matchesStatus && matchesTeam;
  });

  return (
    <div className="space-y-6 max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-text-primary">
            User Management
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-text-secondary">
            Manage system users, employee profiles, roles, teams, and account access.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
          <button
            onClick={loadUsers}
            title="Refresh users"
            className="p-2 sm:p-2.5 rounded-lg border border-border bg-surface text-text-secondary hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
          >
            <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
          </button>

          {canAddUser && (
            <button
              onClick={handleOpenCreate}
              className="
                flex items-center gap-2
                rounded-lg
                bg-primary-500
                px-3.5 py-2 sm:px-4 sm:py-2.5
                text-xs sm:text-sm font-medium
                text-white
                transition
                hover:bg-primary-600
                cursor-pointer shadow-2xs
              "
            >
              <Plus size={17} />
              Add User
            </button>
          )}
        </div>
      </div>

      {/* Filters: Search, Status, Team */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Search
            size={17}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="text"
            placeholder="Search users by name, username, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="
              h-10 sm:h-11
              w-full
              rounded-lg
              border
              border-border
              bg-surface
              pl-10
              pr-4
              text-xs sm:text-sm
              outline-none
              transition
              focus:border-primary-500
              focus:ring-2
              focus:ring-primary-100
            "
          />
        </div>

        {/* Dropdowns Row on Mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:w-auto shrink-0">
          {/* Status Filter */}
          <div className="relative flex items-center gap-2 sm:w-44">
            <Filter size={16} className="text-text-muted shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="
                h-10 sm:h-11
                w-full
                rounded-lg
                border border-border
                bg-surface
                px-3
                text-xs sm:text-sm text-text-primary
                outline-none
                transition
                focus:border-primary-500
                focus:ring-2
                focus:ring-primary-100
                cursor-pointer
              "
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>

          {/* Team Filter */}
          <div className="relative flex items-center gap-2 sm:w-48">
            <Users size={16} className="text-text-muted shrink-0" />
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="
                h-10 sm:h-11
                w-full
                rounded-lg
                border border-border
                bg-surface
                px-3
                text-xs sm:text-sm text-text-primary
                outline-none
                transition
                focus:border-primary-500
                focus:ring-2
                focus:ring-primary-100
                cursor-pointer
              "
            >
              <option value="ALL">All Teams</option>
              <option value="UNASSIGNED">Unassigned</option>
              {teams.map((t) => (
                <option key={t.id} value={String(t.id)}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-2xs">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="border-b border-border bg-neutral-50 dark:bg-neutral-800/50">
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  User Details
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Contact
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Role / Team
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Status
                </th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <SectionLoadingState
                  isTableRow
                  colSpan={5}
                  message="Loading system users..."
                />
              ) : error ? (
                <PageErrorState
                  isTableRow
                  colSpan={5}
                  title="Failed to load users"
                  message={error}
                  onRetry={loadUsers}
                />
              ) : filteredUsers.length === 0 ? (
                <PageEmptyState
                  isTableRow
                  colSpan={5}
                  icon={Users}
                  title="No users found"
                  message={
                    searchTerm || statusFilter !== "ALL" || teamFilter !== "ALL"
                      ? "No users matched your filter criteria."
                      : "No users exist in the system yet."
                  }
                />
              ) : (
                filteredUsers.map((user) => {
                  const fullName = `${user.firstName} ${user.lastName || ""}`.trim();
                  const initials = `${user.firstName[0] || ""}${
                    user.lastName ? user.lastName[0] : ""
                  }`.toUpperCase();

                  const isActive = user.status === "ACTIVE";
                  const isSuperAdminRole =
                    user.role?.name?.toUpperCase() === "SUPER_ADMIN" ||
                    user.roleId === 1;

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/30 transition"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300 font-semibold text-xs shrink-0">
                            {initials || "U"}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-text-primary truncate">
                              {fullName}
                            </p>
                            <p className="text-xs text-text-muted truncate">
                              @{user.username}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-sm text-text-secondary">
                        <div className="space-y-0.5">
                          <p className="truncate text-xs sm:text-sm text-text-primary">{user.email}</p>
                          <p className="text-xs text-text-muted">{user.phone}</p>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-sm text-text-secondary">
                        <div className="flex flex-col gap-1 items-start">
                          <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/60 px-2 py-0.5 text-xs font-medium text-purple-700 dark:text-purple-300">
                            <UserCheck size={13} />
                            {user.role?.name || `Role ${user.roleId}`}
                          </span>
                          {user.team ? (
                            <span className="inline-flex items-center gap-1 text-xs text-text-muted truncate">
                              Team: <strong className="text-text-primary">{user.team.name}</strong>
                            </span>
                          ) : user.teamId ? (
                            <span className="inline-flex items-center gap-1 text-xs text-text-muted truncate">
                              Team: <strong className="text-text-primary">Team #{user.teamId}</strong>
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-md bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 px-2 py-0.5 text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                              Unassigned
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                            isActive
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                              : user.status === "SUSPENDED"
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                              : "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isActive
                                ? "bg-emerald-500"
                                : user.status === "SUSPENDED"
                                ? "bg-amber-500"
                                : "bg-rose-500"
                            }`}
                          />
                          {user.status || "ACTIVE"}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Edit User Button (Icon) */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(user)}
                            title="Edit user"
                            aria-label="Edit user"
                            className="p-2 rounded-lg text-text-secondary hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-primary-600 transition cursor-pointer"
                          >
                            <Edit3 size={17} />
                          </button>

                          {/* Assign / Change Team Button (Icon) */}
                          <button
                            type="button"
                            onClick={() => setAssigningTeamUser(user)}
                            title="Assign team"
                            aria-label="Assign team"
                            className="p-2 rounded-lg text-text-secondary hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-purple-600 transition cursor-pointer"
                          >
                            <UserPlus size={17} />
                          </button>

                          {/* Account Access Deactivate / Reactivate Control: Hidden for Super Admin */}
                          {!isSuperAdminRole ? (
                            isActive ? (
                              <button
                                type="button"
                                disabled={statusUpdating}
                                onClick={() => setDeactivatingUser(user)}
                                title="Deactivate employee account"
                                aria-label="Deactivate employee account"
                                className="p-2 rounded-lg text-text-secondary hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 transition disabled:opacity-50 cursor-pointer"
                              >
                                <UserX size={17} />
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={statusUpdating}
                                onClick={() => handleActivateUser(user)}
                                title="Activate employee account"
                                aria-label="Activate employee account"
                                className="p-2 rounded-lg text-text-secondary hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 transition disabled:opacity-50 cursor-pointer"
                              >
                                <UserCheck size={17} />
                              </button>
                            )
                          ) : (
                            /* Super Admin is protected: placeholder keeps alignment uniform without any deactivation trigger */
                            <div className="w-8 h-8" aria-hidden="true" />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit / Create Modal */}
      {isModalOpen && (
        <CreateUserModal
          userToEdit={userToEdit}
          onClose={handleModalClose}
          onSuccessWithUser={handleUserSaved}
        />
      )}

      {/* Assign Team Modal */}
      {assigningTeamUser && (
        <AssignTeamModal
          user={assigningTeamUser}
          onClose={() => setAssigningTeamUser(null)}
          onSuccess={handleUserSaved}
        />
      )}

      {/* Deactivation Confirmation Drawer */}
      {deactivatingUser && (
        <DeactivateUserDrawer
          user={deactivatingUser}
          onClose={() => setDeactivatingUser(null)}
          onConfirm={handleConfirmDeactivate}
          isSubmitting={statusUpdating}
        />
      )}
    </div>
  );
};

export default UsersPage;
