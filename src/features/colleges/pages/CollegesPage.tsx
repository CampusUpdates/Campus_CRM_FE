import { useEffect, useState, useCallback } from "react";
import {
  Building2,
  Plus,
  Search,
  SlidersHorizontal,
  RefreshCw,
  MapPin,
  Phone,
  Mail,
  Globe,
  UserCheck,
  CheckCircle2,
  GraduationCap,
  LayoutGrid,
  List,
  Trash2,
  Edit3,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import { fetchActiveColleges, deleteCollege, type College } from "../../../services/collegeService";
import CreateCollegeModal from "../components/CreateCollegeModal";
import CollegeDetailsModal from "../components/CollegeDetailsModal";
import EditCollegeModal from "../components/EditCollegeModal";

const CollegesPage = () => {
  const { accessToken, hasRole, user } = useAuth();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlSearchQuery = searchParams.get("search") || "";

  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(urlSearchQuery);
  const [isCreateCollegeOpen, setIsCreateCollegeOpen] = useState(false);
  const [selectedCollege, setSelectedCollege] = useState<College | null>(null);
  const [editingCollege, setEditingCollege] = useState<College | null>(null);

  useEffect(() => {
    setSearchTerm(urlSearchQuery);
  }, [urlSearchQuery]);

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    if (term.trim()) {
      setSearchParams({ search: term.trim() });
    } else {
      setSearchParams({});
    }
  };

  const isAdvisor = user?.roleCode === "PROGRAM_ADVISOR";
  const canManageCollege = hasRole(["SUPER_ADMIN", "HR"]);
  const isHR = user?.roleCode === "HR";

  // Default to card layout for advisors, allow view toggle for admins/HR
  const [viewMode, setViewMode] = useState<"card" | "table">(isAdvisor ? "card" : "card");

  const loadColleges = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const data = await fetchActiveColleges(accessToken);
      setColleges(data);
    } catch (err) {
      console.error("Failed to load colleges:", err);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    loadColleges();
  }, [loadColleges]);

  const handleRemoveCollege = async (id: string, name: string) => {
    if (!accessToken) return;
    if (!window.confirm(`Are you sure you want to remove "${name}" from partner colleges?`)) {
      return;
    }
    try {
      await deleteCollege(accessToken, id);
      toast.success(`Removed "${name}" successfully`);
      if (selectedCollege?.id === id) {
        setSelectedCollege(null);
      }
      loadColleges();
    } catch (err: any) {
      toast.error(err.message || "Failed to remove college");
    }
  };

  const filteredColleges = colleges.filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      (c.city || "").toLowerCase().includes(term) ||
      (c.state || "").toLowerCase().includes(term) ||
      (c.description || "").toLowerCase().includes(term) ||
      (c.contactPerson || "").toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">
            Colleges
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            {!canManageCollege
              ? "Browse partner colleges, university details, and admission pitch guidelines in read-only mode."
              : "View partner colleges, university details, and affiliation programs."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center rounded-lg border border-border bg-surface p-1">
            <button
              onClick={() => setViewMode("card")}
              title="Card View"
              className={`p-1.5 rounded-md text-sm font-medium transition ${
                viewMode === "card"
                  ? "bg-primary-50 text-primary-600 shadow-xs"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <LayoutGrid size={17} />
            </button>
            <button
              onClick={() => setViewMode("table")}
              title="Table View"
              className={`p-1.5 rounded-md text-sm font-medium transition ${
                viewMode === "table"
                  ? "bg-primary-50 text-primary-600 shadow-xs"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <List size={17} />
            </button>
          </div>

          <button
            onClick={loadColleges}
            title="Refresh colleges"
            className="p-2.5 rounded-lg border border-border bg-surface text-text-secondary hover:bg-neutral-100 transition"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>

          {canManageCollege && (
            <button
              onClick={() => setIsCreateCollegeOpen(true)}
              className="
                flex items-center gap-2
                rounded-lg
                bg-primary-500
                px-4 py-2.5
                text-sm font-medium
                text-white
                transition
                hover:bg-primary-600
              "
            >
              <Plus size={18} />
              Add College
            </button>
          )}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="text"
            placeholder="Search colleges by name, city, contact person, or guidelines..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="
              h-11
              w-full
              rounded-lg
              border
              border-border
              bg-surface
              pl-11
              pr-4
              text-sm
              outline-none
              transition
              focus:border-primary-500
              focus:ring-2
              focus:ring-primary-100
            "
          />
        </div>

        <button
          className="
            flex items-center gap-2
            rounded-lg
            border border-border
            bg-surface
            px-4 py-2.5
            text-sm
            text-text-secondary
            hover:bg-neutral-100
          "
        >
          <SlidersHorizontal size={17} />
          Filters
        </button>
      </div>

      {/* Content Section */}
      {loading ? (
        <div className="flex items-center justify-center p-16 text-sm text-text-secondary rounded-xl border border-border bg-surface">
          <RefreshCw className="animate-spin mr-2" size={18} />
          Loading colleges...
        </div>
      ) : filteredColleges.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 text-center rounded-xl border border-border bg-surface">
          <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mb-3 text-text-muted">
            <Building2 size={24} />
          </div>
          <h3 className="text-base font-semibold text-text-primary">No colleges found</h3>
          <p className="text-sm text-text-secondary mt-1 max-w-sm">
            {searchTerm
              ? "No colleges matched your search query."
              : "No partner colleges available."}
          </p>
        </div>
      ) : viewMode === "card" ? (
        /* Card Grid Layout */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredColleges.map((college) => {
            const location = [college.city, college.state].filter(Boolean).join(", ");

            return (
              <div
                key={college.id}
                className="
                  group flex flex-col justify-between
                  rounded-2xl border border-border bg-surface p-6
                  shadow-xs hover:shadow-md hover:border-primary-200
                  transition duration-200
                "
              >
                <div className="space-y-4">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600 shrink-0 group-hover:bg-primary-500 group-hover:text-white transition duration-200">
                        <Building2 size={22} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-text-primary text-base leading-snug line-clamp-1">
                          {college.name}
                        </h3>
                        {location && (
                          <p className="text-xs text-text-muted flex items-center gap-1 mt-0.5">
                            <MapPin size={12} className="text-primary-500 shrink-0" />
                            {location}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Partnership Badge */}
                  <div className="flex items-center gap-2">
                    {college.hasTieUp ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                        <CheckCircle2 size={12} />
                        Official Partner
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                        Active College
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                    {college.description}
                  </p>

                  {/* Contact Info List */}
                  <div className="space-y-2 border-t border-border/60 pt-3 text-xs text-text-secondary">
                    {college.contactPerson && (
                      <div className="flex items-center gap-2">
                        <UserCheck size={14} className="text-primary-500 shrink-0" />
                        <span className="truncate">{college.contactPerson}</span>
                      </div>
                    )}
                    {college.phone && (
                      <div className="flex items-center gap-2">
                        <Phone size={14} className="text-primary-500 shrink-0" />
                        <span>{college.phone}</span>
                      </div>
                    )}
                    {college.email && (
                      <div className="flex items-center gap-2">
                        <Mail size={14} className="text-primary-500 shrink-0" />
                        <span className="truncate">{college.email}</span>
                      </div>
                    )}
                    {college.website && (
                      <div className="flex items-center gap-2">
                        <Globe size={14} className="text-primary-500 shrink-0" />
                        <a
                          href={college.website.startsWith("http") ? college.website : `https://${college.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="truncate hover:underline text-primary-600 font-medium"
                        >
                          {college.website}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Admission Guidelines snippet */}
                  {college.admissionProcess && (
                    <div className="rounded-lg bg-neutral-50 p-2.5 text-xs text-text-secondary border border-neutral-100 flex items-start gap-2">
                      <GraduationCap size={15} className="text-primary-600 shrink-0 mt-0.5" />
                      <p className="line-clamp-2 italic">{college.admissionProcess}</p>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="border-t border-border/60 pt-4 mt-4 flex items-center justify-end gap-2">
                  <button
                    onClick={() => setSelectedCollege(college)}
                    className="
                      text-xs font-semibold
                      text-primary-600 hover:text-primary-700
                      hover:bg-primary-50
                      px-3 py-1.5 rounded-lg transition
                    "
                  >
                    View Details
                  </button>
                  {isHR && (
                    <button
                      onClick={() => setEditingCollege(college)}
                      className="
                        text-xs font-semibold
                        text-neutral-700 hover:text-text-primary
                        hover:bg-neutral-100
                        px-3 py-1.5 rounded-lg transition
                        flex items-center gap-1
                      "
                      title="Edit College"
                    >
                      <Edit3 size={13} />
                      Edit
                    </button>
                  )}
                  {canManageCollege && (
                    <button
                      onClick={() => handleRemoveCollege(college.id, college.name)}
                      className="
                        text-xs font-semibold
                        text-rose-600 hover:text-rose-700
                        hover:bg-rose-50
                        px-3 py-1.5 rounded-lg transition
                        flex items-center gap-1
                      "
                      title="Remove College"
                    >
                      <Trash2 size={13} />
                      Remove
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-neutral-50">
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-text-secondary">
                    College Name
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-text-secondary">
                    Location
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-text-secondary">
                    Status
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase text-text-secondary">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredColleges.map((college) => {
                  const location = [college.city, college.state]
                    .filter(Boolean)
                    .join(", ") || "N/A";

                  return (
                    <tr
                      key={college.id}
                      className="border-b border-border last:border-0 hover:bg-neutral-50/50 transition"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600 shrink-0">
                            <Building2 size={20} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-text-primary">
                              {college.name}
                            </p>
                            {college.description && (
                              <p className="text-xs text-text-muted truncate max-w-xs">
                                {college.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-text-secondary">
                        {location}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            college.isActive !== false
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {college.isActive !== false ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => setSelectedCollege(college)}
                            className="text-sm font-medium text-primary-600 hover:text-primary-700"
                          >
                            View Details
                          </button>
                          {isHR && (
                            <button
                              onClick={() => setEditingCollege(college)}
                              className="text-sm font-medium text-neutral-700 hover:text-text-primary flex items-center gap-1"
                              title="Edit College"
                            >
                              <Edit3 size={14} />
                              Edit
                            </button>
                          )}
                          {canManageCollege && (
                            <button
                              onClick={() => handleRemoveCollege(college.id, college.name)}
                              className="text-sm font-medium text-rose-600 hover:text-rose-700 flex items-center gap-1"
                              title="Remove College"
                            >
                              <Trash2 size={14} />
                              Remove
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add College Modal (Admin/HR only) */}
      {isCreateCollegeOpen && (
        <CreateCollegeModal
          onClose={() => {
            setIsCreateCollegeOpen(false);
            loadColleges();
          }}
        />
      )}

      {/* Read-Only / Editable College Details Modal */}
      {selectedCollege && (
        <CollegeDetailsModal
          college={selectedCollege}
          onClose={() => setSelectedCollege(null)}
          onDelete={canManageCollege ? () => handleRemoveCollege(selectedCollege.id, selectedCollege.name) : undefined}
          onEdit={isHR ? () => {
            setEditingCollege(selectedCollege);
            setSelectedCollege(null);
          } : undefined}
        />
      )}

      {/* Edit College Modal (HR only) */}
      {editingCollege && (
        <EditCollegeModal
          college={editingCollege}
          onClose={() => setEditingCollege(null)}
          onSuccess={() => {
            loadColleges();
            setEditingCollege(null);
          }}
        />
      )}
    </div>
  );
};

export default CollegesPage;

