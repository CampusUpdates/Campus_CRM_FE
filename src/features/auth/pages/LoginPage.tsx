import { useState } from "react";
import { Eye, EyeOff, LockKeyhole, User, ShieldAlert } from "lucide-react";
import login from "../../../services/authService";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import { useNavigate } from "react-router-dom";

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { login: setAuth } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

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
    if (!username.trim() || !password) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      // 1. Initial attempt: Submit username & password directly without GPS
      const data = await login(username.trim(), password);
      handleLoginSuccess(data);
    } catch (err: any) {
      // 2. If backend specifically responds that location is required for this user:
      if (err.locationRequired) {
        try {
          const coords = await requestCoordinates();
          if (coords.lat === undefined || coords.lon === undefined) {
            const locErrMsg = "Location permission is required to log in. Please enable GPS in your browser.";
            setErrorMsg(locErrMsg);
            toast.error(locErrMsg);
            return;
          }

          // Retry with coordinates
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

            <form className="mt-5 sm:mt-6 space-y-4 sm:space-y-5" onSubmit={handleSubmit}>
              {/* Username */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-text-primary mb-1.5 sm:mb-2">
                  Username
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
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="w-full h-10 sm:h-11 pl-10 pr-4 rounded-md border border-border bg-surface outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition text-xs sm:text-sm text-text-primary placeholder:text-text-muted"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-text-primary mb-1.5 sm:mb-2">
                  Password
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
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full h-10 sm:h-11 pl-10 pr-11 rounded-md border border-border bg-surface outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition text-xs sm:text-sm text-text-primary placeholder:text-text-muted"
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