import { Suspense } from "react";
import { Outlet } from "react-router-dom";

import Navbar from "../../components/Navbar/Navbar";
import Sidebar from "../../components/Sidebar/Sidebar";
import NotificationDrawer from "../../components/Notifications/NotificationDrawer";
import { BroadcastNotificationPopup } from "../../components/Notifications/BroadcastNotificationPopup";
import { RealtimeAlertPopup } from "../../components/Notifications/RealtimeAlertPopup";
import { PageLoadingState } from "../../components/common";

const DashboardLayout = () => {
  return (
    <div className="flex h-screen bg-background overflow-hidden">

      <Sidebar />

      <div className="flex flex-1 flex-col min-w-0">

        <Navbar />

        <main className="flex-1 overflow-y-auto bg-background px-4 py-4 sm:p-6 lg:p-8 custom-scrollbar">
          <div className="mx-auto w-full max-w-[1920px]">
            <Suspense fallback={<PageLoadingState message="Loading..." />}>
              <Outlet />
            </Suspense>
          </div>
        </main>

      </div>

      <NotificationDrawer />
      <BroadcastNotificationPopup />
      <RealtimeAlertPopup />

    </div>
  );
};

export default DashboardLayout;