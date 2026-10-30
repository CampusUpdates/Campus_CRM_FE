import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import { createCollege, type CreateCollegePayload } from "../../../services/collegeService";
import { getFieldValidationClass } from "../../../utils/formValidation";

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

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const validateCollegeField = (name: string, value: any): string | null => {
    if (name === "name" && !String(value || "").trim()) {
      return "College name is required";
    }
    if (name === "description" && !String(value || "").trim()) {
      return "College description is required";
    }
    if (name === "email" && String(value || "").trim()) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim())) {
        return "Please enter a valid email address";
      }
    }
    return null;
  };

  const handleBlur = (name: string) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    const err = validateCollegeField(name, (formData as any)[name]);
    setErrors((prev) => ({ ...prev, [name]: err }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    let nextVal: any = value;
    if (type === "checkbox") {
      nextVal = (e.target as HTMLInputElement).checked;
    }
    const nextData = { ...formData, [name]: nextVal };
    setFormData(nextData);

    if (touched[name]) {
      const err = validateCollegeField(name, nextVal);
      setErrors((prev) => ({ ...prev, [name]: err }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!accessToken) return;

    const allFields = ["name", "description", "contactPerson", "phone", "email", "website", "address", "city", "state", "admissionProcess"];
    const newTouched: Record<string, boolean> = {};
    const newErrors: Record<string, string | null> = {};
    let hasError = false;

    allFields.forEach((f) => {
      newTouched[f] = true;
      const err = validateCollegeField(f, (formData as any)[f]);
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
    <form onSubmit={handleSubmit} noValidate className="space-y-8">
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
            onBlur={() => handleBlur("name")}
            touched={touched.name}
            error={errors.name}
            placeholder="e.g. Apex Institute of Technology"
            required
          />

          <div>
            <label className="mb-2 block text-xs font-semibold text-text-secondary">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              onBlur={() => handleBlur("description")}
              placeholder="Provide a brief overview of the college..."
              rows={3}
              className={getFieldValidationClass(touched.description, errors.description, "w-full rounded-lg border bg-surface p-4 text-sm text-text-primary outline-none transition placeholder:text-text-muted")}
            />
            {touched.description && errors.description && (
              <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.description}</p>
            )}
          </div>

          <Input
            label="Website URL"
            name="website"
            value={formData.website}
            onChange={handleChange}
            onBlur={() => handleBlur("website")}
            touched={touched.website}
            error={errors.website}
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
            onBlur={() => handleBlur("contactPerson")}
            touched={touched.contactPerson}
            error={errors.contactPerson}
            placeholder="e.g. Dr. Rajesh Sharma"
          />

          <Input
            label="Phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            onBlur={() => handleBlur("phone")}
            touched={touched.phone}
            error={errors.phone}
            placeholder="e.g. +91 9876543210"
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
            onBlur={() => handleBlur("address")}
            touched={touched.address}
            error={errors.address}
            placeholder="Campus address..."
          />

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Input
              label="City"
              name="city"
              value={formData.city}
              onChange={handleChange}
              onBlur={() => handleBlur("city")}
              touched={touched.city}
              error={errors.city}
              placeholder="e.g. Bhopal"
            />

            <Input
              label="State"
              name="state"
              value={formData.state}
              onChange={handleChange}
              onBlur={() => handleBlur("state")}
              touched={touched.state}
              error={errors.state}
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
            <label className="mb-2 block text-xs font-semibold text-text-secondary">
              Admission Process Details
            </label>
            <textarea
              name="admissionProcess"
              value={formData.admissionProcess}
              onChange={handleChange}
              onBlur={() => handleBlur("admissionProcess")}
              placeholder="Describe eligibility criteria, counseling rounds, entrance exam preferences..."
              rows={3}
              className={getFieldValidationClass(touched.admissionProcess, errors.admissionProcess, "w-full rounded-lg border bg-surface p-4 text-sm text-text-primary outline-none transition placeholder:text-text-muted")}
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
  onBlur?: () => void;
  touched?: boolean;
  error?: string | null;
  placeholder?: string;
  type?: string;
  required?: boolean;
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
}: InputProps) => {
  const inputClass = getFieldValidationClass(
    touched,
    error,
    "h-11 w-full rounded-lg border bg-surface px-4 text-sm text-text-primary outline-none transition placeholder:text-text-muted"
  );

  return (
    <div>
      <label className="mb-2 block text-xs font-semibold text-text-secondary">
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
        className={inputClass}
      />
      {touched && error && (
        <p className="mt-1 text-xs text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  );
};

export default CreateCollegeForm;
