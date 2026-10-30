import { useEffect, useState } from "react";
import { PhoneCall, PhoneOff, Clock, ShieldAlert, Tag } from "lucide-react";
import type { MockCallSession, MockCallQueueStudentItem } from "../../../services/mockCallService";
import StudentDetailsCard from "./StudentDetailsCard";

interface MockCallPanelProps {
  student: MockCallQueueStudentItem | null;
  callSession: MockCallSession | null;
  onInitiateCall: () => void;
  onEndCall: () => void;
  loading: boolean;
  phonePosition?: number;
  onPhonePositionChange?: (newPos: number) => void;
  totalAssigned?: number;
  currentIndex?: number;
}

const formatTimer = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

export const MockCallPanel = ({
  student,
  callSession,
  onInitiateCall,
  onEndCall,
  loading,
  phonePosition = 1,
  onPhonePositionChange,
}: MockCallPanelProps) => {
  const [duration, setDuration] = useState(0);

  const status = callSession?.status || "READY";

  useEffect(() => {
    let interval: any = null;
    if (status === "CONNECTED") {
      interval = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else if (status === "READY" || status === "CALLING") {
      setDuration(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status]);

  const getStatusBadge = () => {
    switch (status) {
      case "CALLING":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-950/70 border border-blue-800 px-3 py-1 text-xs font-semibold text-blue-300 animate-pulse">
            <PhoneCall size={12} className="animate-bounce" />
            <span>Ringing / Calling...</span>
          </span>
        );
      case "CONNECTED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/80 border border-emerald-700 px-3 py-1 text-xs font-semibold text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Active Call Connected</span>
          </span>
        );
      case "ENDED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900/80 border border-slate-700/80 px-3 py-1 text-xs font-semibold text-slate-300">
            <PhoneOff size={12} />
            <span>Call Disconnected</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/70 border border-emerald-800/80 px-3 py-1 text-xs font-semibold text-emerald-300">
            <span>Ready to Call</span>
          </span>
        );
    }
  };

  const studentFullName = student
    ? [student.firstName, student.middleName, student.lastName].filter(Boolean).join(" ")
    : "Assigned Prospect";

  return (
    <div className="rounded-2xl border border-border/80 bg-surface p-6 shadow-xs flex flex-col justify-between space-y-5 w-full min-w-0">
      {/* 1. Telephony Console heading, subtitle, and current call status */}
      <div className="flex items-center justify-between border-b border-border/60 pb-4 min-w-0">
        <div className="min-w-0">
          <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
            <PhoneCall size={18} className="text-emerald-500 shrink-0" />
            <span className="truncate">Telephony Console</span>
          </h3>
          <p className="text-xs text-text-muted mt-0.5 truncate">
            Simulated advisor dialing environment
          </p>
        </div>
        <div className="shrink-0">{getStatusBadge()}</div>
      </div>

      {/* 2. Phone number and contact name at the top, prominently displayed in the center */}
      <div className="text-center pt-2 space-y-1 w-full min-w-0">
        <p className="text-3xl font-bold font-mono text-white tracking-tight truncate">
          {student ? student.phone : "+91 XXXXX XXXXX"}
        </p>
        {student && (
          <div className="flex items-center justify-center gap-2 flex-wrap pt-0.5">
            <p className="text-base font-semibold text-text-secondary truncate" title={studentFullName}>
              {studentFullName}
            </p>
            {student.category && (
              <span className="inline-flex items-center gap-1 rounded-md bg-indigo-950/70 border border-indigo-800/80 px-2 py-0.5 text-[10px] font-bold text-indigo-300">
                <Tag size={10} className="shrink-0" />
                <span>{student.category.name}</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* 3. Phone attempt indicator and Previous/Next Phone controls */}
      {student && onPhonePositionChange && (
        <div className="flex items-center justify-center gap-2 pt-0.5">
          <button
            type="button"
            onClick={() => onPhonePositionChange(Math.max(1, phonePosition - 1))}
            disabled={phonePosition <= 1 || status === "CONNECTED"}
            className="px-2.5 py-1 rounded-lg border border-border/60 bg-background text-[11px] font-semibold text-text-secondary hover:text-text-primary hover:border-border transition disabled:opacity-40 cursor-pointer shadow-2xs"
          >
            Prev Phone #
          </button>
          <span className="text-xs font-mono font-bold text-emerald-400 bg-background border border-border/60 px-2.5 py-1 rounded-lg">
            Attempt #{phonePosition}
          </span>
          <button
            type="button"
            onClick={() => onPhonePositionChange(phonePosition + 1)}
            disabled={status === "CONNECTED"}
            className="px-2.5 py-1 rounded-lg border border-border/60 bg-background text-[11px] font-semibold text-text-secondary hover:text-text-primary hover:border-border transition disabled:opacity-40 cursor-pointer shadow-2xs"
          >
            Next Phone #
          </button>
        </div>
      )}

      {/* 4. Call timer */}
      {(status === "CONNECTED" || status === "ENDED") && (
        <div className="flex items-center justify-center pt-0.5">
          <div className="flex items-center gap-2 rounded-lg bg-background border border-border/60 px-4 py-1.5 text-xs font-mono font-bold text-text-primary shadow-2xs">
            <Clock size={14} className="text-emerald-400" />
            <span>{formatTimer(status === "ENDED" ? (callSession?.durationSeconds || duration) : duration)}</span>
          </div>
        </div>
      )}

      {/* 5. Contact details in a compact two-column layout */}
      <StudentDetailsCard student={student} />

      {/* 6. Full-width green Start Call button */}
      <div className="pt-2 w-full">
        {status === "READY" || status === "ENDED" ? (
          <button
            type="button"
            onClick={onInitiateCall}
            disabled={!student || loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 text-sm transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <PhoneCall size={18} />
            <span>Start Call</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onEndCall}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold py-3.5 text-sm transition shadow-sm disabled:opacity-50 cursor-pointer"
          >
            <PhoneOff size={18} />
            <span>End Call</span>
          </button>
        )}
      </div>

      {/* 7. Existing mock telephony/development-mode indicator */}
      <div className="text-[11px] text-text-muted text-center flex items-center justify-center gap-1.5 pt-0.5">
        <ShieldAlert size={12} className="text-amber-400" />
        <span>Mock Telephony Provider active (Development Mode)</span>
      </div>
    </div>
  );
};

export default MockCallPanel;
