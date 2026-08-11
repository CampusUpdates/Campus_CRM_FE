import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  PhoneCall,
  GraduationCap,
  ClipboardCheck,
  BarChart3,
  Bell,
  CheckSquare,
  User,
} from "lucide-react";

import { ROUTES } from "../../app/router/routes";

const menuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    path: ROUTES.DASHBOARD,
  },
  {
    title: "Leads",
    icon: Users,
    path: ROUTES.LEADS,
  },
  {
    title: "Follow Ups",
    icon: PhoneCall,
    path: ROUTES.FOLLOWUPS,
  },
  {
    title: "TPC",
    icon: ClipboardCheck,
    path: ROUTES.TPC,
  },
  {
    title: "Admissions",
    icon: GraduationCap,
    path: ROUTES.ADMISSIONS,
  },
  {
    title: "Reports",
    icon: BarChart3,
    path: ROUTES.REPORTS,
  },
  {
    title: "My Todo",
    icon: CheckSquare,
    path: ROUTES.TODO,
  },
  {
    title: "Notifications",
    icon: Bell,
    path: ROUTES.NOTIFICATIONS,
  },
  {
    title: "Profile",
    icon: User,
    path: ROUTES.PROFILE,
  },
];

const SidebarMenu = () => {
  return (
    <nav className="flex-1 px-3 py-4">
      <ul className="space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `group flex items-center gap-4 rounded-md px-4 py-2.5 text-base transition-all duration-200 ${
                    isActive
                      ? "bg-sidebar-active text-success-900 font-medium"
                      : "text-text-secondary font-normal hover:bg-primary-25 hover:text-text-primary"
                  }`
                }
              >
                <Icon
                  size={20}
                  strokeWidth={1.8}
                  className="shrink-0"
                />

                <span>{item.title}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default SidebarMenu;