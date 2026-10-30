import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Phone,
  Mail,
  MapPin,
  GraduationCap,
  UserCheck,
  Building2,
  FileText,
  CreditCard,
  Award,
  PhoneCall,
  User,
  History,
  Shield,
  Layers,
  ChevronRight,
  ExternalLink,
  FileSpreadsheet,
  Check,
  CheckCircle2,
  Compass,
  IndianRupee,
  Tag,
} from "lucide-react";

import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import { fetchLead360Profile } from "../../../services/leadService";
import {
  fetchCounsellingByLead,
  type CollegeCounsellingItem,
} from "../../../services/counsellingService";
import CollegeCounsellingDrawer from "../components/CollegeCounsellingDrawer";
import {
  PageLoadingState,
  PageErrorState,
} from "../../../components/common";

// Helpers for human readable formatting
function formatDate(dateStr?: string | Date | null): string {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatPreferredDate(dateStr?: string | Date | null): string {
  if (!dateStr) return "—";
  try {
    const str = typeof dateStr === "string" ? dateStr : dateStr.toISOString();
    const clean = str.includes("T") ? str.split("T")[0] : str;
    const parts = clean.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    }
    const d = new Date(str);
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return String(dateStr);
  }
}

function formatPreferredTime(timeStr?: string | null): string | null {
  if (!timeStr) return null;
  const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${String(hours).padStart(2, "0")}:${minutes} ${ampm}`;
  }
  return timeStr;
}

function formatTime(dateStr?: string | Date | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDateTime(dateStr?: string | Date | null): string {
  if (!dateStr) return "N/A";
  const d = formatDate(dateStr);
  const t = formatTime(dateStr);
  return t ? `${d} at ${t}` : d;
}

function formatCurrency(amount?: number | null): string {
  if (amount === undefined || amount === null) return "N/A";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function LeadProfilePage() {
  const { leadId } = useParams<{ leadId: string }>();
  const navigate = useNavigate();
  const { accessToken, user } = useAuth();
  const toast = useToast();

  const [profileData, setProfileData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timelineFilter, setTimelineFilter] = useState<string>("ALL");
  const [expandedCollegeHistories, setExpandedCollegeHistories] = useState<Record<string, boolean>>({});

  // College Counselling State
  const [counsellingRequests, setCounsellingRequests] = useState<CollegeCounsellingItem[]>([]);
  const [selectedCounsellingItem, setSelectedCounsellingItem] = useState<CollegeCounsellingItem | null>(null);
  const [isCounsellingDrawerOpen, setIsCounsellingDrawerOpen] = useState(false);

  const isAuthorized =
    user?.roleCode === "SUPER_ADMIN" ||
    user?.roleCode === "ADMIN" ||
    user?.roleCode === "MANAGER" ||
    user?.roleCode === "TEAM_LEAD" ||
    user?.roleCode === "PROGRAM_ADVISOR";

  const canCompleteCounselling =
    user?.roleCode === "SUPER_ADMIN" ||
    user?.roleCode === "ADMIN" ||
    user?.roleCode === "MANAGER" ||
    user?.roleCode === "TEAM_LEAD";

  const loadProfile = useCallback(() => {
    if (!isAuthorized) {
      setError("Access denied: You do not have permission to view the Lead Profile.");
      setLoading(false);
      return;
    }

    if (!leadId || !accessToken) return;

    setLoading(true);
    setError(null);

    Promise.all([
      fetchLead360Profile(accessToken, leadId),
      fetchCounsellingByLead(accessToken, leadId).catch((err) => {
        console.error("Failed to load counselling requests:", err);
        return [];
      }),
    ])
      .then(([profile, counselling]) => {
        setProfileData(profile);
        setCounsellingRequests(counselling);
      })
      .catch((err: any) => {
        const msg = err.message || "Failed to load Lead Profile";
        setError(msg);
        toast.error(msg);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [leadId, accessToken, isAuthorized, toast]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const refreshCounselling = useCallback(async () => {
    if (!leadId || !accessToken) return;
    try {
      const data = await fetchCounsellingByLead(accessToken, leadId);
      setCounsellingRequests(data);
    } catch (err) {
      console.error("Failed to refresh counselling requests:", err);
    }
  }, [leadId, accessToken]);

  useEffect(() => {
    if (!leadId || !accessToken) return;

    let isSubscribed = true;
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel("crm_counselling_sync");
      channel.onmessage = () => {
        if (isSubscribed) refreshCounselling();
      };
    } catch {}

    const handleCustomEvent = () => {
      if (isSubscribed) refreshCounselling();
    };
    window.addEventListener("crm:counselling-updated", handleCustomEvent);

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "crm_counselling_last_update" && isSubscribed) {
        refreshCounselling();
      }
    };
    window.addEventListener("storage", handleStorage);

    const handleFocus = () => {
      if (isSubscribed) refreshCounselling();
    };
    window.addEventListener("focus", handleFocus);

    return () => {
      isSubscribed = false;
      if (channel) channel.close();
      window.removeEventListener("crm:counselling-updated", handleCustomEvent);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", handleFocus);
    };
  }, [leadId, accessToken, refreshCounselling]);

  const toggleCollegeHistory = (collegeId: string) => {
    setExpandedCollegeHistories((prev) => ({
      ...prev,
      [collegeId]: !prev[collegeId],
    }));
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-8">
        <PageLoadingState
          message="Loading Lead 360 Profile..."
          description="Gathering student timeline, calls, applications, and counsel history"
          minHeight="min-h-[420px]"
        />
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="max-w-2xl mx-auto py-8 space-y-4">
        <PageErrorState
          title="Unable to load Lead 360 Profile"
          message={error || "Lead 360 profile could not be loaded."}
          onRetry={loadProfile}
          minHeight="min-h-[300px]"
        />
        <div className="text-center">
          <button
            onClick={() => navigate("/leads")}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl border border-border bg-surface text-text-secondary hover:bg-neutral-100 transition shadow-2xs"
          >
            <ArrowLeft size={14} /> Back to Leads
          </button>
        </div>
      </div>
    );
  }

  const { lead, summary, dataOrigin, leadPipeline, tpcJourney, colleges, people, masterTimeline } = profileData;

  const filteredTimeline = masterTimeline.filter((ev: any) => {
    if (timelineFilter === "ALL") return true;
    if (timelineFilter === "CALLS") return ev.type === "CALL" || ev.type === "INTERACTION";
    if (timelineFilter === "COLLEGE") return ev.type.startsWith("COLLEGE_") || ev.type.startsWith("INTERVIEW_") || ev.type.startsWith("SELECTION_") || ev.type.startsWith("PAYMENT_");
    if (timelineFilter === "DATA") return ev.type.startsWith("DATA_");
    if (timelineFilter === "TPC") return ev.type.startsWith("TPC_");
    return true;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header Navigation & Breadcrumbs */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/leads")}
            className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3.5 py-2 text-sm font-medium text-text-secondary hover:bg-neutral-50 hover:text-text-primary transition shadow-2xs cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Back to Leads</span>
          </button>
          <div className="h-5 w-px bg-border hidden sm:block" />
          <nav className="text-xs text-text-muted hidden sm:flex items-center gap-1.5 font-medium">
            <span>Leads</span>
            <ChevronRight size={12} />
            <span>Lead 360 Profile</span>
            <ChevronRight size={12} />
            <span className="text-text-primary font-semibold">{lead.fullName}</span>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700 border border-primary-200">
            <Shield size={13} /> Super Admin View
          </span>
        </div>
      </div>

      {/* 1. LEAD HEADER */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-surface p-6 shadow-xs sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="flex items-start gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary-500 text-2xl font-bold text-white shadow-md">
              {lead.firstName?.[0]}
              {lead.lastName?.[0] || ""}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">{lead.fullName}</h1>
                <span className="rounded-md bg-neutral-100 px-2.5 py-1 text-xs font-mono font-semibold text-text-muted border border-border">
                  {lead.shortId}
                </span>
                <span
                  className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white shadow-2xs"
                  style={{ backgroundColor: lead.status?.color || "#3b82f6" }}
                >
                  {lead.status?.name}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-sm text-text-secondary pt-2">
                <div className="flex items-center gap-2">
                  <Phone size={15} className="text-primary-500 shrink-0" />
                  <span className="font-mono">{lead.phone}</span>
                </div>
                {lead.email && (
                  <div className="flex items-center gap-2">
                    <Mail size={15} className="text-primary-500 shrink-0" />
                    <span>{lead.email}</span>
                  </div>
                )}
                {(lead.city || lead.state) && (
                  <div className="flex items-center gap-2" title="Residential Location">
                    <MapPin size={15} className="text-primary-500 shrink-0" />
                    <span><span className="text-text-muted">Residence:</span> {[lead.city, lead.state].filter(Boolean).join(", ")}</span>
                  </div>
                )}
                {(lead.preferredCity || lead.preferredState) && (
                  <div className="flex items-center gap-2" title="Preferred Study Location">
                    <Compass size={15} className="text-primary-500 shrink-0" />
                    <span><span className="text-text-muted">Preferred Study:</span> {[lead.preferredCity, lead.preferredState].filter(Boolean).join(", ")}</span>
                  </div>
                )}
                {lead.preferredBudget != null && (
                  <div className="flex items-center gap-2" title="Preferred Budget">
                    <IndianRupee size={15} className="text-primary-500 shrink-0" />
                    <span><span className="text-text-muted">Budget:</span> ₹{Number(lead.preferredBudget).toLocaleString("en-IN")}</span>
                  </div>
                )}
                {lead.source && (
                  <div className="flex items-center gap-2" title="Lead Source">
                    <Tag size={15} className="text-primary-500 shrink-0" />
                    <span>
                      <span className="text-text-muted">Source:</span>{" "}
                      {lead.source === "REFERENCE" ? "Reference" : lead.source}
                      {lead.source === "REFERENCE" && lead.referredBy ? ` (by ${lead.referredBy})` : ""}
                    </span>
                  </div>
                )}
                {lead.courseInterested && (
                  <div className="flex items-center gap-2">
                    <GraduationCap size={15} className="text-primary-500 shrink-0" />
                    <span className="font-medium text-text-primary">{lead.courseInterested}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Current Owner Card */}
          <div className="rounded-xl border border-border bg-neutral-50/70 p-4 min-w-[240px] space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Current Owner</p>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-primary-800 font-bold text-sm">
                {summary.currentOwner?.[0] || "U"}
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">{summary.currentOwner}</p>
                <p className="text-xs text-text-muted">Lead Owner / Assignee</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. LEAD SUMMARY METRICS */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-xl border border-border bg-surface p-4 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-medium text-text-muted">
            <Calendar size={14} className="text-primary-500" /> Date Acquired
          </div>
          <p className="mt-2 text-base font-bold text-text-primary">{formatDate(summary.acquiredAt)}</p>
          <p className="text-xs text-text-muted">{formatTime(summary.acquiredAt)}</p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-medium text-text-muted">
            <UserCheck size={14} className="text-primary-500" /> TPC Status
          </div>
          <p className="mt-2 text-base font-bold text-text-primary">{summary.tpcStatus}</p>
          <p className="text-xs text-text-muted">{summary.tpcAttemptsCount} Assignment(s)</p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-medium text-text-muted">
            <PhoneCall size={14} className="text-primary-500" /> Calls & Notes
          </div>
          <p className="mt-2 text-base font-bold text-text-primary">{summary.callsInteractionsCount}</p>
          <p className="text-xs text-text-muted">Total Interactions</p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-medium text-text-muted">
            <Building2 size={14} className="text-primary-500" /> Colleges Pitched
          </div>
          <p className="mt-2 text-base font-bold text-text-primary">{summary.collegesCount}</p>
          <p className="text-xs text-text-muted">{summary.applicationsCount} Application(s)</p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-medium text-text-muted">
            <Award size={14} className="text-primary-500" /> Interviews / Passes
          </div>
          <p className="mt-2 text-base font-bold text-text-primary">{summary.interviewsCount}</p>
          <p className="text-xs text-text-muted">{summary.selectionsCount} Selection(s)</p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-medium text-text-muted">
            <CreditCard size={14} className="text-primary-500" /> Payments Total
          </div>
          <p className="mt-2 text-base font-bold text-text-primary">{formatCurrency(summary.totalPaidAmount)}</p>
          <p className="text-xs text-text-muted">{summary.paymentsCount} Payment(s)</p>
        </div>
      </div>

      {/* 3. LEAD-LEVEL JOURNEY */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs">
        <h3 className="text-base font-bold text-text-primary flex items-center gap-2 mb-6">
          <Layers size={18} className="text-primary-500" /> Overall Lead Lifecycle Journey
        </h3>

        <div className="relative flex flex-col md:flex-row items-stretch justify-between gap-4">
          {leadPipeline.map((step: any, idx: number) => {
            return (
              <div key={step.id} className="flex-1 flex flex-col items-center relative group">
                <div className="flex items-center w-full mb-3">
                  {idx > 0 && (
                    <div
                      className={`h-1 flex-1 transition-colors ${step.isCompleted || step.isCurrent ? "bg-primary-500" : "bg-neutral-200"
                        }`}
                    />
                  )}
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold text-xs transition-all shadow-2xs ${step.isCurrent
                      ? "bg-primary-500 text-white ring-4 ring-primary-100 scale-110"
                      : step.isCompleted
                        ? "bg-primary-600 text-white"
                        : "bg-neutral-100 text-text-muted border border-border"
                      }`}
                  >
                    {step.isCompleted ? <Check size={16} /> : idx + 1}
                  </div>
                  {idx < leadPipeline.length - 1 && (
                    <div
                      className={`h-1 flex-1 transition-colors ${step.isCompleted ? "bg-primary-500" : "bg-neutral-200"
                        }`}
                    />
                  )}
                </div>
                <div className="text-center">
                  <p
                    className={`text-xs font-semibold uppercase tracking-wider ${step.isCurrent
                      ? "text-primary-700 font-bold"
                      : step.isCompleted
                        ? "text-text-primary"
                        : "text-text-muted"
                      }`}
                  >
                    {step.name}
                  </p>
                  <p className="text-[11px] text-text-muted mt-0.5 max-w-[120px] mx-auto line-clamp-2">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 4. DATA ORIGIN & ACQUISITION */}
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
            <FileSpreadsheet size={18} className="text-primary-500" /> Data Origin & Acquisition
          </h3>

          {dataOrigin ? (
            <div className="space-y-4 rounded-xl border border-border bg-neutral-50/50 p-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="text-xs font-semibold text-text-muted uppercase">Upload Source</span>
                <span className="inline-flex items-center gap-1 rounded bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-800">
                  <FileText size={12} /> {dataOrigin.fileName}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-text-muted">Uploaded Date:</span>
                  <span className="font-semibold text-text-primary">{formatDateTime(dataOrigin.uploadedAt)}</span>
                </div>
                {dataOrigin.uploadedBy && (
                  <div className="flex justify-between">
                    <span className="text-text-muted">Uploaded By:</span>
                    <span className="font-semibold text-text-primary">{dataOrigin.uploadedBy.name}</span>
                  </div>
                )}
                {dataOrigin.assignedAt && (
                  <div className="flex justify-between border-t border-border pt-2">
                    <span className="text-text-muted">Assigned Date:</span>
                    <span className="font-semibold text-text-primary">{formatDateTime(dataOrigin.assignedAt)}</span>
                  </div>
                )}
                {dataOrigin.assignedTo && (
                  <div className="flex justify-between">
                    <span className="text-text-muted">Claimed / Assigned To:</span>
                    <span className="font-semibold text-text-primary">{dataOrigin.assignedTo.name}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-text-muted">
              Direct Creation / No CSV upload origin recorded.
            </div>
          )}

          {/* Lead Source & Study Preferences Summary */}
          <div className="space-y-2 rounded-xl border border-border bg-neutral-50/50 p-4 text-xs">
            <h4 className="font-semibold text-text-primary uppercase tracking-wider text-[11px] mb-1">
              Preferences & Referral
            </h4>
            <div className="flex justify-between">
              <span className="text-text-muted">Lead Source:</span>
              <span className="font-semibold text-text-primary">
                {lead.source === "REFERENCE" ? "Reference" : (lead.source || "Direct")}
              </span>
            </div>
            {lead.source === "REFERENCE" && lead.referredBy && (
              <div className="flex justify-between">
                <span className="text-text-muted">Referred By:</span>
                <span className="font-semibold text-text-primary">{lead.referredBy}</span>
              </div>
            )}
            {(lead.city || lead.state) && (
              <div className="flex justify-between border-t border-border pt-1.5">
                <span className="text-text-muted">Residential Location:</span>
                <span className="font-semibold text-text-primary">
                  {[lead.city, lead.state].filter(Boolean).join(", ")}
                </span>
              </div>
            )}
            {(lead.preferredCity || lead.preferredState) && (
              <div className="flex justify-between">
                <span className="text-text-muted">Preferred Study Location:</span>
                <span className="font-semibold text-text-primary">
                  {[lead.preferredCity, lead.preferredState].filter(Boolean).join(", ")}
                </span>
              </div>
            )}
            {lead.preferredBudget != null && (
              <div className="flex justify-between">
                <span className="text-text-muted">Preferred Budget:</span>
                <span className="font-semibold text-text-primary">
                  ₹{Number(lead.preferredBudget).toLocaleString("en-IN")}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 5. TPC JOURNEY */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-surface p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
              <UserCheck size={18} className="text-primary-500" /> TPC Call Journey
            </h3>
            <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700 border border-primary-200">
              TPC Status: {tpcJourney.latestStatus}
            </span>
          </div>

          {tpcJourney.assignments && tpcJourney.assignments.length > 0 ? (
            <div className="space-y-3">
              {tpcJourney.assignments.map((tpc: any, idx: number) => (
                <div
                  key={tpc.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border bg-neutral-50/50 p-4 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 font-bold text-primary-800">
                      #{idx + 1}
                    </div>
                    <div>
                      <p className="font-bold text-text-primary">
                        Assigned To: {tpc.assignedTo?.name || "Counselor"}
                      </p>
                      <p className="text-text-muted">
                        Assigned By: {tpc.assignedBy?.name || "System"} on {formatDateTime(tpc.assignedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 border-t sm:border-t-0 border-border pt-2 sm:pt-0">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${tpc.status === "COMPLETED"
                        ? "bg-success-100 text-success-800"
                        : "bg-warning-100 text-warning-800"
                        }`}
                    >
                      {tpc.status}
                    </span>
                    {tpc.completedAt && (
                      <span className="text-text-muted text-[11px]">
                        Done: {formatDateTime(tpc.completedAt)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-text-muted">
              No TPC assignment history recorded yet.
            </div>
          )}
        </div>
      </div>

      {/* COLLEGE COUNSELLING SECTION (DIRECTLY ABOVE INDEPENDENT COLLEGE JOURNEYS) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-text-primary">
            College Counselling
          </h2>
          {counsellingRequests.length > 0 && (
            <span className="text-xs text-text-muted">
              {counsellingRequests.length} {counsellingRequests.length === 1 ? "request" : "requests"}
            </span>
          )}
        </div>

        {counsellingRequests.length > 0 ? (
          <div className="divide-y divide-border border-y border-border">
            {counsellingRequests.map((req) => {
              const isDone = String(req.status || "").toUpperCase() === "COMPLETED";
              const isScheduled = String(req.status || "").toUpperCase() === "SCHEDULED";
              const colLocation = [req.college?.city, req.college?.state].filter(Boolean).join(", ");
              const requesterName = [req.requestedBy?.firstName, req.requestedBy?.lastName].filter(Boolean).join(" ") || "Program Advisor";
              const scheduledByName = [req.scheduledBy?.firstName, req.scheduledBy?.lastName].filter(Boolean).join(" ") || "Manager / Super Admin";
              const completedByName = [req.completedBy?.firstName, req.completedBy?.lastName].filter(Boolean).join(" ") || "Manager / Team Lead";

              return (
                <div key={req.id} className="py-3.5 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-semibold text-text-primary">
                        {req.college?.name || "College"}
                      </span>
                      {colLocation && (
                        <span className="text-xs text-text-muted">
                          ({colLocation})
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          isDone
                            ? "bg-emerald-100 text-emerald-800"
                            : isScheduled
                            ? "bg-blue-100 text-blue-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {isDone ? (
                          <CheckCircle2 size={12} />
                        ) : isScheduled ? (
                          <Calendar size={12} />
                        ) : (
                          <Clock size={12} />
                        )}
                        {isDone ? "Completed" : isScheduled ? "Scheduled" : "Pending"}
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCounsellingItem(req);
                          setIsCounsellingDrawerOpen(true);
                        }}
                        className={`rounded-md px-3.5 py-1.5 text-xs font-medium transition cursor-pointer shadow-sm ${
                          !isDone && canCompleteCounselling
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                            : "border border-border text-text-secondary hover:bg-neutral-100"
                        }`}
                      >
                        {!isDone && canCompleteCounselling ? "Mark as Done" : "View Details"}
                      </button>
                    </div>
                  </div>

                  {/* Request metadata row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs text-text-secondary">
                    <div>
                      <span className="text-text-muted">Requested by: </span>
                      <span className="font-medium text-text-primary">{requesterName}</span>
                    </div>
                    <div>
                      <span className="text-text-muted">Date: </span>
                      <span>{formatDate(req.requestedAt || req.createdAt)}</span>
                    </div>
                    <div>
                      <span className="text-text-muted">Preferred schedule: </span>
                      <span className="text-text-primary">
                        {(req.preferredDate || req.preferredTime)
                          ? [req.preferredDate, req.preferredTime].filter(Boolean).join(" at ")
                          : req.preferredTiming || "Not specified"}
                      </span>
                    </div>
                    <div>
                      <span className="text-text-muted">Purpose: </span>
                      <span className="text-text-primary">{req.purpose || "General guidance"}</span>
                    </div>
                  </div>

                  {/* Scheduled info if scheduled */}
                  {isScheduled && (
                    <div className="text-xs text-text-secondary pt-1 space-y-1 border-t border-border/40">
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-text-muted">
                        <span>
                          Scheduled by: <strong className="text-text-primary font-medium">{scheduledByName}</strong>
                        </span>
                        {(req.scheduledDate || req.counsellingDate) && (
                          <span className="text-blue-700 font-medium">
                            Scheduled for: {[formatPreferredDate(req.scheduledDate || req.counsellingDate), formatPreferredTime(req.scheduledTime)].filter(Boolean).join(" at ")}
                          </span>
                        )}
                        {req.scheduledAt && <span>Scheduled on: {formatDate(req.scheduledAt)}</span>}
                      </div>
                      {(req.counsellingNotes || req.completionRemark) && (
                        <p className="text-text-primary">
                          <span className="text-text-muted font-medium">Notes: </span>
                          <span className="italic">{req.counsellingNotes || req.completionRemark}</span>
                        </p>
                      )}
                    </div>
                  )}

                  {/* Completed info if completed */}
                  {isDone && (
                    <div className="text-xs text-text-secondary pt-1 space-y-1 border-t border-border/40">
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-text-muted">
                        <span>
                          Completed by: <strong className="text-text-primary font-medium">{completedByName}</strong>
                        </span>
                        <span>Completed on: {formatDate(req.completedAt)}</span>
                        {req.counsellingDate && (
                          <span className="text-emerald-700 font-medium">
                            Lead Valid Till: {formatPreferredDate(req.counsellingDate)}
                          </span>
                        )}
                      </div>
                      {req.completionRemark && (
                        <p className="text-text-primary">
                          <span className="text-text-muted font-medium">Revert: </span>
                          <span className="italic">{req.completionRemark}</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-text-muted py-2">
            No college counselling requested for this lead.
          </p>
        )}
      </div>

      {/* 6. INDEPENDENT COLLEGE JOURNEYS (MOST IMPORTANT SECTION) */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
              <Building2 size={22} className="text-primary-500" /> Independent College Journeys
            </h2>
            <p className="text-xs text-text-muted mt-1">
              Each pitched college maintains its own independent application lifecycle and progress.
            </p>
          </div>
          <span className="rounded-full bg-primary-500 px-3.5 py-1 text-xs font-bold text-white shadow-2xs">
            {colleges.length} College(s)
          </span>
        </div>

        {colleges && colleges.length > 0 ? (
          <div className="space-y-6">
            {colleges.map((col: any) => {
              const isSignificant = col.isSignificant;

              return (
                <div
                  key={col.id}
                  className={`rounded-2xl border transition-all shadow-xs ${isSignificant
                    ? "border-primary-400 bg-surface ring-1 ring-primary-300/40"
                    : "border-border bg-surface"
                    }`}
                >
                  {/* College Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border p-6 bg-neutral-50/40">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-800 font-bold text-lg">
                        <Building2 size={24} />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-bold text-text-primary">{col.collegeName}</h3>
                          {isSignificant && (
                            <span className="rounded-full bg-success-500 px-2.5 py-0.5 text-[11px] font-bold text-white uppercase tracking-wider">
                              Application Done+
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-text-muted mt-0.5">
                          {[col.collegeCity, col.collegeState].filter(Boolean).join(", ")}
                        </p>
                        <div className="flex items-center gap-1.5 text-xs text-text-secondary mt-1 font-medium">
                          <User size={13} className="text-primary-500 shrink-0" />
                          <span>Pitched / Handled By: <strong className="text-text-primary font-semibold">{col.pitchedBy?.name || col.applicationDetails?.pitchedBy?.name || summary.currentOwner}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className="rounded-full px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-2xs"
                        style={{ backgroundColor: col.currentStatus?.color || "#3b82f6" }}
                      >
                        {col.currentStatus?.name}
                      </span>
                      <button
                        onClick={() => toggleCollegeHistory(col.id)}
                        className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-800 underline cursor-pointer"
                      >
                        <History size={14} /> History
                      </button>
                    </div>
                  </div>

                  {/* Independent Pipeline Progress */}
                  <div className="p-6 border-b border-border bg-neutral-50/20">
                    <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">
                      College Pipeline Progress
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      {col.pipeline.map((st: any, i: number) => (
                        <div key={st.id} className="flex items-center">
                          <div
                            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium ${st.isCurrent
                              ? "bg-primary-600 text-white font-bold shadow-xs"
                              : st.isCompleted
                                ? "bg-primary-100 text-primary-900"
                                : "bg-neutral-100 text-text-muted"
                              }`}
                          >
                            {st.isCompleted && <Check size={12} />}
                            <span>{st.name}</span>
                          </div>
                          {i < col.pipeline.length - 1 && (
                            <ChevronRight size={14} className="text-text-muted mx-1 shrink-0" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Expanded Journey Details for Significant / Application Done+ Colleges */}
                  {isSignificant ? (
                    <div className="p-6 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Application Box */}
                        <div className="rounded-xl border border-border bg-neutral-50/60 p-4 space-y-2">
                          <div className="flex items-center gap-2 text-xs font-bold text-primary-700 uppercase">
                            <FileText size={15} /> Application Info
                          </div>
                          <div className="text-xs space-y-1.5 pt-1">
                            <p>
                              <span className="text-text-muted">App ID:</span>{" "}
                              <span className="font-mono font-bold text-text-primary">
                                {col.applicationDetails?.applicationId || "N/A"}
                              </span>
                            </p>
                            <p>
                              <span className="text-text-muted">Course:</span>{" "}
                              <span className="font-semibold text-text-primary">
                                {col.applicationDetails?.coursePitched || "N/A"}
                              </span>
                            </p>
                            <p>
                              <span className="text-text-muted">Applied On:</span>{" "}
                              <span className="font-medium text-text-primary">
                                {formatDateTime(col.applicationDetails?.createdAt)}
                              </span>
                            </p>
                            <p>
                              <span className="text-text-muted">Pitched By:</span>{" "}
                              <span className="font-semibold text-primary-700">
                                {col.pitchedBy?.name || col.applicationDetails?.pitchedBy?.name || summary.currentOwner}
                              </span>
                            </p>
                          </div>
                        </div>

                        {/* Interview Box */}
                        <div className="rounded-xl border border-border bg-neutral-50/60 p-4 space-y-2">
                          <div className="flex items-center gap-2 text-xs font-bold text-primary-700 uppercase">
                            <UserCheck size={15} /> Interview Status
                          </div>
                          {col.interviews && col.interviews.length > 0 ? (
                            <div className="text-xs space-y-1.5 pt-1">
                              <p>
                                <span className="text-text-muted">Result:</span>{" "}
                                <span className="font-bold text-success-700">
                                  {col.interviews[0].result}
                                </span>
                              </p>
                              <p>
                                <span className="text-text-muted">Scheduled:</span>{" "}
                                <span className="font-medium text-text-primary">
                                  {formatDateTime(col.interviews[0].scheduledAt)}
                                </span>
                              </p>
                            </div>
                          ) : (
                            <p className="text-xs text-text-muted pt-2">No interview scheduled.</p>
                          )}
                        </div>

                        {/* Selection Letter Box */}
                        <div className="rounded-xl border border-border bg-neutral-50/60 p-4 space-y-2">
                          <div className="flex items-center gap-2 text-xs font-bold text-primary-700 uppercase">
                            <Award size={15} /> Selection Letter
                          </div>
                          {col.selection ? (
                            <div className="text-xs space-y-1.5 pt-1">
                              <p>
                                <span className="text-text-muted">Issued Date:</span>{" "}
                                <span className="font-medium text-text-primary">
                                  {formatDate(col.selection.issuedAt)}
                                </span>
                              </p>
                              <p>
                                <span className="text-text-muted">Deadline:</span>{" "}
                                <span className="font-bold text-danger-600">
                                  {formatDate(col.selection.admissionLastDate)}
                                </span>
                              </p>
                              {col.selection.letterUrl && (
                                <a
                                  href={col.selection.letterUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:underline pt-1"
                                >
                                  View Letter <ExternalLink size={12} />
                                </a>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs text-text-muted pt-2">Not issued yet.</p>
                          )}
                        </div>

                        {/* Payment Box */}
                        <div className="rounded-xl border border-border bg-neutral-50/60 p-4 space-y-2">
                          <div className="flex items-center gap-2 text-xs font-bold text-primary-700 uppercase">
                            <CreditCard size={15} /> Payment Info
                          </div>
                          {col.payments && col.payments.length > 0 ? (
                            <div className="text-xs space-y-1.5 pt-1">
                              <p>
                                <span className="text-text-muted">Amount Paid:</span>{" "}
                                <span className="font-bold text-success-700">
                                  {formatCurrency(col.payments[0].amount)}
                                </span>
                              </p>
                              <p>
                                <span className="text-text-muted">Paid Date:</span>{" "}
                                <span className="font-medium text-text-primary">
                                  {formatDate(col.payments[0].paidAt)}
                                </span>
                              </p>
                              {col.payments[0].transactionRef && (
                                <p className="font-mono text-[11px] text-text-muted">
                                  Ref: {col.payments[0].transactionRef}
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs text-text-muted pt-2">No payment recorded.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 px-6 text-xs text-text-muted flex items-center justify-between">
                      <span>Early Stage College Pitch — Detailed application boxes unlock after Application Done stage.</span>
                      {col.applicationDetails?.pitchedBy && (
                        <span>Pitched by: <strong>{col.applicationDetails.pitchedBy.name}</strong></span>
                      )}
                    </div>
                  )}

                  {/* Expandable History Drawer */}
                  {expandedCollegeHistories[col.id] && (
                    <div className="p-6 border-t border-border bg-neutral-50/70 space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary">
                        College Status Transition Log
                      </h4>
                      {col.history && col.history.length > 0 ? (
                        <div className="space-y-2">
                          {col.history.map((h: any) => (
                            <div
                              key={h.id}
                              className="flex items-center justify-between rounded-lg border border-border bg-surface p-3 text-xs"
                            >
                              <div>
                                <span className="font-semibold text-text-primary">
                                  {h.fromStatus} → {h.toStatus}
                                </span>
                                {h.remarks && <p className="text-text-muted mt-0.5">{h.remarks}</p>}
                              </div>
                              <div className="text-right text-[11px] text-text-muted">
                                <p>{formatDateTime(h.changedAt)}</p>
                                {h.changedBy && <p>By: {h.changedBy.name}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-text-muted">No transition log available.</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-text-muted">
            No college applications pitched yet.
          </div>
        )}
      </div>

      {/* 7.5 NEGATIVE COLLEGES */}
      {lead.negativeColleges && lead.negativeColleges.length > 0 && (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700/50 bg-gray-50/30 dark:bg-gray-800/20 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Building2 size={20} className="text-gray-500" /> Negative Colleges
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Colleges the lead is negative for / not interested in pursuing.
              </p>
            </div>
            <span className="rounded-full bg-gray-600 px-3 py-0.5 text-xs font-bold text-white shadow-2xs">
              {lead.negativeColleges.length} College(s)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {lead.negativeColleges.map((neg: any) => (
              <div
                key={neg.id}
                className="flex items-start gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-surface p-3.5 shadow-2xs"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-bold text-sm">
                  <Building2 size={18} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-text-primary truncate">
                    {neg.collegeName}
                  </h4>
                  <span className="inline-block mt-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-[10px] font-semibold px-2 py-0.5">
                    Not Interested
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8. PEOPLE INVOLVED */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs space-y-6">
        <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
          <User size={20} className="text-primary-500" /> People Involved in Lead Journey
        </h3>

        {people && people.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {people.map((p: any) => (
              <div key={p.id} className="flex items-start gap-4 rounded-xl border border-border bg-neutral-50/50 p-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-800 font-bold text-base">
                  {p.name?.[0] || "U"}
                </div>
                <div className="space-y-1 min-w-0">
                  <h4 className="text-sm font-bold text-text-primary truncate">{p.name}</h4>
                  <p className="text-xs font-semibold text-primary-700">{p.role}</p>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {p.actions.map((act: string, i: number) => (
                      <span key={i} className="rounded bg-neutral-200 px-2 py-0.5 text-[10px] font-medium text-text-secondary">
                        {act}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-xs text-text-muted p-4">No actors recorded.</div>
        )}
      </div>

      {/* 9. MASTER CHRONOLOGICAL TIMELINE */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <History size={20} className="text-primary-500" /> Master Chronological Timeline
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              Unified real-time activity stream from data acquisition to present.
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-1.5 rounded-lg border border-border bg-neutral-50 p-1">
            {["ALL", "DATA", "TPC", "CALLS", "COLLEGE"].map((flt) => (
              <button
                key={flt}
                onClick={() => setTimelineFilter(flt)}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition cursor-pointer ${timelineFilter === flt
                  ? "bg-primary-500 text-white shadow-2xs"
                  : "text-text-secondary hover:text-text-primary"
                  }`}
              >
                {flt}
              </button>
            ))}
          </div>
        </div>

        {filteredTimeline && filteredTimeline.length > 0 ? (
          <div className="relative pl-6 border-l-2 border-primary-200 space-y-6 my-4">
            {filteredTimeline.map((ev: any) => (
              <div key={ev.id} className="relative group">
                {/* Node Icon Circle */}
                <div className="absolute -left-[31px] top-0 flex h-7 w-7 items-center justify-center rounded-full bg-primary-500 text-white shadow-xs text-xs font-bold">
                  {ev.type.includes("CALL") ? (
                    <PhoneCall size={14} />
                  ) : ev.type.includes("COLLEGE") || ev.type.includes("INTERVIEW") ? (
                    <Building2 size={14} />
                  ) : ev.type.includes("DATA") ? (
                    <FileSpreadsheet size={14} />
                  ) : ev.type.includes("PAYMENT") ? (
                    <CreditCard size={14} />
                  ) : (
                    <Clock size={14} />
                  )}
                </div>

                <div className="rounded-xl border border-border bg-neutral-50/40 p-4 hover:border-primary-300 transition shadow-2xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-text-primary">{ev.title}</span>
                      <span className="rounded bg-primary-50 px-2 py-0.5 text-[10px] font-bold text-primary-700 uppercase">
                        {ev.type}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-text-muted">
                      {formatDateTime(ev.timestamp)}
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-text-secondary leading-relaxed">{ev.description}</p>

                  {ev.actor && (
                    <div className="mt-3 flex items-center gap-2 text-[11px] text-text-muted border-t border-border/60 pt-2">
                      <User size={12} className="text-primary-500" />
                      <span>Performed by: <strong>{ev.actor.name}</strong> ({ev.actor.role})</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-xs text-text-muted">
            No events match the selected timeline filter.
          </div>
        )}
      </div>

      {/* College Counselling Drawer */}
      {isCounsellingDrawerOpen && selectedCounsellingItem && (
        <CollegeCounsellingDrawer
          request={selectedCounsellingItem}
          student={{
            id: leadId || "",
            firstName: lead.firstName || "",
            lastName: lead.lastName,
            phone: lead.phone,
            email: lead.email,
            city: lead.city,
            state: lead.state,
            courseInterested: lead.courseInterested,
            courseInterestedOther: lead.courseInterestedOther,
          }}
          canComplete={canCompleteCounselling}
          onClose={() => {
            setIsCounsellingDrawerOpen(false);
            setSelectedCounsellingItem(null);
          }}
          onSuccess={(updated) => {
            setCounsellingRequests((prev) =>
              prev.map((item) =>
                item.id === updated.id ? { ...item, ...updated, status: "COMPLETED" } : item
              )
            );
            setSelectedCounsellingItem(null);
            setIsCounsellingDrawerOpen(false);
            refreshCounselling();
          }}
        />
      )}
    </div>
  );
}
