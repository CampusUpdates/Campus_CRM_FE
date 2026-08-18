import { useState, useEffect } from "react";
import createLead, { getColleges, type CreateLeadDto, type CollegeItem } from "../../../services/leadService";
import { useToast } from "../../../context/ToastContext";
import { INDIAN_STATES, INDIAN_STATES_AND_CITIES } from "../../../data/indianStatesAndCities";
import { X } from "lucide-react";

type CreateLeadFormProps = {
  onSuccess?: () => void;
  onCancel?: () => void;
};

const initialFormState = {
  firstName: "",
  lastName: "",
  phone: "",
  alternatePhone: "",
  email: "",
  gender: "",
  dateOfBirth: "",
  state: "",
  city: "",
  tenthPercentage: "",
  twelfthPercentage: "",
  graduationPercentage: "",
  graduationCourse: "",
  graduationSpecialization: "",
  courseInterested: "",
  specializationInterested: "",
  passingYear: "",
  source: "",
};

const CreateLeadForm = ({ onSuccess, onCancel }: CreateLeadFormProps) => {
  const [formData, setFormData] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { showToast } = useToast();

  const [colleges, setColleges] = useState<CollegeItem[]>([]);
  const [loadingColleges, setLoadingColleges] = useState(false);
  const [selectedCollegeIds, setSelectedCollegeIds] = useState<string[]>([]);

  useEffect(() => {
    let isMounted = true;
    const fetchColleges = async () => {
      setLoadingColleges(true);
      try {
        const data = await getColleges(true);
        if (isMounted) {
          setColleges(data);
        }
      } catch (err) {
        console.error("Failed to load active colleges:", err);
      } finally {
        if (isMounted) {
          setLoadingColleges(false);
        }
      }
    };

    fetchColleges();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "state" ? { city: "" } : {}),
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const payload: CreateLeadDto = {
        firstName: formData.firstName.trim(),
        phone: formData.phone.trim(),
        source: formData.source as any,
      };

      if (formData.lastName.trim()) payload.lastName = formData.lastName.trim();
      if (formData.alternatePhone.trim()) payload.alternatePhone = formData.alternatePhone.trim();
      if (formData.email.trim()) payload.email = formData.email.trim();
      if (formData.gender) payload.gender = formData.gender as any;
      if (formData.dateOfBirth) payload.dateOfBirth = new Date(formData.dateOfBirth).toISOString();
      if (formData.state) payload.state = formData.state;
      if (formData.city) payload.city = formData.city;

      if (formData.tenthPercentage) payload.tenthPercentage = parseFloat(formData.tenthPercentage);
      if (formData.twelfthPercentage) payload.twelfthPercentage = parseFloat(formData.twelfthPercentage);
      if (formData.graduationPercentage) payload.graduationPercentage = parseFloat(formData.graduationPercentage);

      if (formData.graduationCourse.trim()) payload.graduationCourse = formData.graduationCourse.trim();
      if (formData.graduationSpecialization.trim()) payload.graduationSpecialization = formData.graduationSpecialization.trim();
      if (formData.courseInterested) payload.courseInterested = formData.courseInterested as any;
      if (formData.specializationInterested.trim()) payload.specializationInterested = formData.specializationInterested.trim();
      if (formData.passingYear) payload.passingYear = parseInt(formData.passingYear, 10);

      if (selectedCollegeIds.length > 0) {
        payload.collegeIds = selectedCollegeIds;
      }

      await createLead(payload);

      const msg = `Lead "${formData.firstName}" created successfully!`;
      setSuccess(msg);
      showToast(msg, "success");
      setFormData(initialFormState);
      setSelectedCollegeIds([]);

      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 800);
      }
    } catch (err: any) {
      const errMsg = err.message || "Failed to create lead.";
      setError(errMsg);
      showToast(errMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  const availableCities = formData.state && INDIAN_STATES_AND_CITIES[formData.state]
    ? INDIAN_STATES_AND_CITIES[formData.state]
    : [];

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Notifications */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {success}
        </div>
      )}

      {/* Personal Information */}
      <section>
        <div className="mb-5">
          <h3 className="text-base font-semibold text-text-primary">
            Personal Information
          </h3>

          <p className="mt-1 text-sm text-text-secondary">
            Basic contact details and location of the lead.
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
            type="date"
            label="Date of Birth"
            name="dateOfBirth"
            value={formData.dateOfBirth}
            onChange={handleChange}
          />

          <Select
            label="State"
            name="state"
            value={formData.state}
            onChange={handleChange}
            placeholder="Select State"
            options={INDIAN_STATES.map((state) => ({
              value: state,
              label: state,
            }))}
          />

          <Select
            label="City"
            name="city"
            value={formData.city}
            onChange={handleChange}
            disabled={!formData.state}
            placeholder={formData.state ? "Select City" : "Select state first"}
            options={availableCities.map((city) => ({
              value: city,
              label: city,
            }))}
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
            Add the academic background of the lead.
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

      {/* Course Interest */}
      <section>
        <div className="mb-5">
          <h3 className="text-base font-semibold text-text-primary">
            Course & College Interest
          </h3>

          <p className="mt-1 text-sm text-text-secondary">
            What does the lead want to study and which colleges are they interested in?
          </p>
        </div>

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

          <CollegeMultiSelect
            colleges={colleges}
            selectedIds={selectedCollegeIds}
            onChange={setSelectedCollegeIds}
            loadingColleges={loadingColleges}
          />

        </div>
      </section>

      {/* Lead Information */}
      <section>
        <div className="mb-5">
          <h3 className="text-base font-semibold text-text-primary">
            Lead Information
          </h3>

          <p className="mt-1 text-sm text-text-secondary">
            Tell us how this lead came to us.
          </p>
        </div>

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
      </section>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 border-t border-border pt-6">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="
              rounded-lg
              border border-border
              bg-surface
              px-4
              py-2.5
              text-sm
              font-medium
              text-text-secondary
              transition
              hover:bg-neutral-100
              disabled:opacity-50
            "
          >
            Cancel
          </button>
        )}

        <button
          type="submit"
          disabled={loading}
          className="
            flex items-center gap-2
            rounded-lg
            bg-primary-500
            px-5
            py-2.5
            text-sm
            font-medium
            text-white
            transition
            hover:bg-primary-600
            disabled:opacity-50
          "
        >
          {loading ? "Creating..." : "Create Lead"}
        </button>
      </div>

    </form>
  );
};


/* ---------------- Input ---------------- */

type InputProps = {
  label: string;
  name: string;
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement>
  ) => void;
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
          border
          border-border
          bg-surface
          px-4
          text-sm
          text-text-primary
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
  onChange: (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => void;
  options: SelectOption[];
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
};

const Select = ({
  label,
  name,
  value,
  onChange,
  options,
  required,
  disabled,
  placeholder,
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
        disabled={disabled}
        className="
          h-11
          w-full
          rounded-lg
          border
          border-border
          bg-surface
          px-4
          text-sm
          text-text-primary
          outline-none
          transition
          disabled:bg-neutral-100
          disabled:text-text-muted
          disabled:cursor-not-allowed
          focus:border-primary-500
          focus:ring-2
          focus:ring-primary-100
        "
      >
        <option value="">{placeholder || `Select ${label.toLowerCase()}`}</option>

        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};


/* ---------------- College Multi-Select ---------------- */

type CollegeMultiSelectProps = {
  colleges: CollegeItem[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  loadingColleges?: boolean;
};

const CollegeMultiSelect = ({
  colleges,
  selectedIds,
  onChange,
  loadingColleges,
}: CollegeMultiSelectProps) => {
  const selectedColleges = colleges.filter((c) => selectedIds.includes(c.id));
  const availableColleges = colleges.filter((c) => !selectedIds.includes(c.id));

  const handleAdd = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    if (id && !selectedIds.includes(id)) {
      onChange([...selectedIds, id]);
    }
  };

  const handleRemove = (id: string) => {
    onChange(selectedIds.filter((item) => item !== id));
  };

  return (
    <div className="col-span-1 md:col-span-2">
      <label className="mb-2 block text-sm font-medium text-text-primary">
        Colleges Interested
      </label>

      <div className="min-h-[52px] w-full rounded-lg border border-border bg-surface p-2 transition focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-100 flex flex-wrap items-center gap-2">
        {selectedColleges.map((college) => (
          <span
            key={college.id}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-700 border border-primary-200 shadow-xs transition hover:bg-primary-100"
          >
            {college.name}
            <button
              type="button"
              onClick={() => handleRemove(college.id)}
              className="rounded-full p-0.5 text-primary-500 hover:bg-primary-200 hover:text-primary-800 transition-colors"
              title={`Remove ${college.name}`}
            >
              <X size={14} />
            </button>
          </span>
        ))}

        <select
          value=""
          onChange={handleAdd}
          disabled={loadingColleges || availableColleges.length === 0}
          className="h-9 flex-1 min-w-[180px] bg-transparent text-sm text-text-primary outline-none cursor-pointer disabled:cursor-not-allowed disabled:text-text-muted"
        >
          <option value="" disabled>
            {loadingColleges
              ? "Loading colleges..."
              : availableColleges.length === 0
              ? selectedIds.length > 0
                ? "All colleges selected"
                : "No active colleges available"
              : "Select college ▾"}
          </option>
          {availableColleges.map((college) => (
            <option key={college.id} value={college.id}>
              {college.name} {college.city ? `(${college.city})` : ""}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default CreateLeadForm;