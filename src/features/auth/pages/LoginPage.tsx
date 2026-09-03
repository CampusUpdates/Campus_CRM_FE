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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      const data = await login(username.trim(), password);

      // Check if backend flags first-time temporary password login
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
    } catch (err: any) {
      const msg = err.message || "Invalid login credentials";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-5xl min-h-[600px] bg-surface rounded-2xl overflow-hidden border border-border shadow-lg flex">
        {/* Login Section */}
        <div className="w-1/2 flex items-center justify-center p-12">
          <div className="w-full max-w-md">
            {/* Logo */}
            <div className="w-12 h-12 rounded-xl bg-primary-500 flex items-center justify-center mb-8 shadow-md">
              <span className="text-white text-xl font-bold">C</span>
            </div>

            <h1 className="text-3xl font-bold text-text-primary">
              Welcome back!
            </h1>

            <p className="mt-2 text-text-secondary text-sm">
              Sign in to your Campus Updates CRM account.
            </p>

            {errorMsg && (
              <div className="mt-4 rounded-lg bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-700 flex items-center gap-2">
                <ShieldAlert size={16} className="shrink-0" />
                {errorMsg}
              </div>
            )}

            <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Username
                </label>

                <div className="relative">
                  <User
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                  />

                  <input
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="w-full h-11 pl-10 pr-4 rounded-md border border-border bg-surface outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition text-sm"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Password
                </label>

                <div className="relative">
                  <LockKeyhole
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                  />

                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full h-11 pl-10 pr-11 rounded-md border border-border bg-surface outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition text-sm"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary-500 transition"
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
                className="w-full h-11 rounded-md bg-primary-500 text-white font-medium hover:bg-primary-600 transition disabled:opacity-50"
              >
                {loading ? "Signing In..." : "Sign In"}
              </button>
            </form>
          </div>
        </div>

        {/* Branding Section */}
        <div className="w-1/2 bg-primary-500 relative overflow-hidden flex items-center justify-center p-12">
          {/* Decorative shapes */}
          <div className="absolute w-72 h-72 rounded-full bg-primary-400/30 -top-20 -right-20" />
          <div className="absolute w-56 h-56 rounded-full bg-primary-700/30 -bottom-20 -left-20" />

          <div className="relative z-10 text-white max-w-sm">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center mb-6">
              <span className="text-2xl font-bold">CU</span>
            </div>

            <h2 className="text-4xl font-bold leading-tight">
              Campus Updates
            </h2>

            <p className="mt-4 text-primary-100 leading-relaxed text-sm">
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