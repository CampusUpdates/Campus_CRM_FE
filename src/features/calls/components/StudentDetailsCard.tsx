import {
  Phone,
  Mail,
  MapPin,
  FileSpreadsheet,
} from "lucide-react";
import type { MockCallQueueStudentItem } from "../../../services/mockCallService";

interface StudentDetailsCardProps {
  student: MockCallQueueStudentItem | null;
}

export const StudentDetailsCard = ({ student }: StudentDetailsCardProps) => {
  if (!student) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs w-full min-w-0 pt-2 border-t border-border/60">
      {/* Phone Number */}
      <div className="flex items-center gap-2.5 p-3 rounded-xl border border-border/50 bg-background/50 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-surface border border-border/50 text-emerald-400 flex items-center justify-center shrink-0">
          <Phone size={14} />
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted block">
            Phone Number
          </span>
          <span className="font-semibold text-text-primary font-mono text-xs truncate block">
            {student.phone}
          </span>
        </div>
      </div>

      {/* Email Address */}
      <div className="flex items-center gap-2.5 p-3 rounded-xl border border-border/50 bg-background/50 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-surface border border-border/50 text-purple-400 flex items-center justify-center shrink-0">
          <Mail size={14} />
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted block">
            Email Address
          </span>
          <span
            className="font-semibold text-text-primary truncate block text-xs"
            title={student.email || "N/A"}
          >
            {student.email || "N/A"}
          </span>
        </div>
      </div>

      {/* Location */}
      <div className="flex items-center gap-2.5 p-3 rounded-xl border border-border/50 bg-background/50 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-surface border border-border/50 text-blue-400 flex items-center justify-center shrink-0">
          <MapPin size={14} />
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted block">
            Location
          </span>
          <span
            className="font-semibold text-text-primary truncate block text-xs"
            title={[student.city, student.state].filter(Boolean).join(", ") || "Unspecified"}
          >
            {[student.city, student.state].filter(Boolean).join(", ") || "Unspecified"}
          </span>
        </div>
      </div>

      {/* Dataset File */}
      <div className="flex items-center gap-2.5 p-3 rounded-xl border border-border/50 bg-background/50 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-surface border border-border/50 text-amber-400 flex items-center justify-center shrink-0">
          <FileSpreadsheet size={14} />
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted block">
            Dataset File
          </span>
          <span
            className="font-semibold text-text-primary truncate block text-xs"
            title={student.upload?.fileName || "Uploaded Dataset"}
          >
            {student.upload?.fileName || "Uploaded Dataset"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default StudentDetailsCard;
