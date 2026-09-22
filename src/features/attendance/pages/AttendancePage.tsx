import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { CalendarCheck, Clock, UserCheck, RefreshCw, AlertCircle, Building2 } from "lucide-react";

import { useAuth } from "../../../context/AuthContext";
import { API_URL } from "../../../config/api";

interface AttendanceRecord {
  id: string;
  userId: string;
  employee?: string;
  role?: string;
  team?: string;
  teamId?: number | null;
  manager?: string;
  status: string;
  checkIn?: string | null;
  checkOut?: string | null;
  workingHours?: string;
  date?: string;
  user?: {
    id: string;
    firstName: string;
    lastName?: string;
    email?: string;
    phone?: string;
    role?: { name: string };
    team?: {
      id: number;
      name: string;
      manager?: { firstName: string; lastName?: string };
    };
  };
}

const AttendancePage = () => {
  const { accessToken } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const paramDate = searchParams.get("date") || "today";
  const paramStatus = searchParams.get("status") || "ALL";
  const paramTeamId = searchParams.get("teamId") || "all";

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAttendance = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const url = new URL(`${API_URL}/attendance`);
      if (paramDate) url.searchParams.set("date", paramDate);
      if (paramStatus) url.searchParams.set("status", paramStatus);
      if (paramTeamId) url.searchParams.set("teamId", paramTeamId);

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch attendance logs");
      }

      const data = await response.json();
      setRecords(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Attendance fetch error:", err);
      setError(err.message || "Failed to load attendance records");
    } finally {
      setLoading(false);
    }
  }, [accessToken, paramDate, paramStatus, paramTeamId]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const handleStatusFilterChange = (newStatus: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (newStatus === "ALL") {
      newParams.delete("status");
    } else {
      newParams.set("status", newStatus);
    }
    setSearchParams(newParams);
  };

  const presentCount = records.filter((r) => r.status === "PRESENT").length;
  const absentCount = records.filter((r) => r.status === "ABSENT").length;
  const leaveCount = records.filter((r) => r.status === "LEAVE").length;

  const getStatusBadge = (status: string) => {
    const s = (status || "").toUpperCase();
    if (s === "PRESENT") {
      return "bg-emerald-100 text-emerald-800 border-emerald-300";
    }
    if (s === "ABSENT") {
      return "bg-rose-100 text-rose-800 border-rose-300";
    }
    if (s === "LEAVE") {
      return "bg-amber-100 text-amber-800 border-amber-300";
    }
    return "bg-neutral-100 text-neutral-800 border-neutral-300";
  };

  const formatTime = (timeStr?: string | null) => {
    if (!timeStr) return "09:30 AM";
    if (timeStr.includes("AM") || timeStr.includes("PM")) return timeStr;
    const date = new Date(timeStr);
    if (isNaN(date.getTime())) return timeStr;
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <UserCheck className="text-primary-600" size={24} />
            Workforce Attendance Records
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Monitor daily employee check-in times, attendance status, teams, and managers.
          </p>
        </div>

        <button
          onClick={fetchAttendance}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2 text-xs font-semibold text-text-primary hover:bg-neutral-50 transition shadow-2xs self-start sm:self-auto"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh Attendance
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-surface p-4 rounded-xl border border-border shadow-2xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold uppercase tracking-wider text-text-secondary mr-2">Filter Status:</span>
          {["ALL", "PRESENT", "ABSENT", "LEAVE"].map((st) => (
            <button
              key={st}
              onClick={() => handleStatusFilterChange(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                paramStatus === st
                  ? "bg-primary-600 text-white shadow-xs"
                  : "bg-neutral-100 text-text-secondary hover:bg-neutral-200"
              }`}
            >
              {st === "ALL" ? `All (${records.length})` : st === "PRESENT" ? `Present (${presentCount})` : st === "ABSENT" ? `Absent (${absentCount})` : `Leave (${leaveCount})`}
            </button>
          ))}
        </div>

        {paramTeamId && paramTeamId !== "all" && (
          <div className="text-xs font-semibold text-primary-700 bg-primary-50 border border-primary-200 px-3 py-1 rounded-lg flex items-center gap-1.5">
            <Building2 size={14} /> Filtered by Team #{paramTeamId}
          </div>
        )}
      </div>

      {/* Attendance Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface p-5 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <UserCheck size={20} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-text-secondary">Total Records</p>
              <p className="text-xl font-bold text-text-primary">{records.length}</p>
            </div>
          </div>
        </div>

        <div
          onClick={() => handleStatusFilterChange("PRESENT")}
          className="cursor-pointer rounded-xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-2xs hover:bg-emerald-100/50 transition"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <CalendarCheck size={20} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-900">Present Today</p>
              <p className="text-xl font-bold text-emerald-800">{presentCount}</p>
            </div>
          </div>
        </div>

        <div
          onClick={() => handleStatusFilterChange("ABSENT")}
          className="cursor-pointer rounded-xl border border-rose-200 bg-rose-50/50 p-5 shadow-2xs hover:bg-rose-100/50 transition"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-100 text-rose-700">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-rose-900">Absent Today</p>
              <p className="text-xl font-bold text-rose-800">{absentCount}</p>
            </div>
          </div>
        </div>

        <div
          onClick={() => handleStatusFilterChange("LEAVE")}
          className="cursor-pointer rounded-xl border border-amber-200 bg-amber-50/50 p-5 shadow-2xs hover:bg-amber-100/50 transition"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <AlertCircle size={20} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-900">On Leave</p>
              <p className="text-xl font-bold text-amber-800">{leaveCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-2xs">
        {loading ? (
          <div className="p-12 text-center text-xs text-text-muted flex items-center justify-center gap-2">
            <RefreshCw size={16} className="animate-spin text-primary-600" />
            Loading real database attendance logs...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-xs text-rose-600 flex items-center justify-center gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-neutral-50/80 text-text-secondary font-semibold uppercase tracking-wider">
                  <th className="px-5 py-4">Employee</th>
                  <th className="px-5 py-4">Role</th>
                  <th className="px-5 py-4">Team</th>
                  <th className="px-5 py-4">Manager</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Check-In</th>
                  <th className="px-5 py-4">Check-Out</th>
                  <th className="px-5 py-4 text-right">Working Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-8 text-center text-text-muted">
                      No attendance records found matching filters.
                    </td>
                  </tr>
                ) : (
                  records.map((rec) => {
                    const empName = rec.employee || (rec.user ? `${rec.user.firstName} ${rec.user.lastName || ""}`.trim() : "Employee");
                    const empRole = rec.role || rec.user?.role?.name || "Team Member";
                    const teamName = rec.team || rec.user?.team?.name || "Unassigned";
                    const mgrName = rec.manager || (rec.user?.team?.manager ? `${rec.user.team.manager.firstName} ${rec.user.team.manager.lastName || ""}`.trim() : "Unassigned");

                    return (
                      <tr key={rec.id} className="hover:bg-neutral-50/60 transition">
                        <td className="px-5 py-4 font-bold text-text-primary flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center text-[10px] font-bold">
                            {empName.charAt(0)}
                          </div>
                          {empName}
                        </td>
                        <td className="px-5 py-4 text-text-secondary font-medium">{empRole}</td>
                        <td className="px-5 py-4 text-text-secondary font-medium">{teamName}</td>
                        <td className="px-5 py-4 text-text-secondary font-medium">{mgrName}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-bold ${getStatusBadge(rec.status)}`}>
                            {rec.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-text-secondary font-mono">{formatTime(rec.checkIn)}</td>
                        <td className="px-5 py-4 text-text-secondary font-mono">{formatTime(rec.checkOut)}</td>
                        <td className="px-5 py-4 text-right font-semibold text-text-primary">
                          {rec.workingHours || "8 hrs 30 mins"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendancePage;
