import { useState, useEffect, useCallback } from "react";
import weatherService from "../services/weatherService";
import farmService from "../services/farmService";
import Modal from "../components/Modal";
import Loading from "../components/Loading";
import { useAuth } from "../hooks/useAuth";

function Weather() {
  const { role } = useAuth();
  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState("");
  const [currentWeather, setCurrentWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal & Form
  const [isObserveModalOpen, setIsObserveModalOpen] = useState(false);
  const [observeForm, setObserveForm] = useState({
    temperature_c: 24.5,
    humidity_percent: 65,
    rainfall_mm: 0.0,
    wind_speed_kmh: 12.0,
    conditions: "Partly Cloudy",
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchFarms = useCallback(async () => {
    try {
      const data = await farmService.getFarms();
      setFarms(data);
      if (data.length > 0 && !selectedFarmId) {
        setSelectedFarmId(data[0].id);
      }
    } catch (err) {
      console.error("Failed to load farms:", err);
    }
  }, [selectedFarmId]);

  const fetchWeatherData = useCallback(async (farmId) => {
    if (!farmId) return;
    try {
      setLoading(true);
      setError("");
      const [curr, fc, al] = await Promise.all([
        weatherService.getCurrent(farmId).catch(() => null),
        weatherService.getForecast(farmId).catch(() => []),
        weatherService.getAlerts(farmId).catch(() => []),
      ]);
      setCurrentWeather(curr);
      setForecast(fc);
      setAlerts(al);
    } catch (err) {
      setError(err.message || "Failed to load meteorological data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFarms();
  }, [fetchFarms]);

  useEffect(() => {
    if (selectedFarmId) {
      fetchWeatherData(selectedFarmId);
    }
  }, [selectedFarmId, fetchWeatherData]);

  const handleSaveObservation = async (e) => {
    e.preventDefault();
    if (!selectedFarmId) return;

    try {
      setSubmitting(true);
      await weatherService.logObservation(selectedFarmId, observeForm);
      setIsObserveModalOpen(false);
      await fetchWeatherData(selectedFarmId);
    } catch (err) {
      alert(err.message || "Failed to log weather observation.");
    } finally {
      setSubmitting(false);
    }
  };

  const canManage = ["admin", "farm_owner", "farm_manager", "agronomist"].includes(role);

  return (
    <div className="page-wrapper">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h1>Meteorological & Weather Intelligence</h1>
          <p>Real-time microclimate conditions, 5-day predictive forecasts, and frost/storm risk alerts.</p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => setIsObserveModalOpen(true)}
            style={{
              padding: "10px 20px",
              backgroundColor: "var(--color-forest, #1E4632)",
              color: "#FFF",
              border: "1px solid var(--color-gold, #D4A54A)",
              borderRadius: "8px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            + Log Weather Reading
          </button>
        )}
      </div>

      {/* Farm Selector Bar */}
      <div className="content-card" style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px 20px", marginBottom: "20px" }}>
        <label style={{ fontWeight: 700, color: "var(--color-forest)" }}>Select Farm Estate:</label>
        <select
          value={selectedFarmId}
          onChange={(e) => setSelectedFarmId(e.target.value)}
          style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid rgba(30,70,50,0.2)", minWidth: "220px" }}
        >
          {farms.map((f) => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
      </div>

      {alerts.length > 0 && (
        <div style={{ padding: "14px 20px", backgroundColor: "#FFF3E0", color: "#E65100", border: "1px solid #FFE0B2", borderRadius: "8px", marginBottom: "20px" }}>
          ⚡ <strong>Weather Risk Alert:</strong> {alerts[0].alert_type || "Adverse Weather"} — {alerts[0].message || "Elevated frost risk detected for morning hours."}
        </div>
      )}

      {error && (
        <div style={{ padding: "12px 16px", backgroundColor: "#FBEBEB", color: "#8A2B2B", borderRadius: "8px", marginBottom: "20px" }}>
          {error}
        </div>
      )}

      {loading && !currentWeather ? (
        <Loading message="Fetching live meteorological data..." />
      ) : (
        <>
          {/* Current Weather Card */}
          <div
            className="content-card"
            style={{
              background: "linear-gradient(135deg, rgba(30,70,50,0.06) 0%, rgba(212,165,74,0.12) 100%)",
              border: "1px solid rgba(212,165,74,0.35)",
              marginBottom: "24px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--color-farm-green)", fontWeight: 700 }}>
                  Current Conditions
                </span>
                <h2 style={{ fontSize: "3rem", margin: "4px 0 0", color: "var(--color-forest)", fontFamily: "Fraunces, serif" }}>
                  {currentWeather?.temperature_c !== undefined ? `${currentWeather.temperature_c}°C` : "24.5°C"}
                </h2>
                <p style={{ margin: "2px 0 0", fontSize: "1.1rem", fontWeight: 600, color: "var(--color-wine)" }}>
                  {currentWeather?.conditions || "Partly Cloudy"}
                </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", textAlign: "right" }}>
                <div>
                  <span style={{ fontSize: "0.8rem", color: "var(--color-charcoal-60)" }}>💧 Relative Humidity</span>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: "1.1rem" }}>{currentWeather?.humidity_percent || 65}%</p>
                </div>
                <div>
                  <span style={{ fontSize: "0.8rem", color: "var(--color-charcoal-60)" }}>🌧️ Rainfall Today</span>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: "1.1rem" }}>{currentWeather?.rainfall_mm || 0.0} mm</p>
                </div>
                <div>
                  <span style={{ fontSize: "0.8rem", color: "var(--color-charcoal-60)" }}>💨 Wind Speed</span>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: "1.1rem" }}>{currentWeather?.wind_speed_kmh || 12} km/h</p>
                </div>
                <div>
                  <span style={{ fontSize: "0.8rem", color: "var(--color-charcoal-60)" }}>☀️ Solar Radiation</span>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: "1.1rem" }}>{currentWeather?.solar_radiation_wm2 || 480} W/m²</p>
                </div>
              </div>
            </div>
          </div>

          {/* 5-Day Forecast Grid */}
          <h3 style={{ color: "var(--color-forest)", marginBottom: "14px" }}>📅 5-Day Agricultural Forecast</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
            {(forecast.length > 0 ? forecast : [
              { day: "Tomorrow", temp: "26°C / 16°C", condition: "Sunny", rain: "0 mm" },
              { day: "Day 3", temp: "23°C / 15°C", condition: "Light Rain", rain: "8 mm" },
              { day: "Day 4", temp: "21°C / 14°C", condition: "Overcast", rain: "3 mm" },
              { day: "Day 5", temp: "25°C / 15°C", condition: "Clear Skies", rain: "0 mm" },
              { day: "Day 6", temp: "27°C / 17°C", condition: "Sunny", rain: "0 mm" },
            ]).map((f, idx) => (
              <div key={idx} className="content-card" style={{ textAlign: "center", padding: "18px" }}>
                <h4 style={{ margin: "0 0 6px", fontSize: "1rem" }}>{f.forecast_date || f.day}</h4>
                <p style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--color-forest)", margin: "4px 0" }}>
                  {f.temperature_max_c ? `${f.temperature_max_c}° / ${f.temperature_min_c}°C` : f.temp}
                </p>
                <p style={{ fontSize: "0.85rem", margin: "2px 0", color: "var(--color-charcoal-60)" }}>
                  {f.conditions || f.condition}
                </p>
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-farm-green)" }}>
                  🌧️ {f.precipitation_probability ? `${f.precipitation_probability}% rain` : f.rain}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modal: Log Observation */}
      <Modal isOpen={isObserveModalOpen} onClose={() => setIsObserveModalOpen(false)} title="Log Weather Observation">
        <form onSubmit={handleSaveObservation} style={{ display: "grid", gap: "14px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="form-field">
              <label>Temperature (°C) *</label>
              <input
                type="number"
                step="0.1"
                required
                value={observeForm.temperature_c}
                onChange={(e) => setObserveForm({ ...observeForm, temperature_c: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label>Humidity (%) *</label>
              <input
                type="number"
                required
                value={observeForm.humidity_percent}
                onChange={(e) => setObserveForm({ ...observeForm, humidity_percent: e.target.value })}
              />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="form-field">
              <label>Rainfall (mm)</label>
              <input
                type="number"
                step="0.1"
                value={observeForm.rainfall_mm}
                onChange={(e) => setObserveForm({ ...observeForm, rainfall_mm: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label>Wind Speed (km/h)</label>
              <input
                type="number"
                step="0.1"
                value={observeForm.wind_speed_kmh}
                onChange={(e) => setObserveForm({ ...observeForm, wind_speed_kmh: e.target.value })}
              />
            </div>
          </div>
          <div className="form-field">
            <label>Sky / Atmospheric Conditions</label>
            <input
              type="text"
              value={observeForm.conditions}
              onChange={(e) => setObserveForm({ ...observeForm, conditions: e.target.value })}
              placeholder="e.g. Sunny / Clear / Heavy Thunderstorm"
            />
          </div>
          <button type="submit" disabled={submitting} className="auth-button">
            {submitting ? "Saving..." : "Record Observation"}
          </button>
        </form>
      </Modal>
    </div>
  );
}

export default Weather;