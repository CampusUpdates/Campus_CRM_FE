import { useState } from "react";
import { Mail, ShieldAlert, CheckCircle2 } from "lucide-react";
import { forgotPassword } from "../../../services/authService";
import { useToast } from "../../../context/ToastContext";
import { useNavigate } from "react-router-dom";
import { getFieldValidationClass } from "../../../utils/formValidation";
import { ROUTES } from "../../../app/router/routes";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const toast = useToast();
  const navigate = useNavigate();

  const validateEmail = (val: string) => {
    if (!val.trim()) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return "Invalid email address";
    return null;
  };

  const handleBlur = () => {
    setTouched(true);
    setError(validateEmail(email));
  };

  const handleChange = (val: string) => {
    setEmail(val);
    if (touched) {
      setError(validateEmail(val));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);

    const err = validateEmail(email);
    setError(err);

    if (err) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      const response = await forgotPassword(email.trim());
      setSuccess(true);
      toast.success(response.message || "Reset link sent");
    } catch (err: any) {
      const msg = err.message || "Failed to request password reset";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const emailInputClass = getFieldValidationClass(
    touched,
    error,
    "w-full h-10 sm:h-11 pl-10 pr-4 rounded-md border bg-surface outline-none transition text-xs sm:text-sm text-text-primary placeholder:text-text-muted"
  );

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-3 sm:p-6 md:p-8">
      <div className="w-full max-w-5xl min-h-0 sm:min-h-[520px] lg:min-h-[600px] bg-surface rounded-2xl overflow-hidden border border-border shadow-xl flex flex-col lg:flex-row">
        {/* Form Section */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 lg:p-12">
          <div className="w-full max-w-md">
            {/* Logo */}
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary-500 flex items-center justify-center mb-6 sm:mb-8 shadow-md">
              <span className="text-white text-lg sm:text-xl font-bold">C</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">
              Forgot Password?
            </h1>

            <p className="mt-1.5 sm:mt-2 text-text-secondary text-xs sm:text-sm">
              Enter your registered email address and we'll send you a password reset link.
            </p>

            {errorMsg && (
              <div className="mt-4 rounded-lg bg-rose-50 border border-rose-200 p-3 sm:p-3.5 text-xs text-rose-700 flex items-center gap-2">
                <ShieldAlert size={16} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {success ? (
              <div className="mt-6 p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={20} className="text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <h3 className="text-sm font-semibold text-emerald-800">Check your email</h3>
                    <p className="mt-1 text-xs sm:text-sm text-emerald-700">
                      If an account exists with this email, a password reset link has been sent.
                    </p>
                  </div>
                </div>
                <div className="mt-6">
                  <button
                    onClick={() => navigate(ROUTES.LOGIN)}
                    className="w-full h-10 sm:h-11 rounded-md bg-white border border-border text-text-primary text-sm font-medium hover:bg-neutral-50 transition cursor-pointer shadow-xs"
                  >
                    Return to Login
                  </button>
                </div>
              </div>
            ) : (
              <form className="mt-5 sm:mt-6 space-y-4 sm:space-y-5" onSubmit={handleSubmit} noValidate>
                {/* Email */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-text-primary mb-1.5 sm:mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>

                  <div className="relative">
                    <Mail
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                    />

                    <input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => handleChange(e.target.value)}
                      onBlur={handleBlur}
                      className={emailInputClass}
                    />
                  </div>
                  {touched && error && (
                    <p className="mt-1 text-xs text-red-500 dark:text-red-400">{error}</p>
                  )}
                </div>

                <div className="pt-2 flex flex-col gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-10 sm:h-11 rounded-md bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    {loading ? "Sending..." : "Send Reset Link"}
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate(ROUTES.LOGIN)}
                    disabled={loading}
                    className="w-full h-10 sm:h-11 rounded-md bg-white border border-border text-text-primary text-sm font-medium hover:bg-neutral-50 transition disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    Back to Login
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Branding Section (Visible on Desktop / Large screens) */}
        <div className="hidden lg:flex lg:w-1/2 bg-primary-500 relative overflow-hidden items-center justify-center p-8 lg:p-12">
          {/* Decorative shapes */}
          <div className="absolute w-72 h-72 rounded-full bg-primary-400/30 -top-20 -right-20 pointer-events-none" />
          <div className="absolute w-56 h-56 rounded-full bg-primary-700/30 -bottom-20 -left-20 pointer-events-none" />

          <div className="relative z-10 text-white max-w-sm">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center mb-6 shadow-sm">
              <span className="text-xl sm:text-2xl font-bold">CU</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold leading-tight">
              Password Recovery
            </h2>

            <p className="mt-4 text-primary-100 leading-relaxed text-xs sm:text-sm">
              Regain access to your Campus Updates CRM account securely and quickly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
