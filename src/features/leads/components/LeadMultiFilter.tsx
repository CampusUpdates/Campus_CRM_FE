import { useState, useEffect, useRef } from "react";
import { Clock, Building2, UserCircle } from "lucide-react";
import type { LeadStatusItem } from "../../../services/leadService";
import type { College } from "../../../services/collegeService";
import type { UserItem } from "../../../services/userService";

export interface LeadFilterState {
  statuses: string[];
  time: string;
  fromDate: string;
  toDate: string;
  colleges: string[];
  owners: string[];
}

interface Props {
  filters: LeadFilterState;
  onApplyFilters: (filters: LeadFilterState) => void;
  dbStatuses: LeadStatusItem[];
  collegesList: College[];
  usersList: UserItem[];
}

const toggleArrayItem = (arr: string[], item: string) =>
  arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];

export default function LeadMultiFilter({
  filters,
  onApplyFilters,
  dbStatuses,
  collegesList,
  usersList,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const [draft, setDraft] = useState<LeadFilterState>(filters);
  const [collegeSearch, setCollegeSearch] = useState("");
  const [ownerSearch, setOwnerSearch] = useState("");

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    else document.removeEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Sync draft when opened
  useEffect(() => {
    if (isOpen) {
      setDraft(filters);
    }
  }, [isOpen, filters]);

  const activeCount =
    (draft.statuses.includes("LEAD") && draft.statuses.length === 1 ? 0 : draft.statuses.filter(s => s !== "LEAD").length) +
    (draft.time !== "all" ? 1 : 0) +
    draft.colleges.length +
    draft.owners.length;

  return (
    <div className="relative w-full sm:w-auto" ref={popoverRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          flex items-center justify-center gap-2
          h-11 px-4
          rounded-xl
          border border-border
          bg-surface
          text-sm font-bold text-text-secondary
          hover:bg-surface-hover hover:text-text-primary
          transition shadow-sm w-full sm:w-auto
          whitespace-nowrap
        "
      >
        <span className="text-primary-600 font-extrabold text-lg mr-1">+</span>
        Filters
        {activeCount > 0 && (
          <span className="bg-primary-500 text-white text-[10px] px-2 py-0.5 rounded-full ml-1 font-bold">
            {activeCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-[320px] sm:w-[360px] bg-surface rounded-2xl shadow-xl border border-border z-50 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border flex items-center justify-between bg-surface-hover/30">
            <h3 className="font-bold text-text-primary text-sm">Filter Leads</h3>
            <button
              onClick={() => {
                setDraft({ statuses: ["LEAD"], time: "all", fromDate: "", toDate: "", colleges: [], owners: [] });
              }}
              className="text-xs text-primary-600 hover:text-primary-700 font-semibold"
            >
              Clear All
            </button>
          </div>

          <div className="p-4 max-h-[60vh] overflow-y-auto space-y-6">
            {/* STATUS */}
            <div>
              <h4 className="text-xs font-semibold uppercase text-text-muted mb-3">Lead Status</h4>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setDraft({ ...draft, statuses: toggleArrayItem(draft.statuses, "LEAD") })}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition border ${draft.statuses.includes("LEAD")
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-border bg-surface text-text-secondary hover:bg-surface-hover"
                    }`}
                >
                  Active Leads
                </button>
                {dbStatuses.map((st) => {
                  if (st.name === "LEAD") return null;
                  return (
                    <button
                      key={st.id}
                      onClick={() => setDraft({ ...draft, statuses: toggleArrayItem(draft.statuses, st.name) })}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition border ${draft.statuses.includes(st.name)
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-border bg-surface text-text-secondary hover:bg-surface-hover"
                        }`}
                    >
                      {st.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* TIME */}
            <div>
              <h4 className="text-xs font-semibold uppercase text-text-muted mb-3 flex items-center gap-2">
                <Clock size={14} /> Time
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: "all", label: "All Time" },
                  { id: "today", label: "Today" },
                  { id: "yesterday", label: "Yesterday" },
                  { id: "week", label: "Last 7 Days" },
                  { id: "month", label: "Last 30 Days" },
                  { id: "custom", label: "Custom Range" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setDraft({ ...draft, time: opt.id })}
                    className={`px-3 py-2 rounded-lg border text-xs font-medium transition ${draft.time === opt.id
                        ? "border-primary-500 bg-primary-50 text-primary-700"
                        : "border-border bg-surface text-text-secondary hover:bg-surface-hover"
                      }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {draft.time === "custom" && (
                <div className="mt-3 grid grid-cols-2 gap-3 bg-neutral-50 p-3 rounded-lg border border-border">
                  <div>
                    <label className="text-[10px] font-semibold text-text-muted mb-1 block uppercase">From</label>
                    <input
                      type="date"
                      value={draft.fromDate}
                      onChange={(e) => setDraft({ ...draft, fromDate: e.target.value })}
                      className="w-full text-xs p-1.5 rounded-md border border-border outline-none focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-text-muted mb-1 block uppercase">To</label>
                    <input
                      type="date"
                      value={draft.toDate}
                      onChange={(e) => setDraft({ ...draft, toDate: e.target.value })}
                      className="w-full text-xs p-1.5 rounded-md border border-border outline-none focus:border-primary-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* COLLEGE */}
            <div>
              <h4 className="text-xs font-semibold uppercase text-text-muted mb-3 flex items-center justify-between">
                <span className="flex items-center gap-2"><Building2 size={14} /> College</span>
              </h4>
              <div className="mb-2">
                <input
                  type="text"
                  placeholder="Search colleges..."
                  value={collegeSearch}
                  onChange={(e) => setCollegeSearch(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-border outline-none focus:border-primary-500 bg-surface"
                />
              </div>
              <div className="max-h-[140px] overflow-y-auto border border-border rounded-lg bg-surface">
                {collegesList
                  .filter(c => c.name.toLowerCase().includes(collegeSearch.toLowerCase()))
                  .map((c) => (
                    <label key={c.id} className="flex items-center gap-3 p-2.5 border-b border-border hover:bg-surface-hover cursor-pointer last:border-b-0">
                      <input
                        type="checkbox"
                        checked={draft.colleges.includes(c.id)}
                        onChange={() => setDraft({ ...draft, colleges: toggleArrayItem(draft.colleges, c.id) })}
                        className="rounded text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm font-medium text-text-primary">{c.name}</span>
                    </label>
                  ))}
                {collegesList.filter(c => c.name.toLowerCase().includes(collegeSearch.toLowerCase())).length === 0 && (
                  <div className="p-3 text-xs text-center text-text-muted">No colleges found</div>
                )}
              </div>
            </div>

            {/* OWNER */}
            <div>
              <h4 className="text-xs font-semibold uppercase text-text-muted mb-3 flex items-center gap-2">
                <UserCircle size={14} /> Owner / User
              </h4>
              <div className="mb-2">
                <input
                  type="text"
                  placeholder="Search owners..."
                  value={ownerSearch}
                  onChange={(e) => setOwnerSearch(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-border outline-none focus:border-primary-500 bg-surface"
                />
              </div>
              <div className="max-h-[140px] overflow-y-auto border border-border rounded-lg bg-surface">
                {("unassigned".includes(ownerSearch.toLowerCase())) && (
                  <label className="flex items-center gap-3 p-2.5 border-b border-border hover:bg-surface-hover cursor-pointer text-orange-600 bg-orange-50/30">
                    <input
                      type="checkbox"
                      checked={draft.owners.includes("UNASSIGNED")}
                      onChange={() => setDraft({ ...draft, owners: toggleArrayItem(draft.owners, "UNASSIGNED") })}
                      className="rounded text-orange-600 focus:ring-orange-500 border-orange-300"
                    />
                    <span className="text-sm font-medium italic">Unassigned Leads</span>
                  </label>
                )}
                {usersList
                  .filter(u => `${u.firstName} ${u.lastName || ""}`.toLowerCase().includes(ownerSearch.toLowerCase()))
                  .map((u) => (
                    <label key={u.id} className="flex items-center gap-3 p-2.5 border-b border-border hover:bg-surface-hover cursor-pointer last:border-b-0">
                      <input
                        type="checkbox"
                        checked={draft.owners.includes(u.id)}
                        onChange={() => setDraft({ ...draft, owners: toggleArrayItem(draft.owners, u.id) })}
                        className="rounded text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm font-medium text-text-primary">{u.firstName} {u.lastName}</span>
                    </label>
                  ))}
                {usersList.filter(u => `${u.firstName} ${u.lastName || ""}`.toLowerCase().includes(ownerSearch.toLowerCase())).length === 0 && !("unassigned".includes(ownerSearch.toLowerCase())) && (
                  <div className="p-3 text-xs text-center text-text-muted">No owners found</div>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-border bg-neutral-50/50 flex justify-end gap-3">
            <button
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-text-secondary hover:bg-neutral-200 transition"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onApplyFilters(draft);
                setIsOpen(false);
              }}
              className="px-4 py-2 rounded-xl bg-primary-500 text-white text-xs font-bold hover:bg-primary-600 transition shadow-sm"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
