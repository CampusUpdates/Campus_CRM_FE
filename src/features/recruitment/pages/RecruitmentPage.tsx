import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Briefcase, Building2, CalendarCheck, Clock, Mail, Pencil, Phone, Plus, RefreshCw, UserCheck, UserPlus, Users } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { Tooltip } from "../../../components/Tooltip";
import { fetchCandidates, type Candidate } from "../../../services/candidateService";
import { fetchInterviews, type Interview } from "../../../services/interviewService";
import { fetchPositions, type Position } from "../../../services/positionService";
import AddCandidateModal from "../components/AddCandidateModal";
import AddPositionModal from "../components/AddPositionModal";
import EditInterviewModal from "../components/EditInterviewModal";
import ScheduleInterviewModal from "../components/ScheduleInterviewModal";
import {
  PageLoadingState,
  PageErrorState,
  PageEmptyState,
} from "../../../components/common";

const RecruitmentPage = () => {
  const { accessToken } = useAuth();
  const [searchParams] = useSearchParams();

  const paramTab = searchParams.get("tab");
  const paramDate = searchParams.get("date");
  const paramStatus = searchParams.get("status");

  const [activeTab, setActiveTab] = useState<"positions" | "candidates" | "interviews">(
    paramTab === "interviews" || paramTab === "candidates" ? paramTab : "positions"
  );
  const [positions, setPositions] = useState<Position[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  const [isAddPositionOpen, setIsAddPositionOpen] = useState(false);
  const [isAddCandidateOpen, setIsAddCandidateOpen] = useState(false);
  const [isScheduleInterviewOpen, setIsScheduleInterviewOpen] = useState(false);
  const [editingInterview, setEditingInterview] = useState<Interview | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [posData, candData, intData] = await Promise.all([
        fetchPositions(accessToken || undefined),
        fetchCandidates(accessToken || undefined),
        fetchInterviews(accessToken || undefined),
      ]);
      setPositions(posData);
      setCandidates(candData);
      setInterviews(intData);
    } catch (err: any) {
      console.error("Failed to load recruitment data:", err);
      setError(err.message || "Failed to load recruitment data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [accessToken]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "HIRED":
      case "SELECTED":
      case "COMPLETED":
      case "PASSED":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800";
      case "REJECTED":
      case "CANCELLED":
      case "FAILED":
        return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800";
      case "INTERVIEW_SCHEDULED":
      case "INTERVIEWED":
      case "SCHEDULED":
        return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800";
      case "SCREENING":
      case "ON_HOLD":
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800";
      default:
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800";
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="border-b border-border pb-4 sm:pb-5">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-2xl font-semibold sm:font-bold text-text-primary">
              Recruitment & Hiring
            </h1>
            <p className="mt-1 text-[11px] sm:text-sm text-text-secondary leading-relaxed sm:leading-normal">
              Manage open job positions, candidate applications, and interview schedules.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 shrink-0">
            <Tooltip
              content="Refresh recruitment data"
              className="px-2.5 py-1 text-xs font-medium rounded-md shadow-lg bg-neutral-900 text-neutral-100 border border-neutral-700 whitespace-nowrap pointer-events-none"
            >
              <button
                type="button"
                onClick={loadData}
                disabled={loading}
                title="Refresh recruitment data"
                aria-label="Refresh recruitment data"
                className="inline-flex items-center justify-center h-8 sm:h-10 w-8 sm:w-10 rounded-lg border border-border bg-surface text-text-secondary hover:bg-neutral-100 dark:hover:bg-neutral-800 transition shadow-2xs shrink-0 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw size={15} className={`sm:w-[18px] sm:h-[18px] ${loading ? "animate-spin text-primary-600" : ""}`} />
              </button>
            </Tooltip>

            <button
              type="button"
              onClick={() => setIsAddPositionOpen(true)}
              className="
                inline-flex items-center gap-1.5 sm:gap-2
                rounded-lg
                border border-border
                bg-surface
                h-8 sm:h-10
                px-2.5 sm:px-3.5
                text-xs sm:text-sm font-medium
                text-text-primary
                whitespace-nowrap
                transition
                hover:bg-neutral-100
                dark:hover:bg-neutral-800
                shadow-2xs
                cursor-pointer
              "
            >
              <Plus size={15} className="sm:w-4 sm:h-4 shrink-0" />
              <span>Post Position</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAddCandidateOpen(true)}
              className="
                inline-flex items-center gap-1.5 sm:gap-2
                rounded-lg
                border border-border
                bg-surface
                h-8 sm:h-10
                px-2.5 sm:px-3.5
                text-xs sm:text-sm font-medium
                text-text-primary
                whitespace-nowrap
                transition
                hover:bg-neutral-100
                dark:hover:bg-neutral-800
                shadow-2xs
                cursor-pointer
              "
            >
              <UserPlus size={15} className="sm:w-4 sm:h-4 shrink-0" />
              <span>Add Candidate</span>
            </button>

            <button
              type="button"
              onClick={() => setIsScheduleInterviewOpen(true)}
              className="
                inline-flex items-center gap-1.5 sm:gap-2
                rounded-lg
                bg-primary-500
                h-8 sm:h-10
                px-3 sm:px-4
                text-xs sm:text-sm font-medium
                text-white
                whitespace-nowrap
                transition
                hover:bg-primary-600
                shadow-2xs
                cursor-pointer
              "
            >
              <CalendarCheck size={15} className="sm:w-4 sm:h-4 shrink-0" />
              <span>Schedule Interview</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-3 sm:flex sm:items-center border-b border-border w-full">
        <button
          type="button"
          onClick={() => setActiveTab("positions")}
          className={`
            col-span-1 sm:col-auto flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 border-b-2 px-2 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium transition cursor-pointer min-w-0 text-center
            ${
              activeTab === "positions"
                ? "border-primary-500 text-primary-600 dark:text-primary-400 font-semibold"
                : "border-transparent text-text-secondary hover:text-text-primary"
            }
          `}
        >
          <Briefcase size={15} className="shrink-0 hidden xs:inline sm:inline" />
          <span className="truncate">
            <span className="inline sm:hidden md:inline">Job </span>Positions
          </span>
          <span className="text-[11px] sm:text-xs opacity-75 shrink-0">({positions.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("candidates")}
          className={`
            col-span-1 sm:col-auto flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 border-b-2 px-2 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium transition cursor-pointer min-w-0 text-center
            ${
              activeTab === "candidates"
                ? "border-primary-500 text-primary-600 dark:text-primary-400 font-semibold"
                : "border-transparent text-text-secondary hover:text-text-primary"
            }
          `}
        >
          <Users size={15} className="shrink-0 hidden xs:inline sm:inline" />
          <span className="truncate">Candidates</span>
          <span className="text-[11px] sm:text-xs opacity-75 shrink-0">({candidates.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("interviews")}
          className={`
            col-span-1 sm:col-auto flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 border-b-2 px-2 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium transition cursor-pointer min-w-0 text-center
            ${
              activeTab === "interviews"
                ? "border-primary-500 text-primary-600 dark:text-primary-400 font-semibold"
                : "border-transparent text-text-secondary hover:text-text-primary"
            }
          `}
        >
          <CalendarCheck size={15} className="shrink-0 hidden xs:inline sm:inline" />
          <span className="truncate">Interviews</span>
          <span className="text-[11px] sm:text-xs opacity-75 shrink-0">({interviews.length})</span>
        </button>
      </div>

      {/* Tab Content */}
      {loading ? (
        <PageLoadingState message="Loading recruitment records..." />
      ) : error ? (
        <PageErrorState
          title="Failed to load recruitment data"
          message={error}
          onRetry={loadData}
        />
      ) : activeTab === "positions" ? (
        /* Job Positions Table */
        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-neutral-50/80 dark:bg-neutral-800/50 text-text-secondary font-semibold uppercase tracking-wider">
                  <th className="px-4 sm:px-5 py-3 sm:py-4">
                    Job Position
                  </th>
                  <th className="px-4 sm:px-5 py-3 sm:py-4">
                    Department
                  </th>
                  <th className="px-4 sm:px-5 py-3 sm:py-4">
                    Vacancies
                  </th>
                  <th className="px-4 sm:px-5 py-3 sm:py-4">
                    Applicants
                  </th>
                  <th className="px-4 sm:px-5 py-3 sm:py-4">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {positions.length === 0 ? (
                  <PageEmptyState
                    isTableRow
                    colSpan={5}
                    icon={Briefcase}
                    title="No job positions posted yet"
                    message="Click 'Post Position' to create one."
                    actionText="Post Position"
                    onAction={() => setIsAddPositionOpen(true)}
                  />
                ) : (
                  positions.map((pos) => (
                    <tr key={pos.id} className="transition hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                      <td className="px-4 sm:px-5 py-3.5 sm:py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50">
                            <Briefcase size={18} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-semibold text-text-primary truncate">
                              {pos.title}
                            </p>
                            {pos.description && (
                              <p className="text-[11px] text-text-muted line-clamp-1 max-w-xs mt-0.5">
                                {pos.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-5 py-3.5 sm:py-4 text-xs sm:text-sm text-text-secondary font-medium">
                        {pos.department}
                      </td>
                      <td className="px-4 sm:px-5 py-3.5 sm:py-4 text-xs sm:text-sm text-text-secondary font-medium">
                        {pos.vacancies} {pos.vacancies === 1 ? "Open Seat" : "Open Seats"}
                      </td>
                      <td className="px-4 sm:px-5 py-3.5 sm:py-4 text-xs sm:text-sm text-text-secondary">
                        <span className="inline-flex items-center gap-1.5 font-medium text-text-primary">
                          <UserPlus size={15} className="text-primary-500" />
                          {pos._count?.candidates ?? 0} Applicants
                        </span>
                      </td>
                      <td className="px-4 sm:px-5 py-3.5 sm:py-4">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] sm:text-xs font-semibold ${
                            pos.isActive
                              ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300"
                              : "border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                          }`}
                        >
                          {pos.isActive ? "OPEN" : "CLOSED"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === "candidates" ? (
        /* Candidates Table */
        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-neutral-50/80 dark:bg-neutral-800/50 text-text-secondary font-semibold uppercase tracking-wider">
                  <th className="px-4 sm:px-5 py-3 sm:py-4">
                    Candidate Name
                  </th>
                  <th className="px-4 sm:px-5 py-3 sm:py-4">
                    Applied Position
                  </th>
                  <th className="px-4 sm:px-5 py-3 sm:py-4">
                    Contact Details
                  </th>
                  <th className="px-4 sm:px-5 py-3 sm:py-4">
                    Experience / Company
                  </th>
                  <th className="px-4 sm:px-5 py-3 sm:py-4">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {candidates.length === 0 ? (
                  <PageEmptyState
                    isTableRow
                    colSpan={5}
                    icon={Users}
                    title="No candidate profiles found"
                    message="Click 'Add Candidate' to register an applicant."
                    actionText="Add Candidate"
                    onAction={() => setIsAddCandidateOpen(true)}
                  />
                ) : (
                  candidates.map((cand) => (
                    <tr key={cand.id} className="transition hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                      <td className="px-4 sm:px-5 py-3.5 sm:py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-950/80 text-primary-700 dark:text-primary-300 font-bold text-xs shrink-0">
                            {cand.firstName.charAt(0)}
                            {cand.lastName ? cand.lastName.charAt(0) : ""}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-semibold text-text-primary truncate">
                              {cand.firstName} {cand.lastName || ""}
                            </p>
                            {cand.gender && (
                              <p className="text-[11px] text-text-muted mt-0.5">
                                {cand.gender}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-5 py-3.5 sm:py-4 text-xs sm:text-sm text-text-primary font-medium">
                        {cand.position ? (
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-semibold text-text-primary truncate">{cand.position.title}</p>
                            <p className="text-[11px] text-text-muted truncate mt-0.5">{cand.position.department}</p>
                          </div>
                        ) : (
                          <span className="text-text-muted">Position #{cand.positionId}</span>
                        )}
                      </td>
                      <td className="px-4 sm:px-5 py-3.5 sm:py-4 text-xs sm:text-sm text-text-secondary space-y-0.5">
                        <div className="flex items-center gap-1.5 text-xs">
                          <Phone size={13} className="text-text-muted shrink-0" />
                          <span className="font-mono text-text-primary">{cand.phone}</span>
                        </div>
                        {cand.email && (
                          <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
                            <Mail size={12} className="shrink-0" />
                            <span className="truncate">{cand.email}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 sm:px-5 py-3.5 sm:py-4 text-xs sm:text-sm text-text-secondary">
                        <p className="font-medium text-text-primary">
                          {cand.experience !== undefined && cand.experience !== null
                            ? `${cand.experience} yrs exp`
                            : "Fresher"}
                        </p>
                        {cand.currentCompany && (
                          <p className="text-[11px] text-text-muted flex items-center gap-1 mt-0.5 truncate">
                            <Building2 size={12} className="shrink-0" />
                            <span className="truncate">{cand.currentCompany}</span>
                          </p>
                        )}
                      </td>
                      <td className="px-4 sm:px-5 py-3.5 sm:py-4">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] sm:text-xs font-semibold whitespace-nowrap ${getStatusBadge(
                            cand.status
                          )}`}
                        >
                          {cand.status.replace("_", " ")}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Interviews Table */
        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-neutral-50/80 dark:bg-neutral-800/50 text-text-secondary font-semibold uppercase tracking-wider">
                  <th className="px-4 sm:px-5 py-3 sm:py-4">
                    Candidate & Position
                  </th>
                  <th className="px-4 sm:px-5 py-3 sm:py-4">
                    Interviewer
                  </th>
                  <th className="px-4 sm:px-5 py-3 sm:py-4">
                    Scheduled Date & Time
                  </th>
                  <th className="px-4 sm:px-5 py-3 sm:py-4">
                    Status / Result
                  </th>
                  <th className="px-4 sm:px-5 py-3 sm:py-4">
                    Feedback / Notes
                  </th>
                  <th className="px-4 sm:px-5 py-3 sm:py-4 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(() => {
                  const filteredInterviews = interviews.filter((item) => {
                    if (paramDate === "today") {
                      const itemDate = new Date(item.scheduledAt).toDateString();
                      const todayDate = new Date().toDateString();
                      if (itemDate !== todayDate) return false;
                    }
                    if (paramStatus) {
                      const statusUpper = paramStatus.toUpperCase();
                      if (statusUpper === "SCHEDULED" && item.status !== "SCHEDULED") return false;
                      if (statusUpper === "COMPLETED" && item.status !== "COMPLETED") return false;
                      if (statusUpper === "PENDING" && item.result !== "PENDING") return false;
                    }
                    return true;
                  });

                  if (filteredInterviews.length === 0) {
                    return (
                      <PageEmptyState
                        isTableRow
                        colSpan={6}
                        icon={CalendarCheck}
                        title="No interview rounds found"
                        message="No interview rounds scheduled matching filters."
                        actionText="Schedule Interview"
                        onAction={() => setIsScheduleInterviewOpen(true)}
                      />
                    );
                  }

                  return filteredInterviews.map((item) => (
                    <tr key={item.id} className="transition hover:bg-neutral-50 dark:hover:bg-neutral-800/50">

                      <td className="px-4 sm:px-5 py-3.5 sm:py-4">
                        {item.candidate ? (
                          <div>
                            <p className="text-sm font-semibold text-text-primary">
                              {item.candidate.firstName} {item.candidate.lastName || ""}
                            </p>
                            <p className="text-xs text-text-muted flex items-center gap-1">
                              <Briefcase size={12} />
                              {item.candidate.position?.title || "Applicant"}
                            </p>
                          </div>
                        ) : (
                          <span className="text-sm text-text-muted">Candidate #{item.candidateId}</span>
                        )}
                      </td>
                      <td className="px-4 sm:px-5 py-3.5 sm:py-4 text-sm text-text-primary">
                        {item.interviewer ? (
                          <div className="flex items-center gap-1.5">
                            <UserCheck size={15} className="text-primary-500" />
                            <span className="font-medium">
                              {item.interviewer.firstName} {item.interviewer.lastName || ""}
                            </span>
                          </div>
                        ) : (
                          <span className="text-text-muted">Assigned Interviewer</span>
                        )}
                      </td>
                      <td className="px-4 sm:px-5 py-3.5 sm:py-4 text-sm text-text-secondary">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-text-primary">
                          <Clock size={14} className="text-text-muted" />
                          {new Date(item.scheduledAt).toLocaleString("en-US", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </div>
                      </td>
                      <td className="px-4 sm:px-5 py-3.5 sm:py-4 space-y-1">
                        <div>
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusBadge(
                              item.status
                            )}`}
                          >
                            {item.status}
                          </span>
                        </div>
                        <div>
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${getStatusBadge(
                              item.result
                            )}`}
                          >
                            Result: {item.result}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-5 py-3.5 sm:py-4 text-sm text-text-secondary max-w-xs">
                        {item.feedback ? (
                          <p className="text-xs text-text-secondary line-clamp-2">{item.feedback}</p>
                        ) : (
                          <span className="text-xs text-text-muted italic">No feedback added</span>
                        )}
                      </td>
                      <td className="px-4 sm:px-5 py-3.5 sm:py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setEditingInterview(item)}
                          className="
                            inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5
                            text-xs font-medium text-text-primary shadow-2xs transition hover:border-primary-500 hover:text-primary-600 cursor-pointer
                          "
                        >
                          <Pencil size={14} />
                          Edit
                        </button>
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>


            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {isAddPositionOpen && (
        <AddPositionModal
          onClose={() => setIsAddPositionOpen(false)}
          onSuccess={loadData}
        />
      )}

      {isAddCandidateOpen && (
        <AddCandidateModal
          onClose={() => setIsAddCandidateOpen(false)}
          onSuccess={loadData}
        />
      )}

      {isScheduleInterviewOpen && (
        <ScheduleInterviewModal
          onClose={() => setIsScheduleInterviewOpen(false)}
          onSuccess={loadData}
        />
      )}

      {editingInterview && (
        <EditInterviewModal
          interview={editingInterview}
          onClose={() => setEditingInterview(null)}
          onSuccess={loadData}
        />
      )}
    </div>
  );
};

export default RecruitmentPage;
