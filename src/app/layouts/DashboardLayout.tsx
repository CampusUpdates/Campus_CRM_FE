import { Outlet } from "react-router-dom";

import Navbar from "../../components/Navbar/Navbar";
import Sidebar from "../../components/Sidebar/Sidebar";
import NotificationDrawer from "../../components/Notifications/NotificationDrawer";

const DashboardLayout = () => {
  return (
    <div className="flex h-screen bg-background">

      <Sidebar />

      <div className="flex flex-1 flex-col">

        <Navbar />

        <main className="flex-1 overflow-y-auto bg-background p-14 custom-scrollbar">
          <Outlet />
        </main>

      </div>

      <NotificationDrawer />

    </div>
  );
};

export default DashboardLayout;