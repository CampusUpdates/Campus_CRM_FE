import { Outlet } from "react-router-dom";

import Navbar from "../../components/Navbar/Navbar";
import Sidebar from "../../components/Sidebar/Sidebar";
import NotificationDrawer from "../../components/Notifications/NotificationDrawer";

const DashboardLayout = () => {
  return (
    <div className="flex h-screen bg-background overflow-hidden">

      <Sidebar />

      <div className="flex flex-1 flex-col min-w-0">

        <Navbar />

        <main className="flex-1 overflow-y-auto bg-background p-3 sm:p-6 lg:p-8 custom-scrollbar">
          <div className="mx-auto w-full max-w-[1920px]">
            <Outlet />
          </div>
        </main>

      </div>

      <NotificationDrawer />

    </div>
  );
};

export default DashboardLayout;