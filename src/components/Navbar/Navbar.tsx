import { useState, useEffect, useRef, useCallback } from "react";
import {
  Search,
  Bell,
  Moon,
  Sun,
  X,
  Loader2,
  Building2,
  MapPin,
  Menu,
} from "lucide-react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useNotification } from "../../context/NotificationContext";
import { useSidebar } from "../../context/SidebarContext";
import { fetchActiveColleges, type College } from "../../services/collegeService";
import { fetchLeads, fetchLeadsForReallocation, type LeadItem } from "../../services/leadService";
import { fetchUsers, type UserItem } from "../../services/userService";
import { fetchFilteredStudentData } from "../../services/dataManagementService";
import { UserCheck, Phone, Mail, FileText, User } from "lucide-react";

type GlobalSearchResults = {
  colleges: College[];
  leads: LeadItem[];
  users: UserItem[];
  studentData: any[];
};

function getLeadCollegeName(lead: any): string | null {
  if (lead?.finalCollege?.name) return lead.finalCollege.name;
  if (Array.isArray(lead?.collegeApplications) && lead.collegeApplications.length > 0) {
    const validApp = lead.collegeApplications.find((app: any) => app?.college?.name);
    if (validApp?.college?.name) return validApp.college.name;
  }
  if (lead?.graduationCollegeName) return lead.graduationCollegeName;
  if (Array.isArray(lead?.counsellingRequests) && lead.counsellingRequests.length > 0) {
    const req = lead.counsellingRequests.find((r: any) => r?.college?.name);
    if (req?.college?.name) return req.college.name;
  }
  return null;
}

const Navbar = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GlobalSearchResults>({ colleges: [], leads: [], users: [], studentData: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const { accessToken } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { unreadCount, pendingBroadcastCount, toggleDrawer } = useNotification();
  const { toggleSidebar } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const isLeadReallocation = location.pathname.startsWith("/lead-reallocation");

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
        setSearchResults({ colleges: [], leads: [], users: [], studentData: [] });
        setIsSearching(false);
        return;
      }
      setIsSearching(true);
      try {
        const q = query.trim();

        if (isLeadReallocation) {
          // On Lead Reallocation page: scope search strictly to relevant leads.
          // Do NOT fetch or display unrelated studentData, users, or generic colleges.
          const params = new URLSearchParams({ search: q, limit: "10" });
          const leadsRes = await fetchLeadsForReallocation(accessToken, params);
          const rawLeads: any[] = Array.isArray(leadsRes?.data) ? leadsRes.data : [];

          // Deduplicate leads by id to prevent duplicates
          const uniqueLeads = Array.from(new Map(rawLeads.map((l: any) => [l.id, l])).values());

          setSearchResults({
            colleges: [],
            leads: uniqueLeads as any[],
            users: [],
            studentData: [],
          });
        } else {
          // Standard Global Search on other pages (Dashboard, Leads, etc.)
          const [colleges, leadsRes, usersRes, studentDataRes] = await Promise.allSettled([
            fetchActiveColleges(accessToken, q),
            fetchLeads(accessToken, { search: q, limit: 5 }),
            fetchUsers(accessToken),
            fetchFilteredStudentData(accessToken, { search: q, limit: 5 }),
          ]);

          let filteredUsers: any[] = [];
          if (usersRes.status === "fulfilled") {
            const lowerQ = q.toLowerCase();
            filteredUsers = usersRes.value
              .filter(
                (u) =>
                  (u.firstName + " " + (u.lastName || "")).toLowerCase().includes(lowerQ) ||
                  u.email.toLowerCase().includes(lowerQ) ||
                  u.phone.includes(lowerQ)
              )
              .slice(0, 5);
          }

          setSearchResults({
            colleges: colleges.status === "fulfilled" ? colleges.value : [],
            leads: leadsRes.status === "fulfilled" ? leadsRes.value.data : [],
            users: filteredUsers,
            studentData: studentDataRes.status === "fulfilled" ? studentDataRes.value.data : [],
          });
        }
      } catch (err) {
        console.error("Failed to perform global search:", err);
        setSearchResults({ colleges: [], leads: [], users: [], studentData: [] });
      } finally {
        setIsSearching(false);
      }
    },
    [accessToken, isLeadReallocation]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        performSearch(searchQuery);
      } else {
        setSearchResults({ colleges: [], leads: [], users: [], studentData: [] });
        setShowResults(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, performSearch]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
      setShowResults(false);
      setIsMobileSearchOpen(false);
      if (isLeadReallocation) {
        navigate(
          `/lead-reallocation?search=${encodeURIComponent(searchQuery.trim())}&assignmentStatus=ALL&leadStatus=ALL`
        );
      } else {
        navigate(`/colleges?search=${encodeURIComponent(searchQuery.trim())}`);
      }
    }
  };

  const handleSelectReallocationLead = (lead: any) => {
    setShowResults(false);
    setIsMobileSearchOpen(false);
    const searchParam = lead.phone || `${lead.firstName} ${lead.lastName || ""}`.trim();
    navigate(
      `/lead-reallocation?leadId=${encodeURIComponent(lead.id)}&search=${encodeURIComponent(
        searchParam
      )}&assignmentStatus=ALL&leadStatus=ALL`
    );
  };

  const handleSelectCollege = (collegeName: string) => {
    setShowResults(false);
    setIsMobileSearchOpen(false);
    navigate(`/colleges?search=${encodeURIComponent(collegeName)}`);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchResults({ colleges: [], leads: [], users: [], studentData: [] });
    setShowResults(false);
    if (isLeadReallocation) {
      navigate("/lead-reallocation");
    }
  };

  return (
    <header className="flex h-16 sm:h-20 items-center justify-between bg-navbar border-b border-border px-2 sm:px-6 gap-1 sm:gap-2 shrink-0 relative">

      {/* Left Section: Hamburger + Brand for Mobile/Tablet OR Breadcrumb for Desktop */}
      <div className="flex items-center gap-1 sm:gap-3 shrink-0">
        {/* Hamburger Menu Toggle Button (< 1024px) */}
        <button
          type="button"
          onClick={toggleSidebar}
          className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface rounded-lg transition cursor-pointer lg:hidden shrink-0"
          title="Toggle Navigation Menu"
          aria-label="Toggle Navigation Menu"
        >
          <Menu size={22} />
        </button>

        {/* Mobile / Tablet Brand Title */}
        <span className="font-bold text-base text-primary-800 dark:text-primary-400 tracking-tight hidden sm:block lg:hidden truncate max-w-[130px] md:max-w-[200px]">
          Campus Updates
        </span>


      </div>

      {/* Right Section */}
      <div className="flex items-center gap-1 sm:gap-3">

        {/* Mobile Search Button */}
        <button
          type="button"
          onClick={() => setIsMobileSearchOpen(true)}
          className="sm:hidden p-2 text-text-secondary hover:text-primary-500 transition cursor-pointer"
          title="Search"
          aria-label="Search"
        >
          <Search size={18} />
        </button>

        {/* Search Bar (Desktop inline, Mobile overlay) */}
        <div
          className={`
            relative
            ${isMobileSearchOpen
              ? 'absolute inset-x-0 top-0 h-full flex items-center bg-navbar px-2 z-50 gap-2 w-full shadow-md sm:static sm:h-auto sm:block sm:bg-transparent sm:px-0 sm:z-auto sm:w-auto sm:shadow-none'
              : 'hidden sm:block'}
          `}
          ref={searchContainerRef}
        >
          {isMobileSearchOpen && (
            <button
              type="button"
              onClick={() => setIsMobileSearchOpen(false)}
              className="p-2 text-text-secondary sm:hidden shrink-0 cursor-pointer"
            >
              <X size={20} />
            </button>
          )}
          <form onSubmit={handleSearchSubmit} className="relative flex items-center flex-1 w-full">
            <button
              type="submit"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary-500 transition cursor-pointer"
              title="Search"
            >
              <Search size={16} />
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
              placeholder="Search..."
              className="
                h-10 sm:h-11
                w-full sm:w-48 md:w-72 lg:w-96
                rounded-lg
                border
                border-border
                bg-surface
                pl-9 sm:pl-11
                pr-8 sm:pr-10
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
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-500 animate-spin"
              />
            ) : searchQuery ? (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition cursor-pointer"
                title="Clear search"
              >
                <X size={14} />
              </button>
            ) : null}
          </form>

{/* Live Search Results Dropdown */}
          {showResults && searchQuery.trim() && (
            <div className="absolute left-0 right-0 sm:right-auto top-full sm:top-13 mt-1 sm:mt-0 z-50 max-h-96 sm:w-[450px] overflow-y-auto rounded-xl border border-border bg-surface p-2 shadow-xl backdrop-blur-md">
              {isSearching ? (
                <div className="flex items-center justify-center py-8 text-sm text-text-muted gap-2">
                  <Loader2 size={18} className="animate-spin text-primary-500" />
                  Searching CRM...
                </div>
              ) : isLeadReallocation ? (
                /* Scoped Search Results on Lead Reallocation */
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-text-muted border-b border-border/60 pb-2">
                    <span className="flex items-center gap-1.5">
                      <UserCheck size={14} className="text-primary-500" />
                      Leads for Reallocation ({searchResults.leads.length})
                    </span>
                    <span className="text-[11px] lowercase text-text-muted font-normal">Click to locate lead</span>
                  </div>

                  {searchResults.leads.length === 0 ? (
                    <div className="py-7 px-4 text-center">
                      <div className="mx-auto w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-text-muted mb-2">
                        <UserCheck size={20} />
                      </div>
                      <p className="text-sm font-semibold text-text-primary">No matching leads found</p>
                      <p className="text-xs text-text-muted mt-1 max-w-[280px] mx-auto">
                        No lead in the reallocation workspace matches "{searchQuery}" by name, phone, email, or college.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-0.5">
                      {searchResults.leads.map((lead: any) => {
                        const collegeName = getLeadCollegeName(lead);
                        return (
                          <button
                            key={lead.id}
                            type="button"
                            onClick={() => handleSelectReallocationLead(lead)}
                            className="w-full flex items-start gap-3 rounded-xl p-3 text-left transition hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60 group cursor-pointer border border-transparent hover:border-border/80"
                          >
                            <div className="p-2 rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-950/40 shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                              <UserCheck size={18} />
                            </div>

                            <div className="min-w-0 flex-1">
                              {/* Top row: Name & Status */}
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-bold text-text-primary truncate group-hover:text-primary-600 dark:group-hover:text-primary-400">
                                  {lead.firstName} {lead.lastName || ""}
                                </p>
                                {lead.status?.name && (
                                  <span
                                    className="px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wide shrink-0 border"
                                    style={{
                                      backgroundColor: lead.status?.color ? `${lead.status.color}15` : "#e2e8f0",
                                      color: lead.status?.color || "#475569",
                                      borderColor: lead.status?.color ? `${lead.status.color}30` : "#cbd5e1",
                                    }}
                                  >
                                    {lead.status.name}
                                  </span>
                                )}
                              </div>

                              {/* Phone & Email */}
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-secondary mt-1">
                                {lead.phone && (
                                  <span className="inline-flex items-center gap-1 font-medium text-text-primary/90 shrink-0">
                                    <Phone size={12} className="shrink-0 text-text-muted" />
                                    {lead.phone}
                                  </span>
                                )}
                                {lead.email && (
                                  <span className="inline-flex items-center gap-1 shrink-0 text-text-secondary truncate max-w-[220px]">
                                    <Mail size={12} className="shrink-0 text-text-muted" />
                                    {lead.email}
                                  </span>
                                )}
                              </div>

                              {/* Associated College info */}
                              {collegeName && (
                                <div className="flex items-center gap-1.5 text-xs text-text-secondary mt-1.5 truncate">
                                  <Building2 size={13} className="shrink-0 text-primary-500" />
                                  <span className="truncate font-medium text-text-primary/80">
                                    {collegeName}
                                  </span>
                                </div>
                              )}

                              {/* Computed owner / assignment status pill */}
                              {(lead.computedAssignmentStatus || lead.computedCurrentOwner) && (
                                <div className="flex items-center gap-2 text-[11px] text-text-muted mt-1.5 pt-1 border-t border-border/40">
                                  {lead.computedAssignmentStatus && (
                                    <span
                                      className={`px-1.5 py-0.2 rounded font-semibold text-[10px] ${
                                        lead.computedAssignmentStatus === "ACTIVE"
                                          ? "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40"
                                          : lead.computedAssignmentStatus === "EXPIRED"
                                          ? "text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40"
                                          : "text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800"
                                      }`}
                                    >
                                      {lead.computedAssignmentStatus}
                                    </span>
                                  )}
                                  {lead.computedCurrentOwner ? (
                                    <span className="truncate">
                                      Owner: {lead.computedCurrentOwner.firstName} {lead.computedCurrentOwner.lastName || ""}
                                    </span>
                                  ) : (
                                    <span>Unassigned</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                /* Standard Multi-Category Search Results on other pages */
                <div className="space-y-4">
                  {searchResults.leads.length > 0 && (
                    <div>
                      <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-text-muted">
                        Leads ({searchResults.leads.length})
                      </div>
                      <div className="space-y-1 mt-1">
                        {searchResults.leads.slice(0, 5).map((lead) => (
                          <button
                            key={lead.id}
                            onClick={() => { setShowResults(false); navigate(`/leads/${lead.id}`); }}
                            className="w-full flex items-center gap-3 rounded-lg p-2 text-left transition hover:bg-background group cursor-pointer"
                          >
                            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 shrink-0">
                              <UserCheck size={16} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-text-primary truncate group-hover:text-primary-600">
                                {lead.firstName} {lead.lastName}
                              </p>
                              <p className="flex items-center gap-1 text-xs text-text-secondary mt-0.5 truncate">
                                {lead.phone && <><Phone size={12} className="shrink-0" /> {lead.phone}</>}
                                {lead.email && <><Mail size={12} className="shrink-0 ml-1" /> {lead.email}</>}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResults.studentData.length > 0 && (
                    <div>
                      <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-text-muted">
                        Student Data ({searchResults.studentData.length})
                      </div>
                      <div className="space-y-1 mt-1">
                        {searchResults.studentData.slice(0, 5).map((student: any) => (
                          <button
                            key={student.id}
                            onClick={() => { setShowResults(false); navigate(`/data-management`); }}
                            className="w-full flex items-center gap-3 rounded-lg p-2 text-left transition hover:bg-background group cursor-pointer"
                          >
                            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 shrink-0">
                              <FileText size={16} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-text-primary truncate group-hover:text-primary-600">
                                {student.firstName} {student.lastName}
                              </p>
                              <p className="flex items-center gap-1 text-xs text-text-secondary mt-0.5 truncate">
                                {student.phone && <><Phone size={12} className="shrink-0" /> {student.phone}</>}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResults.colleges.length > 0 && (
                    <div>
                      <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-text-muted">
                        Colleges ({searchResults.colleges.length})
                      </div>
                      <div className="space-y-1 mt-1">
                        {searchResults.colleges.slice(0, 5).map((college) => (
                          <button
                            key={college.id}
                            onClick={() => handleSelectCollege(college.name)}
                            className="w-full flex items-center gap-3 rounded-lg p-2 text-left transition hover:bg-background group cursor-pointer"
                          >
                            <div className="p-2 rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-950/40 shrink-0">
                              <Building2 size={16} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-text-primary truncate group-hover:text-primary-600">
                                {college.name}
                              </p>
                              {(college.city || college.state) && (
                                <p className="flex items-center gap-1 text-xs text-text-secondary mt-0.5">
                                  <MapPin size={12} className="shrink-0 text-text-muted" />
                                  {[college.city, college.state].filter(Boolean).join(", ")}
                                </p>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResults.users.length > 0 && (
                    <div>
                      <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-text-muted">
                        Users ({searchResults.users.length})
                      </div>
                      <div className="space-y-1 mt-1">
                        {searchResults.users.slice(0, 5).map((u) => (
                          <button
                            key={u.id}
                            onClick={() => { setShowResults(false); navigate(`/users`); }}
                            className="w-full flex items-center gap-3 rounded-lg p-2 text-left transition hover:bg-background group cursor-pointer"
                          >
                            <div className="p-2 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/40 shrink-0">
                              <User size={16} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-text-primary truncate group-hover:text-primary-600">
                                {u.firstName} {u.lastName}
                              </p>
                              <p className="flex items-center gap-1 text-xs text-text-secondary mt-0.5 truncate">
                                {u.role?.name || ''} {u.email && <><Mail size={12} className="shrink-0 ml-1" /> {u.email}</>}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResults.leads.length === 0 && searchResults.studentData.length === 0 && searchResults.colleges.length === 0 && searchResults.users.length === 0 && (
                    <div className="py-6 text-center text-sm text-text-muted">
                      No results found for "{searchQuery}"
                    </div>
                  )}
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
            p-2 sm:p-2.5
            text-text-secondary
            transition
            hover:bg-surface
            hover:text-primary-600
            cursor-pointer
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
          title={
            pendingBroadcastCount > 0
              ? `Notifications: ${unreadCount} unread, ${pendingBroadcastCount} broadcast(s) awaiting acknowledgement`
              : "Notifications"
          }
          aria-label="Toggle notifications drawer"
          className="
            relative
            rounded-lg
            p-2 sm:p-2.5
            text-text-secondary
            transition
            hover:bg-surface
            hover:text-primary-600
            cursor-pointer
          "
        >
          <Bell size={18} />

          {unreadCount + pendingBroadcastCount > 0 && (
            <span
              className={`absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white shadow-xs ${
                pendingBroadcastCount > 0 ? "bg-amber-600 animate-pulse" : "bg-danger-500"
              }`}
            >
              {unreadCount + pendingBroadcastCount > 99
                ? "99+"
                : unreadCount + pendingBroadcastCount}
            </span>
          )}
        </button>

        {/* Divider */}
        <div className="h-6 sm:h-8 w-px bg-border" />

        {/* Campus Updates Logo */}
        <Link
          to="/"
          className="flex items-center min-w-0 focus:outline-hidden"
          title="Campus Updates"
        >
          <img
            src="/favicon.png"
            alt="Campus Updates logo"
            className="h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10 object-contain shrink-0"
          />
        </Link>

      </div>
    </header>
  );
};

export default Navbar;