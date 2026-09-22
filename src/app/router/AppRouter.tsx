import { Navigate, Route, Routes } from "react-router-dom";

import AuthLayout from "../layouts/AuthLayout";
import DashboardLayout from "../layouts/DashboardLayout";

import ProtectedRoute from "./ProtectedRoutes";
import { ROUTES } from "./routes";

import LoginPage from "../../features/auth/pages/LoginPage";
import UpdatePasswordPage from "../../features/auth/pages/UpdatePasswordPage";
import AccessDeniedPage from "../../features/auth/pages/AccessDeniedPage";
import DashboardPage from "../../features/dashboard/pages/DashboardPage";
import LeadPage from "../../features/leads/pages/LeadPage";
import LeadProfilePage from "../../features/leads/pages/LeadProfilePage";
import AdmissionPage from "../../features/admissions/pages/AdmissionPage";
import ReportsPage from "../../features/reports/pages/ReportsPage";
import ProfilePage from "../../features/profile/pages/ProfilePage";
import Tpc from "../../features/tpc/pages/Tpc";
import Todo from "../../features/todo/pages/Todo";
import Notifications from "../../features/notifications/pages/Notifications";
import PitchApprovalsPage from "../../features/pitch-approvals/pages/PitchApprovalsPage";
import CollegesPage from "../../features/colleges/pages/CollegesPage";
import UsersPage from "../../features/users/pages/UsersPage";
import AttendancePage from "../../features/attendance/pages/AttendancePage";
import RecruitmentPage from "../../features/recruitment/pages/RecruitmentPage";
import TeamsPage from "../../features/teams/pages/TeamsPage";
import TeamDetailsPage from "../../features/teams/pages/TeamDetailsPage";
import DataUploadPage from "../../features/data-management/pages/DataUploadPage";
import DataAssignmentPage from "../../features/data-management/pages/DataAssignmentPage";
import CallWorkspace from "../../features/calls/pages/CallWorkspace";
import ClaimRequestsPage from "../../features/claim-requests/pages/ClaimRequestsPage";
import OfficeSettingsPage from "../../features/office/pages/OfficeSettingsPage";

const AppRouter = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<AuthLayout />}>
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.UPDATE_PASSWORD} element={<UpdatePasswordPage />} />
      </Route>

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path={ROUTES.ACCESS_DENIED} element={<AccessDeniedPage />} />

          <Route
            path={ROUTES.DASHBOARD}
            element={<DashboardPage />}
          />

          <Route
            path={ROUTES.CALLS}
            element={<CallWorkspace />}
          />

          <Route element={<ProtectedRoute allowedRoles={["SUPER_ADMIN", "MANAGER", "HR"]} />}>
            <Route path={ROUTES.TEAMS} element={<TeamsPage />} />
            <Route path={ROUTES.TEAM_DETAILS} element={<TeamDetailsPage />} />
          </Route>



          <Route element={<ProtectedRoute allowedRoles={["SUPER_ADMIN", "MANAGER"]} />}>
            <Route path={ROUTES.DATA_UPLOAD} element={<DataUploadPage />} />
            <Route path={ROUTES.DATA_ASSIGNMENT} element={<DataAssignmentPage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["SUPER_ADMIN", "MANAGER", "PROGRAM_ADVISOR"]} />}>
            <Route path={ROUTES.LEADS} element={<LeadPage />} />
            <Route path={ROUTES.LEAD_PROFILE} element={<LeadProfilePage />} />
            <Route path={ROUTES.TPC} element={<Tpc />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["SUPER_ADMIN"]} />}>
            <Route path={ROUTES.CLAIM_REQUESTS} element={<ClaimRequestsPage />} />
            <Route path={ROUTES.OFFICE_SETTINGS} element={<OfficeSettingsPage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["SUPER_ADMIN", "MANAGER"]} />}>
            <Route path={ROUTES.PITCH_APPROVALS} element={<PitchApprovalsPage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["SUPER_ADMIN", "MANAGER", "HR", "PROGRAM_ADVISOR"]} />}>
            <Route path={ROUTES.COLLEGES} element={<CollegesPage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["SUPER_ADMIN", "HR"]} />}>
            <Route path={ROUTES.USERS} element={<UsersPage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["SUPER_ADMIN", "HR"]} />}>
            <Route path={ROUTES.ATTENDANCE} element={<AttendancePage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["SUPER_ADMIN", "HR"]} />}>
            <Route path={ROUTES.RECRUITMENT} element={<RecruitmentPage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["SUPER_ADMIN", "PROGRAM_ADVISOR"]} />}>
            <Route path={ROUTES.ADMISSIONS} element={<AdmissionPage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["SUPER_ADMIN", "MANAGER", "HR", "PROGRAM_ADVISOR"]} />}>
            <Route path={ROUTES.TODO} element={<Todo />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["SUPER_ADMIN", "MANAGER", "HR"]} />}>
            <Route path={ROUTES.REPORTS} element={<ReportsPage />} />
          </Route>

          <Route
            path={ROUTES.NOTIFICATIONS}
            element={<Notifications />}
          />

          <Route
            path={ROUTES.PROFILE}
            element={<ProfilePage />}
          />

          {/* Unknown route inside dashboard layout falls back to dashboard */}
          <Route
            path="*"
            element={<Navigate to={ROUTES.DASHBOARD} replace />}
          />
        </Route>
      </Route>

      {/* Root redirect */}
      <Route
        path="/"
        element={<Navigate to={ROUTES.DASHBOARD} replace />}
      />

      {/* Fallback redirect */}
      <Route
        path="*"
        element={<Navigate to={ROUTES.DASHBOARD} replace />}
      />
    </Routes>
  );
};

export default AppRouter;