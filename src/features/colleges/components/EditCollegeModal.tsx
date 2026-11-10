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
          w-full sm:w-[480px] md:w-[560px] lg:w-[640px] xl:w-[40vw]
          max-w-full
          bg-surface
          shadow-2xl
          flex flex-col
          ${isClosing ? "animate-slide-out" : "animate-slide-in"}
        `}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-4 sm:px-6 py-4 sm:py-5 gap-2">
          <div className="min-w-0 pr-2">
            <h2 className="text-lg sm:text-xl font-semibold text-text-primary truncate">
              Edit College
            </h2>
            <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-text-secondary truncate">
              Update details for {college.name}
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Close modal"
            className="
              shrink-0
              rounded-lg
              p-1.5 sm:p-2
              text-text-secondary
              transition
              hover:bg-neutral-100
              dark:hover:bg-neutral-800
              hover:text-text-primary
              cursor-pointer
            "
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Form */}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 custom-scrollbar">
          <form id="edit-college-form" onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
            {errorMsg && (
              <div className="rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 p-3 sm:p-4 text-xs sm:text-sm text-rose-700 dark:text-rose-300">
                {errorMsg}
              </div>
            )}

            {/* Basic Information */}
            <section className="space-y-4">
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-text-primary">
                  Basic Information
                </h3>
                <p className="mt-0.5 text-xs sm:text-sm text-text-secondary">
                  Primary details of the institution.
                </p>
              </div>

              <div className="space-y-4">
                <Input
                  label="College Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Apex Institute of Technology"
                  required
                />

                <div>
                  <label className="mb-1.5 block text-xs sm:text-sm font-medium text-text-primary">
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
                      box-border
                      rounded-lg
                      border border-border
                      bg-surface
                      p-3 sm:p-3.5
                      text-xs sm:text-sm text-text-primary
                      outline-none
                      transition
                      placeholder:text-text-muted
                      focus:border-primary-500
                      focus:ring-2
                      focus:ring-primary-100 dark:focus:ring-primary-950/40
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
            <section className="space-y-4">
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-text-primary">
                  Contact Details
                </h3>
                <p className="mt-0.5 text-xs sm:text-sm text-text-secondary">
                  Point of contact and communication info.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

                <div className="sm:col-span-2">
                  <Input
                    type="email"
                    label="Email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="e.g. admissions@apex.edu.in"
                  />
                </div>
              </div>
            </section>

            {/* Location */}
            <section className="space-y-4">
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-text-primary">
                  Location
                </h3>
                <p className="mt-0.5 text-xs sm:text-sm text-text-secondary">
                  Physical address and location details.
                </p>
              </div>

              <div className="space-y-4">
                <Input
                  label="Address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Campus address..."
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            <section className="space-y-4">
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-text-primary">
                  Admission & Institutional Status
                </h3>
                <p className="mt-0.5 text-xs sm:text-sm text-text-secondary">
                  Process guidelines and active partnership flags.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs sm:text-sm font-medium text-text-primary">
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
                      box-border
                      rounded-lg
                      border border-border
                      bg-surface
                      p-3 sm:p-3.5
                      text-xs sm:text-sm text-text-primary
                      outline-none
                      transition
                      placeholder:text-text-muted
                      focus:border-primary-500
                      focus:ring-2
                      focus:ring-primary-100 dark:focus:ring-primary-950/40
                    "
                  />
                </div>

                <div className="flex flex-col gap-2.5 pt-1">
                  <label className="flex items-start sm:items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="hasTieUp"
                      checked={formData.hasTieUp}
                      onChange={handleChange}
                      className="mt-0.5 sm:mt-0 h-4 w-4 shrink-0 rounded border-border text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-xs sm:text-sm font-medium text-text-primary">
                      Official Partnership / Tie-Up Established
                    </span>
                  </label>

                  <label className="flex items-start sm:items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleChange}
                      className="mt-0.5 sm:mt-0 h-4 w-4 shrink-0 rounded border-border text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-xs sm:text-sm font-medium text-text-primary">
                      Mark as Active College
                    </span>
                  </label>

                  <label className="flex items-start sm:items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="requiresApproval"
                      checked={formData.requiresApproval}
                      onChange={handleChange}
                      className="mt-0.5 sm:mt-0 h-4 w-4 shrink-0 rounded border-border text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-xs sm:text-sm font-medium text-text-primary">
                      Requires Manager Approval for Lead Pitches
                    </span>
                  </label>
                </div>
              </div>
            </section>
          </form>
        </div>

        {/* Footer */}
        <div className="shrink-0 flex items-center justify-end gap-2.5 border-t border-border bg-surface px-4 sm:px-6 py-3 sm:py-3.5">
          <button
            type="button"
            onClick={handleClose}
            className="
              inline-flex items-center justify-center
              h-[38px]
              px-4
              rounded-lg
              border border-border
              bg-surface
              text-xs sm:text-sm font-semibold
              text-text-secondary
              hover:text-text-primary
              hover:bg-neutral-100 dark:hover:bg-neutral-800
              hover:border-neutral-300 dark:hover:border-neutral-700
              transition
              shadow-2xs
              whitespace-nowrap
              cursor-pointer
            "
          >
            Cancel
          </button>
          <button
            type="submit"
            form="edit-college-form"
            disabled={loading}
            className="
              inline-flex items-center justify-center
              h-[38px]
              px-4
              rounded-lg
              bg-emerald-600 hover:bg-emerald-700
              text-white
              text-xs sm:text-sm font-semibold
              transition
              shadow-2xs
              whitespace-nowrap
              cursor-pointer
              disabled:opacity-50
              disabled:cursor-not-allowed
            "
          >
            {loading ? "Updating College..." : "Save Changes"}
          </button>
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
      <label className="mb-1.5 block text-xs sm:text-sm font-medium text-text-primary">
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
          h-10 sm:h-11
          w-full
          box-border
          rounded-lg
          border border-border
          bg-surface
          px-3.5 sm:px-4
          text-xs sm:text-sm text-text-primary
          outline-none
          transition
          placeholder:text-text-muted
          focus:border-primary-500
          focus:ring-2
          focus:ring-primary-100 dark:focus:ring-primary-950/40
        "
      />
    </div>
  );
};

export default EditCollegeModal;
