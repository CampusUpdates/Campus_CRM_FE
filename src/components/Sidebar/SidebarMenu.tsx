import { useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useSidebar } from "../../context/SidebarContext";
import { getNavigationForRole, type NavigationItem } from "../../config/navigationConfig";

const checkIsChildActive = (childPath: string, pathname: string, search: string) => {
  if (childPath.includes("?")) {
    const [basePath, searchStr] = childPath.split("?");
    if (pathname !== basePath) return false;
    const childParams = new URLSearchParams(searchStr);
    const currentParams = new URLSearchParams(search);

    let isMatch = true;
    childParams.forEach((val, key) => {
      const currentVal = currentParams.get(key);
      if (key === "tab" && val === "my") {
        if (currentVal && currentVal !== "my") {
          isMatch = false;
        }
      } else if (currentVal !== val) {
        isMatch = false;
      }
    });
    return isMatch;
  }
  return pathname === childPath;
};

const SidebarMenu = () => {
  const { user } = useAuth();
  const { closeSidebar } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const menuItems = user ? getNavigationForRole(user.roleCode) : [];

  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const newExpanded: Record<string, boolean> = {};
    menuItems.forEach((item) => {
      if (item.children) {
        const isChildActive = item.children.some((child) =>
          checkIsChildActive(child.path, location.pathname, location.search)
        );
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
      closeSidebar();
    }
  };

  return (
    <nav className="flex-1 px-3 py-4 overflow-y-auto custom-scrollbar">
      <ul className="space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const hasChildren = Boolean(item.children && item.children.length > 0);
          const isExpanded = expandedItems[item.title];

          if (hasChildren) {
            const isAnyChildActive = item.children?.some((child) =>
              checkIsChildActive(child.path, location.pathname, location.search)
            );

            return (
              <li key={item.title} className="space-y-1">
                <button
                  type="button"
                  onClick={() => toggleExpand(item)}
                  className={`group flex w-full items-center justify-between gap-4 rounded-md px-4 py-3 text-lg transition-all duration-200 cursor-pointer ${
                    isAnyChildActive
                      ? "text-text-primary font-medium hover:bg-primary-25"
                      : "text-text-secondary font-normal hover:bg-primary-25 hover:text-text-primary"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <Icon size={22} strokeWidth={1.8} className="shrink-0" />
                    <span>{item.title}</span>
                  </div>
                  <ChevronDown
                    size={18}
                    className={`transition-transform duration-200 ${
                      isExpanded ? "rotate-180 text-text-primary" : "text-text-muted"
                    }`}
                  />
                </button>

                {isExpanded && item.children && (
                  <ul className="pl-6 space-y-1 border-l-2 border-primary-100 ml-5 my-1">
                    {item.children.map((child) => {
                      const ChildIcon = child.icon;
                      const isChildActive = checkIsChildActive(
                        child.path,
                        location.pathname,
                        location.search
                      );

                      return (
                        <li key={child.path}>
                          <NavLink
                            to={child.path}
                            onClick={closeSidebar}
                            className={`group flex items-center gap-3 rounded-md px-4 py-2.5 text-base transition-all duration-200 ${
                              isChildActive
                                ? "bg-primary-500 text-white font-medium shadow-xs"
                                : "text-text-secondary font-normal hover:bg-primary-25 hover:text-text-primary"
                            }`}
                          >
                            {ChildIcon && (
                              <ChildIcon size={18} strokeWidth={1.8} className="shrink-0" />
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
                onClick={closeSidebar}
                className={({ isActive }) =>
                  `group flex items-center gap-4 rounded-md px-4 py-3 text-lg transition-all duration-200 ${isActive
                    ? "bg-sidebar-active text-success-900 font-medium"
                    : "text-text-secondary font-normal hover:bg-primary-25 hover:text-text-primary"
                  }`
                }
              >
                <Icon size={22} strokeWidth={1.8} className="shrink-0" />
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