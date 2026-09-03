import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, Search, UserCheck, RefreshCw, Users } from "lucide-react";

import { useAuth } from "../../../context/AuthContext";
import { fetchUsers, type UserItem } from "../../../services/userService";
import CreateUserModal from "../components/CreateUserModal";

const UsersPage = () => {
  const { accessToken, hasRole } = useAuth();
  const [searchParams] = useSearchParams();
  const paramSearch = searchParams.get("search");

  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(paramSearch || "");
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);


  const canAddUser = hasRole(["SUPER_ADMIN", "HR", "MANAGER"]);

  const loadUsers = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const data = await fetchUsers(accessToken);
      setUsers(data);
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filteredUsers = users.filter((u) => {
    const term = searchTerm.toLowerCase();
    const fullName = `${u.firstName} ${u.lastName || ""}`.toLowerCase();
    const email = u.email.toLowerCase();
    const username = u.username.toLowerCase();
    const phone = u.phone.toLowerCase();

    return (
      fullName.includes(term) ||
      email.includes(term) ||
      username.includes(term) ||
      phone.includes(term)
    );
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
            Manage system users, employee profiles, roles, and temporary credentials.
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
              onClick={() => setIsCreateUserOpen(true)}
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

      {/* Search */}
      <div className="flex items-center gap-3">
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
            <h3 className="text-base font-semibold text-text-primary">No users found</h3>
            <p className="text-sm text-text-secondary mt-1 max-w-sm">
              {searchTerm
                ? "No users matched your search criteria."
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
                  const initials = `${user.firstName[0] || ""}${user.lastName ? user.lastName[0] : ""}`.toUpperCase();

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
                          {user.team && (
                            <span className="text-xs text-text-muted">
                              Team: {user.team.name}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            user.status === "ACTIVE"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-rose-100 text-rose-700"
                          }`}
                        >
                          {user.status || "ACTIVE"}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button className="text-sm font-medium text-primary-600 hover:text-primary-700">
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {isCreateUserOpen && (
        <CreateUserModal
          onClose={() => {
            setIsCreateUserOpen(false);
            loadUsers();
          }}
        />
      )}
    </div>
  );
};

export default UsersPage;
