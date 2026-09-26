import { useEffect, useState, useCallback } from "react";
import {
  X,
  Bookmark,
  RefreshCw,
  PhoneCall,
  History,
  Plus,
  Clock,
  FileText,
  AlertCircle,
  ExternalLink,
  Search,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import {
  fetchCallLogs,
  type CallLogItem,
} from "../../../services/mockCallService";

interface BookmarksDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDialer: (studentDataId: string) => void;
  onOpenDisposition: (student: CallLogItem) => void;
  onOpenHistory: (student: CallLogItem) => void;
  refreshKey?: number;
}

const formatExpiresIn = (expiresAtStr?: string | null): string => {
  if (!expiresAtStr) return "24h Active";
  const diffMs = new Date(expiresAtStr).getTime() - Date.now();
  if (diffMs <= 0) return "Expired";
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) {
    return `${hours}h ${mins}m remaining`;
  }
  return `${mins}m remaining`;
};

export const BookmarksDrawer = ({
  isOpen,
  onClose,
  onOpenDialer,
  onOpenDisposition,
  onOpenHistory,
  refreshKey = 0,
}: BookmarksDrawerProps) => {
  const { accessToken } = useAuth();
  const [items, setItems] = useState<CallLogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState("");

  const loadBookmarks = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchCallLogs(accessToken, {
        bookmarkedOnly: true,
        limit: 100,
        search: searchFilter,
      });
      setItems(res.data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load bookmarked call records.");
    } finally {
      setLoading(false);
    }
  }, [accessToken, searchFilter]);

  useEffect(() => {
    if (isOpen) {
      loadBookmarks();
    }
  }, [isOpen, refreshKey, loadBookmarks]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-2xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Slide-in Panel */}
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md sm:w-[480px] bg-surface border-l border-border shadow-2xl flex flex-col transform transition-transform duration-300 animate-in slide-in-from-right">
          {/* Header */}
          <div className="p-5 border-b border-border bg-neutral-50/50 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-primary-600 uppercase tracking-wider">
                  <Bookmark size={14} className="fill-primary-600 text-primary-600" />
                  Active Bookmarks
                </div>
                <h2 className="text-lg font-bold text-text-primary mt-0.5">
                  Follow Up & Call Back Later
                </h2>
                <p className="text-xs text-text-secondary mt-0.5">
                  Student contacts requiring callback within 24 hours.
                </p>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={loadBookmarks}
                  title="Refresh bookmarks"
                  className="p-1.5 rounded-lg border border-border text-text-secondary hover:bg-neutral-100 transition cursor-pointer"
                >
                  <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-lg border border-border text-text-secondary hover:bg-neutral-100 transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* In-drawer quick search */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Filter bookmarks..."
                className="w-full h-8 rounded-lg border border-border bg-surface pl-8 pr-3 text-xs text-text-primary outline-none focus:border-primary-500 transition"
              />
              {searchFilter && (
                <button
                  type="button"
                  onClick={() => setSearchFilter("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-text-muted hover:text-text-primary cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {loading ? (
              <div className="p-12 text-center text-xs text-text-muted flex flex-col items-center justify-center gap-2">
                <RefreshCw size={20} className="animate-spin text-primary-600" />
                <span>Loading active bookmarked students...</span>
              </div>
            ) : error ? (
              <div className="p-6 text-center bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                <AlertCircle size={24} className="text-rose-600 mx-auto" />
                <p className="text-xs font-semibold text-rose-900">{error}</p>
                <button
                  type="button"
                  onClick={loadBookmarks}
                  className="text-xs font-bold text-rose-700 underline cursor-pointer"
                >
                  Try Again
                </button>
              </div>
            ) : items.length === 0 ? (
              <div className="p-12 text-center text-xs text-text-muted space-y-3">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                  <Bookmark size={24} />
                </div>
                <h3 className="font-bold text-text-primary text-sm">No Active Bookmarks</h3>
                <p className="max-w-xs mx-auto text-text-secondary leading-relaxed">
                  Students whose disposition is set to <strong>Call Back Later</strong> or <strong>Follow Up Required</strong> will automatically appear here for 24 hours.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-xs text-text-secondary font-semibold">
                  Total Bookmarked ({items.length})
                </div>

                {items.map((item) => {
                  const outcome = item.latestCall?.outcome;
                  const outcomeLabel =
                    outcome === "CALL_BACK_LATER"
                      ? "Call Back Later"
                      : outcome === "FOLLOW_UP" || outcome === "FOLLOW_UP_REQUIRED"
                      ? "Follow Up Required"
                      : outcome
                      ? outcome.replace(/_/g, " ")
                      : "Follow Up";

                  const badgeClass =
                    outcome === "CALL_BACK_LATER"
                      ? "border-purple-300 bg-purple-50 text-purple-800"
                      : "border-blue-300 bg-blue-50 text-blue-800";

                  const expiresText = formatExpiresIn(item.bookmarkExpiresAt);

                  return (
                    <div
                      key={item.studentDataId}
                      className="p-4 rounded-xl border border-border bg-surface hover:border-primary-200 transition shadow-2xs space-y-3"
                    >
                      {/* Top Bar: Name & Outcome Badge */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onOpenDialer(item.studentDataId);
                            }}
                            className="group font-bold text-sm text-text-primary hover:text-primary-600 flex items-center gap-1.5 text-left cursor-pointer"
                          >
                            <span>{item.fullName}</span>
                            <ExternalLink size={13} className="text-primary-500 opacity-0 group-hover:opacity-100 transition" />
                          </button>
                          <p className="text-xs font-mono text-text-secondary mt-0.5">
                            {item.phone} {item.email ? `• ${item.email}` : ""}
                          </p>
                        </div>

                        <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-bold shrink-0 ${badgeClass}`}>
                          {outcomeLabel}
                        </span>
                      </div>

                      {/* Expiry & Upload Info */}
                      <div className="flex flex-wrap items-center justify-between text-[11px] text-text-muted gap-2 border-t border-b border-neutral-100 py-1.5">
                        <span className="flex items-center gap-1 font-medium text-blue-700">
                          <Clock size={12} />
                          {expiresText}
                        </span>
                        <span className="truncate max-w-[180px]">
                          File: {item.uploadFileName}
                        </span>
                      </div>

                      {/* Notes snippet if available */}
                      {item.latestCall?.notes && (
                        <div className="p-2.5 rounded-lg bg-neutral-50 border border-neutral-200 text-xs text-text-secondary flex items-start gap-2">
                          <FileText size={13} className="text-text-muted shrink-0 mt-0.5" />
                          <p className="italic line-clamp-2">"{item.latestCall.notes}"</p>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenDialer(item.studentDataId);
                          }}
                          className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-primary-700 transition cursor-pointer"
                        >
                          <PhoneCall size={12} />
                          Call in Dialer
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              onOpenDisposition(item);
                            }}
                            className="flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-semibold text-text-secondary hover:bg-neutral-100 hover:text-text-primary transition cursor-pointer"
                          >
                            <Plus size={12} />
                            Disposition
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              onOpenHistory(item);
                            }}
                            className="flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-semibold text-text-secondary hover:bg-neutral-100 hover:text-text-primary transition cursor-pointer"
                          >
                            <History size={12} />
                            History
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
