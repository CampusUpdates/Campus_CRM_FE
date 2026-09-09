import { useState, useEffect, useRef, useCallback } from "react";
import {
  Search,
  Bell,
  Moon,
  Sun,
  ChevronDown,
  X,
  Loader2,
  Building2,
  MapPin,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useNotification } from "../../context/NotificationContext";
import { fetchActiveColleges, type College } from "../../services/collegeService";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<College[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const { user, logout, accessToken } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { unreadCount, toggleDrawer } = useNotification();
  const navigate = useNavigate();
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Debounced live search
  const performSearch = useCallback(
    async (query: string) => {
      if (!query.trim() || !accessToken) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }
      setIsSearching(true);
      try {
        const results = await fetchActiveColleges(accessToken, query.trim());
        setSearchResults(results);
      } catch (err) {
        console.error("Failed to search colleges:", err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [accessToken]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        performSearch(searchQuery);
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, performSearch]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
      setShowResults(false);
      navigate(`/colleges?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSelectCollege = (collegeName: string) => {
    setShowResults(false);
    navigate(`/colleges?search=${encodeURIComponent(collegeName)}`);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setShowResults(false);
  };

  return (
    <header className="flex h-20 items-center justify-between bg-navbar border-b border-border px-6">

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
        <div className="relative" ref={searchContainerRef}>
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <button
              type="submit"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary-500 transition"
              title="Search"
            >
              <Search size={18} />
            </button>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowResults(true);
              }}
              onFocus={() => {
                if (searchQuery.trim()) setShowResults(true);
              }}
              placeholder="Search leads, students, colleges..."
              className="
                h-11
                w-96
                rounded-lg
                border
                border-border
                bg-surface
                pl-11
                pr-10
                text-sm
                text-text-primary
                placeholder:text-text-muted
                outline-none
                transition
                focus:border-primary-500
                focus:ring-2
                focus:ring-primary-100
              "
            />

            {isSearching ? (
              <Loader2
                size={16}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-primary-500 animate-spin"
              />
            ) : searchQuery ? (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition"
                title="Clear search"
              >
                <X size={16} />
              </button>
            ) : null}
          </form>

          {/* Live Search Results Dropdown */}
          {showResults && searchQuery.trim() && (
            <div className="absolute left-0 right-0 top-13 z-50 max-h-96 w-96 overflow-y-auto rounded-xl border border-border bg-surface p-2 shadow-xl backdrop-blur-md">
              <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-text-muted">
                Colleges ({searchResults.length})
              </div>

              {isSearching ? (
                <div className="flex items-center justify-center py-8 text-sm text-text-muted gap-2">
                  <Loader2 size={18} className="animate-spin text-primary-500" />
                  Searching colleges...
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-1 mt-1">
                  {searchResults.slice(0, 5).map((college) => (
                    <button
                      key={college.id}
                      onClick={() => handleSelectCollege(college.name)}
                      className="w-full flex items-center justify-between rounded-lg p-2.5 text-left transition hover:bg-neutral-100 dark:hover:bg-neutral-800/60 group"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="p-2 rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-950/40 shrink-0">
                          <Building2 size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-text-primary group-hover:text-primary-600 truncate">
                            {college.name}
                          </p>
                          {(college.city || college.state) && (
                            <p className="flex items-center gap-1 text-xs text-text-secondary mt-0.5">
                              <MapPin size={12} className="shrink-0 text-text-muted" />
                              {[college.city, college.state].filter(Boolean).join(", ")}
                            </p>
                          )}
                        </div>
                      </div>

                      {college.hasTieUp ? (
                        <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                          Partner
                        </span>
                      ) : (
                        <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                          Active
                        </span>
                      )}
                    </button>
                  ))}

                  {searchResults.length > 5 && (
                    <button
                      onClick={() => handleSearchSubmit()}
                      className="w-full flex items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950/30 transition mt-1 border-t border-border/50"
                    >
                      <span>View all {searchResults.length} colleges</span>
                      <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              ) : (
                <div className="py-6 text-center text-sm text-text-muted">
                  No colleges found for "{searchQuery}"
                </div>
              )}
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className="
            rounded-lg
            p-2.5
            text-text-secondary
            transition
            hover:bg-neutral-100
            hover:text-primary-600
          "
        >
          {theme === "dark" ? (
            <Sun size={18} className="text-amber-400" />
          ) : (
            <Moon size={18} />
          )}
        </button>

        {/* Notification */}
        <button
          type="button"
          onClick={toggleDrawer}
          title="Notifications"
          aria-label="Toggle notifications drawer"
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

          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger-500 px-1 text-[10px] font-bold text-white shadow-xs">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
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
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-600 font-semibold text-white shadow-xs">
              {(user?.firstName ? user.firstName.slice(0, 2) : user?.username?.slice(0, 2) || "US").toUpperCase()}
            </div>

            <div className="text-left">
              <p className="text-sm font-semibold text-text-primary">
                {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.username}
              </p>

              <p className="text-xs text-primary-600 font-medium">
                {user?.roleLabel || "User"}
              </p>
            </div>

            <ChevronDown
              size={16}
              className={`text-text-secondary transition-transform ${isOpen ? "rotate-180" : ""
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