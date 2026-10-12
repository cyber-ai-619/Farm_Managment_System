import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import markerIconUrl from "leaflet/dist/images/marker-icon.png";
import markerIconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import markerShadowUrl from "leaflet/dist/images/marker-shadow.png";
import "leaflet/dist/leaflet.css";
import "./FarmLocationPicker.css";

const LUSAKA = [-15.4167, 28.2833];
const NOMINATIM_URL = "https://nominatim.openstreetmap.org";
const NOMINATIM_INTERVAL_MS = 1100;

const farmMarkerIcon = L.icon({
  iconUrl: markerIconUrl,
  iconRetinaUrl: markerIconRetinaUrl,
  shadowUrl: markerShadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

let nominatimQueue = Promise.resolve();
let lastNominatimRequest = 0;
const nominatimCache = new Map();

function requestNominatim(path, cacheKey, signal) {
  if (nominatimCache.has(cacheKey)) {
    return Promise.resolve(nominatimCache.get(cacheKey));
  }

  const request = nominatimQueue.then(async () => {
    const wait = Math.max(0, NOMINATIM_INTERVAL_MS - (Date.now() - lastNominatimRequest));
    if (wait) await new Promise((resolve) => window.setTimeout(resolve, wait));
    if (signal.aborted) throw new DOMException("Request cancelled", "AbortError");

    lastNominatimRequest = Date.now();
    const response = await fetch(`${NOMINATIM_URL}${path}`, {
      headers: { Accept: "application/json" },
      signal,
    });
    if (!response.ok) throw new Error(`Location search is unavailable (HTTP ${response.status}).`);

    const data = await response.json();
    if (nominatimCache.size >= 100) {
      nominatimCache.delete(nominatimCache.keys().next().value);
    }
    nominatimCache.set(cacheKey, data);
    return data;
  });

  nominatimQueue = request.then(() => undefined, () => undefined);
  return request;
}

function MapResizer({ selectedPosition }) {
  const map = useMap();

  useEffect(() => {
    const timer = window.setTimeout(() => map.invalidateSize(), 100);
    return () => window.clearTimeout(timer);
  }, [map]);

  useEffect(() => {
    if (selectedPosition) {
      map.setView(selectedPosition, Math.max(map.getZoom(), 13), { animate: false });
    }
  }, [map, selectedPosition]);

  return null;
}

function MapClickHandler({ onSelect }) {
  useMapEvents({
    click(event) {
      onSelect(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

function getGeolocationError(error) {
  if (error.code === error.PERMISSION_DENIED) {
    return "Location permission was denied. Allow location access in your browser settings, or tap the map to choose your farm.";
  }
  if (error.code === error.POSITION_UNAVAILABLE) {
    return "Your current location is unavailable. Try again or tap the map to choose your farm.";
  }
  if (error.code === error.TIMEOUT) {
    return "Finding your location timed out. Try again or tap the map to choose your farm.";
  }
  return "Could not read your current location. Try again or tap the map to choose your farm.";
}

function FarmLocationPicker({ latitude, longitude, location, onChange }) {
  const hasCoordinates = latitude !== "" && latitude !== null && latitude !== undefined
    && longitude !== "" && longitude !== null && longitude !== undefined;
  const selectedPosition = useMemo(() => (
    hasCoordinates
      && Number.isFinite(Number(latitude))
      && Number.isFinite(Number(longitude))
      && Number(latitude) >= -90 && Number(latitude) <= 90
      && Number(longitude) >= -180 && Number(longitude) <= 180
      ? [Number(latitude), Number(longitude)]
      : null
  ), [hasCoordinates, latitude, longitude]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [message, setMessage] = useState("");
  const selectionId = useRef(0);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 3) return undefined;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearching(true);
      setMessage("");
      try {
        const params = new URLSearchParams({
          q: term,
          format: "jsonv2",
          addressdetails: "1",
          countrycodes: "zm",
          limit: "5",
        });
        const data = await requestNominatim(
          `/search?${params.toString()}`,
          `search:${term.toLowerCase()}`,
          controller.signal,
        );
        if (controller.signal.aborted) return;
        setResults(data);
        if (data.length === 0) setMessage("No matching locations found. You can still tap the map for a remote farm.");
      } catch (error) {
        if (error.name !== "AbortError") {
          setResults([]);
          setMessage("Location search failed. Check your connection or select the farm directly on the map.");
        }
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 600);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const setFarmPosition = useCallback(async (lat, lng, address = "") => {
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setMessage("That location has invalid coordinates. Choose another point on the map.");
      return;
    }

    const currentSelection = ++selectionId.current;
    const selectedAddress = address.slice(0, 255);
    setResults([]);
    setMessage(selectedAddress ? "" : "Finding the nearest address…");
    onChange({ latitude: lat, longitude: lng, location: selectedAddress });

    if (selectedAddress) {
      setQuery("");
      return;
    }

    setQuery("");
    const controller = new AbortController();
    try {
      const params = new URLSearchParams({
        lat: String(lat),
        lon: String(lng),
        format: "jsonv2",
        addressdetails: "1",
      });
      const result = await requestNominatim(
        `/reverse?${params.toString()}`,
        `reverse:${lat.toFixed(4)},${lng.toFixed(4)}`,
        controller.signal,
      );
      if (selectionId.current !== currentSelection) return;

      const label = (result?.display_name || "").slice(0, 255);
      onChange({ latitude: lat, longitude: lng, location: label });
      setMessage(label ? "" : "No address found here. The selected map coordinates will still be saved.");
    } catch (error) {
      if (error.name !== "AbortError" && selectionId.current === currentSelection) {
        setMessage("No address could be found. The selected map coordinates will still be saved.");
      }
    }
  }, [onChange]);

  const handleChooseResult = (result) => {
    const lat = Number(result.lat);
    const lng = Number(result.lon);
    setFarmPosition(lat, lng, result.display_name || "");
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setMessage("This browser does not support device location. Tap the map to choose your farm.");
      return;
    }

    setLocating(true);
    setMessage("");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocating(false);
        setFarmPosition(coords.latitude, coords.longitude);
      },
      (error) => {
        setLocating(false);
        setMessage(getGeolocationError(error));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  };

  return (
    <section className="farm-location-picker" aria-label="Farm location">
      <div className="farm-location-search">
        <label htmlFor="farm-location-search">Search for a nearby place or address</label>
        <input
          id="farm-location-search"
          type="search"
          value={query}
          onChange={(event) => {
            setResults([]);
            setSearching(false);
            setMessage("");
            setQuery(event.target.value);
          }}
          placeholder="Search a town, village, landmark, or address"
          autoComplete="off"
          aria-controls="farm-location-results"
          aria-expanded={results.length > 0}
        />
        <p className="farm-location-hint">Search is limited to Zambia. For remote farms, select the location on the map.</p>
        {searching && <p className="farm-location-status" role="status">Searching OpenStreetMap…</p>}
        {results.length > 0 && (
          <ul id="farm-location-results" className="farm-location-results" aria-label="Location search results">
            {results.map((result) => (
              <li key={result.place_id}>
                <button type="button" onClick={() => handleChooseResult(result)}>
                  {result.display_name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        className="farm-location-current"
        type="button"
        onClick={handleUseCurrentLocation}
        disabled={locating}
      >
        {locating ? "Finding your location…" : "Use My Current Location"}
      </button>

      <div className="farm-location-map" role="region" aria-label="Choose farm location on map">
        <MapContainer
          center={selectedPosition || LUSAKA}
          zoom={selectedPosition ? 13 : 11}
          scrollWheelZoom
          tap
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapResizer selectedPosition={selectedPosition} />
          <MapClickHandler onSelect={(lat, lng) => setFarmPosition(lat, lng)} />
          {selectedPosition && <Marker position={selectedPosition} icon={farmMarkerIcon} />}
        </MapContainer>
      </div>
      <p className="farm-location-hint">Tap the map to place the marker. Drag to pan and pinch or use the map controls to zoom.</p>

      {selectedPosition && (
        <p className="farm-location-selected" aria-live="polite">
          <strong>Selected location:</strong> {location || "Remote farm location"}
          <span>{selectedPosition[0].toFixed(6)}, {selectedPosition[1].toFixed(6)}</span>
        </p>
      )}
      {message && <p className="farm-location-message" role="status">{message}</p>}
    </section>
  );
}

export default FarmLocationPicker;
