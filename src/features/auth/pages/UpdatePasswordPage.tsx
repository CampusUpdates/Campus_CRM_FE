import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, LockKeyhole, ShieldAlert, CheckCircle2 } from "lucide-react";
import { changePassword, login } from "../../../services/authService";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";

const UpdatePasswordPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login: setAuth } = useAuth();
  const toast = useToast();

  const stateData = location.state || {};
  const [passwordChangeToken] = useState<string>(stateData.passwordChangeToken || "");
  const [username] = useState<string>(stateData.username || "");
  const [oldPassword, setOldPassword] = useState<string>(stateData.oldPassword || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!passwordChangeToken) {
      const msg = "Invalid or expired session. Please log in again.";
      setErrorMsg(msg);
      toast.error(msg);
      navigate("/login");
      return;
    }

    if (!oldPassword) {
      const msg = "Please enter your temporary password";
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      const msg = "New password must be at least 6 characters long";
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }

    if (newPassword === oldPassword) {
      const msg = "New password must be different from temporary password";
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }

    if (newPassword !== confirmPassword) {
      const msg = "New password and confirmation do not match";
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);

    try {
      // 1. Submit password change to backend
      await changePassword(passwordChangeToken, oldPassword, newPassword);

      toast.success("Password updated successfully!");

      // 2. Automatically log user in with new credentials to acquire access_token
      if (username) {
        const loginResult = await login(username, newPassword);
        if (loginResult.access_token) {
          setAuth(loginResult.access_token);
          toast.success("Welcome to Campus CRM!");
          navigate("/dashboard");
          return;
        }
      }

      // Fallback redirect to login
      navigate("/login");
    } catch (err: any) {
      const msg = err.message || "Failed to update password";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-3 sm:p-6 md:p-8">
      <div className="w-full max-w-5xl min-h-0 sm:min-h-[520px] lg:min-h-[600px] bg-surface rounded-2xl overflow-hidden border border-border shadow-xl flex flex-col lg:flex-row">

        {/* Form Section */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 lg:p-12">
          <div className="w-full max-w-md">

            {/* Icon Banner */}
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-500 flex items-center justify-center mb-5 sm:mb-6 text-white shadow-md">
              <LockKeyhole size={22} className="sm:w-6 sm:h-6" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">
              Set New Password
            </h1>

            <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-text-secondary">
              First-time sign-in detected. Please update your temporary password to continue to the dashboard.
            </p>

            {errorMsg && (
              <div className="mt-4 rounded-lg bg-rose-50 border border-rose-200 p-3.5 text-xs sm:text-sm text-rose-700 flex items-center gap-2">
                <ShieldAlert size={18} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form className="mt-5 sm:mt-6 space-y-4" onSubmit={handleSubmit}>

              {/* Temporary / Old Password */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-text-primary mb-1.5">
                  Temporary / Current Password
                </label>

                <div className="relative">
                  <LockKeyhole
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                  />

                  <input
                    type={showOldPassword ? "text" : "password"}
                    placeholder="Enter temporary password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    required
                    className="w-full h-10 sm:h-11 pl-10 pr-11 rounded-md border border-border bg-surface outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition text-xs sm:text-sm text-text-primary placeholder:text-text-muted"
                  />

                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary-500 transition cursor-pointer p-1"
                    title={showOldPassword ? "Hide password" : "Show password"}
                    aria-label={showOldPassword ? "Hide password" : "Show password"}
                  >
                    {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-text-primary mb-1.5">
                  New Password
                </label>

                <div className="relative">
                  <LockKeyhole
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                  />

                  <input
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Minimum 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="w-full h-10 sm:h-11 pl-10 pr-11 rounded-md border border-border bg-surface outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition text-xs sm:text-sm text-text-primary placeholder:text-text-muted"
                  />

                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary-500 transition cursor-pointer p-1"
                    title={showNewPassword ? "Hide password" : "Show password"}
                    aria-label={showNewPassword ? "Hide password" : "Show password"}
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-text-primary mb-1.5">
                  Confirm New Password
                </label>

                <div className="relative">
                  <LockKeyhole
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                  />

                  <input
                    type="password"
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full h-10 sm:h-11 pl-10 pr-4 rounded-md border border-border bg-surface outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition text-xs sm:text-sm text-text-primary placeholder:text-text-muted"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-10 sm:h-11 mt-2 rounded-md bg-primary-500 text-white text-xs sm:text-sm font-medium hover:bg-primary-600 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                {loading ? (
                  "Updating Password..."
                ) : (
                  <>
                    <CheckCircle2 size={18} /> Update Password & Sign In
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Branding Side Panel */}
        <div className="hidden lg:flex lg:w-1/2 bg-primary-500 relative overflow-hidden items-center justify-center p-8 lg:p-12">
          <div className="absolute w-72 h-72 rounded-full bg-primary-400/30 -top-20 -right-20 pointer-events-none" />
          <div className="absolute w-56 h-56 rounded-full bg-primary-700/30 -bottom-20 -left-20 pointer-events-none" />

          <div className="relative z-10 text-white max-w-sm">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center mb-6 shadow-sm">
              <span className="text-xl sm:text-2xl font-bold">CU</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold leading-tight">
              Security Notice
            </h2>

            <p className="mt-4 text-primary-100 leading-relaxed text-xs sm:text-sm">
              Setting a unique password ensures your account security and grants full access to your personalized CRM workspace.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default UpdatePasswordPage;
