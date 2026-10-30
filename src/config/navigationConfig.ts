import {
  LayoutDashboard,
  Users,
  Building2,
  UserCheck,
  CheckCircle2,
  CalendarCheck,
  Briefcase,
  PhoneCall,
  GraduationCap,
  BarChart3,
  CheckSquare,
  Bell,
  User,
  Shield,
  Database,
  Upload,
  MapPin,
  RefreshCcw,
  FileSpreadsheet,
  Megaphone,
  type LucideIcon,
} from "lucide-react";

import { ROUTES } from "../app/router/routes";
import { type RoleCode } from "../utils/roleUtils";

export type NavigationChild = {
  title: string;
  path: string;
  icon?: LucideIcon;
  roles?: RoleCode[];
};

export type NavigationItem = {
  title: string;
  path: string;
  icon: LucideIcon;
  roles: RoleCode[];
  children?: NavigationChild[];
};

export const navigationMenu: NavigationItem[] = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    path: ROUTES.DASHBOARD,
    roles: ["SUPER_ADMIN", "MANAGER", "TEAM_LEAD", "HR", "PROGRAM_ADVISOR"],
  },
  {
    title: "Teams",
    icon: Shield,
    path: ROUTES.TEAMS,
    roles: ["SUPER_ADMIN", "MANAGER", "HR"],
  },
  {
    title: "Leads",
    icon: Users,
    path: ROUTES.LEADS,
    roles: ["SUPER_ADMIN", "MANAGER", "TEAM_LEAD", "PROGRAM_ADVISOR"],
  },
  {
    title: "Calls",
    icon: PhoneCall,
    path: ROUTES.CALL_WORKSPACE,
    roles: ["SUPER_ADMIN"],
    children: [
      {
        title: "Call Workspace",
        path: ROUTES.CALL_WORKSPACE,
        icon: PhoneCall,
      },
      {
        title: "Call Reports",
        path: ROUTES.CALL_REPORTS,
        icon: BarChart3,
      },
    ],
  },
  {
    title: "Call Workspace",
    icon: PhoneCall,
    path: ROUTES.CALL_WORKSPACE,
    roles: ["MANAGER", "TEAM_LEAD", "HR", "PROGRAM_ADVISOR"],
  },
  {
    title: "TPC",
    icon: PhoneCall,
    path: ROUTES.TPC,
    roles: ["SUPER_ADMIN", "MANAGER", "TEAM_LEAD", "PROGRAM_ADVISOR"],
    children: [
      {
        title: "My TPCs",
        path: `${ROUTES.TPC}?tab=my`,
        icon: Users,
      },
      {
        title: "Assigned TPCs",
        path: `${ROUTES.TPC}?tab=assigned`,
        icon: UserCheck,
      },
      {
        title: "TPC Reports",
        path: ROUTES.TPC_REPORTS,
        icon: BarChart3,
        roles: ["SUPER_ADMIN", "MANAGER"],
      },
    ],
  },

  {
    title: "Data Management",
    icon: Database,
    path: ROUTES.DATA_UPLOAD,
    roles: ["SUPER_ADMIN", "MANAGER"],
    children: [
      {
        title: "Data Upload",
        path: ROUTES.DATA_UPLOAD,
        icon: Upload,
      },
      {
        title: "Data Assignment",
        path: ROUTES.DATA_ASSIGNMENT,
        icon: UserCheck,
      },
      {
        title: "Lead Reallocation",
        path: ROUTES.LEAD_REALLOCATION,
        icon: RefreshCcw,
        roles: ["SUPER_ADMIN"],
      },
      {
        title: "Analysis Spreadsheets",
        path: ROUTES.ANALYSIS_SPREADSHEETS,
        icon: FileSpreadsheet,
        roles: ["SUPER_ADMIN", "MANAGER"],
      },
    ],
  },
  {
    title: "Approvals",
    icon: CheckCircle2,
    path: ROUTES.PITCH_APPROVALS,
    roles: ["SUPER_ADMIN"],
    children: [
      {
        title: "College Approvals",
        path: ROUTES.PITCH_APPROVALS,
        icon: CheckCircle2,
      },
      {
        title: "Claim Requests",
        path: ROUTES.CLAIM_REQUESTS,
        icon: UserCheck,
      },
    ],
  },
  {
    title: "College Approvals",
    icon: CheckCircle2,
    path: ROUTES.PITCH_APPROVALS,
    roles: ["MANAGER", "TEAM_LEAD"],
  },
  {
    title: "College Counselling",
    icon: GraduationCap,
    path: ROUTES.COLLEGE_COUNSELLING,
    roles: ["SUPER_ADMIN", "MANAGER", "TEAM_LEAD", "PROGRAM_ADVISOR"],
  },
  {
    title: "Colleges",
    icon: Building2,
    path: ROUTES.COLLEGES,
    roles: ["SUPER_ADMIN", "MANAGER", "TEAM_LEAD", "HR", "PROGRAM_ADVISOR"],
  },
  {
    title: "Users",
    icon: UserCheck,
    path: ROUTES.USERS,
    roles: ["SUPER_ADMIN", "HR"],
  },
  {
    title: "Attendance",
    icon: CalendarCheck,
    path: ROUTES.ATTENDANCE,
    roles: ["SUPER_ADMIN", "HR"],
  },
  {
    title: "Office Settings",
    icon: MapPin,
    path: ROUTES.OFFICE_SETTINGS,
    roles: ["SUPER_ADMIN"],
  },
  {
    title: "Recruitment",
    icon: Briefcase,
    path: ROUTES.RECRUITMENT,
    roles: ["SUPER_ADMIN", "HR"],
  },
  {
    title: "Admissions",
    icon: GraduationCap,
    path: ROUTES.ADMISSIONS,
    roles: ["SUPER_ADMIN"],
  },
  {
    title: "Reports",
    icon: BarChart3,
    path: ROUTES.REPORTS,
    roles: ["SUPER_ADMIN", "MANAGER", "HR"],
  },
  {
    title: "My Todo",
    icon: CheckSquare,
    path: ROUTES.TODO,
    roles: ["SUPER_ADMIN", "MANAGER", "TEAM_LEAD", "HR", "PROGRAM_ADVISOR"],
  },
  {
    title: "Broadcast Messages",
    icon: Megaphone,
    path: ROUTES.BROADCASTS,
    roles: ["SUPER_ADMIN", "MANAGER", "TEAM_LEAD", "HR"],
  },
  {
    title: "Notifications",
    icon: Bell,
    path: ROUTES.NOTIFICATIONS,
    roles: ["SUPER_ADMIN", "MANAGER", "TEAM_LEAD", "HR"],
  },
  {
    title: "Profile",
    icon: User,
    path: ROUTES.PROFILE,
    roles: ["SUPER_ADMIN", "MANAGER", "TEAM_LEAD", "HR", "PROGRAM_ADVISOR"],
  },
];

export function getNavigationForRole(roleCode: RoleCode): NavigationItem[] {
  return navigationMenu
    .filter((item) => item.roles.includes(roleCode))
    .map((item) => {
      if (item.children) {
        const filteredChildren = item.children.filter(
          (child) => !child.roles || child.roles.includes(roleCode)
        );
        return {
          ...item,
          children: filteredChildren.length > 0 ? filteredChildren : undefined,
        };
      }
      return item;
    });
}
