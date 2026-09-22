import { useEffect, useState } from "react";
import { PhoneCall, PhoneOff, Clock, ShieldAlert } from "lucide-react";
import type { MockCallSession, MockCallQueueStudentItem } from "../../../services/mockCallService";

interface MockCallPanelProps {
  student: MockCallQueueStudentItem | null;
  callSession: MockCallSession | null;
  onInitiateCall: () => void;
  onEndCall: () => void;
  loading: boolean;
}

const formatTimer = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

const MockCallPanel = ({
  student,
  callSession,
  onInitiateCall,
  onEndCall,
  loading,
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
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 border border-blue-300 px-3 py-1 text-xs font-semibold text-blue-800 animate-pulse">
            <PhoneCall size={13} className="animate-bounce" />
            Ringing / Calling...
          </span>
        );
      case "CONNECTED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 border border-emerald-300 px-3 py-1 text-xs font-semibold text-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
            Active Call Connected
          </span>
        );
      case "ENDED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 border border-neutral-300 px-3 py-1 text-xs font-semibold text-neutral-800">
            <PhoneOff size={13} />
            Call Disconnected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700">
            Ready to Call
          </span>
        );
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs flex flex-col justify-between space-y-6">
      {/* Top Banner */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
            <PhoneCall size={18} className="text-primary-600" />
            Telephony Console
          </h3>
          <p className="text-xs text-text-muted">Simulated advisor dialing environment</p>
        </div>
        {getStatusBadge()}
      </div>

      {/* Main Dialer Screen */}
      <div className="flex flex-col items-center justify-center py-6 space-y-4">
        <div className="w-20 h-20 rounded-full bg-primary-50 border-4 border-primary-100 flex items-center justify-center text-primary-600 shadow-inner">
          <PhoneCall size={34} className={status === "CONNECTED" ? "animate-pulse" : ""} />
        </div>

        <div className="text-center space-y-1">
          <p className="text-xs font-semibold uppercase text-text-muted tracking-wider">Destination Number</p>
          <p className="text-2xl font-bold font-mono text-text-primary">
            {student ? student.phone : "+91 XXXXX XXXXX"}
          </p>
          {student && (
            <p className="text-xs text-text-secondary">
              {student.firstName} {student.lastName || ""}
            </p>
          )}
        </div>

        {/* Live Call Duration */}
        {(status === "CONNECTED" || status === "ENDED") && (
          <div className="flex items-center gap-2 rounded-xl bg-neutral-100 px-4 py-2 text-sm font-mono font-bold text-text-primary border border-border">
            <Clock size={16} className="text-primary-600" />
            <span>{formatTimer(status === "ENDED" ? (callSession?.durationSeconds || duration) : duration)}</span>
          </div>
        )}
      </div>

      {/* Control Buttons */}
      <div className="border-t border-border pt-4">
        {status === "READY" || status === "ENDED" ? (
          <button
            type="button"
            onClick={onInitiateCall}
            disabled={!student || loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 text-sm transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PhoneCall size={18} />
            Start Call
          </button>
        ) : (
          <button
            type="button"
            onClick={onEndCall}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold py-3 text-sm transition shadow-sm disabled:opacity-50"
          >
            <PhoneOff size={18} />
            End Call
          </button>
        )}
      </div>

      <div className="text-[11px] text-text-muted text-center flex items-center justify-center gap-1">
        <ShieldAlert size={12} className="text-amber-500" />
        <span>Mock Telephony Provider active (Development Mode)</span>
      </div>
    </div>
  );
};

export default MockCallPanel;
