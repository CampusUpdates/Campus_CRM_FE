import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { PageLoadingState } from "../../components/common";

const AuthLayout = () => {
  return (
    <div className="min-h-screen">
      <Suspense fallback={<PageLoadingState message="Loading..." />}>
        <Outlet />
      </Suspense>
    </div>
  );
};

export default AuthLayout;