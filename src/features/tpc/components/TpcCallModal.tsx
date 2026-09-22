import { useState, useEffect } from "react";
import {
  X,
  PhoneCall,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Loader2,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import { updateTpcAssignmentStatus, type TPCStatus } from "../../../services/tpcService";
import { createInteraction } from "../../../services/interactionService";

interface TpcCallModalProps {
  assignmentId: string;
  leadId: string;
  leadName: string;
  leadPhone?: string;
  onClose: () => void;
  onSuccess: () => void;
}

type CallStep = "CALLING" | "LOG_NOTE";
type CallResultType = "CONNECTED" | "NO_REPLY" | "NOT_INTERESTED";

const TpcCallModal = ({
  assignmentId,
  leadId,
  leadName,
  leadPhone,
  onClose,
  onSuccess,
}: TpcCallModalProps) => {
  const { accessToken } = useAuth();
  const toast = useToast();

  const [step, setStep] = useState<CallStep>("CALLING");
  const [callState, setCallState] = useState<"RINGING" | "CONNECTED" | "ENDED">("RINGING");
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);

  const [callResult, setCallResult] = useState<CallResultType>("CONNECTED");
  const [markCompleted, setMarkCompleted] = useState(true);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const handleSelectOutcome = (outcome: CallResultType) => {
    setCallResult(outcome);
  };

  // Handle simulated ringing to connected transition after 1.5s
  useEffect(() => {
    let ringingTimer: ReturnType<typeof setTimeout>;
    if (step === "CALLING" && callState === "RINGING") {
      ringingTimer = setTimeout(() => {
        setCallState("CONNECTED");
      }, 1500);
    }
    return () => clearTimeout(ringingTimer);
  }, [step, callState]);

  // Handle live call duration timer when CONNECTED
  useEffect(() => {
    let durationInterval: ReturnType<typeof setInterval>;
    if (step === "CALLING" && callState === "CONNECTED") {
      durationInterval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(durationInterval);
  }, [step, callState]);

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remainingSecs.toString().padStart(2, "0")}`;
  };

  const handleEndCall = () => {
    setCallState("ENDED");
    setStep("LOG_NOTE");
  };

  const handleClose = () => {
    setIsClosing(true);
  };

  const handleAnimationEnd = () => {
    if (isClosing) {
      onClose();
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    setLoading(true);
    try {
      let status: TPCStatus = markCompleted
        ? "COMPLETED"
        : callResult === "NO_REPLY"
          ? "NO_REPLY"
          : "NOT_INTERESTED";

      let statusLabel = callResult === "NO_REPLY" ? "No Response" : "Not Interested";

      await updateTpcAssignmentStatus(accessToken, assignmentId, status);

      const interactionDescription = notes.trim()
        ? `Result: ${statusLabel} | Duration: ${formatDuration(callDuration)}\nNotes: ${notes.trim()}`
        : `Result: ${statusLabel} | Duration: ${formatDuration(callDuration)}`;

      await createInteraction(accessToken, {
        leadId,
        title: `TPC Dummy Call (${statusLabel})`,
        description: interactionDescription,
      });

      toast.showToast(
        markCompleted
          ? "TPC marked as Completed and call logged!"
          : `Call logged as ${statusLabel}`,
        "success"
      );
      onSuccess();
    } catch (err: any) {
      toast.showToast(err.message || "Failed to save call details", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className={`
          fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300
          ${isClosing ? "opacity-0" : "opacity-100"}
        `}
      />

      {/* Drawer Panel Sliding from Right */}
      <div
        onAnimationEnd={handleAnimationEnd}
        className={`
          fixed right-0 top-0 h-[100dvh] w-full max-w-md bg-surface shadow-2xl border-l border-border flex flex-col z-50
          ${isClosing ? "animate-slide-out-right" : "animate-slide-in-right"}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4 shrink-0">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
              <PhoneCall size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-text-primary">
                {step === "CALLING" ? "Live Dummy Call" : "Log Call Details"}
              </h2>
              <p className="text-xs text-text-secondary">Lead: {leadName}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-1 text-text-muted hover:bg-neutral-100 hover:text-text-primary transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* STEP 1: LIVE SIMULATED CALL SCREEN */}
        {step === "CALLING" && (
          <div className="flex-1 flex flex-col items-center justify-between p-6 bg-gradient-to-b from-neutral-900 via-neutral-900 to-slate-900 text-white overflow-hidden">
            {/* Call Status Badge */}
            <div className="pt-4 text-center space-y-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                {callState === "RINGING" ? "Ringing..." : `Call Active • ${formatDuration(callDuration)}`}
              </span>
              <p className="text-xs text-neutral-400">Dummy Telephony Dialing...</p>
            </div>

            {/* Avatar & Lead Details */}
            <div className="flex flex-col items-center text-center space-y-4 my-auto">
              <div className="relative">
                <div className="h-28 w-28 rounded-full bg-primary-600/30 border-4 border-primary-500 flex items-center justify-center text-4xl font-bold text-white shadow-2xl animate-pulse">
                  {leadName.charAt(0).toUpperCase()}
                </div>
                {callState === "CONNECTED" && (
                  <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-2 border-2 border-neutral-900 shadow-md">
                    <PhoneCall size={16} />
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-xl font-bold text-white">{leadName}</h3>
                <p className="text-sm font-mono text-emerald-400 font-medium mt-1">
                  {leadPhone || "+91 9876543210"}
                </p>
              </div>
            </div>

            {/* In-Call Controls */}
            <div className="w-full space-y-6 pb-6">
              <div className="flex items-center justify-center gap-6">
                <button
                  type="button"
                  onClick={() => setIsMuted(!isMuted)}
                  className={`p-4 rounded-full transition-all border ${isMuted
                      ? "bg-red-500/20 border-red-500 text-red-400"
                      : "bg-neutral-800 border-neutral-700 text-neutral-200 hover:bg-neutral-700"
                    }`}
                >
                  {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
                </button>

                {/* End Call Button */}
                <button
                  type="button"
                  onClick={handleEndCall}
                  className="p-5 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-xl transform active:scale-95 transition"
                  title="End Call"
                >
                  <PhoneOff size={28} />
                </button>

                <button
                  type="button"
                  onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                  className={`p-4 rounded-full transition-all border ${isSpeakerOn
                      ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                      : "bg-neutral-800 border-neutral-700 text-neutral-200 hover:bg-neutral-700"
                    }`}
                >
                  {isSpeakerOn ? <Volume2 size={22} /> : <VolumeX size={22} />}
                </button>
              </div>

              <p className="text-center text-xs text-neutral-400">
                Click <span className="text-red-400 font-semibold">End Call</span> to record interaction feedback.
              </p>
            </div>
          </div>
        )}

        {/* STEP 2: CALL OUTCOME & LOG NOTES FORM */}
        {step === "LOG_NOTE" && (
          <form onSubmit={handleSave} className="p-4 space-y-4 overflow-y-auto flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              {/* Call Summary Card */}
              <div className="rounded-lg bg-neutral-50 p-3 border border-border flex items-center justify-between">
                <div>
                  <p className="text-xs text-text-muted">Lead: <span className="font-semibold text-text-primary">{leadName}</span></p>
                  <p className="text-xs text-text-secondary mt-0.5">Call Duration: <span className="font-mono font-semibold text-emerald-700">{formatDuration(callDuration)}</span></p>
                </div>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                  Call Ended
                </span>
              </div>

              {/* Outcome Selection */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
                  Select Call Outcome
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleSelectOutcome("NOT_INTERESTED")}
                    className={`flex items-center gap-2 p-3 rounded-lg border text-xs font-medium transition ${callResult === "NOT_INTERESTED"
                        ? "border-red-500 bg-red-50 text-red-700 ring-2 ring-red-200 font-semibold"
                        : "border-border text-text-secondary hover:bg-neutral-50"
                      }`}
                  >
                    <XCircle size={16} className="text-red-600 shrink-0" />
                    Not Interested
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectOutcome("NO_REPLY")}
                    className={`flex items-center gap-2 p-3 rounded-lg border text-xs font-medium transition ${callResult === "NO_REPLY"
                        ? "border-amber-500 bg-amber-50 text-amber-700 ring-2 ring-amber-200 font-semibold"
                        : "border-border text-text-secondary hover:bg-neutral-50"
                      }`}
                  >
                    <Clock size={16} className="text-amber-600 shrink-0" />
                    No Response
                  </button>
                </div>
              </div>

              {/* Custom Notes Input */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">
                  Custom Notes & Discussion Summary
                </label>
                <textarea
                  rows={4}
                  placeholder="Click an outcome above or type custom feedback..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="
                    w-full rounded-lg border border-border bg-background p-2.5
                    text-xs text-text-primary focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500
                  "
                />
              </div>

              {/* Mark as Completed Checkbox */}
              <div className="rounded-lg bg-emerald-50/60 p-3 border border-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    id="markCallCompleted"
                    checked={markCompleted}
                    onChange={(e) => setMarkCompleted(e.target.checked)}
                    className="h-4 w-4 rounded border-emerald-400 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <label htmlFor="markCallCompleted" className="text-xs font-semibold text-emerald-900 cursor-pointer">
                    Mark TPC as Completed
                  </label>
                </div>
                <span className="text-[11px] text-emerald-700 font-medium">
                  Moves to Completed section
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border mt-auto">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="px-4 py-2 rounded-lg border border-border text-xs font-medium text-text-secondary hover:bg-neutral-100 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="
                  inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-xs font-medium text-white
                  shadow-sm hover:bg-emerald-700 transition disabled:opacity-50
                "
              >
                {loading && <Loader2 size={14} className="animate-spin" />}
                <CheckCircle2 size={15} />
                {markCompleted ? "Save & Mark Completed" : "Save Call Log"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default TpcCallModal;
