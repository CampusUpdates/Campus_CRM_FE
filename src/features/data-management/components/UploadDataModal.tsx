import { useState, useRef } from "react";
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Loader2,
  FileCheck,
  Columns,
  Table,
} from "lucide-react";
import * as XLSX from "xlsx";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import { createDataUpload } from "../../../services/dataManagementService";

interface UploadDataModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface FilePreviewInfo {
  fileName: string;
  fileSizeStr: string;
  detectedColumns: string[];
  totalRows: number;
}

const UploadDataModal = ({ onClose, onSuccess }: UploadDataModalProps) => {
  const { accessToken } = useAuth();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isClosing, setIsClosing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<FilePreviewInfo | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
  };

  const handleAnimationEnd = () => {
    if (isClosing) {
      onClose();
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const parseFilePreview = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        if (!buffer) return;
        const workbook = XLSX.read(buffer, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];

        if (!firstSheetName) {
          setValidationError("Spreadsheet has no readable sheets.");
          return;
        }

        const sheet = workbook.Sheets[firstSheetName];
        const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        let columns: string[] = [];
        if (rows.length > 0) {
          columns = Object.keys(rows[0]).filter((k) => k && !k.startsWith("__EMPTY"));
        }

        setPreview({
          fileName: file.name,
          fileSizeStr: formatFileSize(file.size),
          detectedColumns: columns,
          totalRows: rows.length,
        });
      } catch (err: any) {
        console.error("Client side spreadsheet preview failed:", err);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const validExtensions = [".csv", ".xlsx", ".xls"];
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();

    if (!validExtensions.includes(ext)) {
      setSelectedFile(null);
      setPreview(null);
      setValidationError("Unsupported file format. Only CSV, XLS, and XLSX files are supported.");
      return;
    }

    const maxSizeBytes = 20 * 1024 * 1024; // 20 MB
    if (file.size > maxSizeBytes) {
      setSelectedFile(null);
      setPreview(null);
      setValidationError(`File size (${formatFileSize(file.size)}) exceeds maximum limit of 20 MB.`);
      return;
    }

    setValidationError(null);
    setSelectedFile(file);
    parseFilePreview(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !accessToken) return;

    setUploading(true);
    setValidationError(null);

    try {
      const res = await createDataUpload(accessToken, selectedFile);
      toast.success(
        res.message || `Student dataset uploaded successfully. ${res.totalRecords || 0} records imported.`
      );
      onSuccess();
      handleClose();
    } catch (err: any) {
      const errorMsg = err.message || "Failed to process and upload student data file.";
      setValidationError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className={`
          fixed inset-0
          bg-black/50
          transition-opacity duration-300
          ${isClosing ? "opacity-0" : "opacity-100"}
        `}
      />

      {/* Right-side Sliding Drawer */}
      <div
        onAnimationEnd={handleAnimationEnd}
        className={`
          fixed right-0 top-0
          h-[100dvh]
          w-[42vw]
          min-w-[440px]
          bg-surface
          shadow-2xl
          flex flex-col
          ${isClosing ? "animate-slide-out" : "animate-slide-in"}
        `}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold text-text-primary flex items-center gap-2">
              <UploadCloud size={22} className="text-primary-600" />
              Upload Student Data
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              Import student records from a CSV or Excel file into Campus CRM.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="
              rounded-lg
              p-2
              text-text-secondary
              transition
              hover:bg-neutral-100
              hover:text-text-primary
            "
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="min-h-0 flex-1 flex flex-col justify-between overflow-y-auto p-6 space-y-6">
          <div className="space-y-6">
            {/* File Input Controls */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv, .xlsx, .xls"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Upload Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="
                group
                relative
                flex flex-col items-center justify-center
                rounded-2xl
                border-2 border-dashed border-border
                bg-neutral-50/50
                p-8
                text-center
                cursor-pointer
                transition-all duration-200
                hover:border-primary-500 hover:bg-primary-50/30
              "
            >
              <div className="w-14 h-14 rounded-full bg-primary-50 flex items-center justify-center mb-3 text-primary-600 group-hover:scale-110 transition-transform">
                <FileSpreadsheet size={28} />
              </div>

              <p className="text-sm font-semibold text-text-primary">
                Click to browse and select file
              </p>
              <p className="text-xs text-text-muted mt-1">
                Supported formats: <span className="font-medium text-text-secondary">CSV, XLS, XLSX</span> (Max size: 20 MB)
              </p>

              <button
                type="button"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-surface border border-border px-3.5 py-1.5 text-xs font-semibold text-text-primary shadow-2xs group-hover:border-primary-300"
              >
                <UploadCloud size={14} />
                [ Select File ]
              </button>
            </div>

            {/* Error Banner */}
            {validationError && (
              <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/90 p-4 text-xs text-rose-900 animate-in fade-in duration-200">
                <AlertCircle size={18} className="shrink-0 text-rose-600 mt-0.5" />
                <div>
                  <p className="font-semibold">Validation Error</p>
                  <p className="mt-0.5">{validationError}</p>
                </div>
              </div>
            )}

            {/* Selected File Details & Preview */}
            {selectedFile && preview && (
              <div className="rounded-2xl border border-border bg-surface p-5 space-y-4 shadow-xs animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                      <FileCheck size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-primary truncate max-w-[240px]">
                        {preview.fileName}
                      </p>
                      <p className="text-xs text-text-muted font-mono">
                        Size: {preview.fileSizeStr}
                      </p>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 text-xs font-semibold">
                    <CheckCircle2 size={12} /> Ready
                  </span>
                </div>

                {/* Detected Rows Count */}
                <div className="flex items-center justify-between text-xs py-1">
                  <span className="text-text-secondary flex items-center gap-1 font-medium">
                    <Table size={14} className="text-primary-500" />
                    Rows Detected:
                  </span>
                  <span className="font-bold text-text-primary text-sm font-mono">
                    {preview.totalRows.toLocaleString()} rows
                  </span>
                </div>

                {/* Detected Column Headers */}
                {preview.detectedColumns.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-xs font-semibold text-text-secondary uppercase flex items-center gap-1">
                      <Columns size={12} /> Detected Columns:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {preview.detectedColumns.map((col, idx) => (
                        <span
                          key={idx}
                          className="rounded-md bg-neutral-100 border border-neutral-200 px-2 py-0.5 text-[11px] font-mono text-text-secondary"
                        >
                          {col}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Action Buttons */}
          <div className="flex items-center justify-end gap-3 border-t border-border pt-5 shrink-0">
            <button
              type="button"
              onClick={handleClose}
              disabled={uploading}
              className="
                rounded-lg
                border border-border
                bg-surface
                px-4 py-2.5
                text-sm font-medium
                text-text-secondary
                transition
                hover:bg-neutral-100
                disabled:opacity-50
              "
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!selectedFile || !!validationError || uploading}
              className="
                flex items-center gap-2
                rounded-lg
                bg-primary-500
                px-5 py-2.5
                text-sm font-medium
                text-white
                transition
                hover:bg-primary-600
                shadow-sm
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              {uploading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Uploading & Processing...
                </>
              ) : (
                <>
                  <UploadCloud size={16} />
                  Upload & Process
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadDataModal;
