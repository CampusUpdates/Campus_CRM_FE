import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import { createCollege, type CreateCollegePayload } from "../../../services/collegeService";

type CreateCollegeFormProps = {
  onSuccess?: () => void;
};

const CreateCollegeForm = ({ onSuccess }: CreateCollegeFormProps) => {
  const { accessToken } = useAuth();
  const toast = useToast();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    contactPerson: "",
    phone: "",
    email: "",
    website: "",
    address: "",
    city: "",
    state: "",
    admissionProcess: "",
    hasTieUp: false,
    isActive: true,
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!accessToken) return;

    // Client-side validation
    if (!formData.name.trim()) {
      const msg = "College name is required";
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }

    if (!formData.description.trim()) {
      const msg = "College description is required";
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      const msg = "Please enter a valid email address";
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const payload: CreateCollegePayload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        contactPerson: formData.contactPerson.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        email: formData.email.trim() || undefined,
        website: formData.website.trim() || undefined,
        address: formData.address.trim() || undefined,
        city: formData.city.trim() || undefined,
        state: formData.state.trim() || undefined,
        admissionProcess: formData.admissionProcess.trim() || undefined,
        hasTieUp: formData.hasTieUp,
        isActive: formData.isActive,
      };

      await createCollege(accessToken, payload);
      toast.success("College created successfully!");
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      const msg = err.message || "Failed to create college";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {errorMsg && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 p-4 text-sm text-rose-700">
          {errorMsg}
        </div>
      )}

      {/* Basic Information */}
      <section>
        <div className="mb-5">
          <h3 className="text-base font-semibold text-text-primary">
            Basic Information
          </h3>
          <p className="mt-1 text-sm text-text-secondary">
            Primary details of the institution.
          </p>
        </div>

        <div className="space-y-5">
          <Input
            label="College Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. Apex Institute of Technology"
            required
          />

          <div>
            <label className="mb-2 block text-sm font-medium text-text-primary">
              Description <span className="text-danger-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Provide a brief overview of the college..."
              rows={3}
              required
              className="
                w-full
                rounded-lg
                border border-border
                bg-surface
                p-4
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

          <Input
            label="Website URL"
            name="website"
            value={formData.website}
            onChange={handleChange}
            placeholder="e.g. https://apex.edu.in"
          />
        </div>
      </section>

      {/* Contact Person & Communication */}
      <section>
        <div className="mb-5">
          <h3 className="text-base font-semibold text-text-primary">
            Contact Details
          </h3>
          <p className="mt-1 text-sm text-text-secondary">
            Point of contact and communication info.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Input
            label="Contact Person"
            name="contactPerson"
            value={formData.contactPerson}
            onChange={handleChange}
            placeholder="e.g. Dr. Rajesh Sharma"
          />

          <Input
            label="Phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="e.g. +91 9876543210"
          />

          <Input
            type="email"
            label="Email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="e.g. admissions@apex.edu.in"
          />
        </div>
      </section>

      {/* Location */}
      <section>
        <div className="mb-5">
          <h3 className="text-base font-semibold text-text-primary">
            Location
          </h3>
          <p className="mt-1 text-sm text-text-secondary">
            Physical address and location details.
          </p>
        </div>

        <div className="space-y-5">
          <Input
            label="Address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Campus address..."
          />

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Input
              label="City"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="e.g. Bhopal"
            />

            <Input
              label="State"
              name="state"
              value={formData.state}
              onChange={handleChange}
              placeholder="e.g. Madhya Pradesh"
            />
          </div>
        </div>
      </section>

      {/* Admission Process & Status Flags */}
      <section>
        <div className="mb-5">
          <h3 className="text-base font-semibold text-text-primary">
            Admission & Institutional Status
          </h3>
          <p className="mt-1 text-sm text-text-secondary">
            Process guidelines and active partnership flags.
          </p>
        </div>

        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-text-primary">
              Admission Process Details
            </label>
            <textarea
              name="admissionProcess"
              value={formData.admissionProcess}
              onChange={handleChange}
              placeholder="Describe eligibility criteria, counseling rounds, entrance exam preferences..."
              rows={3}
              className="
                w-full
                rounded-lg
                border border-border
                bg-surface
                p-4
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

          <div className="flex flex-col sm:flex-row gap-6 pt-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="hasTieUp"
                checked={formData.hasTieUp}
                onChange={handleChange}
                className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-text-primary">
                Official Partnership / Tie-Up Established
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-text-primary">
                Mark as Active College
              </span>
            </label>
          </div>
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
          {loading ? "Creating College..." : "Create College"}
        </button>
      </div>
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
};

const Input = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
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

export default CreateCollegeForm;
