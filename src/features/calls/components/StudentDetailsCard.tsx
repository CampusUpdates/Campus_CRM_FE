import { User, Phone, Mail, MapPin, FileSpreadsheet, Clock, ShieldCheck, History } from "lucide-react";
import type { MockCallQueueStudentItem } from "../../../services/mockCallService";

interface StudentDetailsCardProps {
  student: MockCallQueueStudentItem | null;
  totalAssigned: number;
  currentIndex: number;
  onOpenHistory?: () => void;
}

const StudentDetailsCard = ({
  student,
  totalAssigned,
  currentIndex,
  onOpenHistory,
}: StudentDetailsCardProps) => {
  if (!student) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs flex flex-col items-center justify-center min-h-[300px] text-center">
        <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mb-3 text-text-muted">
          <User size={24} />
        </div>
        <p className="text-sm font-semibold text-text-primary">No student record selected</p>
        <p className="text-xs text-text-muted mt-1">Select or load contacts from your assigned queue.</p>
      </div>
    );
  }

  const fullName = [student.firstName, student.middleName, student.lastName]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs space-y-5">
      {/* Header Info */}
      <div className="flex items-start justify-between border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-primary-50 px-2 py-0.5 text-[11px] font-bold text-primary-700">
              <ShieldCheck size={12} />
              Assigned Record #{currentIndex + 1} of {totalAssigned}
            </span>
          </div>
          <h2 className="text-xl font-bold text-text-primary mt-1.5">{fullName}</h2>
          <p className="text-xs text-text-muted">Assigned student prospect</p>
        </div>

        {onOpenHistory && (
          <button
            type="button"
            onClick={onOpenHistory}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3.5 py-2 text-xs font-bold text-text-primary hover:bg-neutral-100 transition shadow-2xs"
            title="View persistent call history for this contact"
          >
            <History size={15} className="text-primary-600 shrink-0" />
            <span>Call History</span>
          </button>
        )}
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div className="flex items-center gap-2.5 p-3 rounded-xl border border-border bg-neutral-50/50">
          <Phone size={16} className="text-primary-600 shrink-0" />
          <div className="overflow-hidden">
            <span className="text-[10px] uppercase font-semibold text-text-muted block">Phone Number</span>
            <span className="font-semibold text-text-primary font-mono text-xs">{student.phone}</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-3 rounded-xl border border-border bg-neutral-50/50">
          <Mail size={16} className="text-purple-600 shrink-0" />
          <div className="overflow-hidden">
            <span className="text-[10px] uppercase font-semibold text-text-muted block">Email Address</span>
            <span className="font-semibold text-text-primary truncate block">{student.email || "N/A"}</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-3 rounded-xl border border-border bg-neutral-50/50">
          <MapPin size={16} className="text-emerald-600 shrink-0" />
          <div>
            <span className="text-[10px] uppercase font-semibold text-text-muted block">Location</span>
            <span className="font-semibold text-text-primary">
              {[student.city, student.state].filter(Boolean).join(", ") || "Unspecified"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-3 rounded-xl border border-border bg-neutral-50/50">
          <FileSpreadsheet size={16} className="text-amber-600 shrink-0" />
          <div className="overflow-hidden">
            <span className="text-[10px] uppercase font-semibold text-text-muted block">Dataset File</span>
            <span className="font-semibold text-text-primary truncate block">{student.upload?.fileName || "Uploaded Dataset"}</span>
          </div>
        </div>
      </div>

      {/* Assignment Expiry & Metadata */}
      {student.assignment && (
        <div className="rounded-xl border border-amber-200/60 bg-amber-50/40 p-3 flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <Clock size={15} className="text-amber-600 shrink-0" />
            <span>Assignment Status: <strong>{student.assignment.status}</strong></span>
          </div>
          <span className="text-[11px] font-semibold text-amber-700">Permanent Window</span>
        </div>
      )}
    </div>
  );
};

export default StudentDetailsCard;
