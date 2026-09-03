import { useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getNavigationForRole, type NavigationItem } from "../../config/navigationConfig";

const SidebarMenu = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const menuItems = user ? getNavigationForRole(user.roleCode) : [];

  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const newExpanded: Record<string, boolean> = {};
    menuItems.forEach((item) => {
      if (item.children) {
        const isChildActive = item.children.some((child) => {
          if (child.path.includes("?")) {
            const [basePath, search] = child.path.split("?");
            return (
              location.pathname === basePath &&
              (location.search === `?${search}` || (search === "tab=my" && location.search === ""))
            );
          }
          return location.pathname === child.path;
        });
        if (isChildActive || location.pathname === item.path) {
          newExpanded[item.title] = true;
        }
      }
    });
    setExpandedItems((prev) => ({ ...prev, ...newExpanded }));
  }, [location.pathname, location.search, menuItems]);

  const toggleExpand = (item: NavigationItem) => {
    const isCurrentlyExpanded = expandedItems[item.title];
    setExpandedItems((prev) => ({
      ...prev,
      [item.title]: !isCurrentlyExpanded,
    }));

    if (!isCurrentlyExpanded && item.children && item.children.length > 0) {
      navigate(item.children[0].path);
    }
  };

  return (
    <nav className="flex-1 px-3 py-4 overflow-y-auto">
      <ul className="space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const hasChildren = Boolean(item.children && item.children.length > 0);
          const isExpanded = expandedItems[item.title];

          if (hasChildren) {
            const isAnyChildActive = item.children?.some((child) => {
              const [basePath, search] = child.path.split("?");
              return (
                location.pathname === basePath &&
                (location.search === `?${search}` || (search === "tab=my" && location.search === ""))
              );
            });

            return (
              <li key={item.title} className="space-y-1">
                <button
                  type="button"
                  onClick={() => toggleExpand(item)}
                  className={`group flex w-full items-center justify-between gap-4 rounded-md px-4 py-2.5 text-base transition-all duration-200 ${
                    isAnyChildActive
                      ? "bg-sidebar-active text-success-900 font-medium"
                      : "text-text-secondary font-normal hover:bg-primary-25 hover:text-text-primary"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <Icon size={20} strokeWidth={1.8} className="shrink-0" />
                    <span>{item.title}</span>
                  </div>
                  <ChevronDown
                    size={16}
                    className={`transition-transform duration-200 ${
                      isExpanded ? "rotate-180 text-success-900" : "text-text-muted"
                    }`}
                  />
                </button>

                {isExpanded && item.children && (
                  <ul className="pl-6 space-y-1 border-l-2 border-primary-100 ml-5 my-1">
                    {item.children.map((child) => {
                      const ChildIcon = child.icon;
                      const [basePath, search] = child.path.split("?");
                      const isChildActive =
                        location.pathname === basePath &&
                        (location.search === `?${search}` || (search === "tab=my" && location.search === ""));

                      return (
                        <li key={child.path}>
                          <NavLink
                            to={child.path}
                            className={`group flex items-center gap-3 rounded-md px-3.5 py-2 text-sm transition-all duration-200 ${
                              isChildActive
                                ? "bg-primary-500 text-white font-medium shadow-xs"
                                : "text-text-secondary font-normal hover:bg-primary-25 hover:text-text-primary"
                            }`}
                          >
                            {ChildIcon && (
                              <ChildIcon size={16} strokeWidth={1.8} className="shrink-0" />
                            )}
                            <span>{child.title}</span>
                          </NavLink>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          }

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
                <Icon size={20} strokeWidth={1.8} className="shrink-0" />
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