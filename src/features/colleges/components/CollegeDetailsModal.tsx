import { useState } from "react";
import { X, Building2, MapPin, Phone, Mail, Globe, UserCheck, GraduationCap, CheckCircle2, Trash2, Pencil } from "lucide-react";
import { type College } from "../../../services/collegeService";
import CollegeDescription from "./CollegeDescription";

type CollegeDetailsModalProps = {
  college: College;
  onClose: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
};

const CollegeDetailsModal = ({ college, onClose, onDelete, onEdit }: CollegeDetailsModalProps) => {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
  };

  const handleAnimationEnd = () => {
    if (isClosing) {
      onClose();
    }
  };

  const location = [college.city, college.state].filter(Boolean).join(", ");

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className={`
          fixed inset-0
          bg-black/50
          transition-opacity duration-300
          ${isClosing ? "opacity-0" : "opacity-100"}
        `}
      />

      {/* Drawer */}
      <div
        onAnimationEnd={handleAnimationEnd}
        className={`
          fixed right-0 top-0
          h-[100dvh]
          w-full sm:w-[480px] md:w-[560px] lg:w-[640px] xl:w-[40vw]
          max-w-full
          bg-surface
          shadow-2xl
          flex flex-col
          ${isClosing ? "animate-slide-out" : "animate-slide-in"}
        `}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-4 sm:px-6 py-3.5 sm:py-5 gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 shrink-0">
              <Building2 size={20} className="sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-xl font-semibold text-text-primary truncate">
                {college.name}
              </h2>
              {location && (
                <p className="mt-0.5 text-[11px] sm:text-xs text-text-muted flex items-center gap-1 truncate">
                  <MapPin size={12} className="text-primary-500 shrink-0" />
                  <span className="truncate">{location}</span>
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="
              rounded-lg
              p-1.5 sm:p-2
              text-text-secondary
              transition
              hover:bg-neutral-100
              dark:hover:bg-neutral-800
              hover:text-text-primary
              shrink-0
              cursor-pointer
            "
          >
            <X size={18} className="sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Read-Only College Content */}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
          {/* Status Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`rounded-full px-2.5 sm:px-3 py-0.5 sm:py-1 text-[11px] sm:text-xs font-semibold ${college.isActive !== false
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
                  : "bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800"
                }`}
            >
              {college.isActive !== false ? "Active Partner" : "Inactive"}
            </span>

            {college.hasTieUp && (
              <span className="rounded-full bg-primary-50 text-primary-700 border border-primary-200 dark:bg-primary-950/50 dark:text-primary-300 dark:border-primary-800 px-2.5 sm:px-3 py-0.5 sm:py-1 text-[11px] sm:text-xs font-semibold flex items-center gap-1">
                <CheckCircle2 size={13} />
                Official University Tie-Up
              </span>
            )}
          </div>

          {/* Overview */}
          <section className="space-y-2">
            <h3 className="text-xs sm:text-sm font-semibold text-text-primary uppercase tracking-wider">
              Institution Description
            </h3>
            <CollegeDescription description={college.description} />
          </section>

          {/* Contact Information */}
          <section className="space-y-2.5 sm:space-y-3">
            <h3 className="text-xs sm:text-sm font-semibold text-text-primary uppercase tracking-wider">
              Contact & Representative Info
            </h3>

            <div className="grid grid-cols-1 gap-2.5 sm:gap-3 rounded-xl border border-border bg-surface p-3 sm:p-4">
              <div className="flex items-center gap-2.5 sm:gap-3 text-xs sm:text-sm text-text-primary">
                <UserCheck size={16} className="text-primary-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] sm:text-xs text-text-muted">Contact Person</p>
                  <p className="font-medium truncate">{college.contactPerson || "N/A"}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 sm:gap-3 text-xs sm:text-sm text-text-primary border-t border-border/50 pt-2.5 sm:pt-3">
                <Phone size={16} className="text-primary-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] sm:text-xs text-text-muted">Phone</p>
                  <p className="font-medium truncate">{college.phone || "N/A"}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 sm:gap-3 text-xs sm:text-sm text-text-primary border-t border-border/50 pt-2.5 sm:pt-3">
                <Mail size={16} className="text-primary-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] sm:text-xs text-text-muted">Email</p>
                  <p className="font-medium truncate">{college.email || "N/A"}</p>
                </div>
              </div>

              {college.website && (
                <div className="flex items-center gap-2.5 sm:gap-3 text-xs sm:text-sm text-text-primary border-t border-border/50 pt-2.5 sm:pt-3">
                  <Globe size={16} className="text-primary-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] sm:text-xs text-text-muted">Website</p>
                    <a
                      href={college.website.startsWith("http") ? college.website : `https://${college.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary-600 hover:underline break-all"
                    >
                      {college.website}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Admission Process */}
          <section className="space-y-2">
            <h3 className="text-xs sm:text-sm font-semibold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <GraduationCap size={15} className="text-primary-600 shrink-0" />
              <span>Admission Guidelines & Pitch Notes</span>
            </h3>
            <div className="rounded-xl border border-border bg-neutral-50/60 dark:bg-neutral-800/40 p-3 sm:p-4 text-xs sm:text-sm text-text-secondary leading-relaxed">
              {college.admissionProcess || "No specific admission guidelines provided for this college."}
            </div>
          </section>
        </div>

        {/* Footer Actions */}
        <div className="shrink-0 flex items-center justify-end gap-2.5 border-t border-border bg-surface px-4 sm:px-6 py-3 sm:py-3.5">
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="
                inline-flex items-center justify-center gap-1.5
                h-[38px]
                px-3.5
                rounded-lg
                border border-rose-200 dark:border-rose-900/60
                bg-rose-50 dark:bg-rose-950/40
                text-xs font-semibold
                text-rose-700 dark:text-rose-300
                hover:bg-rose-100 dark:hover:bg-rose-900/50
                hover:border-rose-300 dark:hover:border-rose-800
                transition
                shadow-2xs
                whitespace-nowrap
                cursor-pointer
                shrink-0
              "
            >
              <Trash2 size={15} className="shrink-0 text-rose-600 dark:text-rose-400" />
              <span>Remove College</span>
            </button>
          )}

          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="
                inline-flex items-center justify-center gap-1.5
                h-[38px]
                px-3.5
                rounded-lg
                border border-emerald-200 dark:border-emerald-900/60
                bg-emerald-50 dark:bg-emerald-950/40
                text-xs font-semibold
                text-emerald-700 dark:text-emerald-300
                hover:bg-emerald-100 dark:hover:bg-emerald-900/50
                hover:border-emerald-300 dark:hover:border-emerald-800
                transition
                shadow-2xs
                whitespace-nowrap
                cursor-pointer
                shrink-0
              "
            >
              <Pencil size={15} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>Edit College</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleClose}
            className="
              inline-flex items-center justify-center gap-1.5
              h-[38px]
              px-3.5
              rounded-lg
              border border-border
              bg-surface
              text-xs font-semibold
              text-text-secondary
              hover:text-text-primary
              hover:bg-neutral-100 dark:hover:bg-neutral-800
              hover:border-neutral-300 dark:hover:border-neutral-700
              transition
              shadow-2xs
              whitespace-nowrap
              cursor-pointer
              shrink-0
            "
          >
            <X size={15} className="shrink-0 text-text-muted" />
            <span>Close</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CollegeDetailsModal;

