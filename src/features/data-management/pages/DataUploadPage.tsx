import { useEffect, useState, useCallback } from "react";
import {
  Upload,
  Search,
  RefreshCw,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Clock,
  Plus,
  FileText,
  Users,
  History,
  Trash2,
  AlertTriangle,
  X,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import {
  fetchDataUploads,
  softDeleteUpload as softDeleteUploadApi,
  previewHardDeleteUpload,
  hardDeleteUploadRecords,
  type DataUploadItem,
} from "../../../services/dataManagementService";
import UploadDataModal from "../components/UploadDataModal";
import PaginationControls from "../components/PaginationControls";
import { DatasetHistoryDrawer } from "../components/DatasetHistoryDrawer";
import {
  SectionLoadingState,
  PageErrorState,
  PageEmptyState,
} from "../../../components/common";

const DataUploadPage = () => {
  const { accessToken } = useAuth();
  const [uploads, setUploads] = useState<DataUploadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [selectedUploadForHistory, setSelectedUploadForHistory] = useState<DataUploadItem | null>(null);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);

  // Soft Delete Modal State
  const [isSoftDeleteModalOpen, setIsSoftDeleteModalOpen] = useState(false);
  const [softDeleteUploadItem, setSoftDeleteUploadItem] = useState<DataUploadItem | null>(null);
  const [loadingSoftDelete, setLoadingSoftDelete] = useState(false);

  // Hard Delete Modal State
  const [isHardDeleteModalOpen, setIsHardDeleteModalOpen] = useState(false);
  const [isHardDeleteClosing, setIsHardDeleteClosing] = useState(false);
  const [hardDeleteUpload, setHardDeleteUpload] = useState<DataUploadItem | null>(null);
  const [hardDeletePreview, setHardDeletePreview] = useState<any>(null);
  const [loadingHardDelete, setLoadingHardDelete] = useState(false);
  const toast = useToast();

  const loadDataUploads = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchDataUploads(accessToken, page, 10);
      setUploads(res.data);
      if (res.pagination) {
        setTotalPages(res.pagination.totalPages || 1);
        setTotalCount(res.pagination.total || res.data.length);
      }
    } catch (err: any) {
      console.error("Failed to load uploads:", err);
      setError(err.message || "Failed to load upload history.");
    } finally {
      setLoading(false);
    }
  }, [accessToken, page]);

  useEffect(() => {
    loadDataUploads();
  }, [loadDataUploads]);

  // Auto-refresh when any dataset is in PROCESSING state
  useEffect(() => {
    const hasProcessing = uploads.some((u) => u.status === "PROCESSING");
    if (!hasProcessing) return;

    const interval = setInterval(() => {
      loadDataUploads();
    }, 4000);

    return () => clearInterval(interval);
  }, [uploads, loadDataUploads]);

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setPage(1);
  };

  const filteredUploads = uploads.filter((u) => {
    const term = searchTerm.toLowerCase();
    const name = u.fileName.toLowerCase();
    const uploader = u.uploadedBy
      ? `${u.uploadedBy.firstName} ${u.uploadedBy.lastName || ""}`.toLowerCase()
      : "";
    return name.includes(term) || uploader.includes(term);
  });

  const totalRecordsCount = uploads.reduce(
    (acc, cur) => acc + (cur.totalRecords || cur._count?.studentData || 0),
    0
  );

  const getStatusBadge = (status: string, failureReason?: string | null) => {
    switch (status) {
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold">
            <CheckCircle2 size={12} />
            COMPLETED
          </span>
        );
      case "PROCESSING":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 text-xs font-semibold">
            <Clock size={12} className="animate-spin" />
            PROCESSING
          </span>
        );
      default:
        return (
          <div className="flex flex-col items-start gap-1">
            <span
              className="inline-flex items-center gap-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 text-xs font-semibold"
              title={failureReason || "Import failed"}
            >
              <AlertCircle size={12} />
              FAILED
            </span>
            {failureReason && (
              <span
                className="text-[11px] text-rose-600 max-w-[200px] truncate leading-tight font-medium"
                title={failureReason}
              >
                {failureReason}
              </span>
            )}
          </div>
        );
    }
  };

  const handleSoftDelete = (upload: DataUploadItem) => {
    setSoftDeleteUploadItem(upload);
    setIsSoftDeleteModalOpen(true);
  };

  const confirmSoftDelete = async () => {
    if (!accessToken || !softDeleteUploadItem) return;

    setLoadingSoftDelete(true);
    try {
      const res = await softDeleteUploadApi(accessToken, softDeleteUploadItem.id);
      toast.success(res.message);
      setIsSoftDeleteModalOpen(false);
      loadDataUploads();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoadingSoftDelete(false);
    }
  };

  const openHardDeleteModal = async (upload: DataUploadItem) => {
    if (!accessToken) return;
    setHardDeleteUpload(upload);
    setIsHardDeleteModalOpen(true);
    setHardDeletePreview(null);
    setLoadingHardDelete(true);

    try {
      const preview = await previewHardDeleteUpload(accessToken, upload.id);
      setHardDeletePreview(preview);
    } catch (err: any) {
      toast.error(err.message);
      setIsHardDeleteModalOpen(false);
    } finally {
      setLoadingHardDelete(false);
    }
  };

  const closeHardDeleteDrawer = () => {
    if (loadingHardDelete && !hardDeletePreview) return; // Prevent closing while initial load
    setIsHardDeleteClosing(true);
    setTimeout(() => {
      setIsHardDeleteModalOpen(false);
      setIsHardDeleteClosing(false);
    }, 300);
  };

  const confirmHardDelete = async () => {
    if (!accessToken || !hardDeleteUpload) return;
    setLoadingHardDelete(true);
    try {
      const res = await hardDeleteUploadRecords(accessToken, hardDeleteUpload.id);
      toast.success(res.message);
      closeHardDeleteDrawer();
      loadDataUploads();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoadingHardDelete(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Upload className="text-primary-600" size={26} />
            Data Upload
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Upload prospective student datasets (CSV, XLS, XLSX) into the system for batch assignment to advisors.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadDataUploads}
            title="Refresh uploads"
            className="p-2.5 rounded-lg border border-border bg-surface text-text-secondary hover:bg-neutral-100 transition"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="
              flex items-center gap-2
              rounded-lg
              bg-primary-500
              px-4 py-2.5
              text-sm font-medium
              text-white
              transition
              hover:bg-primary-600
              shadow-sm
            "
          >
            <Plus size={18} />
            Upload Data
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-text-secondary">Total Uploads</span>
            <FileSpreadsheet size={20} className="text-primary-500" />
          </div>
          <p className="mt-2 text-3xl font-bold text-text-primary">{uploads.length}</p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-text-secondary">Total Records</span>
            <Users size={20} className="text-emerald-500" />
          </div>
          <p className="mt-2 text-3xl font-bold text-text-primary">{totalRecordsCount}</p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-text-secondary">Completed Imports</span>
            <CheckCircle2 size={20} className="text-purple-500" />
          </div>
          <p className="mt-2 text-3xl font-bold text-text-primary">
            {uploads.filter((u) => u.status === "COMPLETED").length}
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
        />
        <input
          type="text"
          placeholder="Search upload files or uploader names..."
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="
            h-11
            w-full
            rounded-xl
            border
            border-border
            bg-surface
            pl-11
            pr-4
            text-sm
            outline-none
            transition
            focus:border-primary-500
            focus:ring-2
            focus:ring-primary-100
          "
        />
      </div>

      {/* Uploads History Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-xs">
        {loading ? (
          <SectionLoadingState
            message="Loading uploaded data history..."
            description="Retrieving dataset files, record counts, and import statuses"
            minHeight="min-h-[300px]"
          />
        ) : error ? (
          <PageErrorState
            title="Unable to load upload history"
            message={error}
            onRetry={loadDataUploads}
            minHeight="min-h-[300px]"
          />
        ) : filteredUploads.length === 0 ? (
          <PageEmptyState
            icon={FileSpreadsheet}
            title={searchTerm ? "No matching uploads found" : "No uploads found"}
            description={
              searchTerm
                ? "No dataset upload matched your search query."
                : "No student datasets have been uploaded yet."
            }
            actionText={searchTerm ? "Clear Search" : undefined}
            onAction={searchTerm ? () => handleSearchChange("") : undefined}
            minHeight="min-h-[300px]"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-neutral-50">
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-text-secondary">
                    Dataset File
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-text-secondary">
                    Total Records
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-text-secondary">
                    Status
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-text-secondary">
                    Uploaded By
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-text-secondary">
                    Uploaded Date
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase text-text-secondary">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredUploads.map((u) => {
                  const uploaderName = u.uploadedBy
                    ? `${u.uploadedBy.firstName} ${u.uploadedBy.lastName || ""}`.trim()
                    : "System User";
                  const recordCount = u.totalRecords || u._count?.studentData || 0;

                  return (
                    <tr
                      key={u.id}
                      className="border-b border-border last:border-0 hover:bg-neutral-50/50 transition"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary-50 text-primary-600">
                            <FileText size={18} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-text-primary">
                              {u.fileName}
                            </p>
                            <p className="text-xs text-text-muted font-mono">
                              #{u.id.slice(0, 8).toUpperCase()}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm font-semibold text-text-primary">
                        {recordCount} records
                      </td>

                      <td className="px-5 py-4">{getStatusBadge(u.status, u.failureReason)}</td>

                      <td className="px-5 py-4 text-sm text-text-secondary">
                        {uploaderName}
                      </td>

                      <td className="px-5 py-4 text-sm text-text-secondary">
                        {new Date(u.uploadedAt).toLocaleString()}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedUploadForHistory(u);
                              setIsHistoryDrawerOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text-secondary hover:bg-neutral-100 hover:text-text-primary transition shadow-2xs cursor-pointer"
                            title="View dataset history and student call outcomes"
                          >
                            <History size={14} className="text-primary-600 shrink-0" />
                            <span>History</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSoftDelete(u)}
                            className="inline-flex items-center justify-center rounded-lg border border-border bg-surface p-1.5 text-text-secondary hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition shadow-2xs cursor-pointer"
                            title="Hide Dataset (Soft Delete)"
                          >
                            <Trash2 size={16} />
                          </button>

                          <button
                            type="button"
                            onClick={() => openHardDeleteModal(u)}
                            className="inline-flex items-center justify-center rounded-lg border border-border bg-surface p-1.5 text-text-secondary hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition shadow-2xs cursor-pointer"
                            title="Permanently Delete Eligible Records (Hard Delete)"
                          >
                            <AlertTriangle size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <PaginationControls
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalCount}
          onPageChange={setPage}
          itemLabel="uploads"
        />
      </div>

      {/* Dataset History Slide-in Right Drawer */}
      <DatasetHistoryDrawer
        isOpen={isHistoryDrawerOpen}
        onClose={() => setIsHistoryDrawerOpen(false)}
        upload={selectedUploadForHistory}
      />

      {/* Reusable CRM-Native Upload Drawer */}
      {isModalOpen && (
        <UploadDataModal
          onClose={() => setIsModalOpen(false)}
          onSuccess={loadDataUploads}
        />
      )}

      {/* Soft Delete Confirmation Modal */}
      {isSoftDeleteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={() => !loadingSoftDelete && setIsSoftDeleteModalOpen(false)}></div>
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-surface p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-text-primary flex items-center gap-2 mb-2">
              <Trash2 className="text-rose-600" size={24} />
              Hide Dataset?
            </h2>

            <div className="space-y-4 mt-4">
              <p className="text-sm text-text-secondary">
                Are you sure you want to hide this dataset?
              </p>

              <div className="bg-neutral-50 rounded-lg p-4 border border-border flex items-center gap-3">
                <FileText className="text-text-muted" size={20} />
                <span className="font-semibold text-text-primary font-mono text-sm break-all">
                  {softDeleteUploadItem?.fileName}
                </span>
              </div>

              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
                This will hide the dataset from normal listings. Student records, leads, call records, and allocation history will remain unchanged.
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  disabled={loadingSoftDelete}
                  onClick={() => setIsSoftDeleteModalOpen(false)}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-neutral-100 transition"
                >
                  Cancel
                </button>
                <button
                  disabled={loadingSoftDelete}
                  onClick={confirmSoftDelete}
                  className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-rose-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingSoftDelete ? "Hiding..." : "Hide Dataset"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hard Delete Drawer */}
      {isHardDeleteModalOpen && (
        <div className="fixed inset-0 z-[100]">
          {/* Backdrop */}
          <div
            onClick={() => !loadingHardDelete && closeHardDeleteDrawer()}
            className={`
              fixed inset-0
              bg-black/50
              transition-opacity duration-300
              ${isHardDeleteClosing ? "opacity-0" : "opacity-100"}
            `}
          />

          {/* Right-side Sliding Drawer */}
          <div
            className={`
              fixed right-0 top-0
              h-[100dvh]
              w-[42vw]
              min-w-[440px]
              bg-surface
              shadow-2xl
              flex flex-col
              transition-transform duration-300
              ${isHardDeleteClosing ? "translate-x-full" : "translate-x-0"}
            `}
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                  <AlertTriangle className="text-rose-600" size={24} />
                  Hard Delete Records
                </h2>
                <p className="mt-1 text-sm text-text-secondary">
                  Dataset: <span className="font-semibold text-text-primary">{hardDeleteUpload?.fileName}</span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => !loadingHardDelete && closeHardDeleteDrawer()}
                className="rounded-lg p-2 text-text-secondary transition hover:bg-neutral-100 hover:text-text-primary"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="min-h-0 flex-1 overflow-y-auto p-6">
              {loadingHardDelete && !hardDeletePreview ? (
                <div className="py-12 text-center text-sm text-text-secondary flex flex-col items-center">
                  <RefreshCw size={28} className="animate-spin text-primary-500 mb-3" />
                  Analyzing relationships...
                </div>
              ) : hardDeletePreview ? (
                <div className="space-y-5">
                  <p className="text-sm text-text-secondary">
                    This action will permanently delete eligible student records from the database. Protected records with existing relationships (like calls or assignments) will be skipped.
                  </p>

                  <div className="bg-neutral-50 rounded-lg p-4 border border-border text-sm">
                    <p className="font-medium text-text-primary mb-3">Analysis Results</p>
                    <ul className="space-y-2 text-text-secondary">
                      <li className="flex justify-between border-b border-border pb-2">
                        <span>Total records in dataset:</span>
                        <strong className="text-text-primary">{hardDeletePreview.totalCount}</strong>
                      </li>
                      <li className="flex justify-between border-b border-border pb-2">
                        <span>Eligible for deletion:</span>
                        <strong className="text-emerald-600">{hardDeletePreview.eligibleCount}</strong>
                      </li>
                      <li className="flex justify-between pt-1">
                        <span>Blocked by relationships:</span>
                        <strong className="text-rose-600">{hardDeletePreview.blockedCount}</strong>
                      </li>
                    </ul>
                  </div>

                  {hardDeletePreview.blockedCount > 0 && (
                    <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
                      <strong>Warning:</strong> {hardDeletePreview.message}
                    </div>
                  )}

                  {hardDeletePreview.eligibleCount > 0 && (
                    <div className="rounded-lg bg-rose-50 border border-rose-200 p-4 text-sm text-rose-800">
                      Are you sure you want to permanently delete the <strong>{hardDeletePreview.eligibleCount}</strong> eligible records? This action cannot be undone.
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* Footer with Actions */}
            <div className="flex shrink-0 items-center justify-end gap-3 border-t border-border px-6 py-4">
              <button
                disabled={loadingHardDelete}
                onClick={closeHardDeleteDrawer}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-neutral-100 transition"
              >
                Cancel
              </button>
              <button
                disabled={!hardDeletePreview || hardDeletePreview.eligibleCount === 0 || loadingHardDelete}
                onClick={confirmHardDelete}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-rose-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingHardDelete && hardDeletePreview ? "Deleting..." : "Permanently Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataUploadPage;


