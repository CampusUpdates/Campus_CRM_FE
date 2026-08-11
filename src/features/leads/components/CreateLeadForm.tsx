import { useState } from "react";

const CreateLeadForm = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    alternatePhone: "",
    email: "",
    gender: "",
    dateOfBirth: "",
    tenthPercentage: "",
    twelfthPercentage: "",
    graduationPercentage: "",
    graduationCourse: "",
    graduationSpecialization: "",
    courseInterested: "",
    specializationInterested: "",
    passingYear: "",
    source: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    console.log(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">

      {/* Personal Information */}
      <section>
        <div className="mb-5">
          <h3 className="text-base font-semibold text-text-primary">
            Personal Information
          </h3>

          <p className="mt-1 text-sm text-text-secondary">
            Basic contact information of the lead.
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
            Course Interest
          </h3>

          <p className="mt-1 text-sm text-text-secondary">
            What does the lead want to study?
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
      <div className="flex justify-end gap-3 border-t border-border pt-6">
        <button
          type="submit"
          className="
            rounded-lg
            bg-primary-500
            px-5
            py-2.5
            text-sm
            font-medium
            text-white
            transition
            hover:bg-primary-600
          "
        >
          Create Lead
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
          border
          border-border
          bg-surface
          px-4
          text-sm
          text-text-primary
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