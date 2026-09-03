import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import {
  updateCollege,
  type College,
  type UpdateCollegePayload,
} from "../../../services/collegeService";

type EditCollegeModalProps = {
  college: College;
  onClose: () => void;
  onSuccess: () => void;
};

const EditCollegeModal = ({
  college,
  onClose,
  onSuccess,
}: EditCollegeModalProps) => {
  const { accessToken } = useAuth();
  const toast = useToast();
  const [isClosing, setIsClosing] = useState(false);

  const [formData, setFormData] = useState({
    name: college.name || "",
    description: college.description || "",
    contactPerson: college.contactPerson || "",
    phone: college.phone || "",
    email: college.email || "",
    website: college.website || "",
    address: college.address || "",
    city: college.city || "",
    state: college.state || "",
    admissionProcess: college.admissionProcess || "",
    hasTieUp: college.hasTieUp ?? false,
    isActive: college.isActive ?? true,
    requiresApproval: college.requiresApproval ?? false,
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setFormData({
      name: college.name || "",
      description: college.description || "",
      contactPerson: college.contactPerson || "",
      phone: college.phone || "",
      email: college.email || "",
      website: college.website || "",
      address: college.address || "",
      city: college.city || "",
      state: college.state || "",
      admissionProcess: college.admissionProcess || "",
      hasTieUp: college.hasTieUp ?? false,
      isActive: college.isActive ?? true,
      requiresApproval: college.requiresApproval ?? false,
    });
  }, [college]);

  const handleClose = () => {
    setIsClosing(true);
  };

  const handleAnimationEnd = () => {
    if (isClosing) {
      onClose();
    }
  };

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

    if (
      formData.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())
    ) {
      const msg = "Please enter a valid email address";
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const payload: UpdateCollegePayload = {
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
        requiresApproval: formData.requiresApproval,
      };

      await updateCollege(accessToken, college.id, payload);
      toast.success("College updated successfully!");
      onSuccess();
      handleClose();
    } catch (err: any) {
      const msg = err.message || "Failed to update college";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

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
          <div>
            <h2 className="text-xl font-semibold text-text-primary">
              Edit College
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              Update details for {college.name}
            </p>
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

        {/* Scrollable Form */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
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

                <div className="flex flex-col gap-3 pt-2">
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

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="requiresApproval"
                      checked={formData.requiresApproval}
                      onChange={handleChange}
                      className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm font-medium text-text-primary">
                      Requires Manager Approval for Lead Pitches
                    </span>
                  </label>
                </div>
              </div>
            </section>

            {/* Submit Button */}
            <div className="flex justify-end gap-3 border-t border-border pt-6">
              <button
                type="button"
                onClick={handleClose}
                className="
                  rounded-lg
                  border border-border
                  px-5 py-2.5
                  text-sm font-medium text-text-secondary
                  transition
                  hover:bg-neutral-100
                "
              >
                Cancel
              </button>
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
                {loading ? "Updating College..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

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

export default EditCollegeModal;
