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
    <div className="space-y-4 sm:space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:gap-1.5 border-b border-border pb-3 sm:pb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
          User Account Profile
        </h1>
        <p className="text-xs sm:text-sm text-text-secondary leading-normal sm:leading-relaxed">
          View your personal account details, credentials, and organizational role.
        </p>
      </div>

      {/* Hero User Card */}
      <div className="relative overflow-hidden rounded-xl sm:rounded-2xl border border-border bg-surface p-4 sm:p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3.5 sm:gap-5 min-w-0">
            {/* Avatar Initials Badge */}
            <div className="flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 border border-primary-200/80 dark:border-primary-800/60 text-xl sm:text-2xl font-bold shadow-2xs">
              {initials}
            </div>

            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
                <h2 className="text-lg sm:text-2xl font-bold text-text-primary tracking-tight break-words">
                  {profile.firstName} {profile.lastName || ""}
                </h2>

                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 sm:px-2.5 py-0.5 text-[10px] sm:text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>{profile.status}</span>
                </span>

                {!canEditProfile && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 sm:px-2.5 py-0.5 text-[10px] sm:text-xs font-semibold text-amber-600 dark:text-amber-400">
                    <Lock size={11} className="sm:w-3 sm:h-3" />
                    <span>Read-Only</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-primary-600 dark:text-primary-400">
                <ShieldCheck size={14} className="sm:w-4 sm:h-4 shrink-0 text-primary-600 dark:text-primary-400" />
                <span>{profile.role?.name || "System User"}</span>
                {profile.team?.name && (
                  <span className="text-text-muted font-normal text-xs">• {profile.team.name}</span>
                )}
              </div>

              <div className="flex items-center gap-3 sm:gap-4 text-xs text-text-secondary pt-0.5 flex-wrap">
                <span className="inline-flex items-center gap-1">
                  <UserIcon size={12} className="text-text-muted shrink-0" />
                  <span>Username:</span>
                  <strong className="text-text-primary font-medium break-all">@{profile.username}</strong>
                </span>
                <span className="hidden sm:inline text-text-muted">•</span>
                <span className="inline-flex items-center gap-1">
                  <Calendar size={12} className="text-text-muted shrink-0" />
                  <span>Member Since:</span>
                  <strong className="text-text-primary font-medium">
                    {new Date(profile.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                  </strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Non-HR Read-Only Mode Banner */}
      {!canEditProfile && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/70 dark:bg-amber-950/40 p-3 sm:p-4 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5 shadow-2xs">
          <Lock size={15} className="shrink-0 text-amber-600 dark:text-amber-400 mt-0.5 sm:w-4 sm:h-4" />
          <div>
            <p className="font-semibold text-amber-900 dark:text-amber-200">
              Read-Only Profile Mode
            </p>
            <p className="mt-0.5 text-amber-700 dark:text-amber-300/90 leading-relaxed">
              Only HR personnel are authorized to update profile information. If any of your details need modification, please contact your HR department.
            </p>
          </div>
        </div>
      )}

      {/* Activity Summary Stats */}
      {profile._count && (
        <section className="grid grid-cols-2 gap-2.5 sm:gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-surface p-3.5 sm:p-5 shadow-2xs min-w-0 flex flex-col justify-between">
            <div className="flex items-start justify-between gap-2">
              <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Created Leads
              </span>
              <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                <Building2 size={15} className="sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="mt-2.5 sm:mt-3">
              <p className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
                {profile._count.createdLeads ?? 0}
              </p>
              <p className="text-[11px] text-text-muted mt-0.5 leading-tight">
                Leads generated on record
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-3.5 sm:p-5 shadow-2xs min-w-0 flex flex-col justify-between">
            <div className="flex items-start justify-between gap-2">
              <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Interviews
              </span>
              <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
                <UserCheck size={15} className="sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="mt-2.5 sm:mt-3">
              <p className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
                {profile._count.conductedInterviews ?? 0}
              </p>
              <p className="text-[11px] text-text-muted mt-0.5 leading-tight">
                Candidate sessions held
              </p>
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 rounded-xl border border-border bg-surface p-3.5 sm:p-5 shadow-2xs min-w-0 flex flex-col justify-between">
            <div className="flex items-start justify-between gap-2">
              <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Attendance Logs
              </span>
              <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                <CheckCircle2 size={15} className="sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="mt-2.5 sm:mt-3">
              <p className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
                {profile._count.attendance ?? 0}
              </p>
              <p className="text-[11px] text-text-muted mt-0.5 leading-tight">
                Verified check-in records
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Personal Details Form (Takes 2 cols) */}
        <div className="lg:col-span-2 rounded-xl sm:rounded-2xl border border-border bg-surface p-4 sm:p-6 shadow-2xs">
          <div className="flex items-center justify-between gap-2 mb-4 border-b border-border pb-3">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-text-primary tracking-tight">
                Personal Information
              </h3>
              <p className="text-xs text-text-secondary mt-0.5">
                {canEditProfile
                  ? "Update your personal profile details and contact information."
                  : "Your official employee details registered in Campus CRM."}
              </p>
            </div>

            {!canEditProfile && (
              <span className="rounded-md bg-neutral-100 dark:bg-neutral-800 px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium text-text-muted flex items-center gap-1 shrink-0">
                <Lock size={11} className="sm:w-3 sm:h-3" /> Read-Only
              </span>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="rounded-lg bg-rose-50 dark:bg-rose-950/40 p-2.5 sm:p-3 text-xs font-medium text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60">
                {errorMsg}
              </div>
            )}

            {/* Name Fields Group */}
            <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-text-primary mb-1.5">
                  First Name {canEditProfile && <span className="text-rose-500 font-bold">*</span>}
                </label>
                <input
                  type="text"
                  name="firstName"
                  disabled={!canEditProfile}
                  required={canEditProfile}
                  value={formData.firstName}
                  onChange={handleChange}
                  className={`
                    w-full h-10 rounded-lg border px-3 sm:px-3.5 text-xs sm:text-sm transition outline-none shadow-2xs
                    ${canEditProfile
                      ? "border-border bg-surface text-text-primary focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-950"
                      : "border-border/80 bg-neutral-100/80 dark:bg-slate-900/50 text-text-secondary cursor-not-allowed"
                    }
                  `}
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-text-primary mb-1.5">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  disabled={!canEditProfile}
                  value={formData.lastName}
                  onChange={handleChange}
                  className={`
                    w-full h-10 rounded-lg border px-3 sm:px-3.5 text-xs sm:text-sm transition outline-none shadow-2xs
                    ${canEditProfile
                      ? "border-border bg-surface text-text-primary focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-950"
                      : "border-border/80 bg-neutral-100/80 dark:bg-slate-900/50 text-text-secondary cursor-not-allowed"
                    }
                  `}
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-text-primary mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  Email Address
                  <Lock size={12} className="text-text-muted" />
                </span>
                <span className="text-[11px] font-normal text-text-muted">
                  Managed by HR
                </span>
              </label>
              <input
                type="email"
                disabled
                value={profile.email}
                className="w-full h-10 rounded-lg border border-border/80 bg-neutral-100/80 dark:bg-slate-900/50 text-xs sm:text-sm text-text-secondary px-3 sm:px-3.5 cursor-not-allowed truncate"
              />
            </div>

            {/* Contact Numbers Group */}
            <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-text-primary mb-1.5">
                  Phone Number {canEditProfile && <span className="text-rose-500 font-bold">*</span>}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
                    <Phone size={14} className="sm:w-4 sm:h-4" />
                  </span>
                  <input
                    type="tel"
                    name="phone"
                    disabled={!canEditProfile}
                    required={canEditProfile}
                    value={formData.phone}
                    onChange={handleChange}
                    className={`
                      w-full h-10 rounded-lg border pl-9 sm:pl-9.5 pr-3 text-xs sm:text-sm transition outline-none shadow-2xs
                      ${canEditProfile
                        ? "border-border bg-surface text-text-primary focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-950"
                        : "border-border/80 bg-neutral-100/80 dark:bg-slate-900/50 text-text-secondary cursor-not-allowed"
                      }
                    `}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-text-primary mb-1.5">
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
                    w-full h-10 rounded-lg border px-3 sm:px-3.5 text-xs sm:text-sm transition outline-none shadow-2xs placeholder:text-text-muted
                    ${canEditProfile
                      ? "border-border bg-surface text-text-primary focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-950"
                      : "border-border/80 bg-neutral-100/80 dark:bg-slate-900/50 text-text-secondary cursor-not-allowed"
                    }
                  `}
                />
              </div>
            </div>

            {/* Date of Birth */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-text-primary mb-1.5">
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="dob"
                  disabled={!canEditProfile}
                  value={formData.dob}
                  onChange={handleChange}
                  className={`
                    w-full h-10 rounded-lg border px-3 sm:px-3.5 text-xs sm:text-sm transition outline-none shadow-2xs cursor-pointer
                    ${canEditProfile
                      ? "border-border bg-surface text-text-primary focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-950"
                      : "border-border/80 bg-neutral-100/80 dark:bg-slate-900/50 text-text-secondary cursor-not-allowed"
                    }
                  `}
                />
              </div>
            </div>

            {canEditProfile && (
              <div className="pt-4 border-t border-border flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="
                    w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg
                    bg-primary-600 hover:bg-primary-700 active:bg-primary-800
                    h-10 px-5 text-xs sm:text-sm font-semibold text-white
                    shadow-2xs transition-all duration-150 disabled:opacity-50 cursor-pointer
                  "
                >
                  <Save size={15} className="sm:w-4 sm:h-4" />
                  <span>{saving ? "Saving Changes..." : "Save Profile Details"}</span>
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Organizational Details Sidebar (Takes 1 col) */}
        <div className="space-y-4 sm:space-y-6">
          {/* Organization & Manager Info */}
          <div className="rounded-xl sm:rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-2xs space-y-4">
            <div className="border-b border-border pb-3">
              <h3 className="text-sm sm:text-base font-semibold text-text-primary">
                Organizational Details
              </h3>
              <p className="text-xs text-text-secondary mt-0.5">
                Role assignments and managerial hierarchy
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex flex-col gap-1 p-2.5 rounded-lg bg-neutral-50/70 dark:bg-slate-900/40 border border-border/60">
                <span className="text-text-muted font-medium text-[11px]">Assigned Role</span>
                <span className="text-xs sm:text-sm font-bold text-text-primary">
                  {profile.role?.name || "System Role"}
                </span>
                {profile.role?.description && (
                  <p className="text-[11px] text-text-secondary leading-snug">{profile.role.description}</p>
                )}
              </div>

              <div className="flex flex-col gap-1 p-2.5 rounded-lg bg-neutral-50/70 dark:bg-slate-900/40 border border-border/60">
                <span className="text-text-muted font-medium text-[11px]">Department / Team</span>
                <span className="text-xs sm:text-sm font-semibold text-text-primary flex items-center gap-1.5">
                  <Briefcase size={14} className="text-primary-500 shrink-0" />
                  <span>{profile.team?.name || "General Workspace"}</span>
                </span>
              </div>

              <div className="flex flex-col gap-1 p-2.5 rounded-lg bg-neutral-50/70 dark:bg-slate-900/40 border border-border/60">
                <span className="text-text-muted font-medium text-[11px]">Reporting Manager</span>
                {profile.manager ? (
                  <div className="flex items-center gap-2 pt-0.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                      <UserCheck size={14} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-text-primary truncate">
                        {profile.manager.firstName} {profile.manager.lastName || ""}
                      </p>
                      <p className="text-[11px] text-text-muted truncate">{profile.manager.email}</p>
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-text-secondary italic">Direct Executive</span>
                )}
              </div>

              <div className="pt-2 border-t border-border">
                <span className="text-text-muted font-medium text-[11px] block">User Reference ID</span>
                <code className="text-[11px] text-text-secondary font-mono select-all bg-neutral-100 dark:bg-slate-800/80 px-2 py-1.5 rounded block mt-1 break-all border border-border/50">
                  {profile.id}
                </code>
              </div>
            </div>
          </div>

          {/* Account Security Box */}
          <div className="rounded-xl sm:rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-2xs space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                <Lock size={14} />
              </div>
              <h3 className="text-sm sm:text-base font-semibold text-text-primary">
                Account Security
              </h3>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Your login credentials and account permissions are managed securely under organizational RBAC policies.
            </p>
            <div className="rounded-lg bg-amber-50/80 dark:bg-amber-950/40 p-2.5 sm:p-3 text-xs text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 leading-relaxed">
              Need to update your password? Contact your system administrator or HR team.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;