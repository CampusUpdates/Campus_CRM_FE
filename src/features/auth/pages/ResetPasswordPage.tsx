import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Eye, EyeOff, LockKeyhole, ShieldAlert, CheckCircle2 } from "lucide-react";
import { resetPassword } from "../../../services/authService";
import { useToast } from "../../../context/ToastContext";
import { getFieldValidationClass } from "../../../utils/formValidation";
import { ROUTES } from "../../../app/router/routes";

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const toast = useToast();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setErrorMsg("This password reset link is invalid or has expired.");
    }
  }, [token]);

  const validateField = (name: string, currentNew = newPassword, currentConfirm = confirmPassword): string | null => {
    if (name === "newPassword") {
      if (!currentNew || currentNew.length < 6) {
        return "New password must be at least 6 characters long";
      }
    }
    if (name === "confirmPassword") {
      if (!currentConfirm) {
        return "Please confirm your new password";
      }
      if (currentConfirm !== currentNew) {
        return "New password and confirmation do not match";
      }
    }
    return null;
  };

  const handleBlur = (name: string) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    const err = validateField(name, newPassword, confirmPassword);
    setErrors((prev) => ({ ...prev, [name]: err }));
  };

  const handleNewPasswordChange = (val: string) => {
    setNewPassword(val);
    if (touched.newPassword) {
      setErrors((prev) => ({ ...prev, newPassword: validateField("newPassword", val, confirmPassword) }));
    }
    if (touched.confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: validateField("confirmPassword", val, confirmPassword) }));
    }
  };

  const handleConfirmPasswordChange = (val: string) => {
    setConfirmPassword(val);
    if (touched.confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: validateField("confirmPassword", newPassword, val) }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setErrorMsg(null);

    const allFields = ["newPassword", "confirmPassword"];
    const newTouched: Record<string, boolean> = {};
    const newErrors: Record<string, string | null> = {};
    let hasError = false;

    allFields.forEach((f) => {
      newTouched[f] = true;
      const err = validateField(f, newPassword, confirmPassword);
      newErrors[f] = err;
      if (err) hasError = true;
    });

    setTouched(newTouched);
    setErrors(newErrors);

    if (hasError) {
      return;
    }

    setLoading(true);

    try {
      await resetPassword(token, newPassword);
      setSuccess(true);
      toast.success("Password reset successfully.");
    } catch (err: any) {
      const msg = err.message || "Failed to reset password";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const newPasswordInputClass = getFieldValidationClass(
    touched.newPassword,
    errors.newPassword,
    "w-full h-10 sm:h-11 pl-10 pr-11 rounded-md border bg-surface outline-none transition text-xs sm:text-sm text-text-primary placeholder:text-text-muted"
  );

  const confirmPasswordInputClass = getFieldValidationClass(
    touched.confirmPassword,
    errors.confirmPassword,
    "w-full h-10 sm:h-11 pl-10 pr-4 rounded-md border bg-surface outline-none transition text-xs sm:text-sm text-text-primary placeholder:text-text-muted"
  );

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
              Reset Password
            </h1>

            <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-text-secondary">
              Create a new password for your Campus CRM account.
            </p>

            {errorMsg && (
              <div className="mt-4 rounded-lg bg-rose-50 border border-rose-200 p-3.5 text-xs sm:text-sm text-rose-700 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <ShieldAlert size={18} className="shrink-0" />
                  <span>{errorMsg}</span>
                </div>
                {!token && (
                  <button
                    onClick={() => navigate(ROUTES.FORGOT_PASSWORD)}
                    className="mt-2 w-full h-9 rounded-md bg-white border border-rose-300 text-rose-700 text-xs font-medium hover:bg-rose-50 transition cursor-pointer"
                  >
                    Request New Reset Link
                  </button>
                )}
              </div>
            )}

            {success ? (
              <div className="mt-6 p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={20} className="text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <h3 className="text-sm font-semibold text-emerald-800">Password Updated</h3>
                    <p className="mt-1 text-xs sm:text-sm text-emerald-700">
                      Your password has been reset successfully.
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex flex-col gap-3">
                  <button
                    onClick={() => navigate(ROUTES.LOGIN)}
                    className="w-full h-10 sm:h-11 rounded-md bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition cursor-pointer shadow-xs"
                  >
                    Go to Login
                  </button>
                </div>
              </div>
            ) : (
              <form className="mt-5 sm:mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
                {/* New Password */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-text-primary mb-1.5">
                    New Password <span className="text-red-500">*</span>
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
                      onChange={(e) => handleNewPasswordChange(e.target.value)}
                      onBlur={() => handleBlur("newPassword")}
                      className={newPasswordInputClass}
                      disabled={!token || loading}
                    />

                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary-500 transition cursor-pointer p-1"
                      title={showNewPassword ? "Hide password" : "Show password"}
                      aria-label={showNewPassword ? "Hide password" : "Show password"}
                      disabled={!token || loading}
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {touched.newPassword && errors.newPassword && (
                    <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.newPassword}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-text-primary mb-1.5">
                    Confirm Password <span className="text-red-500">*</span>
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
                      onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                      onBlur={() => handleBlur("confirmPassword")}
                      className={confirmPasswordInputClass}
                      disabled={!token || loading}
                    />
                  </div>
                  {touched.confirmPassword && errors.confirmPassword && (
                    <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.confirmPassword}</p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || !token}
                  className="w-full h-10 sm:h-11 mt-4 rounded-md bg-primary-500 text-white text-xs sm:text-sm font-medium hover:bg-primary-600 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  {loading ? (
                    "Resetting..."
                  ) : (
                    <>
                      Reset Password
                    </>
                  )}
                </button>
              </form>
            )}
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
              Ensure you choose a strong password to protect your account.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ResetPasswordPage;
