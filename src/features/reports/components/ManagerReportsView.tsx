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
import { useToast } from "../../../context/ToastContext";
import { fetchActiveColleges, type College } from "../../../services/collegeService";
import { fetchTeams, fetchTeamMembers, type EligibleMember } from "../../../services/teamService";
import { fetchLeadStatuses, type LeadItem, type LeadStatusItem } from "../../../services/leadService";
import {
  fetchCRMReport,
  fetchCRMReportExport,
  type SummaryMetrics,
  type PerformanceItem,
} from "../../../services/reportService";
import {
  PageLoadingState,
  SectionLoadingState,
  PageErrorState,
  PageEmptyState,
} from "../../../components/common";

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
  const toast = useToast();

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
  const [loadError, setLoadError] = useState<string | null>(null);
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
  const [isExportingPipeline, setIsExportingPipeline] = useState(false);
  const pageSize = 10;

  // Load initial options
  const loadInitialData = async () => {
    if (!accessToken) return;
    setInitialLoading(true);
    setLoadError(null);
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
    } catch (err: any) {
      console.error("Error loading initial data for reports:", err);
      setLoadError(err.message || "Failed to load initial report configuration.");
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, [accessToken]);

  // Load report data from backend
  const executeReportFetch = async (
    pageToFetch: number = 1,
    searchToUse: string = tableSearch,
    filterOverrides?: {
      period?: PeriodFilterOption;
      startDate?: string;
      endDate?: string;
      collegeId?: string;
      memberId?: string;
      statusId?: string;
    }
  ) => {
    if (!accessToken) return;
    setIsGenerating(true);

    const activePeriod = filterOverrides?.period ?? period;
    const activeStartDate = filterOverrides?.startDate ?? startDate;
    const activeEndDate = filterOverrides?.endDate ?? endDate;
    const activeCollegeId = filterOverrides?.collegeId ?? selectedCollegeId;
    const activeMemberId = filterOverrides?.memberId ?? selectedMemberId;
    const activeStatusId = filterOverrides?.statusId ?? selectedStatusId;

    try {
      const res = await fetchCRMReport(accessToken, {
        period: activePeriod,
        startDate: activePeriod === "CUSTOM" ? activeStartDate : undefined,
        endDate: activePeriod === "CUSTOM" ? activeEndDate : undefined,
        collegeId: activeCollegeId,
        memberId: activeMemberId,
        statusId: activeStatusId,
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
      const collegeObj = colleges.find((c) => c.id === activeCollegeId);
      const memberObj = members.find((m) => m.id === activeMemberId);

      let stageLabel = "All Stages";
      if (activeStatusId && activeStatusId !== "ALL") {
        const foundStatus = statuses.find(
          (s) =>
            s.id.toString() === activeStatusId ||
            s.name.toUpperCase() === activeStatusId.toUpperCase()
        );
        stageLabel = foundStatus?.name || activeStatusId;
      }

      let periodLabel = "All Time";
      if (activePeriod === "TODAY") periodLabel = "Today";
      else if (activePeriod === "THIS_WEEK") periodLabel = "This Week";
      else if (activePeriod === "THIS_MONTH") periodLabel = "This Month";
      else if (activePeriod === "THIS_YEAR") periodLabel = "This Year";
      else if (activePeriod === "CUSTOM") periodLabel = `${activeStartDate} to ${activeEndDate}`;

      setAppliedFilterSummary({
        periodText: periodLabel,
        collegeText: collegeObj ? collegeObj.name : "All Colleges",
        memberText: memberObj
          ? `${memberObj.firstName} ${memberObj.lastName || ""}`.trim()
          : "All Members",
        statusText: stageLabel,
      });

      setHasGenerated(true);
    } catch (err) {
      console.error("Failed to fetch CRM report:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Automatically refresh report and summary cards when filters change
  useEffect(() => {
    if (!accessToken || initialLoading) return;

    if (period === "CUSTOM") {
      if (!startDate || !endDate) return;
      if (new Date(startDate) > new Date(endDate)) return;
    }

    setValidationError(null);
    setCurrentPage(1);
    executeReportFetch(1, tableSearch, {
      period,
      startDate,
      endDate,
      collegeId: selectedCollegeId,
      memberId: selectedMemberId,
      statusId: selectedStatusId,
    });
  }, [
    accessToken,
    initialLoading,
    period,
    startDate,
    endDate,
    selectedCollegeId,
    selectedMemberId,
    selectedStatusId,
  ]);

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

  const getCollegesAppliedTo = (lead: LeadItem, filterCollegeId?: string): string => {
    let apps = lead.collegeApplications || [];
    if (filterCollegeId && filterCollegeId !== "ALL") {
      apps = apps.filter(
        (app) => app.collegeId === filterCollegeId || app.college?.id === filterCollegeId
      );
    }
    if (apps.length === 0) return "N/A";
    const names = apps
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

  // Multi-Sheet Excel Export Handler ("Admission Pipeline Funnel") containing 8 worksheets
  const handleExportPipelineExcel = async () => {
    if (!accessToken) return;

    if (period === "CUSTOM") {
      if (!startDate || !endDate) {
        setValidationError("Please select both start and end dates.");
        return;
      }
      if (new Date(startDate) > new Date(endDate)) {
        setValidationError("Start date cannot be after end date.");
        return;
      }
    }
    setValidationError(null);

    setIsExportingPipeline(true);

    try {
      // Respect all active filters: Period, Scope, College, Member, Search
      // We query full matching dataset across all pipeline stages
      const exportRes = await fetchCRMReportExport(accessToken, {
        period,
        startDate: period === "CUSTOM" ? startDate : undefined,
        endDate: period === "CUSTOM" ? endDate : undefined,
        collegeId: selectedCollegeId,
        memberId: selectedMemberId,
        search: tableSearch,
      });

      const allLeads = exportRes.leads || [];

      // College-stage evaluation helpers
      const getRelevantApps = (lead: LeadItem) => {
        let apps = lead.collegeApplications || [];
        if (selectedCollegeId && selectedCollegeId !== "ALL") {
          apps = apps.filter(
            (a) => a.collegeId === selectedCollegeId || a.college?.id === selectedCollegeId
          );
        }
        return apps;
      };

      const isCollegeCancelled = (app: any): boolean => {
        const st = (app.status?.name || "").toUpperCase();
        const appSt = (app.approvalStatus || "").toUpperCase();
        return Boolean(
          app.isCancelled ||
          app.statusId === 7 ||
          st.includes("CANCEL") ||
          appSt.includes("CANCEL")
        );
      };

      const isCollegeApplicationDone = (app: any): boolean => {
        if (isCollegeCancelled(app)) return false;
        const st = (app.status?.name || "").toUpperCase();
        return app.statusId === 2 || st === "APPLICATION" || st === "APPLICATION_DONE" || st === "APPLICATION DONE";
      };

      const isCollegeInterviewScheduled = (app: any): boolean => {
        if (isCollegeCancelled(app)) return false;
        const st = (app.status?.name || "").toUpperCase();
        return (
          app.statusId === 3 ||
          st === "INTERVIEW_SCHEDULED" ||
          st === "INTERVIEW SCHEDULED" ||
          Boolean(app.interviews?.some((i: any) => i.status === "SCHEDULED"))
        );
      };

      const isCollegeInterviewDone = (app: any): boolean => {
        if (isCollegeCancelled(app)) return false;
        const st = (app.status?.name || "").toUpperCase();
        return (
          app.statusId === 4 ||
          st === "INTERVIEW_DONE" ||
          st === "INTERVIEW DONE" ||
          Boolean(app.interviews?.some((i: any) => i.status === "COMPLETED" && i.result !== "PASSED"))
        );
      };

      const isCollegeSelectionLetter = (app: any): boolean => {
        if (isCollegeCancelled(app)) return false;
        const st = (app.status?.name || "").toUpperCase();
        return (
          app.statusId === 5 ||
          st === "LETTER_OUT" ||
          st === "LETTER OUT" ||
          st.includes("SELECTION") ||
          Boolean(app.interviews?.some((i: any) => i.result === "PASSED")) ||
          Boolean(app.selectionLetters && app.selectionLetters.length > 0)
        );
      };

      const isCollegeAdmissionDone = (app: any, lead: any): boolean => {
        const st = (app.status?.name || "").toUpperCase();
        return Boolean(
          app.statusId === 6 ||
          st === "ADMISSION_DONE" ||
          st === "ADMISSION DONE" ||
          st === "CONFIRMED" ||
          Boolean(app.payments && app.payments.some((p: any) => p.type === "ADMISSION_FEE")) ||
          (lead.finalCollegeId &&
            (lead.finalCollegeId === app.collegeId || lead.finalCollegeId === app.college?.id) &&
            (lead.statusId === 6 || (lead.status?.name || "").toUpperCase() === "ADMISSION_DONE"))
        );
      };

      // Helper to build stage items with exact college names for that stage
      interface StageItem {
        lead: LeadItem;
        colleges: string;
        stage: string;
      }

      const buildStageItems = (
        predicate: (app: any, lead: LeadItem) => boolean,
        defaultStageName: string
      ): StageItem[] => {
        const items: StageItem[] = [];
        for (const lead of allLeads) {
          const apps = getRelevantApps(lead);
          if (apps.length > 0) {
            const matchingApps = apps.filter((a) => predicate(a, lead));
            if (matchingApps.length > 0) {
              const names = Array.from(
                new Set(matchingApps.map((a) => a.college?.name).filter(Boolean))
              ).join(", ");
              items.push({
                lead,
                colleges: names || "N/A",
                stage: defaultStageName,
              });
            }
          } else if (!selectedCollegeId || selectedCollegeId === "ALL") {
            // Direct lead without college applications
            const dummyApp = {
              statusId: lead.statusId,
              status: lead.status,
              isCancelled: lead.statusId === 7,
            };
            if (predicate(dummyApp, lead)) {
              items.push({
                lead,
                colleges: "Direct Lead",
                stage: defaultStageName,
              });
            }
          }
        }
        return items;
      };

      // 1. Leads Sheet: matches currently selected report filters
      // Rule 2: A student who has reached APPLICATION must still count in LEAD because the student originally entered the pipeline as a lead.
      let leadsSheetData: StageItem[] = [];
      const targetStageUpper =
        statuses.find(
          (s) =>
            s.id.toString() === selectedStatusId ||
            s.name.toUpperCase() === selectedStatusId.toUpperCase()
        )?.name?.toUpperCase() || selectedStatusId.toUpperCase();

      if (selectedStatusId === "ALL" || selectedStatusId === "1" || targetStageUpper === "LEAD") {
        leadsSheetData = allLeads.map((lead) => {
          const apps = getRelevantApps(lead);
          const names = Array.from(
            new Set(apps.map((a) => a.college?.name).filter(Boolean))
          ).join(", ");
          return {
            lead,
            colleges: names || "N/A",
            stage: lead.status?.name || "LEAD",
          };
        });
      } else {
        // If a specific stage is filtered, use that stage's records
        if (targetStageUpper === "APPLICATION" || selectedStatusId === "2") {
          leadsSheetData = buildStageItems(isCollegeApplicationDone, "APPLICATION");
        } else if (targetStageUpper === "INTERVIEW_SCHEDULED" || selectedStatusId === "3") {
          leadsSheetData = buildStageItems(isCollegeInterviewScheduled, "INTERVIEW_SCHEDULED");
        } else if (targetStageUpper === "INTERVIEW_DONE" || selectedStatusId === "4") {
          leadsSheetData = buildStageItems(isCollegeInterviewDone, "INTERVIEW_DONE");
        } else if (
          targetStageUpper.includes("LETTER") ||
          targetStageUpper.includes("SELECTION") ||
          selectedStatusId === "5"
        ) {
          leadsSheetData = buildStageItems(isCollegeSelectionLetter, "LETTER_OUT");
        } else if (targetStageUpper.includes("ADMISSION") || selectedStatusId === "6") {
          leadsSheetData = buildStageItems(isCollegeAdmissionDone, "ADMISSION_DONE");
        } else if (targetStageUpper.includes("CANCEL") || selectedStatusId === "7") {
          leadsSheetData = buildStageItems(isCollegeCancelled, "CANCELLED");
        } else {
          leadsSheetData = allLeads.map((lead) => ({
            lead,
            colleges: getCollegesAppliedTo(lead, selectedCollegeId),
            stage: lead.status?.name || "N/A",
          }));
        }
      }

      // 2-7. Pipeline stage subsets
      const applicationDoneItems = buildStageItems(isCollegeApplicationDone, "APPLICATION");
      const interviewScheduledItems = buildStageItems(isCollegeInterviewScheduled, "INTERVIEW_SCHEDULED");
      const interviewDoneItems = buildStageItems(isCollegeInterviewDone, "INTERVIEW_DONE");
      const selectionLetterItems = buildStageItems(isCollegeSelectionLetter, "LETTER_OUT");
      const admissionDoneItems = buildStageItems(isCollegeAdmissionDone, "ADMISSION_DONE");
      const cancellationItems = buildStageItems(isCollegeCancelled, "CANCELLED");

      // 8. Retained: Confirmed admissions after accounting for cancellations, without double-counting students or admissions
      const retainedItems = buildStageItems(
        (app, lead) => isCollegeAdmissionDone(app, lead) && !isCollegeCancelled(app),
        "ADMISSION_DONE"
      );

      const wb = XLSX.utils.book_new();

      const EXCEL_HEADERS = [
        "Student Name",
        "Phone",
        "Alternate Phone",
        "Email",
        "Course Interested",
        "Specialization",
        "City",
        "State",
        "Preferred Location",
        "Colleges Pitched / Applied",
        "Current Owner",
        "Team",
        "Lead Stage",
        "Created Date",
        "Last Updated",
      ];

      const EXCEL_WIDTHS = [
        { wch: 24 }, // Student Name
        { wch: 15 }, // Phone
        { wch: 16 }, // Alternate Phone
        { wch: 28 }, // Email
        { wch: 22 }, // Course Interested
        { wch: 22 }, // Specialization
        { wch: 16 }, // City
        { wch: 16 }, // State
        { wch: 25 }, // Preferred Location
        { wch: 35 }, // Colleges Pitched / Applied
        { wch: 22 }, // Current Owner
        { wch: 18 }, // Team
        { wch: 20 }, // Lead Stage
        { wch: 16 }, // Created Date
        { wch: 16 }, // Last Updated
      ];

      const formatRow = (item: StageItem): (string | number)[] => {
        const lead = item.lead;
        const studentName = `${lead.firstName || ""} ${lead.lastName || ""}`.trim() || "N/A";
        const phone = lead.phone || "";
        const altPhone = lead.alternatePhone || "";
        const email = lead.email || "";
        const course = lead.courseInterested || lead.courseInterestedOther || "N/A";
        const specialization = lead.specializationInterested || "N/A";
        const city = lead.city || "N/A";
        const state = lead.state || "N/A";
        const preferredLocation =
          [lead.preferredCity, lead.preferredState].filter(Boolean).join(", ") || "N/A";

        const collegesPitched = item.colleges;

        const activeAssignment = lead.assignments?.find((a) => a.status === "ACTIVE");
        const assignedUser = activeAssignment?.user || lead.createdBy;
        const currentOwner = assignedUser
          ? `${assignedUser.firstName || ""} ${assignedUser.lastName || ""}`.trim()
          : "Unassigned";

        const team = (lead as any).team?.name || "N/A";
        const leadStage = item.stage;

        const createdDate = lead.createdAt
          ? new Date(lead.createdAt).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })
          : "N/A";

        const lastUpdated = (lead as any).updatedAt
          ? new Date((lead as any).updatedAt).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })
          : createdDate;

        return [
          studentName,
          phone,
          altPhone,
          email,
          course,
          specialization,
          city,
          state,
          preferredLocation,
          collegesPitched,
          currentOwner,
          team,
          leadStage,
          createdDate,
          lastUpdated,
        ];
      };

      const createWorksheet = (dataset: StageItem[]): XLSX.WorkSheet => {
        const rows: (string | number)[][] = [EXCEL_HEADERS];
        dataset.forEach((item) => rows.push(formatRow(item)));

        const ws = XLSX.utils.aoa_to_sheet(rows);
        ws["!cols"] = EXCEL_WIDTHS;
        ws["!views"] = [{ state: "frozen", ySplit: 1 }];

        if (dataset.length > 0) {
          ws["!autofilter"] = { ref: `A1:O${dataset.length + 1}` };
        }
        return ws;
      };

      // Append exactly 8 worksheets
      XLSX.utils.book_append_sheet(wb, createWorksheet(leadsSheetData), "Leads");
      XLSX.utils.book_append_sheet(wb, createWorksheet(applicationDoneItems), "Application Done");
      XLSX.utils.book_append_sheet(wb, createWorksheet(interviewScheduledItems), "Interview Scheduled");
      XLSX.utils.book_append_sheet(wb, createWorksheet(interviewDoneItems), "Interview Done");
      XLSX.utils.book_append_sheet(wb, createWorksheet(selectionLetterItems), "Selection Letter");
      XLSX.utils.book_append_sheet(wb, createWorksheet(admissionDoneItems), "Admission Done");
      XLSX.utils.book_append_sheet(wb, createWorksheet(cancellationItems), "Cancellation");
      XLSX.utils.book_append_sheet(wb, createWorksheet(retainedItems), "Retained");

      const dateStamp = new Date().toISOString().split("T")[0];
      const fileName = `Admission_Pipeline_Funnel_${dateStamp}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast.success("Exported 8-stage Admission Pipeline Funnel Excel workbook successfully!");
    } catch (err) {
      console.error("Failed to export pipeline Excel workbook:", err);
      toast.error("Failed to export Admission Pipeline Excel workbook.");
    } finally {
      setIsExportingPipeline(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="space-y-6">
        <PageLoadingState
          message="Loading CRM Reports..."
          description="Fetching teams, member rosters, colleges, and pipeline statuses"
          minHeight="min-h-[420px]"
        />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-6">
        <PageErrorState
          title="Unable to load CRM Reports"
          message={loadError}
          onRetry={loadInitialData}
          minHeight="min-h-[380px]"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-xl border border-border bg-surface p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{headerTitle}</h1>
          <p className="mt-1 text-xs text-text-secondary">{subtitle}</p>
        </div>

        <button
          onClick={handleExportPipelineExcel}
          disabled={isExportingPipeline}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition shadow-2xs shrink-0 disabled:opacity-50 h-10"
        >
          {isExportingPipeline ? (
            <>
              <RefreshCw size={14} className="animate-spin" />
              Exporting Pipeline...
            </>
          ) : (
            <>
              <FileSpreadsheet size={16} />
              Export Pipeline Excel
            </>
          )}
        </button>
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
              value={
                statuses.find(
                  (s) =>
                    s.id.toString() === selectedStatusId ||
                    s.name.toUpperCase() === selectedStatusId.toUpperCase()
                )?.id.toString() || selectedStatusId
              }
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
                  onClick={handleExportPipelineExcel}
                  disabled={isExportingPipeline}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition shadow-2xs shrink-0 disabled:opacity-50 h-9"
                  title="Export all 8 pipeline stages as separate worksheets into one Excel workbook"
                >
                  {isExportingPipeline ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      Exporting Pipeline...
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet size={15} />
                      Export Pipeline Excel
                    </>
                  )}
                </button>

                <button
                  onClick={handleExportExcel}
                  disabled={isExporting || totalFilteredCount === 0}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-xs font-semibold text-text-secondary hover:bg-neutral-50 transition shadow-2xs shrink-0 disabled:opacity-50 h-9"
                  title="Export filtered table dataset"
                >
                  {isExporting ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download size={15} />
                      Export Table
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
                  {isGenerating ? (
                    <SectionLoadingState
                      isTableRow
                      colSpan={6}
                      message="Generating report dataset..."
                      description="Filtering lead records and matching college applications"
                    />
                  ) : leadDataset.length === 0 ? (
                    <PageEmptyState
                      isTableRow
                      colSpan={6}
                      title="No leads match the filter or search criteria"
                      description="Try selecting different dates, colleges, or pipeline stages."
                    />
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
