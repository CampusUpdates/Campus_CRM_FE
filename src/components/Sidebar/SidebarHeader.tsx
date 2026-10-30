import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, ChevronDown, User, LogOut } from "lucide-react";
import { useSidebar } from "../../context/SidebarContext";
import { useAuth } from "../../context/AuthContext";

const SidebarHeader = () => {
  const { closeSidebar } = useSidebar();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const initials = (user?.firstName ? user.firstName.slice(0, 2) : user?.username?.slice(0, 2) || "US").toUpperCase();
  const displayName = user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.username;
  const roleLabel = user?.roleLabel || "User";

  return (
    <div className="flex h-16 sm:h-20 items-center justify-between border-b border-border px-3 sm:px-4 lg:px-5 shrink-0 relative">
      {/* Profile */}
      <div className="relative min-w-0 flex-1" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="
            flex
            items-center
            gap-2 sm:gap-2.5
            rounded-xl
            px-1 sm:px-2
            py-1.5
            w-full
            text-left
            transition
            hover:bg-surface
            cursor-pointer
          "
          title={`${displayName} (${roleLabel})`}
        >
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-primary-600 font-semibold text-white shadow-xs text-xs sm:text-sm shrink-0">
            {initials}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-sm font-semibold text-text-primary truncate">
              {displayName}
            </p>
            <p className="text-[11px] sm:text-xs text-primary-600 font-medium truncate">
              {roleLabel}
            </p>
          </div>

          <ChevronDown
            size={16}
            className={`text-text-secondary transition-transform shrink-0 ${isOpen ? "rotate-180" : ""}`}
          />
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div
            className="
              absolute
              left-0
              top-full
              mt-1.5
              z-50
              w-52
              max-w-[calc(100vw-24px)]
              rounded-xl
              border
              border-border
              bg-surface
              py-1
              shadow-xl
            "
          >
            {/* Profile */}
            <button
              type="button"
              onClick={() => {
                navigate("/profile");
                setIsOpen(false);
                closeSidebar();
              }}
              className="
                w-full
                flex
                items-center
                gap-2.5
                px-4
                py-2.5
                text-left
                text-sm
                text-text-primary
                hover:bg-background
                transition
                cursor-pointer
              "
            >
              <User size={15} className="text-text-secondary" />
              <span>Profile</span>
            </button>

            {/* Logout */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                closeSidebar();
                handleLogout();
              }}
              className="
                w-full
                flex
                items-center
                gap-2.5
                px-4
                py-2.5
                text-left
                text-sm
                text-rose-400
                hover:bg-rose-950/40
                transition
                cursor-pointer
              "
            >
              <LogOut size={15} />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>

      {/* Mobile close button (< 1024px) */}
      <button
        type="button"
        onClick={closeSidebar}
        className="shrink-0 rounded-lg p-1.5 text-text-secondary hover:bg-surface hover:text-text-primary transition cursor-pointer lg:hidden ml-1"
        title="Close sidebar"
        aria-label="Close sidebar"
      >
        <X size={20} />
      </button>
    </div>
  );
};

export default SidebarHeader;