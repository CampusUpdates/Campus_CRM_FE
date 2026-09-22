import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import {
  createCandidate,
  type CreateCandidatePayload,
  type GenderType,
} from "../../../services/candidateService";
import { fetchPositions, type Position } from "../../../services/positionService";

type AddCandidateFormProps = {
  onSuccess?: () => void;
};

const AddCandidateForm = ({ onSuccess }: AddCandidateFormProps) => {
  const { accessToken } = useAuth();
  const toast = useToast();

  const [positions, setPositions] = useState<Position[]>([]);
  const [loadingPositions, setLoadingPositions] = useState(true);

  const [formData, setFormData] = useState<CreateCandidatePayload>({
    positionId: 0,
    firstName: "",
    lastName: "",
    phone: "",
    alternatePhone: "",
    email: "",
    gender: undefined,
    dateOfBirth: "",
    experience: undefined,
    currentCompany: "",
    resumeUrl: "",
    status: "APPLIED",
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadPositions() {
      try {
        const data = await fetchPositions(accessToken || undefined);
        setPositions(data);
        if (data.length > 0) {
          setFormData((prev) => ({ ...prev, positionId: data[0].id }));
        }
      } catch (err) {
        console.error("Failed to load positions:", err);
      } finally {
        setLoadingPositions(false);
      }
    }
    loadPositions();
  }, [accessToken]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === "positionId" || name === "experience") {
      setFormData((prev) => ({
        ...prev,
        [name]: value ? Number(value) : undefined,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!formData.positionId) {
      setErrorMsg("Please select a job position.");
      return;
    }

    if (!formData.firstName.trim()) {
      setErrorMsg("First name is required.");
      return;
    }

    if (!formData.phone.trim()) {
      setErrorMsg("Phone number is required.");
      return;
    }

    setLoading(true);

    try {
      const payload: CreateCandidatePayload = {
        ...formData,
        positionId: Number(formData.positionId),
        lastName: formData.lastName?.trim() || undefined,
        alternatePhone: formData.alternatePhone?.trim() || undefined,
        email: formData.email?.trim() || undefined,
        gender: (formData.gender as GenderType) || undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
        experience: formData.experience !== undefined ? Number(formData.experience) : undefined,
        currentCompany: formData.currentCompany?.trim() || undefined,
        resumeUrl: formData.resumeUrl?.trim() || undefined,
      };

      await createCandidate(accessToken, payload);
      toast.showToast("Candidate added successfully!", "success");
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to add candidate.");
      toast.showToast(err.message || "Failed to add candidate.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {errorMsg && (
        <div className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600 border border-red-200">
          {errorMsg}
        </div>
      )}

      {/* Target Job Position */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">
          Job Position <span className="text-red-500">*</span>
        </label>
        {loadingPositions ? (
          <div className="text-xs text-text-muted">Loading open positions...</div>
        ) : (
          <select
            name="positionId"
            required
            value={formData.positionId || ""}
            onChange={handleChange}
            className="
              w-full rounded-lg border border-border bg-background px-3.5 py-2.5
              text-sm text-text-primary focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500
            "
          >
            <option value="" disabled>
              Select Job Position
            </option>
            {positions.map((pos) => (
              <option key={pos.id} value={pos.id}>
                {pos.title} ({pos.department})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Names */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            First Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="firstName"
            required
            value={formData.firstName}
            onChange={handleChange}
            placeholder="John"
            className="
              w-full rounded-lg border border-border bg-background px-3.5 py-2.5
              text-sm text-text-primary placeholder:text-text-muted
              focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500
            "
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            Last Name
          </label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName || ""}
            onChange={handleChange}
            placeholder="Doe"
            className="
              w-full rounded-lg border border-border bg-background px-3.5 py-2.5
              text-sm text-text-primary placeholder:text-text-muted
              focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500
            "
          />
        </div>
      </div>

      {/* Phones */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            name="phone"
            required
            value={formData.phone}
            onChange={handleChange}
            placeholder="+91 9876543210"
            className="
              w-full rounded-lg border border-border bg-background px-3.5 py-2.5
              text-sm text-text-primary placeholder:text-text-muted
              focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500
            "
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            Alternate Phone
          </label>
          <input
            type="tel"
            name="alternatePhone"
            value={formData.alternatePhone || ""}
            onChange={handleChange}
            placeholder="+91 9876543211"
            className="
              w-full rounded-lg border border-border bg-background px-3.5 py-2.5
              text-sm text-text-primary placeholder:text-text-muted
              focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500
            "
          />
        </div>
      </div>

      {/* Email & Gender */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            Email Address
          </label>
          <input
            type="email"
            name="email"
            value={formData.email || ""}
            onChange={handleChange}
            placeholder="candidate@example.com"
            className="
              w-full rounded-lg border border-border bg-background px-3.5 py-2.5
              text-sm text-text-primary placeholder:text-text-muted
              focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500
            "
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            Gender
          </label>
          <select
            name="gender"
            value={formData.gender || ""}
            onChange={handleChange}
            className="
              w-full rounded-lg border border-border bg-background px-3.5 py-2.5
              text-sm text-text-primary focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500
            "
          >
            <option value="">Select Gender</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      </div>

      {/* Date of Birth & Experience */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            Date of Birth
          </label>
          <input
            type="date"
            name="dateOfBirth"
            value={formData.dateOfBirth || ""}
            onChange={handleChange}
            className="
              w-full rounded-lg border border-border bg-background px-3.5 py-2.5
              text-sm text-text-primary focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500
            "
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            Experience (Years)
          </label>
          <input
            type="number"
            name="experience"
            min="0"
            value={formData.experience !== undefined ? formData.experience : ""}
            onChange={handleChange}
            placeholder="e.g. 3"
            className="
              w-full rounded-lg border border-border bg-background px-3.5 py-2.5
              text-sm text-text-primary placeholder:text-text-muted
              focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500
            "
          />
        </div>
      </div>

      {/* Current Company & Resume URL */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            Current Company
          </label>
          <input
            type="text"
            name="currentCompany"
            value={formData.currentCompany || ""}
            onChange={handleChange}
            placeholder="e.g. Acme Corp"
            className="
              w-full rounded-lg border border-border bg-background px-3.5 py-2.5
              text-sm text-text-primary placeholder:text-text-muted
              focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500
            "
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            Resume URL
          </label>
          <input
            type="url"
            name="resumeUrl"
            value={formData.resumeUrl || ""}
            onChange={handleChange}
            placeholder="https://drive.google.com/..."
            className="
              w-full rounded-lg border border-border bg-background px-3.5 py-2.5
              text-sm text-text-primary placeholder:text-text-muted
              focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500
            "
          />
        </div>
      </div>

      {/* Status */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">
          Initial Application Status
        </label>
        <select
          name="status"
          value={formData.status}
          onChange={handleChange}
          className="
            w-full rounded-lg border border-border bg-background px-3.5 py-2.5
            text-sm text-text-primary focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500
          "
        >
          <option value="APPLIED">Applied</option>
          <option value="SCREENING">Screening</option>
          <option value="INTERVIEW_SCHEDULED">Interview Scheduled</option>
          <option value="INTERVIEWED">Interviewed</option>
          <option value="SELECTED">Selected</option>
          <option value="REJECTED">Rejected</option>
          <option value="HIRED">Hired</option>
        </select>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
        <button
          type="button"
          onClick={onSuccess}
          disabled={loading}
          className="
            rounded-lg border border-border px-4 py-2.5
            text-sm font-medium text-text-secondary
            hover:bg-neutral-100 transition disabled:opacity-50
          "
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={loading || loadingPositions}
          className="
            flex items-center gap-2 rounded-lg bg-primary-500 px-5 py-2.5
            text-sm font-medium text-white hover:bg-primary-600
            transition disabled:opacity-50
          "
        >
          {loading ? "Adding Candidate..." : "Add Candidate"}
        </button>
      </div>
    </form>
  );
};

export default AddCandidateForm;
