import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { PhoneCall, ChevronLeft, ChevronRight, RefreshCw, Users, History, Filter } from "lucide-react";

import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import {
  fetchMockCallQueue,
  initiateMockCall,
  endMockCall,
  type MockCallQueueStudentItem,
  type MockCallSession,
} from "../../../services/mockCallService";
import { fetchSuperAdminDashboardStats, type SuperAdminDashboardData } from "../../../services/superAdminDashboardService";
import StudentDetailsCard from "../components/StudentDetailsCard";
import MockCallPanel from "../components/MockCallPanel";
import CallOutcomePanel from "../components/CallOutcomePanel";
import { SuperAdminCallReportView } from "../components/SuperAdminCallReportView";

const CallWorkspace = () => {
  const { user, accessToken } = useAuth();
  const toast = useToast();

  const isSuperAdmin = user?.roleCode === "SUPER_ADMIN" || user?.roleId === 1;

  if (isSuperAdmin) {
    return <SuperAdminCallReportView />;
  }

  const [searchParams] = useSearchParams();


  const paramDate = searchParams.get("date");
  const paramTeamId = searchParams.get("teamId");
  const paramAdvisorId = searchParams.get("advisorId");

  const [activeTab, setActiveTab] = useState<"dialer" | "logs">(
    paramDate || paramTeamId || paramAdvisorId ? "logs" : "dialer"
  );

  // Dialer state
  const [queue, setQueue] = useState<MockCallQueueStudentItem[]>([]);
  const [totalAssigned, setTotalAssigned] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Call logs state
  const [dashboardData, setDashboardData] = useState<SuperAdminDashboardData | null>(null);
  const [logsLoading, setLogsLoading] = useState(false);

  // Active call session
  const [callSession, setCallSession] = useState<MockCallSession | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const currentStudent = queue[currentIndex] || null;
  const isQueueCompleted = queue.length > 0 && currentIndex >= queue.length;

  const loadQueue = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await fetchMockCallQueue(accessToken);
      setQueue(res.items || []);
      setTotalAssigned(res.totalAssigned || 0);
      setCurrentIndex(0);
      setCompletedCount(0);
      setCallSession(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to load assigned call queue.");
    } finally {
      setLoading(false);
    }
  }, [accessToken, toast]);

  const loadLogs = useCallback(async () => {
    if (!accessToken) return;
    setLogsLoading(true);
    try {
      const res = await fetchSuperAdminDashboardStats(accessToken);
      setDashboardData(res);
    } catch (err: any) {
      console.error("Failed to load call logs:", err);
    } finally {
      setLogsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (activeTab === "dialer") {
      loadQueue();
    } else {
      loadLogs();
    }
  }, [activeTab, loadQueue, loadLogs]);

  const handleInitiateCall = async () => {
    if (!accessToken || !currentStudent || actionLoading) return;
    setActionLoading(true);
    try {
      const res = await initiateMockCall(accessToken, currentStudent.studentDataId);
      setCallSession(res.session);
      toast.success(`Calling ${currentStudent.firstName} (${res.session.phoneNumber})...`);
    } catch (err: any) {
      toast.error(err.message || "Failed to initiate call.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEndCall = async () => {
    if (!accessToken || !callSession || actionLoading) return;
    setActionLoading(true);
    try {
      const endedSession = await endMockCall(accessToken, callSession.callId);
      setCallSession(endedSession);
      toast.info("Mock call disconnected.");
    } catch (err: any) {
      toast.error(err.message || "Failed to end call.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleNextContact = () => {
    if (currentIndex < queue.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setCallSession(null);
    } else {
      toast.info("You have reached the end of your assigned call queue.");
    }
  };

  const handlePreviousContact = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setCallSession(null);
    }
  };

  const handleOutcomeComplete = () => {
    setCallSession(null);
    setCompletedCount((prev) => prev + 1);
    if (currentIndex < queue.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCurrentIndex(queue.length);
      toast.success("Calling Queue Completed! You have processed all assigned student contacts.");
    }
  };

  const allCallsList = dashboardData?.callsTodayList || [];
  const filteredCallsList = allCallsList.filter((c) => {
    if (paramTeamId && paramTeamId !== "all" && c.teamId?.toString() !== paramTeamId) {
      return false;
    }
    if (paramAdvisorId && c.advisorId !== paramAdvisorId) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-8">
      {/* Workspace Top Header & Mode Toggle */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2.5">
            <PhoneCall className="text-primary-600" size={26} />
            Program Advisor Call Workspace
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Continuous calling workflow, call dispositioning, & historical persisted call log activity.
          </p>
        </div>

        {/* Tab Switcher: Live Call Dialer vs Call & Interaction Logs */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-xl border border-border bg-surface p-1 shadow-2xs">
            <button
              onClick={() => setActiveTab("dialer")}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
                activeTab === "dialer"
                  ? "bg-primary-600 text-white shadow-xs"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <PhoneCall size={14} /> Live Dialer Queue
            </button>
            <button
              onClick={() => setActiveTab("logs")}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
                activeTab === "logs"
                  ? "bg-primary-600 text-white shadow-xs"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <History size={14} /> Call Logs ({filteredCallsList.length})
            </button>
          </div>

          {activeTab === "dialer" ? (
            <button
              type="button"
              onClick={loadQueue}
              title="Refresh queue"
              className="p-2.5 rounded-xl border border-border bg-surface text-text-secondary hover:bg-neutral-100 transition shadow-2xs"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>
          ) : (
            <button
              type="button"
              onClick={loadLogs}
              title="Refresh call logs"
              className="p-2.5 rounded-xl border border-border bg-surface text-text-secondary hover:bg-neutral-100 transition shadow-2xs"
            >
              <RefreshCw size={18} className={logsLoading ? "animate-spin" : ""} />
            </button>
          )}
        </div>
      </div>

      {activeTab === "logs" ? (
        /* PERSISTED HISTORICAL CALL & INTERACTION LOGS TABLE */
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-border bg-surface shadow-2xs">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-primary-600" />
              <h3 className="text-sm font-bold text-text-primary">
                Persisted Call & Interaction Activity Logs
              </h3>
            </div>
            <div className="flex items-center gap-2 text-xs">
              {paramDate && (
                <span className="bg-blue-50 text-blue-800 border border-blue-200 px-2.5 py-1 rounded-md font-bold">
                  Date: {paramDate}
                </span>
              )}
              {paramTeamId && (
                <span className="bg-purple-50 text-purple-800 border border-purple-200 px-2.5 py-1 rounded-md font-bold">
                  Team #{paramTeamId}
                </span>
              )}
              {paramAdvisorId && (
                <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-md font-bold">
                  Advisor Filter Active
                </span>
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-2xs">
            {logsLoading ? (
              <div className="p-12 text-center text-xs text-text-muted flex items-center justify-center gap-2">
                <RefreshCw size={16} className="animate-spin text-primary-600" />
                Loading persisted call & interaction records...
              </div>
            ) : filteredCallsList.length === 0 ? (
              <div className="p-12 text-center text-xs text-text-muted">
                No persisted call records found matching applied filters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border bg-neutral-50/80 text-text-secondary font-semibold uppercase tracking-wider">
                      <th className="px-5 py-4">Student / Lead</th>
                      <th className="px-5 py-4">Phone</th>
                      <th className="px-5 py-4">Advisor</th>
                      <th className="px-5 py-4">Team</th>
                      <th className="px-5 py-4">Manager</th>
                      <th className="px-5 py-4">Call Time</th>
                      <th className="px-5 py-4">Duration</th>
                      <th className="px-5 py-4 text-right">Call Outcome / Title</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredCallsList.map((call) => (
                      <tr key={call.id} className="hover:bg-neutral-50/60 transition">
                        <td className="px-5 py-4 font-bold text-text-primary">{call.student}</td>
                        <td className="px-5 py-4 text-text-secondary font-mono">{call.phone}</td>
                        <td className="px-5 py-4 font-medium text-text-primary">{call.advisor}</td>
                        <td className="px-5 py-4 text-text-secondary">{call.team}</td>
                        <td className="px-5 py-4 text-text-secondary">{call.manager}</td>
                        <td className="px-5 py-4 text-text-muted font-mono">
                          {new Date(call.callTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="px-5 py-4 text-text-muted font-mono">{call.duration}</td>
                        <td className="px-5 py-4 text-right">
                          <span className="inline-flex rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 text-xs font-semibold">
                            {call.callOutcome}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* LIVE DIALER QUEUE WORKSPACE */
        <div>
          {loading ? (
            <div className="flex items-center justify-center p-16 text-sm text-text-secondary">
              <RefreshCw className="animate-spin mr-2" size={20} />
              Loading your assigned student call queue...
            </div>
          ) : queue.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-center bg-surface border border-border rounded-2xl">
              <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4 text-text-muted">
                <Users size={32} />
              </div>
              <h3 className="text-lg font-bold text-text-primary">No assigned contacts found</h3>
              <p className="text-sm text-text-secondary mt-1 max-w-md">
                You do not currently have active student dataset assignments. Please request dataset assignments from your Manager.
              </p>
            </div>
          ) : isQueueCompleted ? (
            <div className="flex flex-col items-center justify-center p-16 text-center bg-surface border border-emerald-200 rounded-2xl bg-emerald-50/30">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4 text-emerald-600">
                <PhoneCall size={32} />
              </div>
              <h3 className="text-xl font-bold text-emerald-900">Calling Queue Completed!</h3>
              <p className="text-sm text-emerald-700 mt-1 max-w-md">
                You have processed all assigned student dataset contacts for this session.
              </p>
              <button
                type="button"
                onClick={loadQueue}
                className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-xs"
              >
                <RefreshCw size={16} />
                Refresh Queue
              </button>
            </div>
          ) : (
            <div className="space-y-4">

              <div className="flex items-center justify-between bg-surface p-3.5 rounded-xl border border-border">
                <div className="flex items-center gap-2 text-xs font-semibold text-text-secondary">
                  <span>Completed in Session:</span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-mono font-bold">
                    {completedCount} / {queue.length}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={handlePreviousContact}
                    disabled={currentIndex === 0 || loading}
                    className="p-1.5 rounded-lg border border-border text-text-secondary hover:bg-neutral-100 transition disabled:opacity-40"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="font-mono font-bold text-text-primary px-2">
                    Contact {currentIndex + 1} of {queue.length}
                  </span>
                  <button
                    type="button"
                    onClick={handleNextContact}
                    disabled={currentIndex >= queue.length - 1 || loading}
                    className="p-1.5 rounded-lg border border-border text-text-secondary hover:bg-neutral-100 transition disabled:opacity-40"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column: Student Details + Outcome Panel */}
                <div className="lg:col-span-7 space-y-6">
                  <StudentDetailsCard
                    student={currentStudent}
                    totalAssigned={totalAssigned}
                    currentIndex={currentIndex}
                  />

                  <CallOutcomePanel
                    student={currentStudent}
                    callSession={callSession}
                    onOutcomeComplete={handleOutcomeComplete}
                  />
                </div>

                {/* Right Column: Mock Dialer Console */}
                <div className="lg:col-span-5">
                  <MockCallPanel
                    student={currentStudent}
                    callSession={callSession}
                    onInitiateCall={handleInitiateCall}
                    onEndCall={handleEndCall}
                    loading={actionLoading}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CallWorkspace;

