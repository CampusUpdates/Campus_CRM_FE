import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Clock,
  Calendar,
  CalendarClock,
  CheckCircle2,
  Loader2,
  User,
  MapPin,
  Phone,
  Mail,
  RefreshCw,
  Eye,
  ChevronLeft,
  ChevronRight,
  X,
  Download,
} from "lucide-react";
import * as XLSX from "xlsx";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import { useNotification } from "../../../context/NotificationContext";
import {
  fetchAllCounselling,
  type CollegeCounsellingItem,
} from "../../../services/counsellingService";
import CollegeCounsellingDrawer from "../../leads/components/CollegeCounsellingDrawer";
import {
  DashboardDropdown,
  type DropdownOption,
  SectionLoadingState,
  PageErrorState,
  PageEmptyState,
} from "../../../components/common";
import { Tooltip } from "../../../components/Tooltip";

const ACTION_TOOLTIP_CLASS =
  "px-2.5 py-1 text-xs font-medium rounded-md shadow-lg bg-neutral-900 text-neutral-100 border border-neutral-700 dark:bg-slate-900 dark:border-slate-700 whitespace-nowrap pointer-events-none";

const COUNSELLING_STATUS_OPTIONS: DropdownOption[] = [
  { label: "All Requests", value: "ALL" },
  { label: "Pending", value: "REQUESTED" },
  { label: "Scheduled", value: "SCHEDULED" },
  { label: "Completed", value: "COMPLETED" },
];

const COUNSELLING_DATE_OPTIONS: DropdownOption[] = [
  { label: "All Time", value: "ALL" },
  { label: "Today", value: "TODAY" },
  { label: "Yesterday", value: "YESTERDAY" },
  { label: "Last 7 Days", value: "LAST_7_DAYS" },
  { label: "This Month", value: "THIS_MONTH" },
  { label: "Custom Date Range", value: "CUSTOM" },
];

const CollegeCounsellingPage = () => {
  const { accessToken, user } = useAuth();
  const { markModuleSeen } = useNotification();
  const toast = useToast();

  useEffect(() => {
    markModuleSeen("COLLEGE_COUNSELLING");
  }, [markModuleSeen]);

  const [requests, setRequests] = useState<CollegeCounsellingItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [dateFilter, setDateFilter] = useState<string>("ALL");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [appliedCustomStartDate, setAppliedCustomStartDate] = useState<string>("");
  const [appliedCustomEndDate, setAppliedCustomEndDate] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalRequests, setTotalRequests] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [selectedRequest, setSelectedRequest] = useState<CollegeCounsellingItem | null>(null);
  const [drawerMode, setDrawerMode] = useState<"SCHEDULE" | "COMPLETE" | "VIEW">("VIEW");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const requestIdRef = useRef(0);

  const normalizedRole = useMemo(() => {
    const rawRole =
      user?.roleCode ||
      user?.roleName ||
      user?.roleLabel ||
      (typeof (user as any)?.role === "string"
        ? (user as any).role
        : (user as any)?.role?.name) ||
      "";
    return String(rawRole).toUpperCase().replace(/\s+/g, "_");
  }, [user]);

  const canComplete = useMemo(() => {
    return (
      user?.roleCode === "MANAGER" ||
      user?.roleCode === "SUPER_ADMIN" ||
      user?.roleCode === "ADMIN" ||
      user?.roleCode === "TEAM_LEAD" ||
      [
        "SUPER_ADMIN",
        "SUPERADMIN",
        "ADMIN",
        "MANAGER",
        "TEAM_LEAD",
        "TEAMLEAD",
      ].includes(normalizedRole) ||
      normalizedRole.includes("MANAGER") ||
      normalizedRole.includes("ADMIN")
    );
  }, [normalizedRole, user?.roleCode]);

  const loadRequests = useCallback(
    async (silent = false) => {
      if (!accessToken) return;
      const currentRequestId = ++requestIdRef.current;
      try {
        if (!silent) {
          setLoading(true);
        } else {
          setIsRefreshing(true);
        }
        setError(null);
        const res = await fetchAllCounselling(accessToken, {
          status: statusFilter === "ALL" ? undefined : statusFilter,
          time: dateFilter === "ALL" ? undefined : dateFilter,
          fromDate:
            dateFilter === "CUSTOM"
              ? appliedCustomStartDate || undefined
              : undefined,
          toDate:
            dateFilter === "CUSTOM"
              ? appliedCustomEndDate || undefined
              : undefined,
          page,
          limit: pageSize,
        });

        if (currentRequestId !== requestIdRef.current) return;

        setRequests(res.data);
        setTotalRequests(res.total);
        setTotalPages(res.totalPages || 1);
      } catch (err: any) {
        if (currentRequestId !== requestIdRef.current) return;
        const msg = err.message || "Failed to load college counselling requests";
        setError(msg);
        if (!silent) toast.showToast(msg, "error");
      } finally {
        if (currentRequestId === requestIdRef.current) {
          setLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [
      accessToken,
      statusFilter,
      dateFilter,
      appliedCustomStartDate,
      appliedCustomEndDate,
      page,
      pageSize,
      toast,
    ]
  );

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleResetDateFilter = () => {
    setDateFilter("ALL");
    setCustomStartDate("");
    setCustomEndDate("");
    setAppliedCustomStartDate("");
    setAppliedCustomEndDate("");
    setPage(1);
  };

  // Real-time synchronization across browser tabs, background events, and tab focus
  useEffect(() => {
    let isSubscribed = true;

    // 1. BroadcastChannel for cross-tab sync
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel("crm_counselling_sync");
      channel.onmessage = () => {
        if (isSubscribed) loadRequests(true);
      };
    } catch { }

    // 2. Window Custom Event for same-page updates
    const handleCounsellingUpdated = () => {
      if (isSubscribed) loadRequests(true);
    };
    window.addEventListener("crm:counselling-updated", handleCounsellingUpdated);

    // 3. Storage event for cross-tab fallback
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "crm_counselling_last_update" && isSubscribed) {
        loadRequests(true);
      }
    };
    window.addEventListener("storage", handleStorage);

    // 4. Focus event: automatically sync when user focuses back on the tab
    const handleFocus = () => {
      if (isSubscribed) loadRequests(true);
    };
    window.addEventListener("focus", handleFocus);

    // 5. Periodic polling (every 10 seconds)
    const intervalId = setInterval(() => {
      if (isSubscribed) loadRequests(true);
    }, 10000);

    return () => {
      isSubscribed = false;
      if (channel) channel.close();
      window.removeEventListener("crm:counselling-updated", handleCounsellingUpdated);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", handleFocus);
      clearInterval(intervalId);
    };
  }, [loadRequests]);

  const handleOpenDrawer = (
    item: CollegeCounsellingItem,
    mode: "SCHEDULE" | "COMPLETE" | "VIEW" = "VIEW"
  ) => {
    setSelectedRequest(item);
    setDrawerMode(mode);
    setIsDrawerOpen(true);
  };

  const handleDrawerSuccess = (updated: CollegeCounsellingItem) => {
    setRequests((prev) =>
      prev
        .map((r) =>
          r.id === updated.id
            ? { ...r, ...updated }
            : r
        )
        .filter((item) => {
          if (statusFilter === "REQUESTED") {
            return item.status === "REQUESTED";
          }
          if (statusFilter === "SCHEDULED") {
            return item.status === "SCHEDULED";
          }
          if (statusFilter === "COMPLETED") {
            return item.status === "COMPLETED";
          }
          return true;
        })
    );
    loadRequests(true);
  };

  const renderBadge = (status?: string | null) => {
    const s = String(status || "").toUpperCase();
    if (s === "COMPLETED") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 px-3 py-1 text-xs font-semibold text-emerald-800 dark:text-emerald-300 border border-emerald-300/40">
          <CheckCircle2 size={13} />
          COMPLETED
        </span>
      );
    }
    if (s === "SCHEDULED") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 dark:bg-blue-950/60 px-3 py-1 text-xs font-semibold text-blue-800 dark:text-blue-300 border border-blue-300/40">
          <Calendar size={13} />
          SCHEDULED
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 dark:bg-amber-950/60 px-3 py-1 text-xs font-semibold text-amber-800 dark:text-amber-300 border border-amber-300/40">
        <Clock size={13} />
        PENDING
      </span>
    );
  };

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return "—";
    try {
      const d = new Date(isoString);
      return (
        d.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }) +
        ", " +
        d.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      );
    } catch {
      return isoString;
    }
  };

  const formatPreferredDate = (dateStr?: string | null) => {
    if (!dateStr) return null;
    try {
      const clean = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
      const parts = clean.split("-");
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const d = new Date(year, month, day);
        return d.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
      }
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formatPreferredTime = (timeStr?: string | null) => {
    if (!timeStr) return null;
    const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
    if (match) {
      let hours = parseInt(match[1], 10);
      const minutes = match[2];
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12 || 12;
      return `${String(hours).padStart(2, "0")}:${minutes} ${ampm}`;
    }
    return timeStr;
  };

  const handleExportExcel = async () => {
    if (!accessToken) {
      toast.showToast("Authentication required to export data", "error");
      return;
    }
    if (isExporting) return;

    try {
      setIsExporting(true);

      // Fetch all counselling records matching current filters across all pages (omit page & limit)
      const res = await fetchAllCounselling(accessToken, {
        status: statusFilter === "ALL" ? undefined : statusFilter,
        time: dateFilter === "ALL" ? undefined : dateFilter,
        fromDate:
          dateFilter === "CUSTOM"
            ? appliedCustomStartDate || undefined
            : undefined,
        toDate:
          dateFilter === "CUSTOM"
            ? appliedCustomEndDate || undefined
            : undefined,
      });

      const records = res.data || [];
      if (records.length === 0) {
        toast.showToast("No counselling records found matching current filters to export", "info");
        return;
      }

      const wb = XLSX.utils.book_new();

      const headers = [
        "Student Name",
        "Phone",
        "Email",
        "City",
        "State",
        "Course Interested",
        "College Name",
        "College Location",
        "Status",
        "Requested At",
        "Requested By",
        "Preferred Date & Time",
        "Purpose",
        "Scheduled Date & Time",
        "Scheduled By",
        "Counselling Notes",
        "Completed At",
        "Completed By",
        "Lead Valid Till",
        "Completion Revert / Remarks",
      ];

      const sheetData: (string | number)[][] = [headers];

      records.forEach((item) => {
        const studentName = [item.lead?.firstName, item.lead?.lastName]
          .filter(Boolean)
          .join(" ") || "N/A";
        const studentCity = item.lead?.city || "";
        const studentState = item.lead?.state || "";
        const collegeLocation = [item.college?.city, item.college?.state]
          .filter(Boolean)
          .join(", ");
        const course =
          item.lead?.courseInterested === "OTHER"
            ? item.lead?.courseInterestedOther || "Other"
            : item.lead?.courseInterested || "";
        const requesterName = [item.requestedBy?.firstName, item.requestedBy?.lastName]
          .filter(Boolean)
          .join(" ") || "N/A";
        const scheduledByName = [item.scheduledBy?.firstName, item.scheduledBy?.lastName]
          .filter(Boolean)
          .join(" ") || "";
        const completedByName = [item.completedBy?.firstName, item.completedBy?.lastName]
          .filter(Boolean)
          .join(" ") || "";

        const preferredDateTime = [
          formatPreferredDate(item.preferredDate),
          formatPreferredTime(item.preferredTime),
        ].filter(Boolean).join(" at ") || item.preferredTiming || "";

        const scheduledDateTime = [
          formatPreferredDate(item.scheduledDate || item.counsellingDate),
          formatPreferredTime(item.scheduledTime),
        ].filter(Boolean).join(" at ") || "";

        const leadValidTill = item.status === "COMPLETED" && item.counsellingDate
          ? formatPreferredDate(item.counsellingDate) || ""
          : "";

        sheetData.push([
          studentName,
          item.lead?.phone || "",
          item.lead?.email || "",
          studentCity,
          studentState,
          course,
          item.college?.name || "",
          collegeLocation,
          item.status || "",
          formatDate(item.requestedAt || item.createdAt),
          requesterName,
          preferredDateTime,
          item.purpose || "",
          scheduledDateTime,
          scheduledByName,
          item.counsellingNotes || "",
          item.completedAt ? formatDate(item.completedAt) : "",
          completedByName,
          leadValidTill,
          item.completionRemark || "",
        ]);
      });

      const ws = XLSX.utils.aoa_to_sheet(sheetData);

      ws["!cols"] = [
        { wch: 22 }, // Student Name
        { wch: 15 }, // Phone
        { wch: 25 }, // Email
        { wch: 16 }, // City
        { wch: 16 }, // State
        { wch: 20 }, // Course Interested
        { wch: 28 }, // College Name
        { wch: 20 }, // College Location
        { wch: 14 }, // Status
        { wch: 22 }, // Requested At
        { wch: 20 }, // Requested By
        { wch: 24 }, // Preferred Date & Time
        { wch: 26 }, // Purpose
        { wch: 24 }, // Scheduled Date & Time
        { wch: 20 }, // Scheduled By
        { wch: 28 }, // Counselling Notes
        { wch: 22 }, // Completed At
        { wch: 20 }, // Completed By
        { wch: 18 }, // Lead Valid Till
        { wch: 32 }, // Completion Revert / Remarks
      ];

      const headerRowNumber = 1;
      const lastRowNumber = headerRowNumber + records.length;
      ws["!autofilter"] = { ref: `A${headerRowNumber}:T${lastRowNumber}` };
      ws["!views"] = [{ state: "frozen", ySplit: 1 }];

      XLSX.utils.book_append_sheet(wb, ws, "College Counselling");

      const dateStamp = new Date().toISOString().split("T")[0];
      const statusSuffix = statusFilter !== "ALL" ? `_${statusFilter}` : "";
      const fileName = `College_Counselling_Export${statusSuffix}_${dateStamp}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast.showToast(`Exported ${records.length} counselling record${records.length > 1 ? "s" : ""} successfully`, "success");
    } catch (err: any) {
      console.error("Failed to export college counselling records:", err);
      toast.showToast(err.message || "Failed to export counselling records", "error");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">
            College Counselling
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Review and coordinate college counselling requests submitted by advisors.
          </p>
        </div>

        {/* Date Filter, Status Dropdown & Refresh Button */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Date Filter Dropdown */}
          <DashboardDropdown
            id="counselling-date-dropdown"
            value={dateFilter}
            onChange={(val) => {
              setDateFilter(val);
              setPage(1);
              if (val !== "CUSTOM") {
                setCustomStartDate("");
                setCustomEndDate("");
                setAppliedCustomStartDate("");
                setAppliedCustomEndDate("");
              }
            }}
            options={COUNSELLING_DATE_OPTIONS}
            minWidth="145px"
            align="right"
          />

          {/* Custom Date Range Picker */}
          {dateFilter === "CUSTOM" && (
            <div className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1 text-xs shadow-xs h-9">
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-text-muted font-medium">From:</span>
                <input
                  type="date"
                  value={customStartDate}
                  max={customEndDate || undefined}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="rounded border border-border bg-background px-1.5 py-0.5 text-xs text-text-primary focus:border-primary-500 focus:outline-hidden cursor-pointer dark:bg-slate-800"
                />
              </div>
              <span className="text-text-muted text-[11px] font-medium">to</span>
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-text-muted font-medium">To:</span>
                <input
                  type="date"
                  value={customEndDate}
                  min={customStartDate || undefined}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="rounded border border-border bg-background px-1.5 py-0.5 text-xs text-text-primary focus:border-primary-500 focus:outline-hidden cursor-pointer dark:bg-slate-800"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  if (customStartDate && customEndDate && customStartDate <= customEndDate) {
                    setAppliedCustomStartDate(customStartDate);
                    setAppliedCustomEndDate(customEndDate);
                    setPage(1);
                  }
                }}
                disabled={!customStartDate || !customEndDate || customStartDate > customEndDate}
                className="rounded-md bg-primary-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-primary-700 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
              >
                Apply
              </button>
            </div>
          )}

          {/* Clear / Reset Date Filter Button */}
          {dateFilter !== "ALL" && (
            <button
              type="button"
              onClick={handleResetDateFilter}
              title="Reset date filter to All Time"
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-2 text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-surface-hover active:bg-neutral-100 dark:active:bg-slate-800 transition shadow-xs cursor-pointer h-9"
            >
              <X size={13} className="text-text-muted" />
              <span>Reset Date</span>
            </button>
          )}

          {/* Status Dropdown */}
          <DashboardDropdown
            id="counselling-status-dropdown"
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setPage(1);
            }}
            options={COUNSELLING_STATUS_OPTIONS}
            minWidth="140px"
            align="right"
          />

          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => loadRequests(false)}
            disabled={loading || isRefreshing || isExporting}
            title="Refresh counselling requests"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold text-text-primary hover:bg-surface-hover active:bg-neutral-100 dark:active:bg-slate-800 transition shadow-xs cursor-pointer disabled:opacity-50 h-9"
          >
            <RefreshCw
              size={13}
              className={loading || isRefreshing ? "animate-spin text-primary-600 dark:text-emerald-400" : "text-text-muted"}
            />
            <span>Refresh</span>
          </button>

          {/* Export Button */}
          <button
            type="button"
            id="export-counselling-excel"
            onClick={handleExportExcel}
            disabled={isExporting}
            title="Export all matching counselling records to Excel"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold text-text-primary hover:bg-surface-hover active:bg-neutral-100 dark:active:bg-slate-800 transition shadow-xs cursor-pointer disabled:opacity-50 h-9"
          >
            {isExporting ? (
              <Loader2 size={13} className="animate-spin text-primary-600 dark:text-emerald-400" />
            ) : (
              <Download size={13} className="text-text-muted" />
            )}
            <span>{isExporting ? "Exporting..." : "Export"}</span>
          </button>
        </div>
      </div>

      {/* College Counselling Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-neutral-50">
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-text-secondary">
                  Student Information
                </th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-text-secondary">
                  College & Counselling Info
                </th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-text-secondary">
                  Requested By
                </th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-text-secondary">
                  Status
                </th>
                <th className="px-5 py-4 text-right text-xs font-semibold uppercase text-text-secondary">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SectionLoadingState
                  isTableRow
                  colSpan={5}
                  message="Loading college counselling requests..."
                  description="Retrieving student applications, scheduling dates, and counselor remarks"
                />
              ) : error ? (
                <PageErrorState
                  isTableRow
                  colSpan={5}
                  title="Unable to load counselling requests"
                  message={error}
                  onRetry={() => loadRequests(false)}
                />
              ) : requests.length === 0 ? (
                <PageEmptyState
                  isTableRow
                  colSpan={5}
                  icon={Clock}
                  title="No college counselling requests found"
                  description="No counselling requests found matching the selected status or date filters."
                />
              ) : (
                requests.map((item) => {
                  const studentName = [item.lead?.firstName, item.lead?.lastName]
                    .filter(Boolean)
                    .join(" ");
                  const studentLocation = [item.lead?.city, item.lead?.state]
                    .filter(Boolean)
                    .join(", ");
                  const collegeLocation = [item.college?.city, item.college?.state]
                    .filter(Boolean)
                    .join(", ");
                  const requesterName = [item.requestedBy?.firstName, item.requestedBy?.lastName]
                    .filter(Boolean)
                    .join(" ");
                  const isDone = String(item.status || "").toUpperCase() === "COMPLETED";
                  const isScheduled = String(item.status || "").toUpperCase() === "SCHEDULED";

                  return (
                    <tr
                      key={item.id}
                      className="border-b border-border last:border-0 hover:bg-neutral-50/50 transition align-top"
                    >
                      {/* Student Information Column */}
                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-text-primary flex items-center gap-1.5">
                            <User size={14} className="text-primary-600 shrink-0" />
                            {studentName || "N/A"}
                          </p>
                          {item.lead?.phone && (
                            <p className="text-xs text-text-secondary flex items-center gap-1.5">
                              <Phone size={12} className="text-text-muted shrink-0" />
                              {item.lead.phone}
                            </p>
                          )}
                          {item.lead?.email && (
                            <p className="text-xs text-text-secondary flex items-center gap-1.5">
                              <Mail size={12} className="text-text-muted shrink-0" />
                              {item.lead.email}
                            </p>
                          )}
                          {studentLocation && (
                            <p className="text-xs text-text-muted flex items-center gap-1.5">
                              <MapPin size={12} className="text-primary-500 shrink-0" />
                              {studentLocation}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* College & Counselling Info Column */}
                      <td className="px-5 py-4">
                        <div>
                          <p className="text-sm font-semibold text-text-primary">
                            {item.college?.name || "Unknown College"}
                          </p>
                          {collegeLocation && (
                            <p className="text-xs text-text-muted mt-0.5">
                              {collegeLocation}
                            </p>
                          )}
                          {Boolean(item.preferredDate || item.preferredTime || item.preferredTiming) && (
                            <p className="inline-flex items-center gap-1 text-xs font-semibold text-primary-700 mt-1">
                              <Calendar size={12} className="shrink-0" />
                              <span>
                                {[
                                  formatPreferredDate(item.preferredDate),
                                  formatPreferredTime(item.preferredTime),
                                ]
                                  .filter(Boolean)
                                  .join(" at ") || item.preferredTiming}
                              </span>
                            </p>
                          )}
                          {item.purpose && (
                            <p className="text-xs text-text-secondary mt-0.5">
                              Purpose: {item.purpose}
                            </p>
                          )}

                          {/* Scheduled Details in Row */}
                          {isScheduled && (item.scheduledDate || item.counsellingDate || item.counsellingNotes) && (
                            <div className="mt-1.5 space-y-0.5">
                              {(item.scheduledDate || item.counsellingDate) && (
                                <p className="text-xs text-blue-700 dark:text-blue-400 font-medium flex items-center gap-1">
                                  <Calendar size={11} className="shrink-0" />
                                  <span>
                                    Scheduled: {[
                                      formatPreferredDate(item.scheduledDate || item.counsellingDate),
                                      formatPreferredTime(item.scheduledTime),
                                    ].filter(Boolean).join(" at ")}
                                  </span>
                                </p>
                              )}
                              {(item.counsellingNotes || item.completionRemark) && (
                                <p className="text-xs text-blue-700 dark:text-blue-400 italic">
                                  Notes: {item.counsellingNotes || item.completionRemark}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Completed Details in Row */}
                          {isDone && (item.counsellingDate || item.completionRemark) && (
                            <div className="mt-1.5 space-y-0.5">
                              {item.counsellingDate && (
                                <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1">
                                  <Calendar size={11} className="shrink-0" />
                                  <span>Lead Valid Till: {formatPreferredDate(item.counsellingDate)}</span>
                                </p>
                              )}
                              {item.completionRemark && (
                                <p className="text-xs text-emerald-700 dark:text-emerald-400 italic">
                                  Revert: {item.completionRemark}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Requested By Column */}
                      <td className="px-5 py-4 text-sm text-text-secondary">
                        <div>
                          <p className="font-medium text-text-primary">
                            {requesterName || "Program Advisor"}
                          </p>
                          <p className="text-xs text-text-muted">
                            {formatDate(item.requestedAt || item.createdAt)}
                          </p>
                          {isScheduled && item.scheduledBy && (
                            <p className="text-xs text-blue-700 dark:text-blue-400 mt-0.5 font-medium">
                              Scheduled by: {[item.scheduledBy.firstName, item.scheduledBy.lastName].filter(Boolean).join(" ")}
                            </p>
                          )}
                          {isDone && item.completedBy && (
                            <p className="text-xs text-text-muted mt-0.5">
                              Done by: {[item.completedBy.firstName, item.completedBy.lastName].filter(Boolean).join(" ")}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Status Column */}
                      <td className="px-5 py-4">{renderBadge(item.status)}</td>

                      {/* Actions Column */}
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5 flex-wrap sm:flex-nowrap">
                          {isDone ? (
                            /* Completed requests retain only View Details */
                            <Tooltip content="View Details" className={ACTION_TOOLTIP_CLASS} wrapperClassName="inline-flex">
                              <button
                                type="button"
                                onClick={() => handleOpenDrawer(item, "VIEW")}
                                aria-label="View details"
                                className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-border bg-neutral-50 text-text-secondary hover:bg-neutral-100 hover:text-text-primary hover:border-neutral-300 dark:border-slate-700/80 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-700/90 dark:hover:text-white dark:hover:border-slate-600 transition-all duration-150 cursor-pointer shadow-2xs hover:shadow-xs active:scale-95 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-slate-900"
                              >
                                <Eye size={16} />
                              </button>
                            </Tooltip>
                          ) : canComplete ? (
                            <>
                              {isScheduled ? (
                                <>
                                  <Tooltip content="Mark as Done" className={ACTION_TOOLTIP_CLASS} wrapperClassName="inline-flex">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenDrawer(item, "COMPLETE")}
                                      aria-label="Mark as done"
                                      className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-emerald-200/80 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 hover:text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-400 dark:hover:bg-emerald-900/60 dark:hover:border-emerald-700 dark:hover:text-emerald-300 transition-all duration-150 cursor-pointer shadow-2xs hover:shadow-xs active:scale-95 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-slate-900"
                                    >
                                      <CheckCircle2 size={16} />
                                    </button>
                                  </Tooltip>
                                  <Tooltip content="Reschedule" className={ACTION_TOOLTIP_CLASS} wrapperClassName="inline-flex">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenDrawer(item, "SCHEDULE")}
                                      aria-label="Reschedule"
                                      className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-blue-200/80 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-300 hover:text-blue-800 dark:border-blue-800/50 dark:bg-blue-950/40 dark:text-blue-400 dark:hover:bg-blue-900/60 dark:hover:border-blue-700 dark:hover:text-blue-300 transition-all duration-150 cursor-pointer shadow-2xs hover:shadow-xs active:scale-95 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-slate-900"
                                    >
                                      <CalendarClock size={16} />
                                    </button>
                                  </Tooltip>
                                </>
                              ) : (
                                <>
                                  <Tooltip content="Schedule" className={ACTION_TOOLTIP_CLASS} wrapperClassName="inline-flex">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenDrawer(item, "SCHEDULE")}
                                      aria-label="Schedule"
                                      className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-blue-200/80 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-300 hover:text-blue-800 dark:border-blue-800/50 dark:bg-blue-950/40 dark:text-blue-400 dark:hover:bg-blue-900/60 dark:hover:border-blue-700 dark:hover:text-blue-300 transition-all duration-150 cursor-pointer shadow-2xs hover:shadow-xs active:scale-95 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-slate-900"
                                    >
                                      <CalendarClock size={16} />
                                    </button>
                                  </Tooltip>
                                  <Tooltip content="Mark as Done" className={ACTION_TOOLTIP_CLASS} wrapperClassName="inline-flex">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenDrawer(item, "COMPLETE")}
                                      aria-label="Mark as done"
                                      className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-emerald-200/80 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 hover:text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-400 dark:hover:bg-emerald-900/60 dark:hover:border-emerald-700 dark:hover:text-emerald-300 transition-all duration-150 cursor-pointer shadow-2xs hover:shadow-xs active:scale-95 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-slate-900"
                                    >
                                      <CheckCircle2 size={16} />
                                    </button>
                                  </Tooltip>
                                </>
                              )}
                              <Tooltip content="View Details" className={ACTION_TOOLTIP_CLASS} wrapperClassName="inline-flex">
                                <button
                                  type="button"
                                  onClick={() => handleOpenDrawer(item, "VIEW")}
                                  aria-label="View details"
                                  className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-border bg-neutral-50 text-text-secondary hover:bg-neutral-100 hover:text-text-primary hover:border-neutral-300 dark:border-slate-700/80 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-700/90 dark:hover:text-white dark:hover:border-slate-600 transition-all duration-150 cursor-pointer shadow-2xs hover:shadow-xs active:scale-95 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-slate-900"
                                >
                                  <Eye size={16} />
                                </button>
                              </Tooltip>
                            </>
                          ) : (
                            /* Program Advisor */
                            <Tooltip content="View Details" className={ACTION_TOOLTIP_CLASS} wrapperClassName="inline-flex">
                              <button
                                type="button"
                                onClick={() => handleOpenDrawer(item, "VIEW")}
                                aria-label="View details"
                                className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-border bg-neutral-50 text-text-secondary hover:bg-neutral-100 hover:text-text-primary hover:border-neutral-300 dark:border-slate-700/80 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-700/90 dark:hover:text-white dark:hover:border-slate-600 transition-all duration-150 cursor-pointer shadow-2xs hover:shadow-xs active:scale-95 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-slate-900"
                              >
                                <Eye size={16} />
                              </button>
                            </Tooltip>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Section */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3.5 border-t border-border px-5 py-3.5 text-xs bg-surface">
          {/* Left: Current Page & Total Matching Count */}
          <div className="text-text-secondary font-medium flex items-center gap-1.5 flex-wrap">
            <span>
              Page <span className="font-bold text-text-primary">{page}</span> of{" "}
              <span className="font-bold text-text-primary">{Math.max(1, totalPages)}</span>
            </span>
            <span className="text-text-muted">
              ({totalRequests} {totalRequests === 1 ? "matching request" : "matching requests"})
            </span>
          </div>

          {/* Right: Page Size Selector & Prev/Next Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Page Size Selector */}
            <div className="flex items-center gap-1.5 text-text-secondary">
              <span>Show:</span>
              <select
                id="counselling-page-size-select"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="rounded-md border border-border bg-background px-2 py-1 text-xs font-medium text-text-primary focus:border-primary-500 focus:outline-hidden cursor-pointer dark:bg-slate-800"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span>per page</span>
            </div>

            {/* Previous and Next Controls */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                id="counselling-prev-page-btn"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border bg-surface font-semibold text-text-secondary hover:bg-neutral-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-2xs cursor-pointer"
              >
                <ChevronLeft size={14} />
                Previous
              </button>

              <button
                type="button"
                id="counselling-next-page-btn"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border bg-surface font-semibold text-text-secondary hover:bg-neutral-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-2xs cursor-pointer"
              >
                Next
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* College Counselling Drawer */}
      {isDrawerOpen && selectedRequest && (
        <CollegeCounsellingDrawer
          request={selectedRequest}
          student={
            selectedRequest.lead || {
              id: selectedRequest.leadId,
              firstName: "Student",
            }
          }
          canComplete={canComplete}
          initialMode={drawerMode}
          onClose={() => {
            setIsDrawerOpen(false);
            setSelectedRequest(null);
          }}
          onSuccess={handleDrawerSuccess}
        />
      )}
    </div>
  );
};

export default CollegeCounsellingPage;
