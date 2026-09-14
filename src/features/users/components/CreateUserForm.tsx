import { useEffect, useState } from "react";
import { Copy, Check, Key, ShieldCheck } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import {
  createUser,
  updateUser,
  fetchRoles,
  fetchTeams,
  type CreateUserPayload,
  type CreateUserResponse,
  type UserItem,
  type UserRole,
  type UserTeam,
} from "../../../services/userService";

type CreateUserFormProps = {
  userToEdit?: UserItem | null;
  onSuccess?: (updatedUser?: UserItem) => void;
};

const CreateUserForm = ({ userToEdit, onSuccess }: CreateUserFormProps) => {
  const { accessToken, user: currentUser } = useAuth();
  const toast = useToast();

  const isSuperAdmin = currentUser?.roleCode === "SUPER_ADMIN" || currentUser?.roleId === 1;

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    alternatePhone: "",
    dob: "",
    roleId: "",
    teamId: "",
  });

  const [roles, setRoles] = useState<UserRole[]>([]);
  const [teams, setTeams] = useState<UserTeam[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdUserCredentials, setCreatedUserCredentials] = useState<CreateUserResponse | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (userToEdit) {
      let formattedDob = "";
      if (userToEdit.dob) {
        try {
          formattedDob = new Date(userToEdit.dob).toISOString().split("T")[0];
        } catch (e) {
          formattedDob = "";
        }
      }

      setFormData({
        firstName: userToEdit.firstName || "",
        lastName: userToEdit.lastName || "",
        email: userToEdit.email || "",
        phone: userToEdit.phone || "",
        alternatePhone: userToEdit.alternatePhone || "",
        dob: formattedDob,
        roleId: userToEdit.roleId ? String(userToEdit.roleId) : "",
        teamId: userToEdit.teamId ? String(userToEdit.teamId) : "",
      });
    }
  }, [userToEdit]);

  useEffect(() => {
    if (accessToken) {
      fetchRoles(accessToken)
        .then((data) => setRoles(data))
        .catch((err) => console.error("Failed to load roles:", err));

      fetchTeams(accessToken)
        .then((data) => setTeams(data))
        .catch((err) => console.error("Failed to load teams:", err));
    }
  }, [accessToken]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`${fieldName} copied to clipboard!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!accessToken) return;

    // Client-side validation
    if (!formData.firstName.trim()) {
      const msg = "First name is required";
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }

    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      const msg = "Please enter a valid email address";
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }

    if (!formData.phone.trim()) {
      const msg = "Phone number is required";
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }

    if (!formData.roleId) {
      const msg = "Please select a user role";
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const payload: CreateUserPayload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim() || undefined,
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        alternatePhone: formData.alternatePhone.trim() || undefined,
        dob: formData.dob ? new Date(formData.dob).toISOString() : undefined,
        roleId: Number(formData.roleId),
        teamId: formData.teamId ? Number(formData.teamId) : null,
      };

      if (userToEdit) {
        const updated = await updateUser(accessToken, userToEdit.id, payload);
        toast.success("Employee profile updated successfully!");
        if (onSuccess) onSuccess(updated);
      } else {
        const result = await createUser(accessToken, payload);
        setCreatedUserCredentials(result);
        toast.success("User account created successfully!");
      }
    } catch (err: any) {
      const msg = err.message || (userToEdit ? "Failed to update user" : "Failed to create user");
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };


  // If user was created, show generated Credentials & Token Card
  if (createdUserCredentials) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-5">
          <div className="flex items-center gap-3 text-emerald-800 font-semibold text-lg">
            <ShieldCheck size={24} className="text-emerald-600 shrink-0" />
            User Account Created Successfully
          </div>
          <p className="mt-1 text-sm text-emerald-700">
            Provide the following temporary credentials and security token to the newly created employee.
          </p>
        </div>

        <div className="space-y-4 rounded-xl border border-border bg-neutral-50 p-5">
          {/* User ID */}
          <div>
            <label className="text-xs font-semibold text-text-secondary uppercase">
              User ID (UUID)
            </label>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={createdUserCredentials.id}
                className="h-10 flex-1 rounded-lg border border-border bg-surface px-3 font-mono text-xs text-text-primary"
              />
              <button
                onClick={() => handleCopy(createdUserCredentials.id, "User ID")}
                className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-text-primary hover:bg-neutral-100 transition"
              >
                {copiedField === "User ID" ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                Copy
              </button>
            </div>
          </div>

          {/* Username */}
          <div>
            <label className="text-xs font-semibold text-text-secondary uppercase">
              Generated Username
            </label>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={createdUserCredentials.username}
                className="h-10 flex-1 rounded-lg border border-border bg-surface px-3 font-mono text-sm font-semibold text-primary-700"
              />
              <button
                onClick={() => handleCopy(createdUserCredentials.username, "Username")}
                className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-text-primary hover:bg-neutral-100 transition"
              >
                {copiedField === "Username" ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                Copy
              </button>
            </div>
          </div>

          {/* Temporary Password */}
          <div>
            <label className="text-xs font-semibold text-text-secondary uppercase">
              Temporary Password
            </label>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={createdUserCredentials.temporaryPassword}
                className="h-10 flex-1 rounded-lg border border-border bg-surface px-3 font-mono text-sm font-bold text-rose-700"
              />
              <button
                onClick={() => handleCopy(createdUserCredentials.temporaryPassword, "Temporary Password")}
                className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-text-primary hover:bg-neutral-100 transition"
              >
                {copiedField === "Temporary Password" ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                Copy
              </button>
            </div>
          </div>

          {/* Temporary JWT Token */}
          <div>
            <label className="text-xs font-semibold text-text-secondary uppercase flex items-center gap-1">
              <Key size={14} className="text-primary-600" /> Temporary Auth Token (Valid for 24 hours)
            </label>
            <div className="mt-1 flex items-center gap-2">
              <textarea
                readOnly
                rows={3}
                value={createdUserCredentials.temporaryToken}
                className="flex-1 rounded-lg border border-border bg-surface p-3 font-mono text-xs text-text-muted break-all resize-none"
              />
              <button
                onClick={() => handleCopy(createdUserCredentials.temporaryToken, "Temporary Token")}
                className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-text-primary hover:bg-neutral-100 transition self-start"
              >
                {copiedField === "Temporary Token" ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                Copy
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <button
            type="button"
            onClick={() => {
              if (onSuccess) onSuccess();
            }}
            className="rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-600 transition"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {errorMsg && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 p-4 text-sm text-rose-700">
          {errorMsg}
        </div>
      )}

      {/* Personal Information */}
      <section>
        <div className="mb-5">
          <h3 className="text-base font-semibold text-text-primary">
            Personal Details
          </h3>
          <p className="mt-1 text-sm text-text-secondary">
            Basic identity and personal contact details of the new employee.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Input
            label="First Name"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            placeholder="e.g. Rahul"
            required
          />

          <Input
            label="Last Name"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            placeholder="e.g. Verma"
          />

          <Input
            type="email"
            label="Email Address"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="e.g. rahul.verma@company.com"
            required
          />

          <Input
            label="Phone Number"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="e.g. 9876543210"
            required
          />

          <Input
            label="Alternate Phone"
            name="alternatePhone"
            value={formData.alternatePhone}
            onChange={handleChange}
            placeholder="e.g. 9123456789"
          />

          <Input
            type="date"
            label="Date of Birth"
            name="dob"
            value={formData.dob}
            onChange={handleChange}
          />
        </div>
      </section>

      {/* Role & Team Assignment */}
      <section>
        <div className="mb-5">
          <h3 className="text-base font-semibold text-text-primary">
            Role & Organization
          </h3>
          <p className="mt-1 text-sm text-text-secondary">
            Assign security role and department team.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-text-primary">
              System Role <span className="text-danger-500">*</span>
            </label>
            <select
              name="roleId"
              value={formData.roleId}
              onChange={handleChange}
              required
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
              "
            >
              <option value="">Select Role</option>
              {roles.length > 0 ? (
                roles
                  .filter((r) => isSuperAdmin || (r.name !== "SUPER_ADMIN" && r.id !== 1))
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))
              ) : (
                <>
                  {isSuperAdmin && <option value="1">Super Admin</option>}
                  <option value="2">Manager</option>
                  <option value="3">Program Advisor</option>
                  <option value="4">HR</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-text-primary">
              Assign Team (Optional)
            </label>
            <select
              name="teamId"
              value={formData.teamId}
              onChange={handleChange}
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
              "
            >
              <option value="">Unassigned</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Submit Button */}
      <div className="flex justify-end gap-3 border-t border-border pt-6">
        <button
          type="submit"
          disabled={loading}
          className="
            rounded-lg
            bg-primary-500
            px-5 py-2.5
            text-sm font-medium text-white
            transition
            hover:bg-primary-600
            disabled:opacity-50
          "
        >
          {userToEdit
            ? loading
              ? "Saving Changes..."
              : "Save Changes"
            : loading
            ? "Creating User Account..."
            : "Create User"}
        </button>
      </div>
    </form>
  );
};

/* ---------------- Subcomponents ---------------- */

type InputProps = {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
};

const Input = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
}: InputProps) => {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-text-primary">
        {label}
        {required && <span className="ml-1 text-danger-500">*</span>}
      </label>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
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
          placeholder:text-text-muted
          focus:border-primary-500
          focus:ring-2
          focus:ring-primary-100
        "
      />
    </div>
  );
};

export default CreateUserForm;
