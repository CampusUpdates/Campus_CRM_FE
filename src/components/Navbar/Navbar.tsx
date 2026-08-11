import { useState } from "react";
import {
  Search,
  Bell,
  Moon,
  ChevronDown,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="flex h-20 items-center justify-between bg-white border-b border-border px-6">

      {/* Breadcrumb */}
      <div>
        <p className="text-sm">
          <span className="text-text-secondary">
            Employee /
          </span>{" "}
          <span className="font-semibold text-text-primary">
            Dashboard
          </span>
        </p>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">

        {/* Search */}
        <div className="relative">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
          />

          <input
            type="text"
            placeholder="Search leads, students, colleges..."
            className="
              h-11
              w-96
              rounded-lg
              border
              border-border
              bg-surface
              pl-11
              pr-4
              text-sm
              text-text-primary
              placeholder:text-text-muted
              outline-none
              transition
              focus:border-primary-300
              focus:ring-2
              focus:ring-primary-100
            "
          />
        </div>

        {/* Theme */}
        <button
          className="
            rounded-lg
            p-2.5
            text-text-secondary
            transition
            hover:bg-neutral-100
            hover:text-primary-600
          "
        >
          <Moon size={18} />
        </button>

        {/* Notification */}
        <button
          className="
            relative
            rounded-lg
            p-2.5
            text-text-secondary
            transition
            hover:bg-neutral-100
            hover:text-primary-600
          "
        >
          <Bell size={18} />

          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-danger-500" />
        </button>

        {/* Divider */}
        <div className="h-8 w-px bg-border" />

        {/* Profile */}
        <div className="relative">

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="
              flex
              items-center
              gap-3
              rounded-xl
              px-2
              py-1
              transition
              hover:bg-neutral-100
            "
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-500 font-semibold text-white">
              {user?.username?.slice(0, 2).toUpperCase()}
            </div>

            <div className="text-left">
              <p className="text-sm font-semibold text-text-primary">
                {user?.username}
              </p>

              <p className="text-xs text-text-secondary">
                {user?.roleId}
              </p>
            </div>

            <ChevronDown
              size={16}
              className={`text-text-secondary transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Dropdown */}
          {isOpen && (
            <div
              className="
                absolute
                right-0
                top-14
                z-50
                w-44
                rounded-lg
                border
                border-border
                bg-surface
                py-1
                shadow-lg
              "
            >
              {/* Profile */}
              <button
                onClick={() => {
                  navigate("/profile");
                  setIsOpen(false);
                }}
                className="
                  w-full
                  px-4
                  py-2.5
                  text-left
                  text-sm
                  text-text-primary
                  hover:bg-neutral-100
                "
              >
                Profile
              </button>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="
                  w-full
                  px-4
                  py-2.5
                  text-left
                  text-sm
                  text-danger-600
                  hover:bg-danger-50
                "
              >
                Logout
              </button>
            </div>
          )}

        </div>

      </div>
    </header>
  );
};

export default Navbar;