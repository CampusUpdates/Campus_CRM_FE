import React, { useState } from "react";
import { Download, ChevronDown, FileSpreadsheet, Layers, Users, Building2, BarChart2 } from "lucide-react";

interface AdmissionsHeaderProps {
  onExport: (type: "ALL" | "COLLEGES" | "EMPLOYEES" | "TEAMS" | "FUNNEL") => void;
  loading?: boolean;
}

export const AdmissionsHeader: React.FC<AdmissionsHeaderProps> = ({ onExport, loading }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleExportClick = (type: "ALL" | "COLLEGES" | "EMPLOYEES" | "TEAMS" | "FUNNEL") => {
    setDropdownOpen(false);
    onExport(type);
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
      <div>
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">
          College Admissions
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Monitor admissions performance across colleges, teams and counselors.
        </p>
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          disabled={loading}
          className="
            flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2.5
            text-sm font-medium text-white transition hover:bg-primary-600
            shadow-xs disabled:opacity-50 cursor-pointer
          "
        >
          <Download size={18} />
          <span>Export</span>
          <ChevronDown size={16} className={`transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-surface shadow-lg z-50 py-1 text-sm">
            <button
              onClick={() => handleExportClick("ALL")}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-text-primary hover:bg-surface-hover transition cursor-pointer"
            >
              <FileSpreadsheet size={16} className="text-emerald-500" />
              <span>Export Admissions CSV</span>
            </button>
            <button
              onClick={() => handleExportClick("COLLEGES")}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-text-primary hover:bg-surface-hover transition cursor-pointer"
            >
              <Building2 size={16} className="text-blue-500" />
              <span>Export College Performance</span>
            </button>
            <button
              onClick={() => handleExportClick("EMPLOYEES")}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-text-primary hover:bg-surface-hover transition cursor-pointer"
            >
              <Users size={16} className="text-violet-500" />
              <span>Export Counselor Performance</span>
            </button>
            <button
              onClick={() => handleExportClick("TEAMS")}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-text-primary hover:bg-surface-hover transition cursor-pointer"
            >
              <Layers size={16} className="text-amber-500" />
              <span>Export Team Performance</span>
            </button>
            <button
              onClick={() => handleExportClick("FUNNEL")}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-text-primary hover:bg-surface-hover transition cursor-pointer border-t border-border mt-1"
            >
              <BarChart2 size={16} className="text-pink-500" />
              <span>Export Funnel Report</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
