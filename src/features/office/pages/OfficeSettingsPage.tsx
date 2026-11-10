import { useEffect, useState, useCallback } from "react";
import {
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
import { Tooltip } from "../../../components/Tooltip";
import {
  fetchOffices,
  updateOfficeStatus,
  type OfficeItem,
} from "../../../services/officeService";
import OfficeDrawer from "../components/OfficeDrawer";
import {
  PageLoadingState,
  PageErrorState,
  PageEmptyState,
} from "../../../components/common";

const OfficeSettingsPage = () => {
  const { accessToken } = useAuth();
  const toast = useToast();

  const [offices, setOffices] = useState<OfficeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<number | null>(null);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [officeToEdit, setOfficeToEdit] = useState<OfficeItem | null>(null);

  const loadOffices = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchOffices(accessToken);
      setOffices(data);
    } catch (err: any) {
      console.error("Failed to load offices:", err);
      const msg = err.message || "Failed to load office locations.";
      setError(msg);
      toast.error(msg);
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
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="border-b border-border pb-4 sm:pb-5 space-y-3 sm:space-y-4">
        <div>
          <h1 className="text-lg sm:text-2xl font-semibold sm:font-bold text-text-primary">
            Office & Attendance Settings
          </h1>
          <p className="mt-1 text-[11px] sm:text-sm text-text-secondary leading-relaxed sm:leading-normal">
            Configure physical offices, GPS geofences, and check-in radiuses for employee attendance verification.
          </p>
        </div>

        {/* Actions positioned directly below heading & description, left-aligned */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <Tooltip
            content="Refresh office list"
            className="px-2.5 py-1 text-xs font-medium rounded-md shadow-lg bg-neutral-900 text-neutral-100 border border-neutral-700 whitespace-nowrap pointer-events-none"
          >
            <button
              onClick={loadOffices}
              disabled={loading}
              title="Refresh office list"
              aria-label="Refresh office list"
              className="inline-flex items-center justify-center h-8 sm:h-10 w-8 sm:w-10 rounded-lg border border-border bg-surface text-text-secondary hover:bg-neutral-100 dark:hover:bg-neutral-800 transition shadow-2xs shrink-0 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={15} className={`sm:w-[18px] sm:h-[18px] ${loading ? "animate-spin text-primary-600" : ""}`} />
            </button>
          </Tooltip>

          <button
            onClick={handleOpenCreate}
            className="
              inline-flex items-center gap-1.5 sm:gap-2
              rounded-lg
              bg-primary-500
              h-8 sm:h-10
              px-3 sm:px-4
              text-xs sm:text-sm font-medium
              text-white
              whitespace-nowrap
              shrink-0
              transition
              hover:bg-primary-600
              shadow-2xs
              cursor-pointer
            "
          >
            <Plus size={15} className="sm:w-[18px] sm:h-[18px] shrink-0" />
            <span>Add Office</span>
          </button>
        </div>
      </div>

      {/* Office Cards Grid */}
      {loading ? (
        <PageLoadingState message="Loading office locations..." />
      ) : error ? (
        <PageErrorState
          title="Failed to load office locations"
          message={error}
          onRetry={loadOffices}
        />
      ) : offices.length === 0 ? (
        <PageEmptyState
          icon={MapPin}
          title="No Offices Configured"
          message="Create physical office locations with GPS coordinates so employees can check in for attendance upon logging in."
          actionText="Configure First Office"
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 lg:gap-5">
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
                className="bg-surface rounded-xl border border-border overflow-hidden shadow-2xs hover:shadow-xs transition flex flex-col justify-between"
              >
                <div className="p-4 sm:p-5 space-y-3 sm:space-y-3.5">
                  {/* Top Bar: Office Name, City/State & Status Badge */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm sm:text-base font-semibold text-text-primary leading-tight truncate">
                        {office.name}
                      </h3>
                      <p className="mt-0.5 sm:mt-1 text-xs text-text-secondary truncate">
                        {[office.city, office.state].filter(Boolean).join(", ") ||
                          "Location Unspecified"}
                      </p>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2 sm:px-2.5 py-0.5 sm:py-1 text-[11px] sm:text-xs font-semibold shrink-0 whitespace-nowrap ${office.isActive
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
                          : "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800"
                        }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${office.isActive ? "bg-emerald-500" : "bg-rose-500"
                          }`}
                      />
                      {office.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {/* Physical Address */}
                  {office.address && (
                    <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">
                      {office.address}
                    </p>
                  )}

                  {/* Location & Radius Details */}
                  <div className="rounded-lg bg-neutral-50/70 dark:bg-neutral-900/50 p-3 space-y-2 border border-border text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-text-secondary flex items-center gap-1.5 font-medium shrink-0">
                        <MapPin size={13} className="text-primary-600 dark:text-primary-400 shrink-0" />
                        Coordinates:
                      </span>
                      {hasLocation ? (
                        <span className="font-mono font-medium text-text-primary truncate">
                          {office.latitude?.toFixed(6)}, {office.longitude?.toFixed(6)}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-900/60 shrink-0">
                          <AlertTriangle size={12} /> Location not set
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-border">
                      <span className="text-text-secondary flex items-center gap-1.5 font-medium shrink-0">
                        <Radio size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                        Geofence Radius:
                      </span>
                      <span className="font-semibold text-text-primary truncate">
                        {office.radiusMeters || 100} meters
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="px-4 sm:px-5 py-3 bg-neutral-50/50 dark:bg-neutral-900/40 border-t border-border flex items-center justify-between gap-2">
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => handleToggleStatus(office)}
                    className={`text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-lg border transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${office.isActive
                        ? "border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                        : "border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                      }`}
                  >
                    {isUpdating ? (
                      <RefreshCw size={13} className="animate-spin" />
                    ) : (
                      <ShieldCheck size={13} />
                    )}
                    {office.isActive ? "Deactivate" : "Activate"}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEdit(office)}
                    className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-border bg-surface text-xs font-semibold text-text-primary hover:bg-neutral-100 dark:hover:bg-neutral-800 transition shadow-2xs cursor-pointer"
                  >
                    <Edit3 size={13} className="text-primary-600 dark:text-primary-400" />
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
