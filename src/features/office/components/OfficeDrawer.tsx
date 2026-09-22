import { useEffect, useState, useRef } from "react";
import { X, MapPin, Search, Loader2, AlertCircle, Navigation } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import {
  createOffice,
  updateOffice,
  type OfficeItem,
  type CreateOfficePayload,
} from "../../../services/officeService";

type OfficeDrawerProps = {
  officeToEdit?: OfficeItem | null;
  onClose: () => void;
  onSuccess: (savedOffice: OfficeItem) => void;
};

interface NominatimSearchResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    road?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
  };
}

const OfficeDrawer = ({
  officeToEdit,
  onClose,
  onSuccess,
}: OfficeDrawerProps) => {
  const { accessToken } = useAuth();
  const toast = useToast();

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    latitude: "",
    longitude: "",
    radiusMeters: "100",
    isActive: true,
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Address search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<NominatimSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      const msg = "Geolocation is not supported by your browser.";
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }

    setIsLocating(true);
    setErrorMsg(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const lat = parseFloat(position.coords.latitude.toFixed(6));
        const lon = parseFloat(position.coords.longitude.toFixed(6));

        setFormData((prev) => ({
          ...prev,
          latitude: String(lat),
          longitude: String(lon),
        }));

        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([lat, lon], 16);
        }

        toast.success("Office location set to your current coordinates!");
      },
      (error) => {
        setIsLocating(false);
        let msg = "Failed to retrieve current location.";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            msg = "Location access denied. Please allow location permissions in your browser.";
            break;
          case error.POSITION_UNAVAILABLE:
            msg = "Location information is unavailable. Please check your device location / GPS settings.";
            break;
          case error.TIMEOUT:
            msg = "Location request timed out. Please try again.";
            break;
          default:
            msg = error.message || msg;
            break;
        }
        setErrorMsg(msg);
        toast.error(msg);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Map refs
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const circleRef = useRef<any>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  useEffect(() => {
    if (officeToEdit) {
      setFormData({
        name: officeToEdit.name || "",
        address: officeToEdit.address || "",
        city: officeToEdit.city || "",
        state: officeToEdit.state || "",
        latitude:
          officeToEdit.latitude !== null && officeToEdit.latitude !== undefined
            ? String(officeToEdit.latitude)
            : "",
        longitude:
          officeToEdit.longitude !== null && officeToEdit.longitude !== undefined
            ? String(officeToEdit.longitude)
            : "",
        radiusMeters: String(officeToEdit.radiusMeters || 100),
        isActive: officeToEdit.isActive ?? true,
      });
    }
  }, [officeToEdit]);

  // Dynamically load Leaflet JS & CSS if not already loaded
  useEffect(() => {
    if ((window as any).L) {
      setLeafletLoaded(true);
      return;
    }

    const cssLink = document.createElement("link");
    cssLink.rel = "stylesheet";
    cssLink.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(cssLink);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => setLeafletLoaded(true);
    document.head.appendChild(script);
  }, []);

  // Initialize or update Leaflet Map
  useEffect(() => {
    if (!leafletLoaded || !mapContainerRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    const lat = parseFloat(formData.latitude) || 20.5937; // Default India center
    const lon = parseFloat(formData.longitude) || 78.9629;
    const hasCoordinates =
      !isNaN(parseFloat(formData.latitude)) && !isNaN(parseFloat(formData.longitude));
    const zoom = hasCoordinates ? 16 : 5;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView([lat, lon], zoom);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;

      // Handle map click to place pin
      map.on("click", (e: any) => {
        const clickedLat = parseFloat(e.latlng.lat.toFixed(6));
        const clickedLng = parseFloat(e.latlng.lng.toFixed(6));
        setFormData((prev) => ({
          ...prev,
          latitude: String(clickedLat),
          longitude: String(clickedLng),
        }));
      });
    } else {
      mapInstanceRef.current.setView([lat, lon], hasCoordinates ? mapInstanceRef.current.getZoom() : 5);
    }

    // Update marker pin
    if (hasCoordinates) {
      if (!markerRef.current) {
        const marker = L.marker([lat, lon], { draggable: true }).addTo(
          mapInstanceRef.current
        );

        marker.on("dragend", (e: any) => {
          const position = e.target.getLatLng();
          const draggedLat = parseFloat(position.lat.toFixed(6));
          const draggedLng = parseFloat(position.lng.toFixed(6));
          setFormData((prev) => ({
            ...prev,
            latitude: String(draggedLat),
            longitude: String(draggedLng),
          }));
        });

        markerRef.current = marker;
      } else {
        markerRef.current.setLatLng([lat, lon]);
      }

      // Update geofence circle radius
      const radiusNum = parseInt(formData.radiusMeters, 10) || 100;
      if (!circleRef.current) {
        const circle = L.circle([lat, lon], {
          radius: radiusNum,
          color: "#0284c7",
          fillColor: "#38bdf8",
          fillOpacity: 0.25,
        }).addTo(mapInstanceRef.current);
        circleRef.current = circle;
      } else {
        circleRef.current.setLatLng([lat, lon]);
        circleRef.current.setRadius(radiusNum);
      }
    }
  }, [leafletLoaded, formData.latitude, formData.longitude, formData.radiusMeters]);

  // Address search with 500ms Debounce
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            searchQuery
          )}&addressdetails=1&limit=5`
        );
        if (res.ok) {
          const data: NominatimSearchResult[] = await res.json();
          setSearchResults(data);
          setShowResults(true);
        }
      } catch (err) {
        console.error("Location search failed:", err);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectSearchResult = (result: NominatimSearchResult) => {
    const lat = parseFloat(result.lat).toFixed(6);
    const lon = parseFloat(result.lon).toFixed(6);

    const addressParts = result.display_name.split(",");
    const mainAddress = addressParts.slice(0, 2).join(",").trim();

    setFormData((prev) => ({
      ...prev,
      address: prev.address || mainAddress,
      city: prev.city || result.address?.city || result.address?.town || "",
      state: prev.state || result.address?.state || "",
      latitude: lat,
      longitude: lon,
    }));

    setShowResults(false);
    setSearchQuery("");
    toast.info("Location coordinates updated from map search.");
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    if (!formData.name.trim()) {
      const msg = "Office name is required";
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }

    let latNum: number | null = null;
    let lonNum: number | null = null;

    if (formData.latitude.trim() || formData.longitude.trim()) {
      latNum = parseFloat(formData.latitude);
      lonNum = parseFloat(formData.longitude);

      if (isNaN(latNum) || latNum < -90 || latNum > 90) {
        const msg = "Latitude must be a valid number between -90 and 90";
        setErrorMsg(msg);
        toast.error(msg);
        return;
      }

      if (isNaN(lonNum) || lonNum < -180 || lonNum > 180) {
        const msg = "Longitude must be a valid number between -180 and 180";
        setErrorMsg(msg);
        toast.error(msg);
        return;
      }
    }

    const radiusNum = parseInt(formData.radiusMeters, 10);
    if (isNaN(radiusNum) || radiusNum <= 0) {
      const msg = "Geofence radius must be a positive integer in meters";
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const payload: CreateOfficePayload = {
        name: formData.name.trim(),
        address: formData.address.trim() || undefined,
        city: formData.city.trim() || undefined,
        state: formData.state.trim() || undefined,
        latitude: latNum,
        longitude: lonNum,
        radiusMeters: radiusNum,
        isActive: formData.isActive,
      };

      if (officeToEdit) {
        const updated = await updateOffice(accessToken, officeToEdit.id, payload);
        toast.success(`Office "${updated.name}" updated successfully!`);
        onSuccess(updated);
      } else {
        const created = await createOffice(accessToken, payload);
        toast.success(`Office "${created.name}" created successfully!`);
        onSuccess(created);
      }
      onClose();
    } catch (err: any) {
      const msg = err.message || "Failed to save office configuration.";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-black/40 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-xl h-full bg-surface shadow-2xl flex flex-col border-l border-border animate-slide-left">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-neutral-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary-100 text-primary-700">
              <MapPin size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">
                {officeToEdit ? "Edit Office Location" : "Configure New Office"}
              </h2>
              <p className="text-xs text-text-secondary">
                Set office details, physical location, and allowed check-in geofence radius.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-text-muted hover:bg-neutral-100 hover:text-text-primary transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMsg && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 p-4 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0 text-rose-600" />
              {errorMsg}
            </div>
          )}

          {/* Office Identification */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider text-xs">
              Office Details
            </h3>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Office Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Vapi Regional Headquarters"
                required
                className="w-full h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text-primary outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="e.g. Vapi"
                  className="w-full h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text-primary outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  State
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="e.g. Gujarat"
                  className="w-full h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text-primary outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Street Address
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="e.g. Plot No 42, GIDC Industrial Estate"
                className="w-full h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text-primary outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition"
              />
            </div>
          </div>

          {/* Set Office Location / Geofence Section */}
          <div className="space-y-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider text-xs">
                Set Office Location & Geofence
              </h3>
              <span className="text-xs text-primary-600 font-medium">
                Click map or drag pin to position
              </span>
            </div>

            {/* Use My Current Location Button */}
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={isLocating || loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-primary-50 hover:bg-primary-100 border border-primary-200 text-primary-700 text-sm font-medium transition dark:bg-primary-950/40 dark:hover:bg-primary-900/50 dark:border-primary-800/60 dark:text-primary-300 disabled:opacity-60 disabled:cursor-not-allowed shadow-2xs cursor-pointer"
            >
              {isLocating ? (
                <>
                  <Loader2 size={16} className="animate-spin text-primary-600 dark:text-primary-400 shrink-0" />
                  <span>Fetching Current Location...</span>
                </>
              ) : (
                <>
                  <Navigation size={16} className="text-primary-600 dark:text-primary-400 shrink-0" />
                  <span>Use My Current Location</span>
                </>
              )}
            </button>

            {/* Address Search Input */}
            <div className="relative">
              <label className="block text-xs font-medium text-text-secondary mb-1">
                Search Location / Address
              </label>
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search city, area, or landmark..."
                  className="w-full h-10 pl-9 pr-8 rounded-lg border border-border bg-surface text-sm text-text-primary outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition"
                />
                {isSearching && (
                  <Loader2
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-primary-500"
                  />
                )}
              </div>

              {/* Search Results Dropdown */}
              {showResults && searchResults.length > 0 && (
                <ul className="absolute z-[120] left-0 right-0 top-full mt-1 bg-surface border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto text-xs divide-y divide-border">
                  {searchResults.map((res) => (
                    <li
                      key={res.place_id}
                      onClick={() => handleSelectSearchResult(res)}
                      className="p-2.5 hover:bg-primary-50 cursor-pointer text-text-primary transition flex items-start gap-2"
                    >
                      <MapPin size={14} className="text-primary-600 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{res.display_name}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Interactive Map */}
            <div className="rounded-xl border border-border overflow-hidden bg-neutral-100">
              <div
                ref={mapContainerRef}
                className="w-full h-56 z-10 relative"
                style={{ minHeight: "224px" }}
              />
            </div>

            {/* Lat / Long / Radius inputs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Latitude
                </label>
                <input
                  type="text"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleChange}
                  placeholder="e.g. 20.389300"
                  className="w-full h-9 rounded-lg border border-border bg-surface px-2.5 font-mono text-xs text-text-primary outline-none focus:border-primary-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Longitude
                </label>
                <input
                  type="text"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleChange}
                  placeholder="e.g. 72.910600"
                  className="w-full h-9 rounded-lg border border-border bg-surface px-2.5 font-mono text-xs text-text-primary outline-none focus:border-primary-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Allowed Radius (Meters)
                </label>
                <input
                  type="number"
                  name="radiusMeters"
                  value={formData.radiusMeters}
                  onChange={handleChange}
                  min={10}
                  max={5000}
                  required
                  className="w-full h-9 rounded-lg border border-border bg-surface px-2.5 text-xs text-text-primary outline-none focus:border-primary-500 transition font-semibold"
                />
              </div>
            </div>

            {/* Active Status Toggle */}
            <div className="flex items-center justify-between pt-2">
              <div>
                <span className="text-sm font-medium text-text-primary block">
                  Office Status
                </span>
                <span className="text-xs text-text-muted">
                  Inactive offices will not authorize employee check-ins.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500" />
              </label>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-border">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-text-secondary hover:bg-neutral-100 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {officeToEdit
                ? loading
                  ? "Saving Changes..."
                  : "Save Changes"
                : loading
                  ? "Creating Office..."
                  : "Create Office"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OfficeDrawer;
