import { useEffect, useState, useCallback } from "react";
import {
  Building2,
  Plus,
  MapPin,
  Edit3,
  RefreshCw,
  AlertTriangle,
  ShieldCheck,
  Radio,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import {
  fetchOffices,
  updateOfficeStatus,
  type OfficeItem,
} from "../../../services/officeService";
import OfficeDrawer from "../components/OfficeDrawer";

const OfficeSettingsPage = () => {
  const { accessToken } = useAuth();
  const toast = useToast();

  const [offices, setOffices] = useState<OfficeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusUpdatingId, setStatusUpdatingId] = useState<number | null>(null);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [officeToEdit, setOfficeToEdit] = useState<OfficeItem | null>(null);

  const loadOffices = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const data = await fetchOffices(accessToken);
      setOffices(data);
    } catch (err: any) {
      console.error("Failed to load offices:", err);
      toast.error(err.message || "Failed to load office locations.");
    } finally {
      setLoading(false);
    }
  }, [accessToken, toast]);

  useEffect(() => {
    loadOffices();
  }, [loadOffices]);

  const handleOpenCreate = () => {
    setOfficeToEdit(null);
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (office: OfficeItem) => {
    setOfficeToEdit(office);
    setIsDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
    setOfficeToEdit(null);
  };

  const handleOfficeSaved = (savedOffice: OfficeItem) => {
    setOffices((prev) => {
      const idx = prev.findIndex((o) => o.id === savedOffice.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = savedOffice;
        return next;
      }
      return [savedOffice, ...prev];
    });
  };

  const handleToggleStatus = async (office: OfficeItem) => {
    if (!accessToken) return;
    const newStatus = !office.isActive;
    setStatusUpdatingId(office.id);

    try {
      const updated = await updateOfficeStatus(accessToken, office.id, newStatus);
      setOffices((prev) =>
        prev.map((o) => (o.id === updated.id ? updated : o))
      );
      toast.success(
        `Office "${office.name}" ${newStatus ? "activated" : "deactivated"} successfully!`
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to update office status.");
    } finally {
      setStatusUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">
            Office & Attendance Settings
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Configure physical offices, GPS geofences, and check-in radiuses for employee attendance verification.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadOffices}
            title="Refresh office list"
            className="p-2.5 rounded-lg border border-border bg-surface text-text-secondary hover:bg-neutral-100 transition"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-600 shadow-sm"
          >
            <Plus size={18} />
            Add Office
          </button>
        </div>
      </div>

      {/* Office Cards Grid */}
      {loading ? (
        <div className="flex items-center justify-center p-16 text-sm text-text-secondary bg-surface rounded-xl border border-border">
          <RefreshCw className="animate-spin mr-2 text-primary-500" size={20} />
          Loading office locations...
        </div>
      ) : offices.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 text-center bg-surface rounded-xl border border-border">
          <div className="w-14 h-14 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center mb-4">
            <Building2 size={28} />
          </div>
          <h3 className="text-lg font-semibold text-text-primary">
            No Offices Configured
          </h3>
          <p className="text-sm text-text-secondary mt-1 max-w-md leading-relaxed">
            Create physical office locations with GPS coordinates so employees can check in for attendance upon logging in.
          </p>
          <button
            onClick={handleOpenCreate}
            className="mt-6 flex items-center gap-2 rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-600 transition"
          >
            <Plus size={18} />
            Configure First Office
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offices.map((office) => {
            const hasLocation =
              office.latitude !== null &&
              office.latitude !== undefined &&
              office.longitude !== null &&
              office.longitude !== undefined;

            const isUpdating = statusUpdatingId === office.id;

            return (
              <div
                key={office.id}
                className="bg-surface rounded-xl border border-border overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between"
              >
                <div className="p-6 space-y-4">
                  {/* Top Bar: Title & Active Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2.5 rounded-xl shrink-0 ${
                          office.isActive && hasLocation
                            ? "bg-primary-50 text-primary-600"
                            : "bg-neutral-100 text-neutral-500"
                        }`}
                      >
                        <Building2 size={22} />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-text-primary">
                          {office.name}
                        </h3>
                        <p className="text-xs text-text-secondary">
                          {[office.city, office.state].filter(Boolean).join(", ") ||
                            "Location Unspecified"}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        office.isActive
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          office.isActive ? "bg-emerald-600" : "bg-rose-600"
                        }`}
                      />
                      {office.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {/* Address */}
                  {office.address && (
                    <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">
                      {office.address}
                    </p>
                  )}

                  {/* Location & Radius Details */}
                  <div className="rounded-lg bg-neutral-50 p-3.5 space-y-2 border border-border/60 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary flex items-center gap-1.5 font-medium">
                        <MapPin size={14} className="text-primary-600 shrink-0" />
                        Coordinates:
                      </span>
                      {hasLocation ? (
                        <span className="font-mono font-medium text-text-primary">
                          {office.latitude?.toFixed(6)}, {office.longitude?.toFixed(6)}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          <AlertTriangle size={12} /> Location not configured
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-neutral-200/60">
                      <span className="text-text-secondary flex items-center gap-1.5 font-medium">
                        <Radio size={14} className="text-emerald-600 shrink-0" />
                        Allowed Geofence Radius:
                      </span>
                      <span className="font-semibold text-text-primary">
                        {office.radiusMeters || 100} meters
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="px-6 py-3.5 bg-neutral-50/70 border-t border-border flex items-center justify-between">
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => handleToggleStatus(office)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition flex items-center gap-1.5 ${
                      office.isActive
                        ? "border-rose-200 text-rose-700 hover:bg-rose-50"
                        : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                    }`}
                  >
                    {isUpdating ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <ShieldCheck size={14} />
                    )}
                    {office.isActive ? "Deactivate" : "Activate"}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEdit(office)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-text-primary hover:bg-white transition"
                  >
                    <Edit3 size={14} className="text-primary-600" />
                    Edit Location
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Drawer Component */}
      {isDrawerOpen && (
        <OfficeDrawer
          officeToEdit={officeToEdit}
          onClose={handleDrawerClose}
          onSuccess={handleOfficeSaved}
        />
      )}
    </div>
  );
};

export default OfficeSettingsPage;
