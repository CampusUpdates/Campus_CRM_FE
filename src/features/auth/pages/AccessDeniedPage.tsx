import { ShieldAlert, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { ROUTES } from "../../../app/router/routes";

const AccessDeniedPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center p-6">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-danger-50 text-danger-500 shadow-xs border border-danger-100">
        <ShieldAlert size={40} />
      </div>

      <h1 className="text-2xl font-bold text-text-primary tracking-tight">
        Access Denied (HTTP 403)
      </h1>

      <p className="mt-2 max-w-md text-sm text-text-secondary">
        Your account role <span className="font-semibold text-text-primary">({user?.roleLabel || "User"})</span> does not have authorization to view this page or module.
      </p>

      <div className="mt-8 flex items-center gap-3">
        <button
          onClick={() => navigate(ROUTES.DASHBOARD)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white shadow-xs transition hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          <ArrowLeft size={16} />
          Return to Dashboard
        </button>
      </div>
    </div>
  );
};

export default AccessDeniedPage;
