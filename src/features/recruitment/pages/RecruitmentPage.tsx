import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Briefcase, Building2, CalendarCheck, Clock, Mail, Pencil, Phone, Plus, UserCheck, UserPlus, Users } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
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
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "REJECTED":
      case "CANCELLED":
      case "FAILED":
        return "bg-rose-100 text-rose-700 border-rose-200";
      case "INTERVIEW_SCHEDULED":
      case "INTERVIEWED":
      case "SCHEDULED":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "SCREENING":
      case "ON_HOLD":
        return "bg-amber-100 text-amber-700 border-amber-200";
      default:
        return "bg-blue-100 text-blue-700 border-blue-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">
            Recruitment & Hiring
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Manage open job positions, candidate applications, and interview schedules.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setIsAddPositionOpen(true)}
            className="
              flex items-center gap-2 rounded-lg border border-border
              bg-surface px-4 py-2.5 text-sm font-medium text-text-primary
              transition hover:bg-neutral-100 hover:text-primary-600
            "
          >
            <Plus size={18} />
            Post New Position
          </button>

          <button
            type="button"
            onClick={() => setIsAddCandidateOpen(true)}
            className="
              flex items-center gap-2 rounded-lg border border-border
              bg-surface px-4 py-2.5 text-sm font-medium text-text-primary
              transition hover:bg-neutral-100 hover:text-primary-600
            "
          >
            <UserPlus size={18} />
            Add Candidate
          </button>

          <button
            type="button"
            onClick={() => setIsScheduleInterviewOpen(true)}
            className="
              flex items-center gap-2 rounded-lg bg-primary-500
              px-4 py-2.5 text-sm font-medium text-white
              transition hover:bg-primary-600 shadow-sm
            "
          >
            <CalendarCheck size={18} />
            Schedule Interview
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab("positions")}
          className={`
            flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition
            ${
              activeTab === "positions"
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-text-secondary hover:text-text-primary"
            }
          `}
        >
          <Briefcase size={18} />
          Job Positions ({positions.length})
        </button>

        <button
          onClick={() => setActiveTab("candidates")}
          className={`
            flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition
            ${
              activeTab === "candidates"
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-text-secondary hover:text-text-primary"
            }
          `}
        >
          <Users size={18} />
          Candidates ({candidates.length})
        </button>

        <button
          onClick={() => setActiveTab("interviews")}
          className={`
            flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition
            ${
              activeTab === "interviews"
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-text-secondary hover:text-text-primary"
            }
          `}
        >
          <CalendarCheck size={18} />
          Interviews ({interviews.length})
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
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-neutral-50">
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-text-secondary">
                    Job Position
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-text-secondary">
                    Department
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-text-secondary">
                    Vacancies
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-text-secondary">
                    Applicants
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-text-secondary">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {positions.length === 0 ? (
                  <PageEmptyState
                    isTableRow
                    colSpan={5}
                    icon={Briefcase}
                    title="No job positions posted yet"
                    message="Click 'Post New Position' to create one."
                    actionText="Post New Position"
                    onAction={() => setIsAddPositionOpen(true)}
                  />
                ) : (
                  positions.map((pos) => (
                    <tr key={pos.id} className="border-b border-border last:border-0 hover:bg-neutral-50/50">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                            <Briefcase size={20} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-text-primary">
                              {pos.title}
                            </p>
                            {pos.description && (
                              <p className="text-xs text-text-muted line-clamp-1 max-w-xs">
                                {pos.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-text-secondary">
                        {pos.department}
                      </td>
                      <td className="px-5 py-4 text-sm text-text-secondary font-medium">
                        {pos.vacancies} {pos.vacancies === 1 ? "Open Seat" : "Open Seats"}
                      </td>
                      <td className="px-5 py-4 text-sm text-text-secondary">
                        <span className="inline-flex items-center gap-1.5 font-medium text-text-primary">
                          <UserPlus size={16} className="text-primary-500" />
                          {pos._count?.candidates ?? 0} Applicants
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                            pos.isActive
                              ? "border-emerald-200 bg-emerald-100 text-emerald-700"
                              : "border-neutral-200 bg-neutral-100 text-neutral-600"
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
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-neutral-50">
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-text-secondary">
                    Candidate Name
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-text-secondary">
                    Applied Position
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-text-secondary">
                    Contact Details
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-text-secondary">
                    Experience / Company
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-text-secondary">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
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
                    <tr key={cand.id} className="border-b border-border last:border-0 hover:bg-neutral-50/50">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-600 font-semibold text-sm">
                            {cand.firstName.charAt(0)}
                            {cand.lastName ? cand.lastName.charAt(0) : ""}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-text-primary">
                              {cand.firstName} {cand.lastName || ""}
                            </p>
                            {cand.gender && (
                              <p className="text-xs text-text-muted">
                                {cand.gender}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-text-primary font-medium">
                        {cand.position ? (
                          <div>
                            <p className="text-sm text-text-primary">{cand.position.title}</p>
                            <p className="text-xs text-text-muted">{cand.position.department}</p>
                          </div>
                        ) : (
                          "Position #" + cand.positionId
                        )}
                      </td>
                      <td className="px-5 py-4 text-sm text-text-secondary space-y-0.5">
                        <div className="flex items-center gap-1.5 text-xs">
                          <Phone size={13} className="text-text-muted" />
                          <span>{cand.phone}</span>
                        </div>
                        {cand.email && (
                          <div className="flex items-center gap-1.5 text-xs text-text-muted">
                            <Mail size={13} />
                            <span>{cand.email}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4 text-sm text-text-secondary">
                        <p className="text-sm font-medium text-text-primary">
                          {cand.experience !== undefined && cand.experience !== null
                            ? `${cand.experience} yrs exp`
                            : "Fresher"}
                        </p>
                        {cand.currentCompany && (
                          <p className="text-xs text-text-muted flex items-center gap-1">
                            <Building2 size={12} />
                            {cand.currentCompany}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusBadge(
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
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-neutral-50">
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-text-secondary">
                    Candidate & Position
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-text-secondary">
                    Interviewer
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-text-secondary">
                    Scheduled Date & Time
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-text-secondary">
                    Status / Result
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-text-secondary">
                    Feedback / Notes
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase text-text-secondary">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
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
                    <tr key={item.id} className="border-b border-border last:border-0 hover:bg-neutral-50/50">

                      <td className="px-5 py-4">
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
                      <td className="px-5 py-4 text-sm text-text-primary">
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
                      <td className="px-5 py-4 text-sm text-text-secondary">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-text-primary">
                          <Clock size={14} className="text-text-muted" />
                          {new Date(item.scheduledAt).toLocaleString("en-US", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </div>
                      </td>
                      <td className="px-5 py-4 space-y-1">
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
                      <td className="px-5 py-4 text-sm text-text-secondary max-w-xs">
                        {item.feedback ? (
                          <p className="text-xs text-text-secondary line-clamp-2">{item.feedback}</p>
                        ) : (
                          <span className="text-xs text-text-muted italic">No feedback added</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setEditingInterview(item)}
                          className="
                            inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5
                            text-xs font-medium text-text-primary transition hover:border-primary-500 hover:text-primary-600
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
