import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { type RoleCode } from "../../utils/roleUtils";

type ProtectedRouteProps = {
  allowedRoles?: RoleCode[];
};

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { accessToken, hasRole } = useAuth();

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !hasRole(allowedRoles)) {
    return <Navigate to="/access-denied" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;