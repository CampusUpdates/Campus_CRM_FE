import React from "react";
import { X, User, Building, Phone, Mail, MapPin, Calendar, Share2, Users } from "lucide-react";
import type { RecentAdmissionRecord } from "../../../services/admissionsDashboardService";

interface AdmissionDetailsDrawerProps {
  admission: RecentAdmissionRecord | null;
  onClose: () => void;
}

export const AdmissionDetailsDrawer: React.FC<AdmissionDetailsDrawerProps> = ({
  admission,
  onClose,
}) => {
  if (!admission) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-4 sm:pl-10">
        <div className="pointer-events-auto w-screen max-w-md bg-surface border-l border-border shadow-2xl transition-all">
          <div className="flex h-full flex-col divide-y divide-border">
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-6 py-5 bg-background/50">
              <div className="flex items-center gap-2">
                <User size={20} className="text-primary-500" />
                <div>
                  <h2 className="text-lg font-bold text-text-primary">Admission Details</h2>
                  <p className="text-xs text-text-muted">Student & Admission Profile</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-text-muted hover:bg-surface-hover hover:text-text-primary transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Status Badge */}
              <div className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                <div>
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Status</span>
                  <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                    {admission.statusName}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-text-muted">Admission Date</span>
                  <div className="text-xs font-semibold text-text-primary">
                    {new Date(admission.admissionDate).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                </div>
              </div>

              {/* Student Information */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                  <User size={14} className="text-primary-500" /> Student Profile
                </h3>
                <div className="rounded-xl border border-border bg-background/50 p-4 space-y-3">
                  <div>
                    <span className="text-[11px] text-text-muted">Full Name</span>
                    <p className="text-sm font-bold text-text-primary">{admission.studentName}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-1 border-t border-border/40">
                    <div>
                      <span className="text-[11px] text-text-muted flex items-center gap-1">
                        <Phone size={12} /> Phone
                      </span>
                      <p className="text-xs font-medium text-text-primary">{admission.phone}</p>
                    </div>
                    <div>
                      <span className="text-[11px] text-text-muted flex items-center gap-1">
                        <Mail size={12} /> Email
                      </span>
                      <p className="text-xs font-medium text-text-primary truncate">{admission.email}</p>
                    </div>
                  </div>
                  <div className="pt-1 border-t border-border/40">
                    <span className="text-[11px] text-text-muted flex items-center gap-1">
                      <MapPin size={12} /> Location
                    </span>
                    <p className="text-xs font-medium text-text-primary">
                      {admission.city}, {admission.state}
                    </p>
                  </div>
                </div>
              </div>

              {/* College & Course Info */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                  <Building size={14} className="text-blue-500" /> College & Course
                </h3>
                <div className="rounded-xl border border-border bg-background/50 p-4 space-y-3">
                  <div>
                    <span className="text-[11px] text-text-muted">College Name</span>
                    <p className="text-sm font-bold text-text-primary">{admission.collegeName}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-1 border-t border-border/40">
                    <div>
                      <span className="text-[11px] text-text-muted">Course Pitched</span>
                      <p className="text-xs font-semibold text-primary-500">{admission.coursePitched}</p>
                    </div>
                    {admission.feePitched > 0 && (
                      <div>
                        <span className="text-[11px] text-text-muted">Fee Amount</span>
                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          ₹{admission.feePitched.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Counselor & Team Details */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                  <Users size={14} className="text-violet-500" /> Ownership & Team
                </h3>
                <div className="rounded-xl border border-border bg-background/50 p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[11px] text-text-muted">Assigned Counselor</span>
                      <p className="text-xs font-semibold text-text-primary">{admission.counselorName}</p>
                    </div>
                    <div>
                      <span className="text-[11px] text-text-muted">Team</span>
                      <p className="text-xs font-semibold text-text-primary">{admission.teamName}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lead Details */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                  <Share2 size={14} className="text-amber-500" /> Lead Details
                </h3>
                <div className="rounded-xl border border-border bg-background/50 p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[11px] text-text-muted">Lead Source</span>
                      <p className="text-xs font-semibold text-text-primary">{admission.source.replace("_", " ")}</p>
                    </div>
                    <div>
                      <span className="text-[11px] text-text-muted flex items-center gap-1">
                        <Calendar size={12} /> Lead Created
                      </span>
                      <p className="text-xs font-medium text-text-primary">
                        {new Date(admission.createdAt).toLocaleDateString("en-IN")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 bg-background/50 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg bg-surface-hover px-4 py-2 text-xs font-medium text-text-primary border border-border hover:bg-border transition cursor-pointer"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
