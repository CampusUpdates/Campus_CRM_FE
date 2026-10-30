import { useEffect, useState } from "react";
import {
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  Lock,
  Phone,
  Save,
  ShieldCheck,
  User as UserIcon,
  UserCheck,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import {
  fetchUserProfile,
  updateUserProfile,
  type UpdateProfilePayload,
  type UserProfile,
} from "../../../services/profileService";
import {
  PageLoadingState,
  PageErrorState,
} from "../../../components/common";

const ProfilePage = () => {
  const { accessToken, user } = useAuth();
  const toast = useToast();

  // Role check: Only HR or SUPER_ADMIN can edit profile details
  const canEditProfile = user?.roleCode === "HR" || user?.roleCode === "SUPER_ADMIN";

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState<UpdateProfilePayload>({
    firstName: "",
    lastName: "",
    phone: "",
    alternatePhone: "",
    dob: "",
  });

  const loadProfile = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await fetchUserProfile(accessToken || undefined);
      setProfile(data);
      setFormData({
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        phone: data.phone || "",
        alternatePhone: data.alternatePhone || "",
        dob: data.dob ? new Date(data.dob).toISOString().slice(0, 10) : "",
      });
    } catch (err: any) {
      console.error("Failed to load user profile:", err);
      const msg = err.message || "Failed to load your user profile details";
      setLoadError(msg);
      toast.showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [accessToken]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditProfile) return;

    setErrorMsg(null);
    setSaving(true);

    try {
      const updated = await updateUserProfile(accessToken, {
        firstName: formData.firstName?.trim(),
        lastName: formData.lastName?.trim() || undefined,
        phone: formData.phone?.trim(),
        alternatePhone: formData.alternatePhone?.trim() || undefined,
        dob: formData.dob || undefined,
      });

      setProfile(updated);
      toast.showToast("Your profile details have been updated successfully!", "success");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update profile details");
      toast.showToast(err.message || "Failed to update profile details", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <PageLoadingState message="Loading your user profile..." />;
  }

  if (loadError || !profile) {
    return (
      <PageErrorState
        title="Failed to load profile"
        message={loadError || "User profile details could not be found."}
        onRetry={loadProfile}
      />
    );
  }

  const initials = `${profile.firstName.charAt(0)}${profile.lastName ? profile.lastName.charAt(0) : ""}`.toUpperCase();

  return (
    <div className="space-y-8 w-full">
      {/* Header */}
      <div className="border-b border-border pb-5">
        <h1 className="text-2xl font-bold text-text-primary">
          User Account Profile
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          View your personal account details, credentials, and organizational role.
        </p>
      </div>

      {/* Hero User Card */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            {/* Avatar Initials Badge */}
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-indigo-600 text-2xl font-bold text-white shadow-md">
              {initials}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl font-bold text-text-primary">
                  {profile.firstName} {profile.lastName || ""}
                </h2>
                <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                  {profile.status}
                </span>

                {!canEditProfile && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                    <Lock size={12} />
                    Read-Only Mode
                  </span>
                )}
              </div>

              <p className="text-sm font-medium text-text-secondary flex items-center gap-2">
                <ShieldCheck size={16} className="text-primary-500" />
                {profile.role?.name || "System User"}
              </p>

              <div className="flex items-center gap-4 text-xs text-text-muted pt-1 flex-wrap">
                <span className="flex items-center gap-1">
                  <UserIcon size={14} />
                  Username: <strong className="text-text-primary">@{profile.username}</strong>
                </span>
                <span className="flex items-center gap-1">
                  <Calendar size={14} />
                  Member Since: {new Date(profile.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Non-HR Read-Only Mode Banner */}
      {!canEditProfile && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-800 flex items-start gap-2.5 shadow-2xs">
          <Lock size={16} className="shrink-0 text-amber-600 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-900">
              Read-Only Profile Mode
            </p>
            <p className="mt-0.5 text-amber-700">
              Only HR personnel are authorized to update profile information. If any of your details need modification, please contact your HR department.
            </p>
          </div>
        </div>
      )}

      {/* Activity Summary Stats */}
      {profile._count && (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-surface p-4.5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Created Leads
              </span>
              <Building2 size={18} className="text-blue-500" />
            </div>
            <p className="mt-2 text-2xl font-bold text-text-primary">
              {profile._count.createdLeads ?? 0}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-surface p-4.5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Conducted Interviews
              </span>
              <UserCheck size={18} className="text-indigo-500" />
            </div>
            <p className="mt-2 text-2xl font-bold text-text-primary">
              {profile._count.conductedInterviews ?? 0}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-surface p-4.5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Attendance Logs
              </span>
              <CheckCircle2 size={18} className="text-emerald-500" />
            </div>
            <p className="mt-2 text-2xl font-bold text-text-primary">
              {profile._count.attendance ?? 0}
            </p>
          </div>
        </section>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Personal Details Form (Takes 2 cols) */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-text-primary">
                Personal Information
              </h3>
              <p className="text-xs text-text-secondary">
                {canEditProfile
                  ? "Update personal profile details and contact numbers."
                  : "Your personal information on record with HR."}
              </p>
            </div>

            {!canEditProfile && (
              <span className="rounded-md bg-neutral-100 px-2.5 py-1 text-xs font-medium text-text-muted flex items-center gap-1">
                <Lock size={12} /> Read-Only
              </span>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {errorMsg && (
              <div className="rounded-lg bg-rose-50 p-3 text-xs font-medium text-rose-600 border border-rose-200">
                {errorMsg}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  First Name {canEditProfile && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="text"
                  name="firstName"
                  disabled={!canEditProfile}
                  required={canEditProfile}
                  value={formData.firstName}
                  onChange={handleChange}
                  className={`
                    w-full rounded-lg border border-border px-3.5 py-2.5 text-sm transition
                    ${canEditProfile
                      ? "bg-background text-text-primary focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      : "bg-neutral-100 text-text-secondary cursor-not-allowed"
                    }
                  `}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  disabled={!canEditProfile}
                  value={formData.lastName}
                  onChange={handleChange}
                  className={`
                    w-full rounded-lg border border-border px-3.5 py-2.5 text-sm transition
                    ${canEditProfile
                      ? "bg-background text-text-primary focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      : "bg-neutral-100 text-text-secondary cursor-not-allowed"
                    }
                  `}
                />
              </div>
            </div>

            {/* Email (Read only for all) */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1 flex items-center gap-1">
                Email Address <Lock size={13} className="text-text-muted" />
              </label>
              <div className="relative">
                <input
                  type="email"
                  disabled
                  value={profile.email}
                  className="
                    w-full rounded-lg border border-border bg-neutral-100 px-3.5 py-2.5 text-sm text-text-muted cursor-not-allowed
                  "
                />
                <span className="absolute right-3 top-2.5 text-[11px] font-medium text-text-muted">
                  Managed by HR
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  Phone Number {canEditProfile && <span className="text-red-500">*</span>}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-text-muted">
                    <Phone size={16} />
                  </span>
                  <input
                    type="tel"
                    name="phone"
                    disabled={!canEditProfile}
                    required={canEditProfile}
                    value={formData.phone}
                    onChange={handleChange}
                    className={`
                      w-full rounded-lg border border-border pl-10 pr-3.5 py-2.5 text-sm transition
                      ${canEditProfile
                        ? "bg-background text-text-primary focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        : "bg-neutral-100 text-text-secondary cursor-not-allowed"
                      }
                    `}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  Alternate Phone
                </label>
                <input
                  type="tel"
                  name="alternatePhone"
                  disabled={!canEditProfile}
                  value={formData.alternatePhone}
                  onChange={handleChange}
                  placeholder="Optional backup phone"
                  className={`
                    w-full rounded-lg border border-border px-3.5 py-2.5 text-sm transition
                    ${canEditProfile
                      ? "bg-background text-text-primary focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      : "bg-neutral-100 text-text-secondary cursor-not-allowed"
                    }
                  `}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                name="dob"
                disabled={!canEditProfile}
                value={formData.dob}
                onChange={handleChange}
                className={`
                  w-full rounded-lg border border-border px-3.5 py-2.5 text-sm transition
                  ${canEditProfile
                    ? "bg-background text-text-primary focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    : "bg-neutral-100 text-text-secondary cursor-not-allowed"
                  }
                `}
              />
            </div>

            {canEditProfile && (
              <div className="pt-3 border-t border-border flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="
                    flex items-center gap-2 rounded-lg bg-primary-500 px-6 py-2.5
                    text-sm font-medium text-white hover:bg-primary-600
                    transition shadow-sm disabled:opacity-50
                  "
                >
                  <Save size={16} />
                  {saving ? "Saving Changes..." : "Save Profile Details"}
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Organizational Details Sidebar (Takes 1 col) */}
        <div className="space-y-6">
          {/* Organization & Manager Info */}
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm space-y-4">
            <h3 className="text-base font-semibold text-text-primary border-b border-border pb-3">
              Organizational Details
            </h3>

            <div className="space-y-3.5 text-xs">
              <div>
                <span className="text-text-muted font-medium block">Assigned Role</span>
                <span className="text-sm font-bold text-text-primary">
                  {profile.role?.name || "System Role"}
                </span>
                {profile.role?.description && (
                  <p className="text-[11px] text-text-muted mt-0.5">{profile.role.description}</p>
                )}
              </div>

              <div>
                <span className="text-text-muted font-medium block">Department / Team</span>
                <span className="text-sm font-semibold text-text-primary flex items-center gap-1.5 mt-0.5">
                  <Briefcase size={15} className="text-primary-500" />
                  {profile.team?.name || "General Workspace"}
                </span>
              </div>

              <div>
                <span className="text-text-muted font-medium block">Reporting Manager</span>
                {profile.manager ? (
                  <div className="mt-1 flex items-center gap-2">
                    <UserCheck size={16} className="text-emerald-600" />
                    <div>
                      <p className="text-sm font-semibold text-text-primary">
                        {profile.manager.firstName} {profile.manager.lastName || ""}
                      </p>
                      <p className="text-[11px] text-text-muted">{profile.manager.email}</p>
                    </div>
                  </div>
                ) : (
                  <span className="text-sm text-text-secondary italic">Direct Executive</span>
                )}
              </div>

              <div className="pt-2 border-t border-border">
                <span className="text-text-muted font-medium block">User Reference ID</span>
                <code className="text-[11px] text-text-secondary font-mono select-all bg-neutral-100 px-2 py-1 rounded block mt-1">
                  {profile.id}
                </code>
              </div>
            </div>
          </div>

          {/* Account Security Box */}
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Lock size={18} className="text-amber-500" />
              <h3 className="text-base font-semibold text-text-primary">
                Account Security
              </h3>
            </div>
            <p className="text-xs text-text-secondary mb-4 leading-relaxed">
              Your login credentials and account permissions are managed securely under organizational RBAC policies.
            </p>
            <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800 border border-amber-200">
              Need to update your password? Contact your system administrator or HR team.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;