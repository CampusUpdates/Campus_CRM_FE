import { useEffect, useState } from "react";
import { X, ChevronDown, CheckCircle2 } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import { fetchActiveColleges, type College } from "../../../services/collegeService";
import {
  createLead,
  updateLead,
  fetchLeadStatuses,
  type CreateLeadPayload,
  type LeadItem,
  type LeadStatusItem,
} from "../../../services/leadService";
import LeadPipelineDrawer from "./LeadPipelineDrawer";
import { StateCitySelect } from "../../../components/common/StateCitySelect";
import { getFieldValidationClass } from "../../../utils/formValidation";

type CreateLeadFormProps = {
  initialLead?: Partial<LeadItem>;
  isEdit?: boolean;
  onSuccess?: (createdLead?: any) => void;
};

const CreateLeadForm = ({
  initialLead,
  isEdit = false,
  onSuccess,
}: CreateLeadFormProps) => {
  const { accessToken } = useAuth();
  const toast = useToast();

  const [formData, setFormData] = useState({
    firstName: initialLead?.firstName || "",
    lastName: initialLead?.lastName || "",
    phone: initialLead?.phone || "",
    alternatePhone: initialLead?.alternatePhone || "",
    email: initialLead?.email || "",
    gender: initialLead?.gender || "",
    city: initialLead?.city || "",
    state: initialLead?.state || "",
    aadharNumber: initialLead?.aadharNumber || "",
    dateOfBirth: initialLead?.dateOfBirth ? initialLead.dateOfBirth.split("T")[0] : "",
    // Existing Academic fields
    tenthPercentage: initialLead?.tenthPercentage ? String(initialLead.tenthPercentage) : "",
    twelfthPercentage: initialLead?.twelfthPercentage ? String(initialLead.twelfthPercentage) : "",
    graduationPercentage: initialLead?.graduationPercentage ? String(initialLead.graduationPercentage) : "",
    graduationCourse: initialLead?.graduationCourse || "",
    graduationSpecialization: initialLead?.graduationSpecialization || "",
    courseInterested: initialLead?.courseInterested || "",
    courseInterestedOther: initialLead?.courseInterestedOther || "",
    specializationInterested: initialLead?.specializationInterested || "",
    passingYear: initialLead?.passingYear ? String(initialLead.passingYear) : "",
    // Extended fields
    fatherName: initialLead?.fatherName || "",
    fatherOccupation: initialLead?.fatherOccupation || "",
    fatherPhone: initialLead?.fatherPhone || "",
    motherName: initialLead?.motherName || "",
    motherOccupation: initialLead?.motherOccupation || "",
    motherPhone: initialLead?.motherPhone || "",
    physicalAddress: initialLead?.physicalAddress || "",
    tenthSchoolName: initialLead?.tenthSchoolName || "",
    tenthBoard: initialLead?.tenthBoard || "",
    tenthPassoutYear: initialLead?.tenthPassoutYear ? String(initialLead.tenthPassoutYear) : "",
    twelfthSchoolName: initialLead?.twelfthSchoolName || "",
    twelfthBoard: initialLead?.twelfthBoard || "",
    twelfthPassoutYear: initialLead?.twelfthPassoutYear ? String(initialLead.twelfthPassoutYear) : "",
    graduationCollegeName: initialLead?.graduationCollegeName || "",
    graduationUniversity: initialLead?.graduationUniversity || "",
    graduationPassoutYear: initialLead?.graduationPassoutYear ? String(initialLead.graduationPassoutYear) : "",
    bestTimeToCall: initialLead?.bestTimeToCall || "",
    notes: initialLead?.notes || "",
    // Lead Metadata
    source: initialLead?.source || "",
    sourceOther: initialLead?.sourceOther || "",
    statusId: initialLead?.statusId ? String(initialLead.statusId) : (initialLead?.status?.id ? String(initialLead.status.id) : ""),
  });

  // Collapsible sections toggle states (collapsed by default)
  const [isAcademicOpen, setIsAcademicOpen] = useState(false);
  const [isFamilyOpen, setIsFamilyOpen] = useState(false);
  const [isCourseInterestOpen, setIsCourseInterestOpen] = useState(false);
  const [isCallingPrefOpen, setIsCallingPrefOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);

  // Score type UI state (frontend-only; backend stores numeric value regardless)
  const [tenthScoreType, setTenthScoreType] = useState<"percentage" | "cgpa">("percentage");
  const [twelfthScoreType, setTwelfthScoreType] = useState<"percentage" | "cgpa">("percentage");
  const [graduationScoreType, setGraduationScoreType] = useState<"percentage" | "cgpa">("percentage");

  const [colleges, setColleges] = useState<College[]>([]);
  const [leadStatuses, setLeadStatuses] = useState<LeadStatusItem[]>([]);
  const [selectedCollegeIds, setSelectedCollegeIds] = useState<string[]>(() => {
    if (initialLead?.collegeApplications) {
      return initialLead.collegeApplications
        .map((app) => app.college?.id)
        .filter((id): id is string => Boolean(id));
    }
    return [];
  });

  const [selectedNegativeColleges, setSelectedNegativeColleges] = useState<string[]>(() => {
    if (initialLead?.negativeColleges) {
      return initialLead.negativeColleges
        .map((item) => item.collegeName)
        .filter((name): name is string => Boolean(name));
    }
    return [];
  });

  const [isCollegeDropdownOpen, setIsCollegeDropdownOpen] = useState(false);
  
  // Negative Colleges Autocomplete State
  const [negativeSearchQuery, setNegativeSearchQuery] = useState("");
  const [negativeSuggestions, setNegativeSuggestions] = useState<College[]>([]);
  const [isSearchingNegative, setIsSearchingNegative] = useState(false);
  const [isNegativeDropdownOpen, setIsNegativeDropdownOpen] = useState(false);
  
  const [negativeCollegeError, setNegativeCollegeError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activePipelineStatus, setActivePipelineStatus] = useState<LeadStatusItem | null>(null);
  const [updatedLeadState, setUpdatedLeadState] = useState<any>(null);

  useEffect(() => {
    if (accessToken) {
      fetchActiveColleges(accessToken)
        .then((data) => setColleges(data))
        .catch((err) => console.error("Failed to load active colleges:", err));

      fetchLeadStatuses(accessToken)
        .then((data) => setLeadStatuses(data))
        .catch((err) => console.error("Failed to load lead statuses:", err));
    }
  }, [accessToken]);

  // Search for negative colleges
  useEffect(() => {
    if (!accessToken) return;
    
    if (!negativeSearchQuery.trim()) {
      setNegativeSuggestions([]);
      return;
    }

    const timer = setTimeout(() => {
      setIsSearchingNegative(true);
      fetchActiveColleges(accessToken, negativeSearchQuery)
        .then((data) => setNegativeSuggestions(data))
        .catch((err) => console.error("Failed to search negative colleges:", err))
        .finally(() => setIsSearchingNegative(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [negativeSearchQuery, accessToken]);

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  const validateLeadField = (name: string, value: any, _currentData = formData, currentColleges = selectedCollegeIds): string | null => {
    if (name === "firstName" && !String(value || "").trim()) {
      return "First name is required";
    }
    if (name === "phone" && !String(value || "").trim()) {
      return "Phone number is required";
    }
    if (name === "email") {
      const v = String(value || "").trim();
      if (!v) return "Email is required";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Please enter a valid email address";
    }
    if (name === "aadharNumber") {
      const v = String(value || "").trim();
      if (v && !/^\d{12}$/.test(v)) return "Aadhar Number must be exactly 12 digits";
    }
    if (name === "fatherPhone" || name === "motherPhone") {
      const v = String(value || "").trim();
      if (v && !/^\d{10}$/.test(v)) return "Phone number must be exactly 10 digits";
    }
    if (name === "city" && !String(value || "").trim()) {
      return "City is required";
    }
    if (name === "state" && !String(value || "").trim()) {
      return "State is required";
    }
    if (name === "colleges" && currentColleges.length === 0) {
      return "At least one college must be selected.";
    }
    if (name === "source" && !String(value || "").trim()) {
      return "Lead source is required";
    }
    if (name === "sourceOther" && _currentData.source === "OTHER" && !String(value || "").trim()) {
      return "Specify Lead Source is required";
    }
    if (name === "courseInterestedOther" && _currentData.courseInterested === "OTHER" && !String(value || "").trim()) {
      return "Specify Course is required";
    }
    return null;
  };

  const handleBlur = (name: string) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    const err = validateLeadField(name, (formData as any)[name]);
    setErrors((prev) => ({ ...prev, [name]: err }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const next = { ...formData, [name]: value };
    setFormData(next);
    if (touched[name]) {
      const err = validateLeadField(name, value, next);
      setErrors((prev) => ({ ...prev, [name]: err }));
    }
  };

  const handleSelectCollege = (collegeId: string) => {
    let next: string[];
    if (!selectedCollegeIds.includes(collegeId)) {
      next = [...selectedCollegeIds, collegeId];
      setSelectedCollegeIds(next);
    } else {
      next = selectedCollegeIds;
    }
    setIsCollegeDropdownOpen(false);
    setTouched((prev) => ({ ...prev, colleges: true }));
    const err = validateLeadField("colleges", null, formData, next);
    setErrors((prev) => ({ ...prev, colleges: err }));
  };

  const handleRemoveCollege = (collegeId: string) => {
    const next = selectedCollegeIds.filter((id) => id !== collegeId);
    setSelectedCollegeIds(next);
    setTouched((prev) => ({ ...prev, colleges: true }));
    const err = validateLeadField("colleges", null, formData, next);
    setErrors((prev) => ({ ...prev, colleges: err }));
  };

  const handleAddNegativeCollege = (collegeName: string) => {
    const trimmed = collegeName.trim();
    if (!trimmed) return;
    
    if (!selectedNegativeColleges.some((name) => name.toLowerCase() === trimmed.toLowerCase())) {
      setSelectedNegativeColleges((prev) => [...prev, trimmed]);
    }
    setNegativeSearchQuery("");
    setIsNegativeDropdownOpen(false);
  };

  const handleRemoveNegativeCollege = (collegeName: string) => {
    setSelectedNegativeColleges((prev) => prev.filter((name) => name !== collegeName));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!accessToken) return;

    const mandatoryFields = ["firstName", "phone", "email", "city", "state", "colleges", "source"];
    if (formData.source === "OTHER") mandatoryFields.push("sourceOther");
    if (formData.courseInterested === "OTHER") mandatoryFields.push("courseInterestedOther");
    const newTouched: Record<string, boolean> = {};
    const newErrors: Record<string, string | null> = {};
    let hasError = false;

    mandatoryFields.forEach((f) => {
      newTouched[f] = true;
      const err = validateLeadField(f, f === "colleges" ? selectedCollegeIds : (formData as any)[f]);
      newErrors[f] = err;
      if (err) hasError = true;
    });

    setTouched(newTouched);
    setErrors(newErrors);

    if (hasError) {
      const firstErr = Object.values(newErrors).find(Boolean);
      if (firstErr) {
        setErrorMsg(firstErr);
        toast.error(firstErr);
      }
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setNegativeCollegeError(null);

    try {
      const payload: CreateLeadPayload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim() || undefined,
        phone: formData.phone.trim(),
        alternatePhone: formData.alternatePhone.trim() || undefined,
        email: formData.email.trim(),
        gender: formData.gender || undefined,
        city: formData.city.trim(),
        state: formData.state.trim(),
        dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : undefined,
        // Existing Academic
        tenthPercentage: formData.tenthPercentage ? Number(formData.tenthPercentage) : undefined,
        twelfthPercentage: formData.twelfthPercentage ? Number(formData.twelfthPercentage) : undefined,
        graduationPercentage: formData.graduationPercentage ? Number(formData.graduationPercentage) : undefined,
        graduationCourse: formData.graduationCourse.trim() || undefined,
        graduationSpecialization: formData.graduationSpecialization.trim() || undefined,
        courseInterested: formData.courseInterested || undefined,
        courseInterestedOther: formData.courseInterested === "OTHER" ? (formData.courseInterestedOther.trim() || undefined) : undefined,
        specializationInterested: formData.specializationInterested.trim() || undefined,
        passingYear: formData.passingYear ? Number(formData.passingYear) : undefined,
        // Extended fields
        aadharNumber: formData.aadharNumber.trim() || undefined,
        fatherName: formData.fatherName.trim() || undefined,
        fatherOccupation: formData.fatherOccupation.trim() || undefined,
        fatherPhone: formData.fatherPhone.trim() || undefined,
        motherName: formData.motherName.trim() || undefined,
        motherOccupation: formData.motherOccupation.trim() || undefined,
        motherPhone: formData.motherPhone.trim() || undefined,
        physicalAddress: formData.physicalAddress.trim() || undefined,
        tenthSchoolName: formData.tenthSchoolName.trim() || undefined,
        tenthBoard: formData.tenthBoard.trim() || undefined,
        tenthPassoutYear: formData.tenthPassoutYear ? Number(formData.tenthPassoutYear) : undefined,
        twelfthSchoolName: formData.twelfthSchoolName.trim() || undefined,
        twelfthBoard: formData.twelfthBoard.trim() || undefined,
        twelfthPassoutYear: formData.twelfthPassoutYear ? Number(formData.twelfthPassoutYear) : undefined,
        graduationCollegeName: formData.graduationCollegeName.trim() || undefined,
        graduationUniversity: formData.graduationUniversity.trim() || undefined,
        graduationPassoutYear: formData.graduationPassoutYear ? Number(formData.graduationPassoutYear) : undefined,
        bestTimeToCall: formData.bestTimeToCall || undefined,
        notes: formData.notes.trim() || undefined,
        // Metadata & Colleges
        collegeIds: selectedCollegeIds,
        negativeColleges: selectedNegativeColleges,
        source: formData.source || "OTHER",
        sourceOther: formData.source === "OTHER" ? (formData.sourceOther.trim() || undefined) : undefined,
        statusId: formData.statusId ? Number(formData.statusId) : undefined,
      };

      if (isEdit && initialLead && initialLead.id) {
        const PIPELINE_STATUSES = [
          "APPLICATION",
          "INTERVIEW_SCHEDULED",
          "INTERVIEW_DONE",
          "LETTER_OUT",
          "ADMISSION_DONE",
          "CANCELLED",
        ];

        const selectedStatusObj = leadStatuses.find(
          (s) => s.id === Number(formData.statusId)
        );
        const selectedStatusName = (selectedStatusObj?.name || "").toUpperCase();

        const initialStatusId = initialLead.statusId || initialLead.status?.id;
        const currentStatusId = formData.statusId ? Number(formData.statusId) : undefined;
        const isStatusChanged =
          currentStatusId !== undefined && currentStatusId !== initialStatusId;

        if (
          isStatusChanged &&
          selectedStatusObj &&
          PIPELINE_STATUSES.includes(selectedStatusName)
        ) {
          const updatePayload = { ...payload };
          delete updatePayload.statusId;
          const updated = await updateLead(accessToken, initialLead.id, updatePayload);
          setUpdatedLeadState(updated || initialLead);
          toast.info("Lead details saved. Complete stage transition in the pipeline drawer.");
          setActivePipelineStatus(selectedStatusObj);
          return;
        }

        const updated = await updateLead(accessToken, initialLead.id, payload);
        toast.success("Lead details updated successfully!");
        if (onSuccess) {
          onSuccess(updated);
        }
      } else {
        const PIPELINE_STATUSES = [
          "APPLICATION",
          "INTERVIEW_SCHEDULED",
          "INTERVIEW_DONE",
          "LETTER_OUT",
          "ADMISSION_DONE",
          "CANCELLED",
        ];
        const selectedStatusObj = leadStatuses.find(
          (s) => s.id === Number(formData.statusId)
        );
        const selectedStatusName = (selectedStatusObj?.name || "").toUpperCase();

        const created = await createLead(accessToken, payload);

        if (selectedStatusObj && PIPELINE_STATUSES.includes(selectedStatusName)) {
          setUpdatedLeadState(created);
          toast.info("Lead created. Complete stage transition in the pipeline drawer.");
          setActivePipelineStatus(selectedStatusObj);
          return;
        }

        toast.success("Lead created successfully!");
        if (onSuccess) {
          onSuccess(created);
        }
      }
    } catch (err: any) {
      const msg = err.message || (isEdit ? "Failed to update lead" : "Failed to create lead");
      if (err.field === "negativeCollegeIds" || err.response?.data?.field === "negativeCollegeIds") {
        setNegativeCollegeError(msg);
      }
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const unselectedColleges = colleges.filter(
    (c) => !selectedCollegeIds.includes(c.id)
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {initialLead && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3.5 sm:p-4 space-y-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-emerald-900 font-bold text-xs">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              Student Information Prefilled
            </span>
            <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[11px] font-semibold w-fit">
              Required: Select College
            </span>
          </div>
          <p className="text-[11px] text-emerald-700 leading-relaxed">
            Contact details ({[formData.firstName, formData.lastName].filter(Boolean).join(" ")}, {formData.phone}) are automatically prefilled from dataset.
          </p>
        </div>
      )}

      {errorMsg && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 p-3.5 sm:p-4 text-xs sm:text-sm text-rose-700">
          {errorMsg}
        </div>
      )}

      {/* SECTION 1 — BASIC INFORMATION (Open by default) */}
      <section className="space-y-4">
        <div>
          <h3 className="text-sm sm:text-base font-semibold text-text-primary">
            1. Basic Information
          </h3>
          <p className="mt-0.5 text-xs text-text-secondary">
            Primary contact details and location.
          </p>
          <div className="mt-2 border-b border-border" />
        </div>

        <div className="grid grid-cols-1 gap-3.5 sm:gap-4 sm:grid-cols-2">
          <Input
            label="First Name"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            onBlur={() => handleBlur("firstName")}
            touched={touched.firstName}
            error={errors.firstName}
            placeholder="Enter first name"
            required
          />

          <Input
            label="Last Name"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            onBlur={() => handleBlur("lastName")}
            touched={touched.lastName}
            error={errors.lastName}
            placeholder="Enter last name"
          />

          <Input
            label="Phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            onBlur={() => handleBlur("phone")}
            touched={touched.phone}
            error={errors.phone}
            placeholder="Enter phone number"
            required
          />

          <Input
            label="Alternate Phone"
            name="alternatePhone"
            value={formData.alternatePhone}
            onChange={handleChange}
            onBlur={() => handleBlur("alternatePhone")}
            touched={touched.alternatePhone}
            error={errors.alternatePhone}
            placeholder="Enter alternate phone"
          />

          <Input
            type="email"
            label="Email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            onBlur={() => handleBlur("email")}
            touched={touched.email}
            error={errors.email}
            placeholder="Enter email address"
            required
          />

          <Input
            label="Aadhar Number"
            name="aadharNumber"
            value={formData.aadharNumber}
            onChange={handleChange}
            onBlur={() => handleBlur("aadharNumber")}
            touched={touched.aadharNumber}
            error={errors.aadharNumber}
            placeholder="e.g. 123456789012"
          />

          <Select
            label="Gender"
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            onBlur={() => handleBlur("gender")}
            touched={touched.gender}
            error={errors.gender}
            options={[
              { value: "MALE", label: "Male" },
              { value: "FEMALE", label: "Female" },
              { value: "OTHER", label: "Other" },
            ]}
          />

          <div className="sm:col-span-2">
            <StateCitySelect
              stateValue={formData.state}
              cityValue={formData.city}
              stateTouched={touched.state}
              cityTouched={touched.city}
              stateError={errors.state || undefined}
              cityError={errors.city || undefined}
              onStateBlur={() => handleBlur("state")}
              onCityBlur={() => handleBlur("city")}
              onStateChange={(state) => {
                setFormData((prev) => ({ ...prev, state }));
                if (touched.state) {
                  setErrors((prev) => ({ ...prev, state: validateLeadField("state", state) }));
                }
              }}
              onCityChange={(city) => {
                setFormData((prev) => ({ ...prev, city }));
                if (touched.city) {
                  setErrors((prev) => ({ ...prev, city: validateLeadField("city", city) }));
                }
              }}
              required
            />
          </div>

          <Input
            type="date"
            label="Date of Birth"
            name="dateOfBirth"
            value={formData.dateOfBirth}
            onChange={handleChange}
            onBlur={() => handleBlur("dateOfBirth")}
            touched={touched.dateOfBirth}
            error={errors.dateOfBirth}
          />
        </div>
      </section>

      {/* SECTION 2 — COLLEGES (Open by default) */}
      <section className="space-y-4 pt-2">
        <div>
          <h3 className="text-sm sm:text-base font-semibold text-text-primary">
            2. Colleges
          </h3>
          <p className="mt-0.5 text-xs text-text-secondary">
            Select colleges pitched to the lead and negative colleges to exclude.
          </p>
          <div className="mt-2 border-b border-border" />
        </div>

        <div className="space-y-4">
          {/* Pitched Colleges (Application Colleges) */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-text-secondary">
              Pitched Colleges <span className="text-red-500">*</span>
            </label>

            <div className="relative">
              <div
                onClick={() => setIsCollegeDropdownOpen(!isCollegeDropdownOpen)}
                className={`
                  min-h-[44px]
                  w-full
                  rounded-lg
                  border
                  ${touched.colleges && errors.colleges ? "border-red-500 ring-1 ring-red-200" : "border-border"}
                  bg-surface
                  p-2
                  flex flex-wrap items-center gap-1.5 sm:gap-2
                  cursor-pointer
                  transition
                  focus-within:border-primary-500
                  focus-within:ring-2
                  focus-within:ring-primary-100
                `}
              >
                {selectedCollegeIds.length === 0 ? (
                  <span className="px-2 text-xs sm:text-sm text-text-muted">
                    Select colleges to pitch...
                  </span>
                ) : (
                  selectedCollegeIds.map((id) => {
                    const college = colleges.find((c) => c.id === id);
                    if (!college) return null;

                    return (
                      <span
                        key={id}
                        className="
                          inline-flex items-center gap-1 sm:gap-1.5
                          rounded-full
                          bg-primary-50
                          border border-primary-200
                          px-2.5 sm:px-3 py-1
                          text-[11px] sm:text-xs font-medium text-primary-700
                          shadow-xs
                          max-w-full
                        "
                      >
                        <span className="truncate max-w-[140px] sm:max-w-none">{college.name}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveCollege(id);
                          }}
                          className="rounded-full p-0.5 hover:bg-primary-200 hover:text-primary-900 transition shrink-0 cursor-pointer"
                        >
                          <X size={12} className="sm:w-3.5 sm:h-3.5" />
                        </button>
                      </span>
                    );
                  })
                )}

                <div className="ml-auto pr-1 text-text-muted">
                  <ChevronDown
                    size={18}
                    className={`transition-transform ${
                      isCollegeDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </div>

              {/* College Dropdown Menu */}
              {isCollegeDropdownOpen && (
                <div
                  className="
                    absolute
                    left-0 right-0
                    top-full
                    z-50
                    mt-1
                    max-h-60
                    overflow-y-auto
                    rounded-lg
                    border border-border
                    bg-surface
                    py-1
                    shadow-lg
                  "
                >
                  {colleges.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-text-muted text-center">
                      No active colleges available
                    </div>
                  ) : unselectedColleges.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-text-muted text-center">
                      All colleges selected
                    </div>
                  ) : (
                    unselectedColleges.map((college) => (
                      <button
                        key={college.id}
                        type="button"
                        onClick={() => handleSelectCollege(college.id)}
                        className="
                          w-full
                          px-3.5 sm:px-4 py-2 sm:py-2.5
                          text-left text-xs sm:text-sm
                          text-text-primary
                          hover:bg-neutral-100
                          flex items-center justify-between
                          transition
                          cursor-pointer
                        "
                      >
                        <div className="min-w-0">
                          <p className="font-medium truncate">{college.name}</p>
                          {college.city && (
                            <p className="text-[11px] sm:text-xs text-text-muted truncate">
                              {college.city}
                              {college.state ? `, ${college.state}` : ""}
                            </p>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            {touched.colleges && errors.colleges && (
              <p className="mt-1 text-xs text-red-500">{errors.colleges}</p>
            )}
          </div>

          {/* Negative Colleges */}
          {/* Negative Colleges */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-text-secondary">
              Negative Colleges <span className="text-text-muted font-normal">(Colleges lead is not interested in)</span>
            </label>

            <div className="relative">
              <div
                className={`
                  min-h-[44px]
                  w-full
                  rounded-lg
                  border
                  ${negativeCollegeError ? "border-rose-500 ring-1 ring-rose-200" : "border-border"}
                  bg-surface
                  p-2
                  flex flex-wrap items-center gap-1.5 sm:gap-2
                  cursor-text
                  transition
                  focus-within:border-primary-500
                  focus-within:ring-2
                  focus-within:ring-primary-100
                `}
                onClick={() => setIsNegativeDropdownOpen(true)}
              >
                {selectedNegativeColleges.map((collegeName) => (
                  <span
                    key={collegeName}
                    className="
                      inline-flex items-center gap-1 sm:gap-1.5
                      rounded-full
                      bg-gray-100 dark:bg-gray-800
                      border border-gray-200 dark:border-gray-700
                      px-2.5 sm:px-3 py-1
                      text-[11px] sm:text-xs font-medium text-gray-700 dark:text-gray-300
                      shadow-xs
                      max-w-full
                    "
                  >
                    <span className="truncate max-w-[140px] sm:max-w-none">{collegeName}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveNegativeCollege(collegeName);
                      }}
                      className="rounded-full p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition shrink-0 cursor-pointer"
                    >
                      <X size={12} className="sm:w-3.5 sm:h-3.5" />
                    </button>
                  </span>
                ))}
                
                <input
                  type="text"
                  placeholder={selectedNegativeColleges.length === 0 ? "Search or type college..." : ""}
                  className="flex-1 bg-transparent min-w-[120px] outline-none text-xs sm:text-sm"
                  value={negativeSearchQuery}
                  onChange={(e) => {
                    setNegativeSearchQuery(e.target.value);
                    setIsNegativeDropdownOpen(true);
                  }}
                  onFocus={() => setIsNegativeDropdownOpen(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (negativeSearchQuery.trim()) {
                        handleAddNegativeCollege(negativeSearchQuery);
                      }
                    }
                  }}
                />
              </div>

              {/* Negative College Dropdown Menu */}
              {isNegativeDropdownOpen && negativeSearchQuery.trim() !== "" && (
                <div
                  className="
                    absolute
                    left-0 right-0
                    top-full
                    z-50
                    mt-1
                    max-h-60
                    overflow-y-auto
                    rounded-lg
                    border border-border
                    bg-surface
                    py-1
                    shadow-lg
                  "
                >
                  {isSearchingNegative ? (
                    <div className="px-4 py-3 text-sm text-text-muted text-center">
                      Searching...
                    </div>
                  ) : negativeSuggestions.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-text-muted text-center">
                      <p>No matching college found.</p>
                      <p className="mt-1 font-medium text-text-primary">Press Enter to add "{negativeSearchQuery}"</p>
                    </div>
                  ) : (
                    negativeSuggestions.map((college) => (
                      <button
                        key={college.id}
                        type="button"
                        onClick={() => handleAddNegativeCollege(college.name)}
                        className="
                          w-full
                          px-3.5 sm:px-4 py-2 sm:py-2.5
                          text-left text-xs sm:text-sm
                          text-text-primary
                          hover:bg-rose-50 dark:hover:bg-rose-950/30
                          flex items-center justify-between
                          transition
                          cursor-pointer
                        "
                      >
                        <div className="min-w-0">
                          <p className="font-medium truncate">{college.name}</p>
                          {college.city && (
                            <p className="text-[11px] sm:text-xs text-text-muted truncate">
                              {college.city}
                              {college.state ? `, ${college.state}` : ""}
                            </p>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {negativeCollegeError && (
              <p className="mt-1.5 text-xs font-medium text-rose-600">
                {negativeCollegeError}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* SECTION 3 — LEAD INFORMATION (Open by default) */}
      <section className="space-y-4 pt-2">
        <div>
          <h3 className="text-sm sm:text-base font-semibold text-text-primary">
            3. Lead Information
          </h3>
          <p className="mt-0.5 text-xs text-text-secondary">
            Lead acquisition channel and initial pipeline status.
          </p>
          <div className="mt-2 border-b border-border" />
        </div>

        <div className="grid grid-cols-1 gap-3.5 sm:gap-4 sm:grid-cols-2">
          <Select
            label="Lead Source"
            name="source"
            value={formData.source}
            onChange={(e) => {
              const val = e.target.value;
              const next = { ...formData, source: val };
              if (val !== "OTHER") {
                next.sourceOther = "";
                setErrors((prev) => ({ ...prev, sourceOther: null }));
              }
              setFormData(next);
              if (touched.source) {
                setErrors((prev) => ({ ...prev, source: validateLeadField("source", val, next) }));
              }
            }}
            onBlur={() => handleBlur("source")}
            touched={touched.source}
            error={errors.source}
            options={[
              { value: "CAT", label: "CAT" },
              { value: "NMAT", label: "NMAT" },
              { value: "MHCET", label: "MHCET" },
              { value: "MAT", label: "MAT" },
              { value: "IBSAT", label: "IBSAT" },
              { value: "SNAP", label: "SNAP" },
              { value: "OTHER", label: "Other" },
            ]}
            required
          />

          {formData.source === "OTHER" && (
            <Input
              label="Specify Lead Source"
              name="sourceOther"
              value={formData.sourceOther}
              onChange={handleChange}
              onBlur={() => handleBlur("sourceOther")}
              touched={touched.sourceOther}
              error={errors.sourceOther}
              placeholder="Enter lead source"
              required
            />
          )}

          <Select
            label="Lead Status"
            name="statusId"
            value={formData.statusId}
            onChange={handleChange}
            options={[
              { value: "", label: "Default (LEAD)" },
              ...leadStatuses.map((status) => ({
                value: String(status.id),
                label: status.name.replace(/_/g, " "),
              })),
            ]}
          />
        </div>
      </section>

      {/* SECTION 4 — ACADEMIC INFORMATION (Collapsible, collapsed by default) */}
      <CollapsibleSection
        title="4. Academic Information"
        subtitle="Schooling, 10th, 12th, and graduation background details"
        isOpen={isAcademicOpen}
        onToggle={() => setIsAcademicOpen(!isAcademicOpen)}
      >
        {/* 10th Subsection */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-primary-600 uppercase tracking-wider bg-primary-50 px-2 py-0.5 rounded">
              10th Standard
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label="School Name"
              name="tenthSchoolName"
              value={formData.tenthSchoolName}
              onChange={handleChange}
              placeholder="e.g. St. Xavier's High School"
            />
            <Input
              label="Board"
              name="tenthBoard"
              value={formData.tenthBoard}
              onChange={handleChange}
              placeholder="e.g. CBSE / ICSE / State Board"
            />
            <Input
              type="number"
              label="Passout Year"
              name="tenthPassoutYear"
              value={formData.tenthPassoutYear}
              onChange={handleChange}
              placeholder="e.g. 2019"
              min="1950"
              max="2100"
            />
            <ScoreInput
              label="10th Score"
              name="tenthPercentage"
              value={formData.tenthPercentage}
              onChange={handleChange}
              scoreType={tenthScoreType}
              onScoreTypeChange={setTenthScoreType}
            />
          </div>
        </div>

        <div className="border-b border-border/60 my-2" />

        {/* 12th Subsection */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-primary-600 uppercase tracking-wider bg-primary-50 px-2 py-0.5 rounded">
              12th / Diploma Standard
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label="School Name"
              name="twelfthSchoolName"
              value={formData.twelfthSchoolName}
              onChange={handleChange}
              placeholder="e.g. Delhi Public School"
            />
            <Input
              label="Board"
              name="twelfthBoard"
              value={formData.twelfthBoard}
              onChange={handleChange}
              placeholder="e.g. CBSE / ISC / State Board"
            />
            <Input
              type="number"
              label="Passout Year"
              name="twelfthPassoutYear"
              value={formData.twelfthPassoutYear}
              onChange={handleChange}
              placeholder="e.g. 2021"
              min="1950"
              max="2100"
            />
            <ScoreInput
              label="12th Score"
              name="twelfthPercentage"
              value={formData.twelfthPercentage}
              onChange={handleChange}
              scoreType={twelfthScoreType}
              onScoreTypeChange={setTwelfthScoreType}
            />
          </div>
        </div>

        <div className="border-b border-border/60 my-2" />

        {/* Graduation Subsection */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-primary-600 uppercase tracking-wider bg-primary-50 px-2 py-0.5 rounded">
              Graduation / Undergraduate
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label="College Name"
              name="graduationCollegeName"
              value={formData.graduationCollegeName}
              onChange={handleChange}
              placeholder="e.g. Loyola College"
            />
            <Input
              label="University"
              name="graduationUniversity"
              value={formData.graduationUniversity}
              onChange={handleChange}
              placeholder="e.g. Mumbai University"
            />
            <Input
              label="Graduation Course"
              name="graduationCourse"
              value={formData.graduationCourse}
              onChange={handleChange}
              placeholder="e.g. B.Tech / B.Com / BBA"
            />
            <Input
              label="Graduation Specialization"
              name="graduationSpecialization"
              value={formData.graduationSpecialization}
              onChange={handleChange}
              placeholder="e.g. Computer Science"
            />
            <Input
              type="number"
              label="Passout Year"
              name="graduationPassoutYear"
              value={formData.graduationPassoutYear}
              onChange={handleChange}
              placeholder="e.g. 2024"
              min="1950"
              max="2100"
            />
            <ScoreInput
              label="Graduation Score"
              name="graduationPercentage"
              value={formData.graduationPercentage}
              onChange={handleChange}
              scoreType={graduationScoreType}
              onScoreTypeChange={setGraduationScoreType}
            />
          </div>
        </div>
      </CollapsibleSection>

      {/* SECTION 5 — FAMILY INFORMATION (Collapsible, collapsed by default) */}
      <CollapsibleSection
        title="5. Family Information"
        subtitle="Parental details and residential address"
        isOpen={isFamilyOpen}
        onToggle={() => setIsFamilyOpen(!isFamilyOpen)}
      >
        <div className="grid grid-cols-1 gap-3.5 sm:gap-4 sm:grid-cols-2">
          <Input
            label="Father's Name"
            name="fatherName"
            value={formData.fatherName}
            onChange={handleChange}
            placeholder="Enter father's name"
          />

          <Input
            label="Father's Occupation"
            name="fatherOccupation"
            value={formData.fatherOccupation}
            onChange={handleChange}
            placeholder="e.g. Businessman / Engineer"
          />

          <div className="sm:col-span-2">
            <Input
              label="Father's Phone Number"
              name="fatherPhone"
              value={formData.fatherPhone}
              onChange={handleChange}
              onBlur={() => handleBlur("fatherPhone")}
              touched={touched.fatherPhone}
              error={errors.fatherPhone}
              placeholder="e.g. 9876543210"
              maxLength={10}
            />
          </div>

          <Input
            label="Mother's Name"
            name="motherName"
            value={formData.motherName}
            onChange={handleChange}
            placeholder="Enter mother's name"
          />

          <Input
            label="Mother's Occupation"
            name="motherOccupation"
            value={formData.motherOccupation}
            onChange={handleChange}
            placeholder="e.g. Homemaker / Teacher"
          />

          <div className="sm:col-span-2">
            <Input
              label="Mother's Phone Number"
              name="motherPhone"
              value={formData.motherPhone}
              onChange={handleChange}
              onBlur={() => handleBlur("motherPhone")}
              touched={touched.motherPhone}
              error={errors.motherPhone}
              placeholder="e.g. 9876543210"
              maxLength={10}
            />
          </div>

          <div className="sm:col-span-2">
            <TextArea
              label="Physical Address"
              name="physicalAddress"
              value={formData.physicalAddress}
              onChange={handleChange}
              rows={3}
              placeholder="Enter complete residential address"
            />
          </div>
        </div>
      </CollapsibleSection>

      {/* SECTION 6 — COURSE INTEREST (Collapsible, collapsed by default) */}
      <CollapsibleSection
        title="6. Course Interest"
        subtitle="Preferred academic course and area of specialization"
        isOpen={isCourseInterestOpen}
        onToggle={() => setIsCourseInterestOpen(!isCourseInterestOpen)}
      >
        <div className="grid grid-cols-1 gap-3.5 sm:gap-4 sm:grid-cols-2">
          <Select
            label="Course Interested"
            name="courseInterested"
            value={formData.courseInterested}
            onChange={(e) => {
              const val = e.target.value;
              const next = { ...formData, courseInterested: val };
              if (val !== "OTHER") {
                next.courseInterestedOther = "";
                setErrors((prev) => ({ ...prev, courseInterestedOther: null }));
              }
              setFormData(next);
              if (touched.courseInterested) {
                setErrors((prev) => ({ ...prev, courseInterested: validateLeadField("courseInterested", val, next) }));
              }
            }}
            onBlur={() => handleBlur("courseInterested")}
            touched={touched.courseInterested}
            error={errors.courseInterested}
            options={[
              { value: "MBA", label: "MBA" },
              { value: "PGDM", label: "PGDM" },
              { value: "MCA", label: "MCA" },
              { value: "BBA", label: "BBA" },
              { value: "OTHER", label: "Other" },
            ]}
          />

          {formData.courseInterested === "OTHER" && (
            <Input
              label="Specify Course"
              name="courseInterestedOther"
              value={formData.courseInterestedOther}
              onChange={handleChange}
              onBlur={() => handleBlur("courseInterestedOther")}
              touched={touched.courseInterestedOther}
              error={errors.courseInterestedOther}
              placeholder="Enter course name"
              required
            />
          )}

          <Input
            label="Specialization Interested"
            name="specializationInterested"
            value={formData.specializationInterested}
            onChange={handleChange}
            placeholder="e.g. Finance / Marketing / Business Analytics"
          />
        </div>
      </CollapsibleSection>

      {/* SECTION 7 — CALLING PREFERENCES (Collapsible, collapsed by default) */}
      <CollapsibleSection
        title="7. Calling Preferences"
        subtitle="Preferred timeframe to contact the lead"
        isOpen={isCallingPrefOpen}
        onToggle={() => setIsCallingPrefOpen(!isCallingPrefOpen)}
      >
        <div>
          <Select
            label="Best Time to Call"
            name="bestTimeToCall"
            value={formData.bestTimeToCall}
            onChange={handleChange}
            options={[
              { value: "Morning (9 AM - 12 PM)", label: "Morning (9 AM - 12 PM)" },
              { value: "Afternoon (12 PM - 4 PM)", label: "Afternoon (12 PM - 4 PM)" },
              { value: "Evening (4 PM - 8 PM)", label: "Evening (4 PM - 8 PM)" },
              { value: "After 6 PM", label: "After 6 PM" },
              { value: "Weekend Only", label: "Weekend Only" },
              { value: "Anytime", label: "Anytime" },
            ]}
          />
        </div>
      </CollapsibleSection>

      {/* SECTION 8 — NOTES (Collapsible, collapsed by default) */}
      <CollapsibleSection
        title="8. Notes"
        subtitle="Additional multi-line notes or counselor instructions"
        isOpen={isNotesOpen}
        onToggle={() => setIsNotesOpen(!isNotesOpen)}
      >
        <div>
          <TextArea
            label="Counselor Notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={4}
            placeholder="e.g. Parent wants to discuss fees. Call after 6 PM."
          />
        </div>
      </CollapsibleSection>

      {/* SECTION 9 — ACTIONS (Form Footer) */}
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 sm:gap-3 border-t border-border pt-4 sm:pt-6">
        <button
          type="submit"
          disabled={loading}
          className="
            w-full sm:w-auto
            rounded-lg
            bg-primary-500
            px-6 py-2.5
            text-sm font-medium text-white
            transition
            hover:bg-primary-600
            disabled:opacity-50
            cursor-pointer
            shadow-xs
          "
        >
          {loading
            ? isEdit
              ? "Saving Changes..."
              : "Creating Lead..."
            : isEdit
            ? "Save Changes"
            : "Create Lead"}
        </button>
      </div>

      {/* Lead Pipeline Drawer for stage transition */}
      {activePipelineStatus && (initialLead || updatedLeadState) && (
        <LeadPipelineDrawer
          lead={(updatedLeadState || initialLead) as LeadItem}
          targetStatus={activePipelineStatus}
          onClose={() => setActivePipelineStatus(null)}
          onSuccess={(updated) => {
            setActivePipelineStatus(null);
            if (onSuccess) {
              onSuccess(updated);
            }
          }}
        />
      )}
    </form>
  );
};

/* ---------------- Subcomponents ---------------- */

type CollapsibleSectionProps = {
  title: string;
  subtitle?: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
};

const CollapsibleSection = ({
  title,
  subtitle,
  isOpen,
  onToggle,
  children,
}: CollapsibleSectionProps) => {
  return (
    <div className="rounded-xl border border-border bg-surface shadow-xs transition duration-150 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3.5 sm:p-4 text-left hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition cursor-pointer select-none"
      >
        <div>
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            {title}
          </h3>
          {subtitle && (
            <p className="mt-0.5 text-xs text-text-secondary">{subtitle}</p>
          )}
        </div>
        <div
          className={`p-1 text-text-muted transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          <ChevronDown size={18} />
        </div>
      </button>
      {isOpen && (
        <div className="border-t border-border p-3.5 sm:p-5 bg-surface space-y-4">
          {children}
        </div>
      )}
    </div>
  );
};

type InputProps = {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  touched?: boolean;
  error?: string | null;
  placeholder?: string;
  type?: string;
  required?: boolean;
  min?: string;
  max?: string;
  maxLength?: number;
  wrapperClassName?: string;
};

const Input = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  touched,
  error,
  placeholder,
  type = "text",
  required,
  min,
  max,
  maxLength,
  wrapperClassName = "",
}: InputProps) => {
  const inputClass = getFieldValidationClass(
    touched,
    error,
    "h-10 w-full rounded-lg border bg-surface px-3.5 text-xs sm:text-sm text-text-primary outline-none transition placeholder:text-text-muted"
  );

  return (
    <div className={wrapperClassName}>
      <label className="mb-1.5 block text-xs font-semibold text-text-secondary">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        min={min}
        max={max}
        maxLength={maxLength}
        className={inputClass}
      />
      {touched && error && (
        <p className="mt-1 text-xs text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  );
};

type SelectOption = {
  value: string;
  label: string;
};

type SelectProps = {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLSelectElement>) => void;
  touched?: boolean;
  error?: string | null;
  options: SelectOption[];
  required?: boolean;
};

const Select = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  touched,
  error,
  options,
  required,
}: SelectProps) => {
  const selectClass = getFieldValidationClass(
    touched,
    error,
    "h-10 w-full rounded-lg border bg-surface px-3.5 text-xs sm:text-sm text-text-primary outline-none transition"
  );

  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-text-secondary">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      <select
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        className={selectClass}
      >
        <option value="">Select {label.toLowerCase()}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {touched && error && (
        <p className="mt-1 text-xs text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  );
};

type TextAreaProps = {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  touched?: boolean;
  error?: string | null;
  placeholder?: string;
  rows?: number;
  required?: boolean;
};

const TextArea = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  touched,
  error,
  placeholder,
  rows = 3,
  required,
}: TextAreaProps) => {
  const textAreaClass = getFieldValidationClass(
    touched,
    error,
    "w-full rounded-lg border bg-surface p-3 text-xs sm:text-sm text-text-primary outline-none transition placeholder:text-text-muted"
  );

  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-text-secondary">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      <textarea
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        rows={rows}
        placeholder={placeholder}
        className={textAreaClass}
      />
      {touched && error && (
        <p className="mt-1 text-xs text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  );
};

export default CreateLeadForm;

/* ---------------- ScoreInput Subcomponent ---------------- */

type ScoreType = "percentage" | "cgpa";

type ScoreInputProps = {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  scoreType: ScoreType;
  onScoreTypeChange: (type: ScoreType) => void;
  touched?: boolean;
  error?: string | null;
};

const ScoreInput = ({
  label,
  name,
  value,
  onChange,
  scoreType,
  onScoreTypeChange,
  touched,
  error,
}: ScoreInputProps) => {
  const maxVal = scoreType === "percentage" ? 100 : 10;
  const placeholder = scoreType === "percentage" ? "e.g. 85.5" : "e.g. 7.8";

  // Validate inline: only show error if value is non-empty and out of range
  const numVal = parseFloat(value);
  const rangeError =
    value !== "" && !isNaN(numVal) && (numVal < 0 || numVal > maxVal)
      ? scoreType === "percentage"
        ? `Percentage must be between 0 and 100`
        : `CGPA must be between 0 and 10`
      : null;

  const displayError = error || rangeError;
  const effectiveTouched = touched || (value !== "" && rangeError !== null);

  const inputClass = getFieldValidationClass(
    effectiveTouched,
    displayError,
    "h-10 w-full rounded-lg border bg-surface px-3.5 text-xs sm:text-sm text-text-primary outline-none transition placeholder:text-text-muted"
  );

  return (
    <div>
      {/* Label row with Score Type toggle */}
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label className="text-xs font-semibold text-text-secondary">{label}</label>
        <div className="flex items-center rounded-md border border-border overflow-hidden text-[11px] font-medium shrink-0">
          <button
            type="button"
            onClick={() => onScoreTypeChange("percentage")}
            className={`px-2 py-0.5 transition ${
              scoreType === "percentage"
                ? "bg-primary-500 text-white"
                : "bg-surface text-text-muted hover:bg-neutral-100"
            }`}
          >
            %
          </button>
          <button
            type="button"
            onClick={() => onScoreTypeChange("cgpa")}
            className={`px-2 py-0.5 transition ${
              scoreType === "cgpa"
                ? "bg-primary-500 text-white"
                : "bg-surface text-text-muted hover:bg-neutral-100"
            }`}
          >
            CGPA
          </button>
        </div>
      </div>

      {/* Score input — uses text type so decimals like 7.82 are never mangled */}
      <input
        type="text"
        inputMode="decimal"
        name={name}
        value={value}
        onChange={(e) => {
          // Allow digits, one decimal point, and empty string only
          const raw = e.target.value;
          if (raw === "" || /^\d*\.?\d*$/.test(raw)) {
            onChange(e);
          }
        }}
        placeholder={placeholder}
        className={inputClass}
      />

      {/* Helper text showing allowed range */}
      <p className="mt-0.5 text-[11px] text-text-muted">
        {scoreType === "percentage" ? "Range: 0 – 100" : "Range: 0 – 10"}
      </p>

      {effectiveTouched && displayError && (
        <p className="mt-1 text-xs text-red-500 dark:text-red-400">{displayError}</p>
      )}
    </div>
  );
};