import React, { useState } from "react";
import { Download, ChevronDown, FileSpreadsheet, Layers, Users, Building2 } from "lucide-react";

interface AdmissionsHeaderProps {
  onExport: (type: "ALL" | "COLLEGES" | "EMPLOYEES" | "TEAMS") => void;
  loading?: boolean;
}

export const AdmissionsHeader: React.FC<AdmissionsHeaderProps> = ({ onExport, loading }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleExportClick = (type: "ALL" | "COLLEGES" | "EMPLOYEES" | "TEAMS") => {
    setDropdownOpen(false);
    onExport(type);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-border pb-4 sm:pb-5">
      <div className="min-w-0 pr-2">
        <h1 className="text-xl sm:text-2xl font-bold sm:font-semibold text-text-primary tracking-tight truncate sm:whitespace-normal">
          College Admissions
        </h1>
        <p className="mt-1 text-[11px] sm:text-sm text-text-secondary leading-relaxed sm:leading-normal">
          Monitor admissions performance across colleges, teams and counselors.
        </p>
      </div>

      <div className="relative shrink-0 self-start sm:self-auto">
        <button
          type="button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          disabled={loading}
          className="
            inline-flex items-center gap-1.5 sm:gap-2
            rounded-lg sm:rounded-xl
            bg-primary-500
            h-8 sm:h-10
            px-3 sm:px-4
            text-xs sm:text-sm font-medium
            text-white
            whitespace-nowrap
            transition
            hover:bg-primary-600
            shadow-2xs
            disabled:opacity-50
            cursor-pointer
          "
        >
          <Download size={15} className="sm:w-[18px] sm:h-[18px] shrink-0" />
          <span>Export</span>
          <ChevronDown size={14} className={`transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
        </button>

        {dropdownOpen && (
          <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-56 rounded-xl border border-border bg-surface shadow-lg z-50 py-1 text-xs sm:text-sm">
            <button
              onClick={() => handleExportClick("ALL")}
              className="flex w-full items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-left text-text-primary hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
            >
              <FileSpreadsheet size={16} className="text-emerald-500 shrink-0" />
              <span>Export Admissions CSV</span>
            </button>
            <button
              onClick={() => handleExportClick("COLLEGES")}
              className="flex w-full items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-left text-text-primary hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
            >
              <Building2 size={16} className="text-blue-500 shrink-0" />
              <span>Export College Performance</span>
            </button>
            <button
              onClick={() => handleExportClick("EMPLOYEES")}
              className="flex w-full items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-left text-text-primary hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
            >
              <Users size={16} className="text-violet-500 shrink-0" />
              <span>Export Counselor Performance</span>
            </button>
            <button
              onClick={() => handleExportClick("TEAMS")}
              className="flex w-full items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-left text-text-primary hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
            >
              <Layers size={16} className="text-amber-500 shrink-0" />
              <span>Export Team Performance</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
