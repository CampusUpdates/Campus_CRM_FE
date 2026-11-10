import { useState, useRef, useEffect } from "react";
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
  ClipboardPaste,
  Eye,
  RotateCcw,
} from "lucide-react";
import * as XLSX from "xlsx";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import {
  createDataUpload,
  confirmDataImport,
  cancelDataImport,
  fetchDataCategories,
  createDataCategory
} from "../../../services/dataManagementService";
import type { DataCategory } from "../../../services/dataManagementService";

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

interface PastedPreviewInfo {
  headers: string[];
  rows: Record<string, string>[];
  totalRows: number;
}

const UploadDataModal = ({ onClose, onSuccess }: UploadDataModalProps) => {
  const { accessToken } = useAuth();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isClosing, setIsClosing] = useState(false);
  const [inputMode, setInputMode] = useState<"file" | "paste">("file");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<FilePreviewInfo | null>(null);
  const [pastedText, setPastedText] = useState<string>("");
  const [pastedPreview, setPastedPreview] = useState<PastedPreviewInfo | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [duplicateActions, setDuplicateActions] = useState<Record<string, string>>({});
  const [bulkAction, setBulkAction] = useState<string>("");

  const [categories, setCategories] = useState<DataCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [customCategoryName, setCustomCategoryName] = useState<string>("");
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    if (accessToken) {
      fetchDataCategories(accessToken)
        .then(setCategories)
        .catch(err => {
          console.error("Failed to fetch categories", err);
          toast.error("Failed to load categories.");
        })
        .finally(() => setLoadingCategories(false));
    }
  }, [accessToken]);

  const cancelAbandonedReview = async (idToCancel: string) => {
    try {
      if (accessToken && idToCancel) {
        await cancelDataImport(accessToken, idToCancel);
      }
    } catch (e) {
      console.error("Failed to cancel abandoned review:", e);
    }
  };

  const handleClose = () => {
    if (reviewMode && uploadId) {
      cancelAbandonedReview(uploadId);
      onSuccess();
    }
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

  const parseDelimitedText = (text: string): { headers: string[]; rows: Record<string, string>[] } => {
    const trimmed = text.trim();
    if (!trimmed) {
      return { headers: [], rows: [] };
    }

    // Auto-detect delimiter from the first non-empty line
    const firstLineEnd = trimmed.search(/[\r\n]/);
    const firstLine = firstLineEnd === -1 ? trimmed : trimmed.slice(0, firstLineEnd);

    const tabCount = (firstLine.match(/\t/g) || []).length;
    const commaCount = (firstLine.match(/,/g) || []).length;
    const semiCount = (firstLine.match(/;/g) || []).length;

    let delimiter = "\t";
    if (tabCount > 0) {
      delimiter = "\t";
    } else if (commaCount >= semiCount && commaCount > 0) {
      delimiter = ",";
    } else if (semiCount > 0) {
      delimiter = ";";
    } else if (trimmed.includes("\t")) {
      delimiter = "\t";
    } else if (trimmed.includes(",")) {
      delimiter = ",";
    }

    const rawRows: string[][] = [];
    let currentRow: string[] = [];
    let currentField = "";
    let inQuotes = false;
    let i = 0;

    while (i < trimmed.length) {
      const char = trimmed[i];

      if (inQuotes) {
        if (char === '"') {
          if (i + 1 < trimmed.length && trimmed[i + 1] === '"') {
            currentField += '"';
            i += 2;
            continue;
          } else {
            inQuotes = false;
            i++;
            continue;
          }
        } else {
          currentField += char;
          i++;
          continue;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
          i++;
          continue;
        }

        if (char === delimiter) {
          currentRow.push(currentField.trim());
          currentField = "";
          i++;
          continue;
        }

        if (char === "\r") {
          if (i + 1 < trimmed.length && trimmed[i + 1] === "\n") {
            i++;
          }
          currentRow.push(currentField.trim());
          if (currentRow.some((f) => f.length > 0)) {
            rawRows.push(currentRow);
          }
          currentRow = [];
          currentField = "";
          i++;
          continue;
        }

        if (char === "\n") {
          currentRow.push(currentField.trim());
          if (currentRow.some((f) => f.length > 0)) {
            rawRows.push(currentRow);
          }
          currentRow = [];
          currentField = "";
          i++;
          continue;
        }

        currentField += char;
        i++;
      }
    }

    currentRow.push(currentField.trim());
    if (currentRow.some((f) => f.length > 0)) {
      rawRows.push(currentRow);
    }

    if (rawRows.length === 0) {
      return { headers: [], rows: [] };
    }

    const rawHeaders = rawRows[0];
    const seenHeaders: Record<string, number> = {};
    const headers = rawHeaders.map((h, idx) => {
      let name = h.trim();
      if (!name) name = `Column_${idx + 1}`;
      if (seenHeaders[name] !== undefined) {
        seenHeaders[name]++;
        return `${name}_${seenHeaders[name]}`;
      }
      seenHeaders[name] = 0;
      return name;
    });

    const dataRows: Record<string, string>[] = [];
    for (let r = 1; r < rawRows.length; r++) {
      const rowVals = rawRows[r];
      if (rowVals.every((v) => v === "")) continue;

      const rowObj: Record<string, string> = {};
      headers.forEach((header, colIdx) => {
        rowObj[header] = rowVals[colIdx] !== undefined ? rowVals[colIdx] : "";
      });
      dataRows.push(rowObj);
    }

    return { headers, rows: dataRows };
  };

  const rowsToCsvFile = (headers: string[], rows: Record<string, string>[]): File => {
    const escapeCsv = (val: string | null | undefined): string => {
      if (val === null || val === undefined) return "";
      const str = String(val);
      if (str.includes('"') || str.includes(",") || str.includes("\n") || str.includes("\r")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const headerLine = headers.map(escapeCsv).join(",");
    const dataLines = rows.map((row) =>
      headers.map((h) => escapeCsv(row[h] || "")).join(",")
    );

    const csvContent = [headerLine, ...dataLines].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    return new File([blob], `pasted_data_${Date.now()}.csv`, { type: "text/csv" });
  };

  const handleModeChange = (mode: "file" | "paste") => {
    setInputMode(mode);
    setValidationError(null);
  };

  const handlePastedTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPastedText(e.target.value);
    if (pastedPreview) {
      setPastedPreview(null);
    }
    if (validationError) {
      setValidationError(null);
    }
  };

  const handlePreviewPaste = () => {
    const trimmed = pastedText.trim();
    if (!trimmed) {
      setValidationError("Please paste spreadsheet data before previewing.");
      return;
    }
    const parsed = parseDelimitedText(trimmed);
    if (parsed.headers.length === 0 || parsed.rows.length === 0) {
      setValidationError("Pasted data must contain at least one header row and one student data row.");
      return;
    }
    setValidationError(null);
    setPastedPreview({
      headers: parsed.headers,
      rows: parsed.rows,
      totalRows: parsed.rows.length,
    });
  };

  const handleClearPaste = () => {
    setPastedText("");
    setPastedPreview(null);
    setValidationError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    if (!selectedCategoryId) {
      setValidationError("Please select a category.");
      return;
    }
    if (selectedCategoryId === "CUSTOM" && !customCategoryName.trim()) {
      setValidationError("Please enter a custom category name.");
      return;
    }

    let fileToUpload: File | null = null;
    if (inputMode === "file") {
      if (!selectedFile) {
        setValidationError("Please select a file to upload.");
        return;
      }
      fileToUpload = selectedFile;
    } else {
      const trimmed = pastedText.trim();
      if (!trimmed) {
        setValidationError("Please paste spreadsheet data before uploading.");
        return;
      }
      let currentPreview = pastedPreview;
      if (!currentPreview) {
        const parsed = parseDelimitedText(trimmed);
        if (parsed.headers.length === 0 || parsed.rows.length === 0) {
          setValidationError("Pasted data must contain at least one header row and one student data row.");
          return;
        }
        currentPreview = {
          headers: parsed.headers,
          rows: parsed.rows,
          totalRows: parsed.rows.length,
        };
        setPastedPreview(currentPreview);
      }
      fileToUpload = rowsToCsvFile(currentPreview.headers, currentPreview.rows);
    }

    setUploading(true);
    setValidationError(null);

    try {
      let finalCategoryId = selectedCategoryId;
      if (selectedCategoryId === "CUSTOM") {
        const newCategory = await createDataCategory(accessToken, customCategoryName);
        finalCategoryId = newCategory.id;
      }

      const res = await createDataUpload(accessToken, fileToUpload, finalCategoryId);
      if (res.status === 'REQUIRES_REVIEW') {
        setDuplicates(res.duplicates);
        setUploadId(res.uploadId);

        // Default all actions to KEEP_EXISTING
        const initialActions: Record<string, string> = {};
        res.duplicates.forEach((d: any) => {
          initialActions[d.incoming.phone] = "KEEP_EXISTING";
        });
        setDuplicateActions(initialActions);

        setReviewMode(true);
        toast.error(res.message);
      } else {
        toast.success(
          res.message || `Student dataset uploaded successfully. ${res.totalRecords || 0} records imported.`
        );
        onSuccess();
        handleClose();
      }
    } catch (err: any) {
      const errorMsg = err.message || "Failed to process and upload student data.";
      setValidationError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setUploading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!uploadId || !accessToken) return;
    setUploading(true);
    setValidationError(null);
    try {
      const res = await confirmDataImport(accessToken, uploadId, duplicateActions);
      toast.success(res.message || "Import confirmed successfully.");
      onSuccess();
      handleClose();
    } catch (err: any) {
      const errorMsg = err.message || "Failed to confirm import.";
      setValidationError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setUploading(false);
    }
  };

  const handleBulkActionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setBulkAction(val);
    if (val) {
      const newActions: Record<string, string> = {};
      duplicates.forEach((d) => {
        newActions[d.incoming.phone] = val;
      });
      setDuplicateActions(newActions);
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
          w-full sm:w-[520px] md:w-[48vw] md:min-w-[460px] lg:max-w-[620px]
          bg-surface
          shadow-2xl
          flex flex-col
          max-w-full
          overflow-x-hidden
          ${isClosing ? "animate-slide-out" : "animate-slide-in"}
        `}
      >
        {/* Header */}
        <div className="flex shrink-0 items-start sm:items-center justify-between border-b border-border px-3.5 sm:px-6 py-3.5 sm:py-5 gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-base sm:text-xl font-semibold text-text-primary flex items-center gap-2">
              {reviewMode ? (
                <UploadCloud className="w-5 h-5 sm:w-[22px] sm:h-[22px] text-primary-600 shrink-0" />
              ) : inputMode === "paste" ? (
                <ClipboardPaste className="w-5 h-5 sm:w-[22px] sm:h-[22px] text-primary-600 shrink-0" />
              ) : (
                <UploadCloud className="w-5 h-5 sm:w-[22px] sm:h-[22px] text-primary-600 shrink-0" />
              )}
              <span className="truncate sm:overflow-visible">
                {reviewMode
                  ? "Review Recurring Records"
                  : inputMode === "paste"
                  ? "Paste Student Data"
                  : "Upload Student Data"}
              </span>
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-text-secondary leading-normal sm:leading-relaxed">
              {reviewMode
                ? "Recurring records found. Please choose an action for each duplicate."
                : inputMode === "paste"
                ? "Paste copied spreadsheet rows directly from Excel or Google Sheets."
                : "Import student records from a CSV or Excel file into Campus CRM."}
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="
              rounded-lg
              p-1.5 sm:p-2
              text-text-secondary
              transition
              hover:bg-neutral-100
              dark:hover:bg-neutral-800
              hover:text-text-primary
              cursor-pointer
              shrink-0
            "
            aria-label="Close modal"
          >
            <X size={18} className="sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        {reviewMode ? (
          <div className="min-h-0 flex-1 flex flex-col justify-between overflow-y-auto p-3.5 sm:p-6 space-y-4 sm:space-y-6 w-full max-w-full min-w-0">
            <div className="space-y-3.5 sm:space-y-4 w-full max-w-full min-w-0">
              {/* Top Summary & Bulk Action Card */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-3.5 rounded-xl border border-border bg-neutral-50/70 dark:bg-neutral-800/30">
                {/* Records Count & Category Badge */}
                <div className="flex flex-wrap items-center gap-2 min-w-0">
                  <h3 className="text-xs sm:text-sm font-bold text-text-primary">
                    {duplicates.length} Recurring Record{duplicates.length === 1 ? "" : "s"} Detected
                  </h3>
                  <span className="rounded-md bg-primary-50 dark:bg-primary-950/60 border border-primary-200 dark:border-primary-800 px-2 py-0.5 text-[11px] sm:text-xs font-medium text-primary-700 dark:text-primary-300 truncate max-w-[180px] sm:max-w-[220px]">
                    Category: {
                      selectedCategoryId === "CUSTOM"
                        ? customCategoryName || "Custom"
                        : categories.find(c => c.id === selectedCategoryId)?.name || "Unknown"
                    }
                  </span>
                </div>

                {/* Bulk Action Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 w-full sm:w-auto shrink-0 min-w-0">
                  <label htmlFor="bulk-action-select" className="text-[11px] sm:text-xs font-medium text-text-secondary whitespace-nowrap">
                    Bulk Action:
                  </label>
                  <select
                    id="bulk-action-select"
                    value={bulkAction}
                    onChange={handleBulkActionChange}
                    className="h-8 w-full sm:w-auto max-w-full rounded-lg border border-border bg-surface px-2.5 text-xs text-text-primary outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 truncate cursor-pointer shadow-2xs"
                  >
                    <option value="">-- Select --</option>
                    <option value="KEEP_EXISTING">Keep Existing (All)</option>
                    <option value="REPLACE">Replace (All)</option>
                    <option value="REMOVE">Remove Entry (All)</option>
                  </select>
                </div>
              </div>

              {/* Action Summary */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 p-2.5 sm:p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl border border-border text-xs w-full min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-semibold text-text-primary whitespace-nowrap">Keep Existing:</span>
                  <span className="font-mono font-bold text-text-secondary bg-surface px-1.5 py-0.5 rounded border border-border">
                    {Object.values(duplicateActions).filter(a => a === "KEEP_EXISTING").length}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-semibold text-text-primary whitespace-nowrap">Replace:</span>
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400 bg-surface px-1.5 py-0.5 rounded border border-border">
                    {Object.values(duplicateActions).filter(a => a === "REPLACE").length}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-semibold text-text-primary whitespace-nowrap">Remove:</span>
                  <span className="font-mono font-bold text-rose-600 dark:text-rose-400 bg-surface px-1.5 py-0.5 rounded border border-border">
                    {Object.values(duplicateActions).filter(a => a === "REMOVE").length}
                  </span>
                </div>
              </div>

              {/* Horizontally scrollable Records Table */}
              <div className="overflow-x-auto rounded-xl border border-border bg-surface w-full max-w-full">
                <table className="w-full min-w-[600px] text-left text-xs sm:text-sm">
                  <thead className="bg-neutral-50 dark:bg-neutral-800 border-b border-border text-[11px] sm:text-xs text-text-secondary uppercase sticky top-0 z-10">
                    <tr>
                      <th className="px-3 sm:px-4 py-3 font-semibold whitespace-nowrap">Student Name</th>
                      <th className="px-3 sm:px-4 py-3 font-semibold whitespace-nowrap">Phone Number</th>
                      <th className="px-3 sm:px-4 py-3 font-semibold min-w-[140px]">Existing Details</th>
                      <th className="px-3 sm:px-4 py-3 font-semibold min-w-[140px]">Incoming Details</th>
                      <th className="px-3 sm:px-4 py-3 font-semibold min-w-[130px]">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {duplicates.map((dup, idx) => (
                      <tr key={idx} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30">
                        <td className="px-3 sm:px-4 py-3 font-medium text-text-primary whitespace-nowrap">
                          {dup.incoming.firstName} {dup.incoming.lastName || ""}
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-text-secondary font-mono text-xs whitespace-nowrap">
                          {dup.incoming.phone}
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-xs text-text-secondary">
                          {dup.existing.firstName} {dup.existing.lastName || ""}<br/>
                          {dup.existing.city || "No City"}, {dup.existing.state || "No State"}<br/>
                          {dup.existing.email || "No Email"}
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-xs text-text-secondary">
                          {dup.incoming.firstName} {dup.incoming.lastName || ""}<br/>
                          {dup.incoming.city || "No City"}, {dup.incoming.state || "No State"}<br/>
                          {dup.incoming.email || "No Email"}
                        </td>
                        <td className="px-3 sm:px-4 py-3">
                          <select
                            value={duplicateActions[dup.incoming.phone] || "KEEP_EXISTING"}
                            onChange={(e) => {
                              setDuplicateActions(prev => ({
                                ...prev,
                                [dup.incoming.phone]: e.target.value
                              }));
                            }}
                            className="w-full rounded-md border border-border bg-surface px-2 py-1.5 text-xs text-text-primary outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 cursor-pointer shadow-2xs"
                          >
                            <option value="KEEP_EXISTING">Keep Existing</option>
                            <option value="REPLACE">Replace</option>
                            <option value="REMOVE">Remove This Entry</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {validationError && (
                <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/90 dark:bg-rose-950/40 dark:border-rose-900 p-3.5 sm:p-4 text-xs text-rose-900 dark:text-rose-200 animate-in fade-in duration-200 mt-4">
                  <AlertCircle size={18} className="shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
                  <div>
                    <p className="font-semibold">Validation Error</p>
                    <p className="mt-0.5">{validationError}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Review Actions */}
            <div className="flex items-center justify-end gap-2.5 sm:gap-3 border-t border-border pt-4 sm:pt-5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (uploadId) {
                    cancelAbandonedReview(uploadId);
                    onSuccess();
                  }
                  setReviewMode(false);
                  setUploadId(null);
                  setDuplicates([]);
                }}
                disabled={uploading}
                className="rounded-lg border border-border bg-surface h-8 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm font-medium text-text-secondary transition hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50 cursor-pointer"
              >
                Back
              </button>

              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={uploading}
                className="flex items-center gap-1.5 sm:gap-2 rounded-lg bg-primary-500 h-8 sm:h-10 px-3.5 sm:px-5 text-xs sm:text-sm font-medium text-white transition hover:bg-primary-600 shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {uploading ? (
                  <>
                    <Loader2 size={15} className="animate-spin sm:w-4 sm:h-4" />
                    <span>Confirming...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={15} className="sm:w-4 sm:h-4" />
                    <span>Confirm Import</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="min-h-0 flex-1 flex flex-col justify-between overflow-y-auto p-6 space-y-6">
          <div className="space-y-6">
            {/* Category Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-text-primary">
                Dataset Category <span className="text-rose-500">*</span>
              </label>
              {loadingCategories ? (
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <Loader2 size={16} className="animate-spin" /> Loading categories...
                </div>
              ) : (
                <div className="space-y-3">
                  <select
                    value={selectedCategoryId}
                    onChange={(e) => {
                      setSelectedCategoryId(e.target.value);
                      if (e.target.value !== "CUSTOM") setCustomCategoryName("");
                    }}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  >
                    <option value="" disabled>-- Select a Category --</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                    <option value="CUSTOM">+ Add Custom Category</option>
                  </select>

                  {selectedCategoryId === "CUSTOM" && (
                    <div className="animate-in slide-in-from-top-1 fade-in duration-200">
                      <input
                        type="text"
                        placeholder="e.g. MBA Leads October"
                        value={customCategoryName}
                        onChange={(e) => setCustomCategoryName(e.target.value)}
                        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Input Method Selector (Upload File vs Paste Data) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Input Method
              </label>
              <div className="grid grid-cols-2 rounded-xl border border-border bg-neutral-100/70 dark:bg-neutral-800/60 p-1 gap-1">
                <button
                  type="button"
                  onClick={() => handleModeChange("file")}
                  className={`flex items-center justify-center gap-1.5 sm:gap-2 py-2 px-3 rounded-lg text-xs sm:text-sm font-medium transition cursor-pointer ${
                    inputMode === "file"
                      ? "bg-surface text-text-primary shadow-xs font-semibold"
                      : "text-text-secondary hover:text-text-primary hover:bg-surface/50"
                  }`}
                >
                  <UploadCloud size={16} className={inputMode === "file" ? "text-primary-600" : ""} />
                  <span>Upload File</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange("paste")}
                  className={`flex items-center justify-center gap-1.5 sm:gap-2 py-2 px-3 rounded-lg text-xs sm:text-sm font-medium transition cursor-pointer ${
                    inputMode === "paste"
                      ? "bg-surface text-text-primary shadow-xs font-semibold"
                      : "text-text-secondary hover:text-text-primary hover:bg-surface/50"
                  }`}
                >
                  <ClipboardPaste size={16} className={inputMode === "paste" ? "text-primary-600" : ""} />
                  <span>Paste Data</span>
                </button>
              </div>
            </div>

            {/* Error Banner */}
            {validationError && (
              <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/90 dark:bg-rose-950/40 dark:border-rose-900 p-4 text-xs text-rose-900 dark:text-rose-200 animate-in fade-in duration-200">
                <AlertCircle size={18} className="shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
                <div>
                  <p className="font-semibold">Validation Error</p>
                  <p className="mt-0.5">{validationError}</p>
                </div>
              </div>
            )}

            {/* Mode 1: Upload File */}
            {inputMode === "file" && (
              <div className="space-y-4 animate-in fade-in duration-200">
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
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const files = e.dataTransfer.files;
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
                    const maxSizeBytes = 20 * 1024 * 1024;
                    if (file.size > maxSizeBytes) {
                      setSelectedFile(null);
                      setPreview(null);
                      setValidationError(`File size (${formatFileSize(file.size)}) exceeds maximum limit of 20 MB.`);
                      return;
                    }
                    setValidationError(null);
                    setSelectedFile(file);
                    parseFilePreview(file);
                  }}
                  className="
                    group
                    relative
                    flex flex-col items-center justify-center
                    rounded-xl sm:rounded-2xl
                    border-2 border-dashed border-border
                    bg-neutral-50/50 dark:bg-neutral-800/20
                    p-4 sm:p-8
                    min-h-[140px] sm:min-h-[200px]
                    text-center
                    cursor-pointer
                    transition-all duration-200
                    hover:border-primary-500 hover:bg-primary-50/30
                  "
                >
                  <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-primary-50 dark:bg-primary-950/60 flex items-center justify-center mb-2 sm:mb-3 text-primary-600 group-hover:scale-110 transition-transform">
                    <FileSpreadsheet className="w-5 h-5 sm:w-7 sm:h-7" />
                  </div>

                  <p className="text-xs sm:text-sm font-semibold text-text-primary">
                    Click to browse or drop file here
                  </p>
                  <p className="text-[11px] sm:text-xs text-text-muted mt-0.5 sm:mt-1">
                    Supported: <span className="font-medium text-text-secondary">CSV, XLS, XLSX</span> (Max: 20 MB)
                  </p>

                  <button
                    type="button"
                    className="mt-2.5 sm:mt-4 inline-flex items-center gap-1.5 sm:gap-2 rounded-lg bg-surface border border-border px-2.5 sm:px-3.5 py-1 sm:py-1.5 text-[11px] sm:text-xs font-semibold text-text-primary shadow-2xs group-hover:border-primary-300"
                  >
                    <UploadCloud size={13} className="sm:w-3.5 sm:h-3.5" />
                    <span>Select File</span>
                  </button>
                </div>

                {/* Selected File Details & Preview */}
                {selectedFile && preview && (
                  <div className="rounded-2xl border border-border bg-surface p-5 space-y-4 shadow-xs animate-in fade-in duration-200">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center font-bold">
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

                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 text-xs font-semibold">
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
                              className="rounded-md bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 px-2 py-0.5 text-[11px] font-mono text-text-secondary"
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
            )}

            {/* Mode 2: Paste Data */}
            {inputMode === "paste" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs sm:text-sm font-medium text-text-primary">
                      Paste Spreadsheet Rows <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] sm:text-xs text-text-muted">
                      TSV or CSV format
                    </span>
                  </div>
                  <textarea
                    rows={6}
                    value={pastedText}
                    onChange={handlePastedTextChange}
                    placeholder={`Paste copied spreadsheet rows here directly from Excel or Google Sheets...\n\nExample:\nName\tEmail\tPhone\tCity\nRahul Sharma\trahul@example.com\t9876543210\tMumbai\nPriya Patel\tpriya@example.com\t9876543211\tPune`}
                    className="w-full font-mono text-xs sm:text-[13px] rounded-xl border border-border bg-surface p-3 text-text-primary placeholder:text-text-muted outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 resize-y leading-relaxed"
                  />
                  <p className="text-[11px] text-text-muted">
                    Tip: The first row must contain column headers (e.g. Name, Phone, Email, City).
                  </p>
                </div>

                {/* Textarea Actions */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handlePreviewPaste}
                      disabled={!pastedText.trim()}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-surface border border-border px-3 py-1.5 text-xs font-semibold text-text-primary shadow-2xs hover:border-primary-400 hover:text-primary-600 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                    >
                      <Eye size={14} className="text-primary-500" />
                      <span>Preview Data</span>
                    </button>
                    {pastedText && (
                      <button
                        type="button"
                        onClick={handleClearPaste}
                        className="inline-flex items-center gap-1 rounded-lg border border-transparent px-2.5 py-1.5 text-xs font-medium text-text-secondary hover:bg-neutral-100 hover:text-rose-600 transition cursor-pointer"
                      >
                        <RotateCcw size={13} />
                        <span>Clear</span>
                      </button>
                    )}
                  </div>

                  {pastedPreview && (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                      <CheckCircle2 size={13} />
                      {pastedPreview.totalRows.toLocaleString()} row{pastedPreview.totalRows === 1 ? "" : "s"} ready
                    </span>
                  )}
                </div>

                {/* Pasted Preview Table */}
                {pastedPreview && (
                  <div className="rounded-xl border border-border bg-surface p-3.5 sm:p-4 space-y-3 shadow-2xs animate-in fade-in duration-200">
                    <div className="flex items-center justify-between pb-2 border-b border-border">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-950/50 text-primary-600 flex items-center justify-center font-bold">
                          <Table size={16} />
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-semibold text-text-primary">
                            Data Preview
                          </p>
                          <p className="text-[11px] text-text-muted">
                            {pastedPreview.totalRows} student {pastedPreview.totalRows === 1 ? "record" : "records"} • {pastedPreview.headers.length} columns detected
                          </p>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 text-[11px] font-semibold">
                        <CheckCircle2 size={11} /> Ready
                      </span>
                    </div>

                    {/* Column Badges */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-text-secondary uppercase flex items-center gap-1">
                        <Columns size={11} /> Columns ({pastedPreview.headers.length}):
                      </span>
                      <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                        {pastedPreview.headers.map((col, idx) => (
                          <span
                            key={idx}
                            className="rounded bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 px-1.5 py-0.5 text-[10px] sm:text-[11px] font-mono text-text-secondary"
                          >
                            {col}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Scrollable Preview Table */}
                    <div className="overflow-x-auto rounded-lg border border-border max-h-52 overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-neutral-50 dark:bg-neutral-800/80 sticky top-0 border-b border-border text-[11px] text-text-secondary uppercase z-10">
                          <tr>
                            <th className="px-3 py-2 font-semibold w-10 text-center">#</th>
                            {pastedPreview.headers.map((header, idx) => (
                              <th key={idx} className="px-3 py-2 font-semibold whitespace-nowrap">
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {pastedPreview.rows.slice(0, 10).map((row, rowIdx) => (
                            <tr key={rowIdx} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30">
                              <td className="px-3 py-1.5 text-center text-text-muted font-mono text-[10px]">
                                {rowIdx + 1}
                              </td>
                              {pastedPreview.headers.map((header, colIdx) => (
                                <td key={colIdx} className="px-3 py-1.5 text-text-primary whitespace-nowrap max-w-[180px] truncate">
                                  {row[header] || <span className="text-text-muted italic">—</span>}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {pastedPreview.totalRows > 10 && (
                      <p className="text-[11px] text-text-muted text-center italic">
                        Showing first 10 of {pastedPreview.totalRows} records. All rows will be processed upon upload.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 sm:gap-3 border-t border-border pt-4 sm:pt-5 shrink-0">
            <button
              type="button"
              onClick={handleClose}
              disabled={uploading}
              className="
                rounded-lg
                border border-border
                bg-surface
                h-8 sm:h-10
                px-3 sm:px-4
                text-xs sm:text-sm font-medium
                text-text-secondary
                transition
                hover:bg-neutral-100
                disabled:opacity-50
                cursor-pointer
              "
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={uploading || (inputMode === "file" ? !selectedFile : !pastedText.trim())}
              className="
                inline-flex items-center gap-1.5 sm:gap-2
                rounded-lg
                bg-primary-500
                h-8 sm:h-10
                px-3.5 sm:px-5
                text-xs sm:text-sm font-medium
                text-white
                transition
                hover:bg-primary-600
                shadow-2xs
                disabled:opacity-50 disabled:cursor-not-allowed
                cursor-pointer
              "
            >
              {uploading ? (
                <>
                  <Loader2 size={15} className="animate-spin sm:w-4 sm:h-4" />
                  <span>Uploading & Processing...</span>
                </>
              ) : (
                <>
                  {inputMode === "paste" ? (
                    <ClipboardPaste size={15} className="sm:w-4 sm:h-4" />
                  ) : (
                    <UploadCloud size={15} className="sm:w-4 sm:h-4" />
                  )}
                  <span>Upload & Process</span>
                </>
              )}
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
};

export default UploadDataModal;
