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
    dateOfBirth: initialLead?.dateOfBirth ? initialLead.dateOfBirth.split("T")[0] : "",
    tenthPercentage: initialLead?.tenthPercentage ? String(initialLead.tenthPercentage) : "",
    twelfthPercentage: initialLead?.twelfthPercentage ? String(initialLead.twelfthPercentage) : "",
    graduationPercentage: initialLead?.graduationPercentage ? String(initialLead.graduationPercentage) : "",
    graduationCourse: initialLead?.graduationCourse || "",
    graduationSpecialization: initialLead?.graduationSpecialization || "",
    courseInterested: initialLead?.courseInterested || "",
    specializationInterested: initialLead?.specializationInterested || "",
    passingYear: initialLead?.passingYear ? String(initialLead.passingYear) : "",
    source: initialLead?.source || "",
    statusId: initialLead?.statusId ? String(initialLead.statusId) : (initialLead?.status?.id ? String(initialLead.status.id) : ""),
  });

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

  const [isCollegeDropdownOpen, setIsCollegeDropdownOpen] = useState(false);
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectCollege = (collegeId: string) => {
    if (!selectedCollegeIds.includes(collegeId)) {
      setSelectedCollegeIds((prev) => [...prev, collegeId]);
    }
    setIsCollegeDropdownOpen(false);
  };

  const handleRemoveCollege = (collegeId: string) => {
    setSelectedCollegeIds((prev) => prev.filter((id) => id !== collegeId));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!accessToken) return;

    if (!formData.firstName.trim()) {
      const msg = "First name is required";
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }

    if (!formData.phone.trim()) {
      const msg = "Phone number is required";
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }

    if (!formData.email.trim()) {
      const msg = "Email is required";
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      const msg = "Please enter a valid email address";
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }

    if (!formData.city.trim()) {
      const msg = "City is required";
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }

    if (!formData.state.trim()) {
      const msg = "State is required";
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }

    if (selectedCollegeIds.length === 0) {
      const msg = "At least one college must be selected.";
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);
    setErrorMsg(null);

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
        tenthPercentage: formData.tenthPercentage ? Number(formData.tenthPercentage) : undefined,
        twelfthPercentage: formData.twelfthPercentage ? Number(formData.twelfthPercentage) : undefined,
        graduationPercentage: formData.graduationPercentage ? Number(formData.graduationPercentage) : undefined,
        graduationCourse: formData.graduationCourse.trim() || undefined,
        graduationSpecialization: formData.graduationSpecialization.trim() || undefined,
        courseInterested: formData.courseInterested || undefined,
        specializationInterested: formData.specializationInterested.trim() || undefined,
        passingYear: formData.passingYear ? Number(formData.passingYear) : undefined,
        collegeIds: selectedCollegeIds,
        source: formData.source || "OTHER",
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
          // Exclude statusId from ordinary lead update payload so pipeline endpoint handles pipeline status transition
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
        const created = await createLead(accessToken, payload);
        toast.success("Lead created successfully!");
        if (onSuccess) {
          onSuccess(created);
        }
      }
    } catch (err: any) {
      const msg = err.message || (isEdit ? "Failed to update lead" : "Failed to create lead");
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
    <form onSubmit={handleSubmit} className="space-y-8">
      {initialLead && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 space-y-1">
          <div className="flex items-center justify-between text-emerald-900 font-bold text-xs">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={16} className="text-emerald-600" />
              Student Information Prefilled
            </span>
            <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[11px] font-semibold">
              Required: Select College
            </span>
          </div>
          <p className="text-[11px] text-emerald-700">
            Contact details ({[formData.firstName, formData.lastName].filter(Boolean).join(" ")}, {formData.phone}) are automatically prefilled from dataset.
          </p>
        </div>
      )}

      {errorMsg && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 p-4 text-sm text-rose-700">
          {errorMsg}
        </div>
      )}


      {/* Personal Information */}
      <section>
        <div className="mb-5">
          <h3 className="text-base font-semibold text-text-primary">
            Personal Information
          </h3>
          <p className="mt-1 text-sm text-text-secondary">
            Basic contact information and location of the lead.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Input
            label="First Name"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            placeholder="Enter first name"
            required
          />

          <Input
            label="Last Name"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            placeholder="Enter last name"
          />

          <Input
            label="Phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Enter phone number"
            required
          />

          <Input
            label="Alternate Phone"
            name="alternatePhone"
            value={formData.alternatePhone}
            onChange={handleChange}
            placeholder="Enter alternate phone"
          />

          <Input
            type="email"
            label="Email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter email"
            required
          />

          <Select
            label="Gender"
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            options={[
              { value: "MALE", label: "Male" },
              { value: "FEMALE", label: "Female" },
              { value: "OTHER", label: "Other" },
            ]}
          />

          <Input
            label="City"
            name="city"
            value={formData.city}
            onChange={handleChange}
            placeholder="e.g. Bhopal"
            required
          />

          <Input
            label="State"
            name="state"
            value={formData.state}
            onChange={handleChange}
            placeholder="e.g. Madhya Pradesh"
            required
          />

          <Input
            type="date"
            label="Date of Birth"
            name="dateOfBirth"
            value={formData.dateOfBirth}
            onChange={handleChange}
          />
        </div>
      </section>

      {/* Academic Information */}
      <section>
        <div className="mb-5">
          <h3 className="text-base font-semibold text-text-primary">
            Academic Information
          </h3>
          <p className="mt-1 text-sm text-text-secondary">
            Add or update the academic background of the lead.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <Input
            type="number"
            label="10th Percentage"
            name="tenthPercentage"
            value={formData.tenthPercentage}
            onChange={handleChange}
            placeholder="e.g. 85"
            min="0"
            max="100"
          />

          <Input
            type="number"
            label="12th Percentage"
            name="twelfthPercentage"
            value={formData.twelfthPercentage}
            onChange={handleChange}
            placeholder="e.g. 80"
            min="0"
            max="100"
          />

          <Input
            type="number"
            label="Graduation Percentage"
            name="graduationPercentage"
            value={formData.graduationPercentage}
            onChange={handleChange}
            placeholder="e.g. 75"
            min="0"
            max="100"
          />

          <Input
            label="Graduation Course"
            name="graduationCourse"
            value={formData.graduationCourse}
            onChange={handleChange}
            placeholder="e.g. B.Tech"
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
            label="Passing Year"
            name="passingYear"
            value={formData.passingYear}
            onChange={handleChange}
            placeholder="e.g. 2026"
          />
        </div>
      </section>

      {/* Course Interest & Application Colleges */}
      <section>
        <div className="mb-5">
          <h3 className="text-base font-semibold text-text-primary">
            Course Interest & Application Colleges
          </h3>
          <p className="mt-1 text-sm text-text-secondary">
            Specify course interest and select colleges for application.
          </p>
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Select
              label="Course Interested"
              name="courseInterested"
              value={formData.courseInterested}
              onChange={handleChange}
              options={[
                { value: "MBA", label: "MBA" },
                { value: "PGDM", label: "PGDM" },
                { value: "MCA", label: "MCA" },
                { value: "BBA", label: "BBA" },
              ]}
            />

            <Input
              label="Specialization Interested"
              name="specializationInterested"
              value={formData.specializationInterested}
              onChange={handleChange}
              placeholder="e.g. Finance"
            />
          </div>

          {/* College Multi-Select Pill Input */}
          <div>
            <label className="mb-2 block text-sm font-medium text-text-primary">
              Application Colleges <span className="ml-1 text-danger-500">*</span>
            </label>

            <div className="relative">
              <div
                onClick={() => setIsCollegeDropdownOpen(!isCollegeDropdownOpen)}
                className="
                  min-h-[44px]
                  w-full
                  rounded-lg
                  border
                  border-border
                  bg-surface
                  p-2
                  flex flex-wrap items-center gap-2
                  cursor-pointer
                  transition
                  focus-within:border-primary-500
                  focus-within:ring-2
                  focus-within:ring-primary-100
                "
              >
                {selectedCollegeIds.length === 0 ? (
                  <span className="px-2 text-sm text-text-muted">
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
                          inline-flex items-center gap-1.5
                          rounded-full
                          bg-primary-50
                          border border-primary-200
                          px-3 py-1
                          text-xs font-medium text-primary-700
                          shadow-xs
                        "
                      >
                        {college.name}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveCollege(id);
                          }}
                          className="rounded-full p-0.5 hover:bg-primary-200 hover:text-primary-900 transition"
                        >
                          <X size={13} />
                        </button>
                      </span>
                    );
                  })
                )}

                <div className="ml-auto pr-2 text-text-muted">
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
                          px-4 py-2.5
                          text-left text-sm
                          text-text-primary
                          hover:bg-neutral-100
                          flex items-center justify-between
                          transition
                        "
                      >
                        <div>
                          <p className="font-medium">{college.name}</p>
                          {college.city && (
                            <p className="text-xs text-text-muted">
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
          </div>
        </div>
      </section>

      {/* Lead Source & Status */}
      <section>
        <div className="mb-5">
          <h3 className="text-base font-semibold text-text-primary">
            Lead Source & Status
          </h3>
          <p className="mt-1 text-sm text-text-secondary">
            Specify how this lead was acquired and set its initial pipeline status.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Select
            label="Lead Source"
            name="source"
            value={formData.source}
            onChange={handleChange}
            options={[
              { value: "WEBSITE", label: "Website" },
              { value: "FACEBOOK", label: "Facebook" },
              { value: "INSTAGRAM", label: "Instagram" },
              { value: "GOOGLE", label: "Google" },
              { value: "REFERRAL", label: "Referral" },
              { value: "DATA_UPLOAD", label: "Data Upload" },
              { value: "COLLEGE_EVENT", label: "College Event" },
              { value: "OTHER", label: "Other" },
            ]}
            required
          />

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

      {/* Submit Button */}
      <div className="flex justify-end gap-3 border-t border-border pt-6">
        <button
          type="submit"
          disabled={loading}
          className="
            rounded-lg
            bg-primary-500
            px-5 py-2.5
            text-sm font-medium text-white
            transition
            hover:bg-primary-600
            disabled:opacity-50
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

type InputProps = {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  min?: string;
  max?: string;
};

const Input = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
  min,
  max,
}: InputProps) => {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-text-primary">
        {label}
        {required && <span className="ml-1 text-danger-500">*</span>}
      </label>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        min={min}
        max={max}
        className="
          h-11
          w-full
          rounded-lg
          border border-border
          bg-surface
          px-4
          text-sm text-text-primary
          outline-none
          transition
          placeholder:text-text-muted
          focus:border-primary-500
          focus:ring-2
          focus:ring-primary-100
        "
      />
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
  options: SelectOption[];
  required?: boolean;
};

const Select = ({
  label,
  name,
  value,
  onChange,
  options,
  required,
}: SelectProps) => {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-text-primary">
        {label}
        {required && <span className="ml-1 text-danger-500">*</span>}
      </label>

      <select
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="
          h-11
          w-full
          rounded-lg
          border border-border
          bg-surface
          px-4
          text-sm text-text-primary
          outline-none
          transition
          focus:border-primary-500
          focus:ring-2
          focus:ring-primary-100
        "
      >
        <option value="">Select {label.toLowerCase()}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default CreateLeadForm;