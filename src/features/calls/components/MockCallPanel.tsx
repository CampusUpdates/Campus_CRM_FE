import { Users, Clock, Tag, CheckCircle2, Plus } from "lucide-react";
import type { MockCallQueueStudentItem } from "../../../services/mockCallService";
import StudentDetailsCard from "./StudentDetailsCard";

interface MockCallPanelProps {
  student: MockCallQueueStudentItem | null;
  onOpenDisposition: () => void;
  phonePosition?: number;
  onPhonePositionChange?: (newPos: number) => void;
  totalAssigned?: number;
  currentIndex?: number;
  refreshKey?: number;
}

export const MockCallPanel = ({
  student,
  onOpenDisposition,
  phonePosition = 1,
  onPhonePositionChange,
  totalAssigned = 0,
  currentIndex = 0,
  refreshKey = 0,
}: MockCallPanelProps) => {
  const studentFullName = student
    ? [student.firstName, student.middleName, student.lastName].filter(Boolean).join(" ")
    : "Assigned Prospect";

  const isCompleted = student?.isCompleted;

  return (
    <div className="rounded-2xl border border-border/80 bg-surface p-4 sm:p-6 shadow-2xs flex flex-col justify-between space-y-4 sm:space-y-5 w-full min-w-0">
      {/* 1. Header: Contact Details heading, subtitle, and status */}
      <div className="flex items-center justify-between border-b border-border/60 pb-3 sm:pb-4 min-w-0 gap-2">
        <div className="min-w-0">
          <h3 className="text-sm sm:text-base font-bold text-text-primary flex items-center gap-2">
            <Users size={18} className="text-primary-600 shrink-0" />
            <span className="truncate">Contact Details</span>
          </h3>
          <p className="text-xs text-text-muted mt-0.5 truncate">
            Assigned queue prospect information
          </p>
        </div>
        <div className="shrink-0">
          {isCompleted ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/70 border border-emerald-800/80 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
              <CheckCircle2 size={12} className="text-emerald-400" />
              <span>Dispositioned</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface border border-border/80 px-2.5 py-0.5 text-xs font-semibold text-text-secondary">
              <Clock size={12} className="text-text-muted" />
              <span>Pending Disposition</span>
            </span>
          )}
        </div>
      </div>

      {/* 2. Phone number and contact name at the top, prominently displayed in the center */}
      <div className="text-center pt-1 sm:pt-2 space-y-1 w-full min-w-0">
        <p className="text-2xl sm:text-3xl font-bold font-mono text-text-primary tracking-tight truncate">
          {student ? student.phone : "+91 XXXXX XXXXX"}
        </p>
        {student && (
          <div className="flex items-center justify-center gap-2 flex-wrap pt-0.5">
            <p className="text-sm sm:text-base font-semibold text-text-secondary truncate" title={studentFullName}>
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
        <div className="flex items-center justify-center gap-2 pt-0.5 flex-wrap">
          <button
            type="button"
            onClick={() => onPhonePositionChange(Math.max(1, phonePosition - 1))}
            disabled={phonePosition <= 1}
            className="px-2.5 py-1 rounded-lg border border-border/60 bg-background text-[11px] font-semibold text-text-secondary hover:text-text-primary hover:border-border transition disabled:opacity-40 cursor-pointer shadow-2xs"
          >
            Prev Phone #
          </button>
          <span className="text-xs font-mono font-bold text-primary-600 bg-background border border-border/60 px-2.5 py-1 rounded-lg">
            Attempt #{phonePosition}
          </span>
          <button
            type="button"
            onClick={() => onPhonePositionChange(phonePosition + 1)}
            className="px-2.5 py-1 rounded-lg border border-border/60 bg-background text-[11px] font-semibold text-text-secondary hover:text-text-primary hover:border-border transition disabled:opacity-40 cursor-pointer shadow-2xs"
          >
            Next Phone #
          </button>
        </div>
      )}

      {/* 4. Contact details card */}
      <StudentDetailsCard
        student={student}
        totalAssigned={totalAssigned}
        currentIndex={currentIndex}
        phonePosition={phonePosition}
        refreshKey={refreshKey}
      />

      {/* 5. Primary Action Button: Add Dispositions */}
      <div className="pt-2 w-full">
        <button
          type="button"
          onClick={onOpenDisposition}
          disabled={!student}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 sm:py-3.5 text-xs sm:text-sm transition shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <Plus size={16} />
          <span>Add Dispositions</span>
        </button>
      </div>
    </div>
  );
};

export default MockCallPanel;
