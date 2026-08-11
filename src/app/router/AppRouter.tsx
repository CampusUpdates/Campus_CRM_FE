import { Navigate, Route, Routes } from "react-router-dom";

import AuthLayout from "../layouts/AuthLayout";
import DashboardLayout from "../layouts/DashboardLayout";

import ProtectedRoute from "./ProtectedRoutes";
import { ROUTES } from "./routes";

import LoginPage from "../../features/auth/pages/LoginPage";
import DashboardPage from "../../features/dashboard/pages/DashboardPage";
import LeadPage from "../../features/leads/pages/LeadPage";
import FollowupPage from "../../features/followups/pages/FollowupPage";
import AdmissionPage from "../../features/admissions/pages/AdmissionPage";
import ReportsPage from "../../features/reports/pages/ReportsPage";
import ProfilePage from "../../features/profile/pages/ProfilePage";
import Tpc from "../../features/tpc/pages/Tpc";
import Todo from "../../features/todo/pages/Todo";
import Notifications from "../../features/notifications/pages/Notifications";

const AppRouter = () => {
  return (
    <Routes>
      {/* Redirect root to login */}
      <Route
        path="/"
        element={<Navigate to={ROUTES.LOGIN} replace />}
      />

      {/* Public Routes */}
      <Route element={<AuthLayout />}>
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
      </Route>

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route
            path={ROUTES.DASHBOARD}
            element={<DashboardPage />}
          />

          <Route
            path={ROUTES.LEADS}
            element={<LeadPage />}
          />

          <Route
            path={ROUTES.FOLLOWUPS}
            element={<FollowupPage />}
          />
          <Route
            path={ROUTES.TPC}
            element={<Tpc />}
          />

          <Route
            path={ROUTES.ADMISSIONS}
            element={<AdmissionPage />}
          />

          <Route
            path={ROUTES.REPORTS}
            element={<ReportsPage />}
          />

          <Route
            path={ROUTES.TODO}
            element={<Todo />}
          />

          <Route
            path={ROUTES.NOTIFICATIONS}
            element={<Notifications />}
          />

          <Route
            path={ROUTES.PROFILE}
            element={<ProfilePage />}
          />
          
        </Route>
      </Route>

      {/* 404 */}
      <Route
        path="*"
        element={<Navigate to={ROUTES.LOGIN} replace />}
      />
    </Routes>
  );
};

export default AppRouter;