import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Megaphone,
  Plus,
  Search,
  RefreshCw,
  Eye,
  CheckCircle2,
  Clock,
  Users,
  BarChart3,
  Calendar,
  X,
  Inbox,
  Send,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import {
  fetchBroadcasts,
  markBroadcastRead,
  type BroadcastSummaryItem,
  type EmployeeBroadcastItem,
} from "../../../services/broadcastService";
import { CreateBroadcastModal } from "../components/CreateBroadcastModal";
import { BroadcastReportModal } from "../components/BroadcastReportModal";
import { BroadcastReaderModal } from "../components/BroadcastReaderModal";
import {
  SectionLoadingState,
  PageLoadingState,
  PageErrorState,
  PageEmptyState,
} from "../../../components/common";

export const BroadcastPage = () => {
  const { accessToken, user } = useAuth();
  const toast = useToast();

  const isSuperAdmin = user?.roleCode === "SUPER_ADMIN";
  const isManager = user?.roleCode === "MANAGER";
  const canCreate = isSuperAdmin || isManager;

  // Tabs:
  // Super Admin: 'crm_broadcasts' (all broadcasts across CRM) | 'inbox'
  // Manager: 'sent' (broadcasts sent by manager) | 'inbox'
  // Employee: 'inbox' only
  const [activeTab, setActiveTab] = useState<"crm_broadcasts" | "sent" | "inbox">(
    isSuperAdmin ? "crm_broadcasts" : isManager ? "sent" : "inbox"
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  // Filters for Table View (Super Admin / Manager Sent)
  const [senderRoleFilter, setSenderRoleFilter] = useState<"ALL" | "SUPER_ADMIN" | "MANAGER">("ALL");
  const [timeFilter, setTimeFilter] = useState<"ALL" | "TODAY" | "LAST_7_DAYS" | "LAST_30_DAYS">("ALL");
  const [ackFilter, setAckFilter] = useState<"ALL" | "ACKNOWLEDGED" | "PENDING">("ALL");

  // Filters for Employee Inbox View
  const [inboxStatusFilter, setInboxStatusFilter] = useState<"ALL" | "UNREAD" | "ACKNOWLEDGED">("ALL");

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [selectedReaderItem, setSelectedReaderItem] = useState<EmployeeBroadcastItem | null>(null);

  const isTableView = (isSuperAdmin && activeTab === "crm_broadcasts") || (isManager && activeTab === "sent");

  const loadData = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const isInbox = !isTableView;
      const res = await fetchBroadcasts(accessToken, {
        page,
        limit: 20,
        search: searchTerm,
        inbox: isInbox,
        senderRole: isTableView && isSuperAdmin ? senderRoleFilter : undefined,
        time: isTableView ? timeFilter : undefined,
        ackStatus: isTableView ? ackFilter : undefined,
      });
      setItems(res.data);
      if (res.meta) {
        setMeta(res.meta);
      }
    } catch (err: any) {
      console.error("Failed to load broadcasts", err);
      const msg = err.message || "Failed to load broadcast messages";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [accessToken, isTableView, isSuperAdmin, page, searchTerm, senderRoleFilter, timeFilter, ackFilter, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle tab switch
  const handleTabChange = (tab: "crm_broadcasts" | "sent" | "inbox") => {
    setActiveTab(tab);
    setPage(1);
    setSearchTerm("");
    setSenderRoleFilter("ALL");
    setTimeFilter("ALL");
    setAckFilter("ALL");
  };

  // Handle employee opening a broadcast to read
  const handleOpenReader = async (item: EmployeeBroadcastItem) => {
    setSelectedReaderItem(item);
    if (!item.isRead && accessToken) {
      try {
        await markBroadcastRead(accessToken, item.id);
        // Update local item status to read
        setItems((prev) =>
          prev.map((b) =>
            b.id === item.id ? { ...b, isRead: true, readAt: new Date().toISOString() } : b
          )
        );
      } catch (err) {
        console.error("Failed to mark as read", err);
      }
    }
  };

  const handleBroadcastAcknowledged = (broadcastId: string) => {
    setItems((prev) =>
      prev.map((b) =>
        b.id === broadcastId
          ? {
              ...b,
              isRead: true,
              isAcknowledged: true,
              acknowledgedAt: new Date().toISOString(),
            }
          : b
      )
    );
    if (selectedReaderItem && selectedReaderItem.id === broadcastId) {
      setSelectedReaderItem({
        ...selectedReaderItem,
        isRead: true,
        isAcknowledged: true,
        acknowledgedAt: new Date().toISOString(),
      });
    }
  };

  // Filtered employee inbox items (client-side unread/ack status filter)
  const filteredEmployeeItems = useMemo(() => {
    if (isTableView) return items;
    return items.filter((item) => {
      if (inboxStatusFilter === "UNREAD") return !item.isRead;
      if (inboxStatusFilter === "ACKNOWLEDGED") return item.isAcknowledged;
      return true;
    });
  }, [items, isTableView, inboxStatusFilter]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2.5">
            <Megaphone className="text-primary-600 h-7 w-7 shrink-0" />
            <span>Broadcast Messages</span>
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            {isSuperAdmin
              ? "Comprehensive broadcast history across the CRM, sender details, and real-time acknowledgement tracking."
              : isManager
              ? "Circulate announcements to your authorized teams, monitor acknowledgements, and review messages."
              : "Important announcements and company-wide communications requiring your review."}
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={loadData}
            disabled={loading}
            title="Refresh announcements"
            className="p-2.5 rounded-lg border border-border bg-surface text-text-secondary hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>

          {canCreate && (
            <button
              onClick={() => setCreateModalOpen(true)}
              className="
                flex items-center gap-2
                rounded-lg
                bg-primary-500 hover:bg-primary-600
                px-4 py-2.5
                text-sm font-medium
                text-white
                shadow-sm transition cursor-pointer
              "
            >
              <Plus size={18} />
              <span>New Broadcast</span>
            </button>
          )}
        </div>
      </div>

      {/* Role Navigation Tabs (Super Admin and Manager) */}
      {(isSuperAdmin || isManager) && (
        <div className="flex items-center gap-2 border-b border-border">
          {isSuperAdmin && (
            <button
              type="button"
              onClick={() => handleTabChange("crm_broadcasts")}
              className={`flex items-center gap-2 pb-3 px-3 text-sm font-medium border-b-2 transition cursor-pointer ${
                activeTab === "crm_broadcasts"
                  ? "border-primary-500 text-primary-600 dark:text-primary-400 font-semibold"
                  : "border-transparent text-text-secondary hover:text-text-primary"
              }`}
            >
              <ShieldCheck size={16} />
              <span>All CRM Broadcasts</span>
              {activeTab === "crm_broadcasts" && meta?.total > 0 && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-primary-500/15 text-primary-600 dark:text-primary-400 font-semibold">
                  {meta.total}
                </span>
              )}
            </button>
          )}

          {isManager && (
            <button
              type="button"
              onClick={() => handleTabChange("sent")}
              className={`flex items-center gap-2 pb-3 px-3 text-sm font-medium border-b-2 transition cursor-pointer ${
                activeTab === "sent"
                  ? "border-primary-500 text-primary-600 dark:text-primary-400 font-semibold"
                  : "border-transparent text-text-secondary hover:text-text-primary"
              }`}
            >
              <Send size={16} />
              <span>Sent Announcements</span>
              {activeTab === "sent" && meta?.total > 0 && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-primary-500/15 text-primary-600 dark:text-primary-400 font-semibold">
                  {meta.total}
                </span>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={() => handleTabChange("inbox")}
            className={`flex items-center gap-2 pb-3 px-3 text-sm font-medium border-b-2 transition cursor-pointer ${
              activeTab === "inbox"
                ? "border-primary-500 text-primary-600 dark:text-primary-400 font-semibold"
                : "border-transparent text-text-secondary hover:text-text-primary"
            }`}
          >
            <Inbox size={16} />
            <span>Received Messages</span>
          </button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 w-full min-w-0">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
          />
          <input
            type="text"
            placeholder={
              isTableView
                ? isSuperAdmin
                  ? "Search by title, message body, or sender name..."
                  : "Search your sent announcements..."
                : "Search received announcements..."
            }
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="
              h-11
              w-full
              rounded-xl
              border border-border
              bg-surface
              pl-11 pr-10
              text-sm text-text-primary
              placeholder:text-text-muted
              outline-none
              focus:border-primary-500
              focus:ring-2 focus:ring-primary-100
              transition
            "
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setPage(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-primary rounded-md"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Filters for Table View (Super Admin / Manager Sent) */}
        {isTableView ? (
          <div className="flex flex-wrap items-center gap-2">
            {/* Sender Filter - Super Admin Only */}
            {isSuperAdmin && (
              <select
                value={senderRoleFilter}
                onChange={(e) => {
                  setSenderRoleFilter(e.target.value as any);
                  setPage(1);
                }}
                className="h-11 px-3 rounded-xl border border-border bg-surface text-xs text-text-primary outline-none focus:border-primary-500 cursor-pointer"
              >
                <option value="ALL">All Senders</option>
                <option value="SUPER_ADMIN">Super Admins Only</option>
                <option value="MANAGER">Managers Only</option>
              </select>
            )}

            {/* Date Range Filter */}
            <select
              value={timeFilter}
              onChange={(e) => {
                setTimeFilter(e.target.value as any);
                setPage(1);
              }}
              className="h-11 px-3 rounded-xl border border-border bg-surface text-xs text-text-primary outline-none focus:border-primary-500 cursor-pointer"
            >
              <option value="ALL">All Time</option>
              <option value="TODAY">Sent Today</option>
              <option value="LAST_7_DAYS">Last 7 Days</option>
              <option value="LAST_30_DAYS">Last 30 Days</option>
            </select>

            {/* Acknowledgement Status Filter */}
            <select
              value={ackFilter}
              onChange={(e) => {
                setAckFilter(e.target.value as any);
                setPage(1);
              }}
              className="h-11 px-3 rounded-xl border border-border bg-surface text-xs text-text-primary outline-none focus:border-primary-500 cursor-pointer"
            >
              <option value="ALL">All Ack Statuses</option>
              <option value="ACKNOWLEDGED">100% Acknowledged</option>
              <option value="PENDING">Pending Acknowledgement</option>
            </select>
          </div>
        ) : (
          /* Segmented Control for Employee / Inbox View */
          <div className="inline-flex items-center gap-1 p-1 rounded-xl border border-border bg-surface shrink-0 self-start lg:self-auto overflow-x-auto max-w-full">
            {(["ALL", "UNREAD", "ACKNOWLEDGED"] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setInboxStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer whitespace-nowrap ${
                  inboxStatusFilter === st
                    ? "bg-primary-500 text-white font-semibold shadow-2xs"
                    : "text-text-secondary hover:text-text-primary hover:bg-neutral-100 dark:hover:bg-neutral-800"
                }`}
              >
                {st === "ALL" && "All Messages"}
                {st === "UNREAD" && "Unread Only"}
                {st === "ACKNOWLEDGED" && "Acknowledged"}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {isTableView ? (
        /* TABLE VIEW: Super Admin All Broadcasts or Manager Sent Broadcasts */
        <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="border-b border-border bg-neutral-50 dark:bg-neutral-800/50 text-text-secondary font-semibold uppercase">
                <tr>
                  <th className="px-5 py-4 text-left">Announcement Details</th>
                  {isSuperAdmin && <th className="px-5 py-4 text-left">Sender</th>}
                  <th className="px-5 py-4 text-left">Sent Date</th>
                  <th className="px-5 py-4 text-left">Target Audience</th>
                  <th className="px-5 py-4 text-center">Recipients</th>
                  <th className="px-5 py-4 text-center">Read Status</th>
                  <th className="px-5 py-4 text-center">Acknowledgement</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading && items.length === 0 ? (
                  <SectionLoadingState
                    isTableRow
                    colSpan={isSuperAdmin ? 8 : 7}
                    message="Loading broadcasts..."
                  />
                ) : error ? (
                  <PageErrorState
                    isTableRow
                    colSpan={isSuperAdmin ? 8 : 7}
                    title="Failed to load broadcasts"
                    message={error}
                    onRetry={loadData}
                  />
                ) : items.length === 0 ? (
                  <PageEmptyState
                    isTableRow
                    colSpan={isSuperAdmin ? 8 : 7}
                    icon={Megaphone}
                    title={
                      isSuperAdmin
                        ? "No Broadcasts Circulated Yet"
                        : "No Broadcasts Sent by You"
                    }
                    message={
                      isSuperAdmin
                        ? "Broadcasts sent by Super Admins and Managers will appear here with delivery, read, and acknowledgement tracking."
                        : "Broadcast announcements to your authorized teams and monitor recipient acknowledgements in real-time."
                    }
                    actionText={canCreate ? "Create First Broadcast" : undefined}
                    onAction={canCreate ? () => setCreateModalOpen(true) : undefined}
                  />
                ) : (
                  items.map((broadcast: BroadcastSummaryItem) => {
                    const ackPercent = broadcast.totalRecipients
                      ? Math.round((broadcast.acknowledgedCount / broadcast.totalRecipients) * 100)
                      : 0;
                    const readPercent = broadcast.totalRecipients
                      ? Math.round((broadcast.readCount / broadcast.totalRecipients) * 100)
                      : 0;
                    const senderRoleName = broadcast.createdBy?.role?.name || "SUPER_ADMIN";
                    const isManagerSender = senderRoleName === "MANAGER";

                    return (
                      <tr
                        key={broadcast.id}
                        className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40 transition"
                      >
                        {/* Title & Preview */}
                        <td className="px-5 py-4 max-w-xs sm:max-w-sm">
                          <p className="font-semibold text-sm text-text-primary truncate">
                            {broadcast.title}
                          </p>
                          <p className="text-xs text-text-secondary line-clamp-1 mt-0.5">
                            {broadcast.body}
                          </p>
                        </td>

                        {/* Sender info (Super Admin View) */}
                        {isSuperAdmin && (
                          <td className="px-5 py-4 whitespace-nowrap">
                            <p className="font-medium text-text-primary">
                              {broadcast.createdBy
                                ? `${broadcast.createdBy.firstName} ${broadcast.createdBy.lastName || ""}`.trim()
                                : "System"}
                            </p>
                            <span
                              className={`inline-block mt-0.5 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                                isManagerSender
                                  ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25"
                                  : "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25"
                              }`}
                            >
                              {senderRoleName.replace(/_/g, " ")}
                            </span>
                          </td>
                        )}

                        {/* Sent Date & Time */}
                        <td className="px-5 py-4 text-text-secondary whitespace-nowrap">
                          <div className="flex items-center gap-1.5 font-medium">
                            <Calendar size={13} className="text-text-muted" />
                            {new Date(broadcast.sentAt || broadcast.createdAt).toLocaleDateString(
                              undefined,
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              }
                            )}
                          </div>
                          <span className="text-[11px] text-text-muted pl-5 block mt-0.5">
                            {new Date(broadcast.sentAt || broadcast.createdAt).toLocaleTimeString(
                              undefined,
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </span>
                        </td>

                        {/* Target Audience */}
                        <td className="px-5 py-4 max-w-[180px]">
                          <span className="inline-block px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-[11px] font-medium text-text-primary border border-border truncate max-w-full" title={broadcast.targetAudience}>
                            {broadcast.targetAudience || "Targeted Recipients"}
                          </span>
                        </td>

                        {/* Total Intended Recipients */}
                        <td className="px-5 py-4 text-center whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-border font-medium text-text-primary text-xs">
                            <Users size={12} className="text-text-muted" />
                            {broadcast.totalRecipients}
                          </span>
                        </td>

                        {/* Read Count & Unread count */}
                        <td className="px-5 py-4 text-center whitespace-nowrap">
                          <div className="inline-flex flex-col items-center">
                            <span className="font-semibold text-blue-600 dark:text-blue-400">
                              {broadcast.readCount} / {broadcast.totalRecipients}
                            </span>
                            <span className="text-[10px] text-text-muted">
                              {readPercent}% read ({broadcast.unreadCount} unread)
                            </span>
                          </div>
                        </td>

                        {/* Acknowledgement Count & Pending count */}
                        <td className="px-5 py-4 text-center whitespace-nowrap">
                          <div className="inline-flex flex-col items-center">
                            <span
                              className={`font-semibold ${
                                ackPercent === 100
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-amber-600 dark:text-amber-400"
                              }`}
                            >
                              {broadcast.acknowledgedCount} / {broadcast.totalRecipients}
                            </span>
                            <span className="text-[10px] text-text-muted">
                              {ackPercent}% signed ({broadcast.pendingAckCount} pending)
                            </span>
                          </div>
                        </td>

                        {/* Action: Open Report */}
                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setSelectedReportId(broadcast.id)}
                            className="
                              inline-flex items-center gap-1.5
                              px-3 py-1.5 rounded-lg
                              border border-border bg-surface
                              hover:bg-neutral-100 dark:hover:bg-neutral-800
                              text-text-primary font-medium text-xs
                              shadow-2xs transition cursor-pointer
                            "
                          >
                            <BarChart3 size={14} className="text-primary-500" />
                            Tracking Report
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination */}
          {meta?.totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-neutral-50/50 dark:bg-neutral-800/30">
              <span className="text-xs text-text-secondary">
                Showing page {meta.page} of {meta.totalPages} ({meta.total} broadcasts)
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1 rounded-lg border border-border bg-surface text-xs font-medium text-text-secondary hover:text-text-primary disabled:opacity-40 cursor-pointer"
                >
                  Previous
                </button>
                <button
                  disabled={page >= meta.totalPages || loading}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1 rounded-lg border border-border bg-surface text-xs font-medium text-text-secondary hover:text-text-primary disabled:opacity-40 cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* INBOX VIEW: List of Cards with Unread badges & Acknowledgement Status */
        <div className="space-y-3">
          {loading && items.length === 0 ? (
            <PageLoadingState message="Loading your announcements..." />
          ) : error ? (
            <PageErrorState
              title="Failed to load announcements"
              message={error}
              onRetry={loadData}
            />
          ) : filteredEmployeeItems.length === 0 ? (
            <PageEmptyState
              icon={Megaphone}
              title="No Announcements Found"
              message={
                inboxStatusFilter === "UNREAD"
                  ? "You have read all your broadcast announcements!"
                  : "You do not have any broadcast messages in this view."
              }
            />
          ) : (
            filteredEmployeeItems.map((item: EmployeeBroadcastItem) => (
              <div
                key={item.id}
                onClick={() => handleOpenReader(item)}
                className={`
                  group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4
                  p-5 rounded-xl border transition-all duration-200 cursor-pointer shadow-xs
                  ${!item.isRead
                    ? "border-primary-500/40 bg-surface hover:border-primary-500 hover:shadow-md"
                    : "border-border bg-surface hover:border-neutral-300 dark:hover:border-neutral-700"
                  }
                `}
              >
                {/* Left details */}
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border mt-0.5 ${
                      !item.isRead
                        ? "border-primary-300 dark:border-primary-800 bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400"
                        : "border-border bg-neutral-100 dark:bg-neutral-800 text-text-muted"
                    }`}
                  >
                    <Megaphone size={18} />
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {!item.isRead && (
                        <span className="px-2 py-0.5 rounded-full bg-primary-500 text-white font-semibold text-[10px] uppercase tracking-wider">
                          New Unread
                        </span>
                      )}

                      <h3
                        className={`text-sm ${
                          !item.isRead
                            ? "font-bold text-text-primary"
                            : "font-semibold text-text-primary"
                        } truncate`}
                      >
                        {item.title}
                      </h3>
                    </div>

                    <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                      {item.body}
                    </p>

                    <div className="flex items-center gap-2.5 text-[11px] text-text-muted pt-1 flex-wrap">
                      <span>
                        Sent by:{" "}
                        <strong className="text-text-primary font-medium">
                          {item.createdBy
                            ? `${item.createdBy.firstName} ${item.createdBy.lastName || ""}`.trim()
                            : "Super Admin"}
                        </strong>
                        {item.createdBy?.role?.name && (
                          <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] bg-neutral-100 dark:bg-neutral-800 text-text-secondary">
                            {item.createdBy.role.name.replace(/_/g, " ")}
                          </span>
                        )}
                      </span>
                      <span>•</span>
                      <span>
                        {new Date(item.sentAt).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Ack status badge & Action */}
                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  {item.isAcknowledged ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold text-xs border border-emerald-200 dark:border-emerald-800/60">
                      <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />
                      Acknowledged
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-semibold text-xs border border-amber-200 dark:border-amber-800/60">
                      <Clock size={14} className="text-amber-600 dark:text-amber-400" />
                      Pending Ack
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenReader(item);
                    }}
                    className="
                      inline-flex items-center gap-1.5
                      px-3.5 py-1.5 rounded-lg
                      bg-primary-500 hover:bg-primary-600
                      text-white font-medium text-xs
                      shadow-2xs transition cursor-pointer
                    "
                  >
                    <Eye size={14} />
                    Read & Acknowledge
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Create Broadcast Modal (Super Admin & Manager) */}
      {canCreate && (
        <CreateBroadcastModal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onSuccess={loadData}
        />
      )}

      {/* Recipient Tracking Report Modal (Super Admin & Broadcast Creator) */}
      {selectedReportId && (
        <BroadcastReportModal
          broadcastId={selectedReportId}
          onClose={() => setSelectedReportId(null)}
        />
      )}

      {/* Employee Reader & Acknowledge Modal */}
      {selectedReaderItem && (
        <BroadcastReaderModal
          broadcast={selectedReaderItem}
          onClose={() => setSelectedReaderItem(null)}
          onAcknowledged={handleBroadcastAcknowledged}
        />
      )}
    </div>
  );
};

export default BroadcastPage;
