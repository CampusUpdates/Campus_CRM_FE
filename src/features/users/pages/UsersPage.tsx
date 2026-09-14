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
  AlertTriangle,
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

const UsersPage = () => {
  const { accessToken, hasRole } = useAuth();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const paramSearch = searchParams.get("search");

  const [users, setUsers] = useState<UserItem[]>([]);
  const [teams, setTeams] = useState<UserTeam[]>([]);
  const [loading, setLoading] = useState(true);
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
    try {
      const data = await fetchUsers(accessToken);
      setUsers(data);
    } catch (err) {
      console.error("Failed to load users:", err);
      toast.error("Failed to load system users.");
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">
            User Management
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Manage system users, employee profiles, roles, teams, and account access.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadUsers}
            title="Refresh users"
            className="p-2.5 rounded-lg border border-border bg-surface text-text-secondary hover:bg-neutral-100 transition"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>

          {canAddUser && (
            <button
              onClick={handleOpenCreate}
              className="
                flex items-center gap-2
                rounded-lg
                bg-primary-500
                px-4 py-2.5
                text-sm font-medium
                text-white
                transition
                hover:bg-primary-600
              "
            >
              <Plus size={18} />
              Add User
            </button>
          )}
        </div>
      </div>

      {/* Filters: Search, Status, Team */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="text"
            placeholder="Search users by name, username, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="
              h-11
              w-full
              rounded-lg
              border
              border-border
              bg-surface
              pl-11
              pr-4
              text-sm
              outline-none
              transition
              focus:border-primary-500
              focus:ring-2
              focus:ring-primary-100
            "
          />
        </div>

        {/* Status Filter */}
        <div className="relative flex items-center gap-2 sm:w-44">
          <Filter size={16} className="text-text-muted shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="
              h-11
              w-full
              rounded-lg
              border border-border
              bg-surface
              px-3
              text-sm text-text-primary
              outline-none
              transition
              focus:border-primary-500
              focus:ring-2
              focus:ring-primary-100
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
              h-11
              w-full
              rounded-lg
              border border-border
              bg-surface
              px-3
              text-sm text-text-primary
              outline-none
              transition
              focus:border-primary-500
              focus:ring-2
              focus:ring-primary-100
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

      {/* Users Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        {loading ? (
          <div className="flex items-center justify-center p-12 text-sm text-text-secondary">
            <RefreshCw className="animate-spin mr-2" size={18} />
            Loading system users...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mb-3 text-text-muted">
              <Users size={24} />
            </div>
            <h3 className="text-base font-semibold text-text-primary">
              No users found
            </h3>
            <p className="text-sm text-text-secondary mt-1 max-w-sm">
              {searchTerm || statusFilter !== "ALL" || teamFilter !== "ALL"
                ? "No users matched your filter criteria."
                : "No users exist in the system yet."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-neutral-50">
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-text-secondary">
                    User Details
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-text-secondary">
                    Contact
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-text-secondary">
                    Role / Team
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-text-secondary">
                    Status
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase text-text-secondary">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const fullName = `${user.firstName} ${user.lastName || ""}`.trim();
                  const initials = `${user.firstName[0] || ""}${
                    user.lastName ? user.lastName[0] : ""
                  }`.toUpperCase();

                  const isActive = user.status === "ACTIVE";

                  return (
                    <tr
                      key={user.id}
                      className="border-b border-border last:border-0 hover:bg-neutral-50/50 transition"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-semibold text-xs shrink-0">
                            {initials || "U"}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-text-primary">
                              {fullName}
                            </p>
                            <p className="text-xs text-text-muted">
                              @{user.username}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm text-text-secondary">
                        <div>
                          <p>{user.email}</p>
                          <p className="text-xs text-text-muted">{user.phone}</p>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm text-text-secondary">
                        <div className="flex flex-col gap-1 items-start">
                          <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 border border-purple-200 px-2.5 py-0.5 text-xs font-medium text-purple-700">
                            <UserCheck size={13} />
                            {user.role?.name || `Role ${user.roleId}`}
                          </span>
                          {user.team ? (
                            <span className="inline-flex items-center gap-1 text-xs text-text-muted">
                              Team: <strong className="text-text-primary">{user.team.name}</strong>
                            </span>
                          ) : user.teamId ? (
                            <span className="inline-flex items-center gap-1 text-xs text-text-muted">
                              Team: <strong className="text-text-primary">Team #{user.teamId}</strong>
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-md bg-neutral-100 border border-neutral-200 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
                              Unassigned
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                            isActive
                              ? "bg-emerald-100 text-emerald-700"
                              : user.status === "SUSPENDED"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-rose-100 text-rose-700"
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

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Edit User Button (Icon) */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(user)}
                            title="Edit user"
                            aria-label="Edit user"
                            className="p-2 rounded-lg text-text-secondary hover:bg-neutral-100 hover:text-primary-600 transition"
                          >
                            <Edit3 size={17} />
                          </button>

                          {/* Assign / Change Team Button (Icon) */}
                          <button
                            type="button"
                            onClick={() => setAssigningTeamUser(user)}
                            title="Assign team"
                            aria-label="Assign team"
                            className="p-2 rounded-lg text-text-secondary hover:bg-neutral-100 hover:text-purple-600 transition"
                          >
                            <UserPlus size={17} />
                          </button>

                          {/* Account Access Deactivate / Reactivate Control */}
                          {isActive ? (
                            <button
                              type="button"
                              disabled={statusUpdating}
                              onClick={() => setDeactivatingUser(user)}
                              title="Deactivate employee account"
                              aria-label="Deactivate employee account"
                              className="p-2 rounded-lg text-text-secondary hover:bg-rose-50 hover:text-rose-600 transition disabled:opacity-50"
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
                              className="p-2 rounded-lg text-text-secondary hover:bg-emerald-50 hover:text-emerald-600 transition disabled:opacity-50"
                            >
                              <UserCheck size={17} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
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

      {/* Deactivation Confirmation Modal */}
      {deactivatingUser && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 animate-fade-in">
          <div className="w-full max-w-md rounded-xl bg-surface p-6 shadow-xl border border-border space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <AlertTriangle size={24} className="shrink-0" />
              <h3 className="text-lg font-semibold text-text-primary">
                Deactivate Employee?
              </h3>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">
              <strong>{`${deactivatingUser.firstName} ${deactivatingUser.lastName || ""}`.trim()}</strong> will no longer be able to log in to Campus CRM.
              <br />
              <br />
              Their existing leads, assignments, activity, and historical records will remain intact.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={statusUpdating}
                onClick={() => setDeactivatingUser(null)}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-border text-text-secondary hover:bg-neutral-100 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={statusUpdating}
                onClick={handleConfirmDeactivate}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition disabled:opacity-50 flex items-center gap-2"
              >
                {statusUpdating && (
                  <RefreshCw size={14} className="animate-spin" />
                )}
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
