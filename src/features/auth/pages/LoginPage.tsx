import { useState } from "react";
import { Eye, EyeOff, LockKeyhole, User, ShieldAlert } from "lucide-react";
import login from "../../../services/authService";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import { useNavigate } from "react-router-dom";
import { getFieldValidationClass } from "../../../utils/formValidation";

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState({ username: false, password: false });
  const [errors, setErrors] = useState<{ username?: string | null; password?: string | null }>({});
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { login: setAuth } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const validateUsername = (val: string) => (!val.trim() ? "Username is required" : null);
  const validatePassword = (val: string) => (!val ? "Password is required" : null);

  const handleBlur = (field: "username" | "password") => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    if (field === "username") {
      setErrors((prev) => ({ ...prev, username: validateUsername(username) }));
    } else {
      setErrors((prev) => ({ ...prev, password: validatePassword(password) }));
    }
  };

  const handleUsernameChange = (val: string) => {
    setUsername(val);
    if (touched.username) {
      setErrors((prev) => ({ ...prev, username: validateUsername(val) }));
    }
  };

  const handlePasswordChange = (val: string) => {
    setPassword(val);
    if (touched.password) {
      setErrors((prev) => ({ ...prev, password: validatePassword(val) }));
    }
  };

  const requestCoordinates = (): Promise<{ lat?: number; lon?: number }> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({});
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
          });
        },
        () => {
          resolve({});
        },
        { timeout: 8000, enableHighAccuracy: true, maximumAge: 0 }
      );
    });
  };

  const handleLoginSuccess = (data: any) => {
    if (data.requiresPasswordChange) {
      toast.info("First-time login detected. Please update your temporary password.");
      navigate("/update-password", {
        state: {
          passwordChangeToken: data.passwordChangeToken,
          username: username.trim(),
          oldPassword: password,
        },
      });
      return;
    }

    if (data.access_token) {
      setAuth(data.access_token);
      toast.success("Signed in successfully!");
      navigate("/dashboard");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ username: true, password: true });

    const uErr = validateUsername(username);
    const pErr = validatePassword(password);
    setErrors({ username: uErr, password: pErr });

    if (uErr || pErr) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      const data = await login(username.trim(), password);
      handleLoginSuccess(data);
    } catch (err: any) {
      if (err.locationRequired) {
        try {
          const coords = await requestCoordinates();
          if (coords.lat === undefined || coords.lon === undefined) {
            const locErrMsg = "Location permission is required to log in. Please enable GPS in your browser.";
            setErrorMsg(locErrMsg);
            toast.error(locErrMsg);
            return;
          }

          const retryData = await login(
            username.trim(),
            password,
            coords.lat,
            coords.lon
          );
          handleLoginSuccess(retryData);
        } catch (retryErr: any) {
          const msg = retryErr.message || "Location verification failed";
          setErrorMsg(msg);
          toast.error(msg);
        }
      } else {
        const msg = err.message || "Invalid login credentials";
        setErrorMsg(msg);
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const usernameInputClass = getFieldValidationClass(
    touched.username,
    errors.username,
    "w-full h-10 sm:h-11 pl-10 pr-4 rounded-md border bg-surface outline-none transition text-xs sm:text-sm text-text-primary placeholder:text-text-muted"
  );

  const passwordInputClass = getFieldValidationClass(
    touched.password,
    errors.password,
    "w-full h-10 sm:h-11 pl-10 pr-11 rounded-md border bg-surface outline-none transition text-xs sm:text-sm text-text-primary placeholder:text-text-muted"
  );

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-3 sm:p-6 md:p-8">
      <div className="w-full max-w-5xl min-h-0 sm:min-h-[520px] lg:min-h-[600px] bg-surface rounded-2xl overflow-hidden border border-border shadow-xl flex flex-col lg:flex-row">
        {/* Login Form Section */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 lg:p-12">
          <div className="w-full max-w-md">
            {/* Logo */}
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary-500 flex items-center justify-center mb-6 sm:mb-8 shadow-md">
              <span className="text-white text-lg sm:text-xl font-bold">C</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">
              Welcome back!
            </h1>

            <p className="mt-1.5 sm:mt-2 text-text-secondary text-xs sm:text-sm">
              Sign in to your Campus Updates CRM account.
            </p>

            {errorMsg && (
              <div className="mt-4 rounded-lg bg-rose-50 border border-rose-200 p-3 sm:p-3.5 text-xs text-rose-700 flex items-center gap-2">
                <ShieldAlert size={16} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form className="mt-5 sm:mt-6 space-y-4 sm:space-y-5" onSubmit={handleSubmit} noValidate>
              {/* Username */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-text-primary mb-1.5 sm:mb-2">
                  Username <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  <User
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                  />

                  <input
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    onBlur={() => handleBlur("username")}
                    className={usernameInputClass}
                  />
                </div>
                {touched.username && errors.username && (
                  <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.username}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-text-primary mb-1.5 sm:mb-2">
                  Password <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  <LockKeyhole
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                  />

                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    onBlur={() => handleBlur("password")}
                    className={passwordInputClass}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary-500 transition cursor-pointer p-1"
                    title={showPassword ? "Hide password" : "Show password"}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
                {touched.password && errors.password && (
                  <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.password}</p>
                )}
              </div>

              {/* Login Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-10 sm:h-11 rounded-md bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {loading ? "Signing In..." : "Sign In"}
              </button>
            </form>
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
              Campus Updates
            </h2>

            <p className="mt-4 text-primary-100 leading-relaxed text-xs sm:text-sm">
              Manage leads, colleges, follow-ups and student relationships
              from one centralized platform.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;