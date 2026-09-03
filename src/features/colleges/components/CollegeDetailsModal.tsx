import { useState } from "react";
import { X, Building2, MapPin, Phone, Mail, Globe, UserCheck, GraduationCap, CheckCircle2, Trash2, Edit3 } from "lucide-react";
import { type College } from "../../../services/collegeService";

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
          w-[40vw]
          min-w-[420px]
          bg-surface
          shadow-2xl
          flex flex-col
          ${isClosing ? "animate-slide-out" : "animate-slide-in"}
        `}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600 shrink-0">
              <Building2 size={24} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-text-primary">
                {college.name}
              </h2>
              {location && (
                <p className="mt-0.5 text-xs text-text-muted flex items-center gap-1">
                  <MapPin size={13} className="text-primary-500" />
                  {location}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="
              rounded-lg
              p-2
              text-text-secondary
              transition
              hover:bg-neutral-100
              hover:text-text-primary
            "
          >
            <X size={20} />
          </button>
        </div>

        {/* Read-Only College Content */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Status Badges */}
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                college.isActive !== false
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                  : "bg-amber-100 text-amber-800 border border-amber-200"
              }`}
            >
              {college.isActive !== false ? "Active Partner" : "Inactive"}
            </span>

            {college.hasTieUp && (
              <span className="rounded-full bg-primary-50 text-primary-700 border border-primary-200 px-3 py-1 text-xs font-semibold flex items-center gap-1">
                <CheckCircle2 size={13} />
                Official University Tie-Up
              </span>
            )}
          </div>

          {/* Overview */}
          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider text-xs">
              Institution Description
            </h3>
            <div className="rounded-xl border border-border bg-neutral-50/60 p-4 text-sm text-text-secondary leading-relaxed">
              {college.description || "No description provided."}
            </div>
          </section>

          {/* Contact Information */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider text-xs">
              Contact & Representative Info
            </h3>

            <div className="grid grid-cols-1 gap-3 rounded-xl border border-border bg-surface p-4">
              <div className="flex items-center gap-3 text-sm text-text-primary">
                <UserCheck size={18} className="text-primary-600 shrink-0" />
                <div>
                  <p className="text-xs text-text-muted">Contact Person</p>
                  <p className="font-medium">{college.contactPerson || "N/A"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm text-text-primary border-t border-border/50 pt-3">
                <Phone size={18} className="text-primary-600 shrink-0" />
                <div>
                  <p className="text-xs text-text-muted">Phone</p>
                  <p className="font-medium">{college.phone || "N/A"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm text-text-primary border-t border-border/50 pt-3">
                <Mail size={18} className="text-primary-600 shrink-0" />
                <div>
                  <p className="text-xs text-text-muted">Email</p>
                  <p className="font-medium">{college.email || "N/A"}</p>
                </div>
              </div>

              {college.website && (
                <div className="flex items-center gap-3 text-sm text-text-primary border-t border-border/50 pt-3">
                  <Globe size={18} className="text-primary-600 shrink-0" />
                  <div>
                    <p className="text-xs text-text-muted">Website</p>
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
            <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider text-xs flex items-center gap-1.5">
              <GraduationCap size={16} className="text-primary-600" />
              Admission Guidelines & Pitch Notes
            </h3>
            <div className="rounded-xl border border-border bg-neutral-50/60 p-4 text-sm text-text-secondary leading-relaxed">
              {college.admissionProcess || "No specific admission guidelines provided for this college."}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-6 py-4">
          <div className="flex items-center gap-2">
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100 transition flex items-center gap-1.5"
              >
                <Trash2 size={16} />
                Remove College
              </button>
            )}
            {onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="rounded-lg border border-primary-200 bg-primary-50 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-100 transition flex items-center gap-1.5"
              >
                <Edit3 size={16} />
                Edit College
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-border bg-surface px-5 py-2 text-sm font-medium text-text-primary hover:bg-neutral-100 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CollegeDetailsModal;

