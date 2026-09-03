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
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-5xl min-h-[600px] bg-surface rounded-2xl overflow-hidden border border-border shadow-lg flex">
        
        {/* Form Section */}
        <div className="w-1/2 flex items-center justify-center p-12">
          <div className="w-full max-w-md">

            {/* Icon Banner */}
            <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center mb-6 text-white shadow-md">
              <LockKeyhole size={24} />
            </div>

            <h1 className="text-3xl font-bold text-text-primary">
              Set New Password
            </h1>

            <p className="mt-2 text-sm text-text-secondary">
              First-time sign-in detected. Please update your temporary password to continue to the dashboard.
            </p>

            {errorMsg && (
              <div className="mt-5 rounded-lg bg-rose-50 border border-rose-200 p-4 text-sm text-rose-700 flex items-center gap-2">
                <ShieldAlert size={18} className="shrink-0" />
                {errorMsg}
              </div>
            )}

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              
              {/* Temporary / Old Password */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Temporary / Current Password
                </label>

                <div className="relative">
                  <LockKeyhole
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                  />

                  <input
                    type={showOldPassword ? "text" : "password"}
                    placeholder="Enter temporary password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    required
                    className="w-full h-11 pl-10 pr-11 rounded-md border border-border bg-surface outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition text-sm"
                  />

                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary-500 transition"
                  >
                    {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  New Password
                </label>

                <div className="relative">
                  <LockKeyhole
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                  />

                  <input
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Minimum 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="w-full h-11 pl-10 pr-11 rounded-md border border-border bg-surface outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition text-sm"
                  />

                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary-500 transition"
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Confirm New Password
                </label>

                <div className="relative">
                  <LockKeyhole
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                  />

                  <input
                    type="password"
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full h-11 pl-10 pr-4 rounded-md border border-border bg-surface outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition text-sm"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 mt-2 rounded-md bg-primary-500 text-white font-medium hover:bg-primary-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
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
        <div className="w-1/2 bg-primary-500 relative overflow-hidden flex items-center justify-center p-12">
          <div className="absolute w-72 h-72 rounded-full bg-primary-400/30 -top-20 -right-20" />
          <div className="absolute w-56 h-56 rounded-full bg-primary-700/30 -bottom-20 -left-20" />

          <div className="relative z-10 text-white max-w-sm">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center mb-6">
              <span className="text-2xl font-bold">CU</span>
            </div>

            <h2 className="text-4xl font-bold leading-tight">
              Security Notice
            </h2>

            <p className="mt-4 text-primary-100 leading-relaxed">
              Setting a unique password ensures your account security and grants full access to your personalized CRM workspace.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default UpdatePasswordPage;
