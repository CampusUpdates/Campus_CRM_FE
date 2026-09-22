import { useEffect, useState } from "react";
import {
  FileSpreadsheet,
  Filter,
  Search,
  Users,
  Building2,
  Calendar,
  Layers,
  RefreshCw,
  AlertCircle,
  Download,
} from "lucide-react";
import * as XLSX from "xlsx";
import { useAuth } from "../../../context/AuthContext";
import { fetchActiveColleges, type College } from "../../../services/collegeService";
import { fetchTeams, fetchTeamMembers, type EligibleMember } from "../../../services/teamService";
import { fetchLeadStatuses, type LeadItem, type LeadStatusItem } from "../../../services/leadService";
import {
  fetchCRMReport,
  fetchCRMReportExport,
  type SummaryMetrics,
  type PerformanceItem,
} from "../../../services/reportService";

type PeriodFilterOption =
  | "ALL"
  | "TODAY"
  | "THIS_WEEK"
  | "THIS_MONTH"
  | "THIS_YEAR"
  | "CUSTOM";

export interface ManagerReportsViewProps {
  headerTitle?: string;
  subtitle?: string;
  leadScopeLabel?: string;
}

export const ManagerReportsView: React.FC<ManagerReportsViewProps> = ({
  headerTitle = "Manager Reports",
  subtitle = "Generate detailed reports for your team's leads, conversions and performance.",
  leadScopeLabel = "All Team Leads",
}) => {
  const { accessToken } = useAuth();

  // Filters State
  const [period, setPeriod] = useState<PeriodFilterOption>("THIS_MONTH");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedCollegeId, setSelectedCollegeId] = useState<string>("ALL");
  const [selectedMemberId, setSelectedMemberId] = useState<string>("ALL");
  const [selectedStatusId, setSelectedStatusId] = useState<string>("ALL");

  // Options State
  const [colleges, setColleges] = useState<College[]>([]);
  const [members, setMembers] = useState<EligibleMember[]>([]);
  const [statuses, setStatuses] = useState<LeadStatusItem[]>([]);

  // Generation & Status State
  const [initialLoading, setInitialLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Backend Report Results
  const [summaryMetrics, setSummaryMetrics] = useState<SummaryMetrics>({
    total: 0,
    applications: 0,
    interviewScheduled: 0,
    interviewDone: 0,
    selected: 0,
    letterOut: 0,
    admissionsDone: 0,
    cancelled: 0,
  });
  const [collegeWiseData, setCollegeWiseData] = useState<PerformanceItem[]>([]);
  const [memberWiseData, setMemberWiseData] = useState<PerformanceItem[]>([]);
  const [leadDataset, setLeadDataset] = useState<LeadItem[]>([]);
  const [totalFilteredCount, setTotalFilteredCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [appliedFilterSummary, setAppliedFilterSummary] = useState({
    periodText: "",
    collegeText: "",
    memberText: "",
    statusText: "",
  });

  // Table Search & Pagination State
  const [tableSearch, setTableSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const pageSize = 10;

  // Load initial options
  const loadInitialData = async () => {
    if (!accessToken) return;
    setInitialLoading(true);
    try {
      const [collegesRes, statusesRes, teamsRes] = await Promise.all([
        fetchActiveColleges(accessToken).catch(() => []),
        fetchLeadStatuses(accessToken).catch(() => []),
        fetchTeams(accessToken).catch(() => []),
      ]);

      setColleges(collegesRes);
      setStatuses(statusesRes);

      // Fetch team members from all available teams
      if (teamsRes.length > 0) {
        const memberPromises = teamsRes.map((t) =>
          fetchTeamMembers(accessToken, t.id).catch(() => [])
        );
        const membersArrays = await Promise.all(memberPromises);
        const allMembers = membersArrays.flat();
        // Deduplicate members by id
        const uniqueMembers = Array.from(
          new Map(allMembers.map((m) => [m.id, m])).values()
        );
        setMembers(uniqueMembers);
      }
    } catch (err) {
      console.error("Error loading initial data for reports:", err);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, [accessToken]);

  // Load report data from backend
  const executeReportFetch = async (pageToFetch: number = 1, searchToUse: string = "") => {
    if (!accessToken) return;
    setIsGenerating(true);
    try {
      const res = await fetchCRMReport(accessToken, {
        period,
        startDate: period === "CUSTOM" ? startDate : undefined,
        endDate: period === "CUSTOM" ? endDate : undefined,
        collegeId: selectedCollegeId,
        memberId: selectedMemberId,
        statusId: selectedStatusId,
        search: searchToUse,
        page: pageToFetch,
        pageSize,
      });

      setSummaryMetrics(res.summaryMetrics);
      setCollegeWiseData(res.collegeWiseData);
      setMemberWiseData(res.memberWiseData);
      setLeadDataset(res.leadDataset);
      setTotalFilteredCount(res.totalFilteredCount);
      setTotalPages(res.totalPages);

      // Format summary labels
      const collegeObj = colleges.find((c) => c.id === selectedCollegeId);
      const memberObj = members.find((m) => m.id === selectedMemberId);
      const statusObj = statuses.find((s) => s.id.toString() === selectedStatusId);

      let periodLabel = "All Time";
      if (period === "TODAY") periodLabel = "Today";
      else if (period === "THIS_WEEK") periodLabel = "This Week";
      else if (period === "THIS_MONTH") periodLabel = "This Month";
      else if (period === "THIS_YEAR") periodLabel = "This Year";
      else if (period === "CUSTOM") periodLabel = `${startDate} to ${endDate}`;

      setAppliedFilterSummary({
        periodText: periodLabel,
        collegeText: collegeObj ? collegeObj.name : "All Colleges",
        memberText: memberObj
          ? `${memberObj.firstName} ${memberObj.lastName || ""}`.trim()
          : "All Members",
        statusText: statusObj ? statusObj.name : "All Stages",
      });

      setHasGenerated(true);
    } catch (err) {
      console.error("Failed to fetch CRM report:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle Report Generation Click
  const handleGenerateReport = () => {
    setValidationError(null);

    // Validate Custom Date Range
    if (period === "CUSTOM") {
      if (!startDate || !endDate) {
        setValidationError("Please select both From and To dates for custom range.");
        return;
      }
      if (new Date(startDate) > new Date(endDate)) {
        setValidationError("From Date cannot be later than To Date.");
        return;
      }
    }

    setCurrentPage(1);
    executeReportFetch(1, tableSearch);
  };

  // Pagination page change
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    executeReportFetch(newPage, tableSearch);
  };

  // Search input change
  const handleSearchChange = (term: string) => {
    setTableSearch(term);
    setCurrentPage(1);
    executeReportFetch(1, term);
  };

  const getCollegesAppliedTo = (lead: LeadItem): string => {
    if (!lead.collegeApplications || lead.collegeApplications.length === 0) return "N/A";
    const names = lead.collegeApplications
      .map((app) => app.college?.name)
      .filter((n): n is string => Boolean(n && n.trim()));
    const uniqueNames = Array.from(new Set(names));
    return uniqueNames.length > 0 ? uniqueNames.join(", ") : "N/A";
  };

  // Single-Sheet Excel Export Handler ("Lead Report") via GET /reports/crm/export
  const handleExportExcel = async () => {
    if (!accessToken) return;
    setIsExporting(true);

    try {
      const exportRes = await fetchCRMReportExport(accessToken, {
        period,
        startDate: period === "CUSTOM" ? startDate : undefined,
        endDate: period === "CUSTOM" ? endDate : undefined,
        collegeId: selectedCollegeId,
        memberId: selectedMemberId,
        statusId: selectedStatusId,
        search: tableSearch,
      });

      const datasetToExport = exportRes.leads;
      if (datasetToExport.length === 0) {
        setIsExporting(false);
        return;
      }

      const wb = XLSX.utils.book_new();

      // Single Worksheet Data Array (AOA - Array of Arrays) starting directly with headers
      const sheetData: (string | number)[][] = [
        [
          "Lead Name",
          "Phone",
          "Email",
          "Colleges Applied To",
          "Assigned Member",
          "Current Status",
          "Created Date",
        ],
      ];

      datasetToExport.forEach((l) => {
        const assignedUser =
          l.assignments?.find((a) => a.status === "ACTIVE")?.user || l.createdBy;

        sheetData.push([
          `${l.firstName} ${l.lastName || ""}`.trim(),
          l.phone,
          l.email || "",
          getCollegesAppliedTo(l),
          assignedUser
            ? `${assignedUser.firstName || ""} ${assignedUser.lastName || ""}`.trim()
            : "Unassigned",
          l.status?.name || "N/A",
          new Date(l.createdAt).toLocaleDateString(),
        ]);
      });

      const ws = XLSX.utils.aoa_to_sheet(sheetData);

      // Dynamic Column Widths for readability
      ws["!cols"] = [
        { wch: 24 }, // Lead Name
        { wch: 16 }, // Phone
        { wch: 28 }, // Email
        { wch: 38 }, // Colleges Applied To
        { wch: 24 }, // Assigned Member
        { wch: 20 }, // Current Status
        { wch: 16 }, // Created Date
      ];

      // Enable Excel's built-in column autofilter starting at Table Header row (Row 1)
      const headerRowNumber = 1;
      const lastRowNumber = headerRowNumber + datasetToExport.length;
      ws["!autofilter"] = { ref: `A${headerRowNumber}:G${lastRowNumber}` };

      // Freeze header row so scrolling keeps header visible
      ws["!views"] = [{ state: "frozen", ySplit: 1 }];

      // Append exactly ONE worksheet named "Lead Report"
      XLSX.utils.book_append_sheet(wb, ws, "Lead Report");


      // Export file
      const dateStamp = new Date().toISOString().split("T")[0];
      const fileName = `${headerTitle.replace(/\s+/g, "_")}_${dateStamp}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (err) {
      console.error("Failed to export Excel report:", err);
    } finally {
      setIsExporting(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="space-y-6 animate-pulse p-6">
        <div className="h-10 w-48 bg-neutral-200 rounded-lg"></div>
        <div className="h-32 w-full bg-neutral-200 rounded-xl"></div>
        <div className="h-64 w-full bg-neutral-200 rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-xl border border-border bg-surface p-6 shadow-2xs">
        <h1 className="text-2xl font-bold text-text-primary">{headerTitle}</h1>
        <p className="mt-1 text-xs text-text-secondary">{subtitle}</p>
      </div>

      {/* REPORT FILTERS SECTION */}
      <div className="rounded-xl border border-border bg-surface p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <Filter size={18} className="text-primary-600" />
          <h2 className="text-sm font-bold text-text-primary">Report Filters</h2>
        </div>

        {validationError && (
          <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-800">
            <AlertCircle size={16} className="text-rose-600 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* A. PERIOD FILTER */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary flex items-center gap-1">
              <Calendar size={14} className="text-text-muted" /> Period
            </label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as PeriodFilterOption)}
              className="w-full h-10 rounded-lg border border-border bg-surface px-3 text-xs outline-none focus:border-primary-500 transition"
            >
              <option value="THIS_MONTH">This Month</option>
              <option value="TODAY">Today</option>
              <option value="THIS_WEEK">This Week</option>
              <option value="THIS_YEAR">This Year</option>
              <option value="ALL">All Time</option>
              <option value="CUSTOM">Custom Range</option>
            </select>
          </div>

          {/* B. LEAD SCOPE */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary flex items-center gap-1">
              <Layers size={14} className="text-text-muted" /> Lead Scope
            </label>
            <select
              disabled
              className="w-full h-10 rounded-lg border border-border bg-neutral-100 px-3 text-xs font-medium text-text-primary cursor-not-allowed opacity-90"
            >
              <option value="ALL_TEAM">{leadScopeLabel}</option>
            </select>
          </div>

          {/* C. COLLEGE FILTER */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary flex items-center gap-1">
              <Building2 size={14} className="text-text-muted" /> College
            </label>
            <select
              value={selectedCollegeId}
              onChange={(e) => setSelectedCollegeId(e.target.value)}
              className="w-full h-10 rounded-lg border border-border bg-surface px-3 text-xs outline-none focus:border-primary-500 transition"
            >
              <option value="ALL">All Colleges</option>
              {colleges.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* D. TEAM MEMBER FILTER */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary flex items-center gap-1">
              <Users size={14} className="text-text-muted" /> Member
            </label>
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="w-full h-10 rounded-lg border border-border bg-surface px-3 text-xs outline-none focus:border-primary-500 transition"
            >
              <option value="ALL">All Members</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.firstName} {m.lastName || ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* CUSTOM DATE RANGE INPUTS */}
        {period === "CUSTOM" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border-light">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary">From Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full h-10 rounded-lg border border-border bg-surface px-3 text-xs outline-none focus:border-primary-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary">To Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full h-10 rounded-lg border border-border bg-surface px-3 text-xs outline-none focus:border-primary-500"
              />
            </div>
          </div>
        )}

        {/* E. LEAD STAGE FILTER & GENERATE BUTTON */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-end justify-between gap-4 pt-2 border-t border-border">
          <div className="space-y-1.5 flex-1 max-w-xs">
            <label className="text-xs font-semibold text-text-secondary">Lead Stage</label>
            <select
              value={selectedStatusId}
              onChange={(e) => setSelectedStatusId(e.target.value)}
              className="w-full h-10 rounded-lg border border-border bg-surface px-3 text-xs outline-none focus:border-primary-500 transition"
            >
              <option value="ALL">All Stages</option>
              {statuses.map((s) => (
                <option key={s.id} value={s.id.toString()}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className="h-10 px-6 rounded-lg bg-primary-500 text-white font-medium text-xs hover:bg-primary-600 transition flex items-center justify-center gap-2 disabled:opacity-50 shrink-0"
          >
            {isGenerating ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                Generating report...
              </>
            ) : (
              <>
                <FileSpreadsheet size={16} />
                Generate Report
              </>
            )}
          </button>
        </div>
      </div>

      {/* GENERATED REPORT CONTENT */}
      {hasGenerated && (
        <div className="space-y-6">
          {/* REPORT SUMMARY */}
          <div className="rounded-xl border border-border bg-surface p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
              <div>
                <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                  Report Summary
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  Applied Filters: Period ({appliedFilterSummary.periodText}) • College ({appliedFilterSummary.collegeText}) • Member ({appliedFilterSummary.memberText}) • Stage ({appliedFilterSummary.statusText})
                </p>
              </div>
            </div>

            {/* Summary Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl border border-border bg-neutral-50/60">
                <p className="text-[11px] font-semibold text-text-muted uppercase">Total Leads</p>
                <p className="text-2xl font-bold text-text-primary mt-1">{summaryMetrics.total}</p>
              </div>
              <div className="p-4 rounded-xl border border-border bg-blue-50/60">
                <p className="text-[11px] font-semibold text-blue-800 uppercase">Applications</p>
                <p className="text-2xl font-bold text-blue-700 mt-1">{summaryMetrics.applications}</p>
              </div>
              <div className="p-4 rounded-xl border border-border bg-purple-50/60">
                <p className="text-[11px] font-semibold text-purple-800 uppercase">Interviews Sched.</p>
                <p className="text-2xl font-bold text-purple-700 mt-1">{summaryMetrics.interviewScheduled}</p>
              </div>
              <div className="p-4 rounded-xl border border-border bg-pink-50/60">
                <p className="text-[11px] font-semibold text-pink-800 uppercase">Interviews Done</p>
                <p className="text-2xl font-bold text-pink-700 mt-1">{summaryMetrics.interviewDone}</p>
              </div>
              <div className="p-4 rounded-xl border border-border bg-amber-50/60">
                <p className="text-[11px] font-semibold text-amber-800 uppercase">Selected</p>
                <p className="text-2xl font-bold text-amber-700 mt-1">{summaryMetrics.selected}</p>
              </div>
              <div className="p-4 rounded-xl border border-border bg-indigo-50/60">
                <p className="text-[11px] font-semibold text-indigo-800 uppercase">Letter Out</p>
                <p className="text-2xl font-bold text-indigo-700 mt-1">{summaryMetrics.letterOut}</p>
              </div>
              <div className="p-4 rounded-xl border border-border bg-emerald-50/60">
                <p className="text-[11px] font-semibold text-emerald-800 uppercase">Admissions Done</p>
                <p className="text-2xl font-bold text-emerald-700 mt-1">{summaryMetrics.admissionsDone}</p>
              </div>
              <div className="p-4 rounded-xl border border-border bg-rose-50/60">
                <p className="text-[11px] font-semibold text-rose-800 uppercase">Cancelled</p>
                <p className="text-2xl font-bold text-rose-700 mt-1">{summaryMetrics.cancelled}</p>
              </div>
            </div>
          </div>

          {/* COLLEGE-WISE & MEMBER-WISE REPORTS GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* COLLEGE-WISE REPORT */}
            <div className="rounded-xl border border-border bg-surface p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-sm font-bold text-text-primary">College Performance</h3>
                <Building2 size={16} className="text-primary-600" />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border bg-neutral-50/80 text-text-secondary font-semibold uppercase tracking-wider">
                      <th className="px-3 py-2.5">College</th>
                      <th className="px-3 py-2.5 text-center">Leads</th>
                      <th className="px-3 py-2.5 text-center">Apps</th>
                      <th className="px-3 py-2.5 text-right">Admissions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {collegeWiseData.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-3 py-6 text-center text-text-muted">
                          No college performance records.
                        </td>
                      </tr>
                    ) : (
                      collegeWiseData.map((c, i) => (
                        <tr key={c.id || i} className="hover:bg-neutral-50/50">
                          <td className="px-3 py-2.5 font-semibold text-text-primary">{c.name}</td>
                          <td className="px-3 py-2.5 text-center text-text-secondary">{c.leads}</td>
                          <td className="px-3 py-2.5 text-center text-indigo-600 font-medium">{c.apps}</td>
                          <td className="px-3 py-2.5 text-right text-emerald-600 font-bold">{c.admissions}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* MEMBER-WISE REPORT */}
            <div className="rounded-xl border border-border bg-surface p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-sm font-bold text-text-primary">Member Performance</h3>
                <Users size={16} className="text-primary-600" />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border bg-neutral-50/80 text-text-secondary font-semibold uppercase tracking-wider">
                      <th className="px-3 py-2.5">Member</th>
                      <th className="px-3 py-2.5 text-center">Leads</th>
                      <th className="px-3 py-2.5 text-center">Apps</th>
                      <th className="px-3 py-2.5 text-right">Admissions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {memberWiseData.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-3 py-6 text-center text-text-muted">
                          No member performance records.
                        </td>
                      </tr>
                    ) : (
                      memberWiseData.map((m, i) => (
                        <tr key={m.id || i} className="hover:bg-neutral-50/50">
                          <td className="px-3 py-2.5 font-semibold text-text-primary">{m.name}</td>
                          <td className="px-3 py-2.5 text-center text-text-secondary">{m.leads}</td>
                          <td className="px-3 py-2.5 text-center text-indigo-600 font-medium">{m.apps}</td>
                          <td className="px-3 py-2.5 text-right text-emerald-600 font-bold">{m.admissions}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* DETAILED LEAD TABLE */}
          <div className="rounded-xl border border-border bg-surface p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
              <div>
                <h3 className="text-sm font-bold text-text-primary">
                  Filtered Lead Dataset ({totalFilteredCount})
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  Detailed table representing exact exported dataset.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="text"
                    placeholder="Search lead name, phone, email..."
                    value={tableSearch}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full h-9 rounded-lg border border-border bg-surface pl-9 pr-3 text-xs outline-none focus:border-primary-500"
                  />
                </div>

                <button
                  onClick={handleExportExcel}
                  disabled={isExporting || totalFilteredCount === 0}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition shadow-2xs shrink-0 disabled:opacity-50 h-9"
                >
                  {isExporting ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download size={15} />
                      Export Excel
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-neutral-50/80 text-text-secondary font-semibold uppercase tracking-wider">
                    <th className="px-4 py-3">Lead Name</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Colleges Applied To</th>
                    <th className="px-4 py-3">Assigned Member</th>
                    <th className="px-4 py-3">Current Status</th>
                    <th className="px-4 py-3 text-right">Created Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {leadDataset.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-text-muted">
                        No leads match the filter or search criteria.
                      </td>
                    </tr>
                  ) : (
                    leadDataset.map((lead) => {
                      const assignedUser =
                        lead.assignments?.find((a) => a.status === "ACTIVE")?.user || lead.createdBy;

                      return (
                        <tr key={lead.id} className="hover:bg-neutral-50/50 transition">
                          <td className="px-4 py-3.5 font-semibold text-text-primary">
                            {lead.firstName} {lead.lastName || ""}
                          </td>
                          <td className="px-4 py-3.5 text-text-secondary">
                            <p>{lead.phone}</p>
                            {lead.email && <p className="text-[11px] text-text-muted">{lead.email}</p>}
                          </td>
                          <td className="px-4 py-3.5 text-text-secondary">{getCollegesAppliedTo(lead)}</td>
                          <td className="px-4 py-3.5 font-medium text-text-primary">
                            {assignedUser
                              ? `${assignedUser.firstName || ""} ${assignedUser.lastName || ""}`.trim()
                              : "Unassigned"}
                          </td>
                          <td className="px-4 py-3.5">
                            <span
                              className="inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                              style={{
                                backgroundColor: lead.status?.color ? `${lead.status.color}20` : "#E0E7FF",
                                color: lead.status?.color || "#3730A3",
                              }}
                            >
                              {lead.status?.name || "N/A"}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-text-muted text-right">
                            {new Date(lead.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-border text-xs">
                <span className="text-text-muted">
                  Page {currentPage} of {totalPages} ({totalFilteredCount} total records)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-lg border border-border bg-surface text-text-secondary hover:bg-neutral-50 transition disabled:opacity-40 font-medium cursor-pointer"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-lg border border-border bg-surface text-text-secondary hover:bg-neutral-50 transition disabled:opacity-40 font-medium cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
