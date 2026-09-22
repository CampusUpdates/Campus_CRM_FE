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
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import {
  fetchDataUploads,
  type DataUploadItem,
} from "../../../services/dataManagementService";
import UploadDataModal from "../components/UploadDataModal";
import PaginationControls from "../components/PaginationControls";

const DataUploadPage = () => {
  const { accessToken } = useAuth();
  const [uploads, setUploads] = useState<DataUploadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const loadDataUploads = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await fetchDataUploads(accessToken, page, 10);
      setUploads(res.data);
      if (res.pagination) {
        setTotalPages(res.pagination.totalPages || 1);
        setTotalCount(res.pagination.total || res.data.length);
      }
    } catch (err: any) {
      console.error("Failed to load uploads:", err);
    } finally {
      setLoading(false);
    }
  }, [accessToken, page]);

  useEffect(() => {
    loadDataUploads();
  }, [loadDataUploads]);

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

  const getStatusBadge = (status: string) => {
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
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 text-xs font-semibold">
            <AlertCircle size={12} />
            FAILED
          </span>
        );
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
          <div className="flex items-center justify-center p-12 text-sm text-text-secondary">
            <RefreshCw className="animate-spin mr-2" size={18} />
            Loading uploaded data history...
          </div>
        ) : filteredUploads.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mb-3 text-text-muted">
              <FileSpreadsheet size={24} />
            </div>
            <h3 className="text-base font-semibold text-text-primary">No uploads found</h3>
            <p className="text-sm text-text-secondary mt-1 max-w-sm">
              {searchTerm
                ? "No dataset upload matched your search query."
                : "No student datasets have been uploaded yet."}
            </p>
          </div>
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

                      <td className="px-5 py-4">{getStatusBadge(u.status)}</td>

                      <td className="px-5 py-4 text-sm text-text-secondary">
                        {uploaderName}
                      </td>

                      <td className="px-5 py-4 text-sm text-text-secondary">
                        {new Date(u.uploadedAt).toLocaleString()}
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

      {/* Reusable CRM-Native Upload Drawer */}
      {isModalOpen && (
        <UploadDataModal
          onClose={() => setIsModalOpen(false)}
          onSuccess={loadDataUploads}
        />
      )}
    </div>
  );
};

export default DataUploadPage;


