import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import weatherService, { getWeatherCondition, windDirectionLabel } from "../services/weatherService";
import farmService from "../services/farmService";
import Modal from "../components/Modal";
import Loading from "../components/Loading";
import { useAuth } from "../hooks/useAuth";

function formatHour(value) {
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", hour12: false });
}

function formatDay(value) {
  return new Date(`${value}T12:00:00`).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
}

function currentHourIndex(hourly, currentTime) {
  if (!hourly?.time?.length || !currentTime) return 0;
  const exact = hourly.time.indexOf(currentTime.slice(0, 13) + ":00");
  if (exact >= 0) return exact;
  const now = new Date(currentTime).getTime();
  let nearest = 0;
  let closestDistance = Infinity;
  hourly.time.forEach((time, index) => {
    const distance = Math.abs(new Date(time).getTime() - now);
    if (distance < closestDistance) {
      closestDistance = distance;
      nearest = index;
    }
  });
  return nearest;
}

function Weather() {
  const { role } = useAuth();
  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState("");
  const [weather, setWeather] = useState(null);
  const [airQuality, setAirQuality] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [locationMatches, setLocationMatches] = useState([]);
  const [locationError, setLocationError] = useState("");
  const [updatedAt, setUpdatedAt] = useState(null);
  const [isObserveModalOpen, setIsObserveModalOpen] = useState(false);
  const [observeForm, setObserveForm] = useState({
    temperature_c: "",
    humidity_pct: "",
    rainfall_mm: "",
    wind_speed_kmh: "",
    condition_summary: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const weatherRequestId = useRef(0);
  const canManage = ["admin", "farm_owner", "farm_manager", "agronomist"].includes(role);
  const selectedFarm = farms.find((farm) => String(farm.id) === String(selectedFarmId));

  useEffect(() => {
    let active = true;
    farmService.getFarms()
      .then((data) => {
        if (!active) return;
        setFarms(data);
        if (data.length) setSelectedFarmId((current) => current || String(data[0].id));
      })
      .catch((fetchError) => {
        if (active) {
          setError(fetchError.message || "Unable to load your farms.");
          setLoading(false);
        }
      });
    return () => { active = false; };
  }, []);

  const fetchWeatherData = useCallback(async (farmId, options = {}) => {
    const farm = farms.find((item) => String(item.id) === String(farmId));
    if (!farm) return;

    const requestId = ++weatherRequestId.current;
    setError("");
    if (options.refresh) setRefreshing(true);
    else setLoading(true);

    try {
      let latitude = options.coordinates?.latitude ?? (farm.latitude !== null && farm.latitude !== "" ? Number(farm.latitude) : null);
      let longitude = options.coordinates?.longitude ?? (farm.longitude !== null && farm.longitude !== "" ? Number(farm.longitude) : null);
      let resolvedLocation = options.resolvedLocation || "";

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        const query = String(farm.location || "").trim();
        if (!query) {
          throw new Error("This farm has no coordinates or location. Add a location in Farms & Fields to load local weather.");
        }
        const matches = await weatherService.searchLocation(query);
        if (!matches.length) throw new Error(`Could not find coordinates for “${query}”. Update the farm location and try again.`);
        latitude = Number(matches[0].latitude);
        longitude = Number(matches[0].longitude);
        resolvedLocation = [matches[0].name, matches[0].admin1, matches[0].country].filter(Boolean).join(", ");
      }

      const [forecastResult, alertsResult, airQualityResult] = await Promise.allSettled([
        weatherService.getWeather(latitude, longitude),
        weatherService.getAlerts(farm.id),
        weatherService.getAirQuality(latitude, longitude),
      ]);
      if (forecastResult.status === "rejected") throw forecastResult.reason;
      const forecastData = forecastResult.value;
      if (requestId !== weatherRequestId.current) return;
      setWeather({ ...forecastData, resolved_location: resolvedLocation });
      setAlerts(alertsResult.status === "fulfilled" ? alertsResult.value : []);
      setAirQuality(airQualityResult.status === "fulfilled" ? airQualityResult.value?.current || null : null);
      setUpdatedAt(new Date());
    } catch (fetchError) {
      if (requestId !== weatherRequestId.current) return;
      setWeather(null);
      setAirQuality(null);
      setAlerts([]);
      setError(fetchError.message || "Unable to load weather data. Please try again.");
    } finally {
      if (requestId === weatherRequestId.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [farms]);

  useEffect(() => {
    if (!selectedFarmId || !farms.length) return undefined;
    const timeout = window.setTimeout(() => fetchWeatherData(selectedFarmId), 0);
    return () => window.clearTimeout(timeout);
  }, [selectedFarmId, farms, fetchWeatherData]);

  const handleLocationSearch = async (event) => {
    event.preventDefault();
    const query = locationQuery.trim();
    if (!query) return;
    setLocationError("");
    try {
      const matches = await weatherService.searchLocation(query);
      setLocationMatches(matches);
      if (!matches.length) setLocationError("No matching place found. Try a town, district, or region name.");
    } catch (searchError) {
      setLocationError(searchError.message || "Location search failed. Try again.");
    }
  };

  const handleUseLocation = async (match) => {
    const resultLabel = [match.name, match.admin1, match.country].filter(Boolean).join(", ");
    const updatedFarm = { ...selectedFarm, latitude: match.latitude, longitude: match.longitude, location: resultLabel };
    setFarms((current) => current.map((farm) => String(farm.id) === String(selectedFarmId) ? updatedFarm : farm));
    setLocationMatches([]);
    setLocationQuery("");
    setLocationError("");
    try {
      await farmService.updateFarm(selectedFarmId, updatedFarm);
    } catch {
      // Some roles may not edit farm records; coordinates still apply for this session.
    }
    await fetchWeatherData(selectedFarmId, {
      coordinates: { latitude: Number(match.latitude), longitude: Number(match.longitude) },
      resolvedLocation: resultLabel,
      refresh: true,
    });
  };

  const handleSaveObservation = async (event) => {
    event.preventDefault();
    if (!selectedFarmId) return;
    try {
      setSubmitting(true);
      await weatherService.logObservation(selectedFarmId, observeForm);
      setIsObserveModalOpen(false);
      await fetchWeatherData(selectedFarmId, { refresh: true });
    } catch (saveError) {
      setError(saveError.message || "Failed to log weather observation.");
    } finally {
      setSubmitting(false);
    }
  };

  const hourlyRows = useMemo(() => {
    const hourly = weather?.hourly;
    if (!hourly?.time?.length) return [];
    const start = currentHourIndex(hourly, weather.current?.time);
    return Array.from({ length: 12 }, (_, offset) => start + offset * 2)
      .filter((index) => index < hourly.time.length)
      .map((index) => ({
        time: hourly.time[index],
        temperature: hourly.temperature_2m?.[index],
        probability: hourly.precipitation_probability?.[index],
        code: hourly.weather_code?.[index],
      }));
  }, [weather]);

  const insights = useMemo(() => {
    if (!weather?.current || !weather?.daily) return ["Insufficient weather data for recommendation."];
    const current = weather.current;
    const daily = weather.daily;
    const currentDayIndex = Math.max(0, daily.time.indexOf(current.time?.slice(0, 10)));
    const rainProbability = daily.precipitation_probability_max?.[currentDayIndex];
    const precipitation = daily.precipitation_sum?.[currentDayIndex];
    const et0 = daily.et0_fao_evapotranspiration?.[currentDayIndex];
    const soilMoisture = weather.hourly?.soil_moisture_0_to_1cm?.[currentHourIndex(weather.hourly, current.time)];
    const recommendations = [];

    if (rainProbability !== undefined && precipitation !== undefined && rainProbability >= 60 && precipitation >= 1) {
      recommendations.push({ icon: "🌧️", title: "Rain outlook", text: `Rain is likely today (${rainProbability}% probability). Consider delaying irrigation.` });
    } else if (rainProbability !== undefined) {
      recommendations.push({ icon: "🌧️", title: "Rain outlook", text: rainProbability < 30 ? `Low chance of rain today (${rainProbability}%).` : `Rain probability is ${rainProbability}% today; monitor local conditions.` });
    }
    if (typeof soilMoisture === "number") {
      const label = soilMoisture < 0.18 ? "low" : soilMoisture < 0.32 ? "moderate" : "high";
      recommendations.push({ icon: "💧", title: "Topsoil moisture", text: `Surface soil moisture is ${label} (${Math.round(soilMoisture * 100)}%).` });
    }
    if (typeof et0 === "number") {
      recommendations.push({ icon: "☀️", title: "Evapotranspiration", text: et0 >= 5 ? `ET₀ is elevated at ${et0.toFixed(1)} mm today; irrigation demand may increase.` : `Reference ET₀ is ${et0.toFixed(1)} mm today.` });
    }
    if (typeof current.wind_speed_10m === "number" && current.wind_speed_10m > 35) {
      recommendations.push({ icon: "🌬️", title: "Field operations", text: `Strong winds (${Math.round(current.wind_speed_10m)} km/h) may affect spraying and field work.` });
    } else if (typeof current.temperature_2m === "number" && current.temperature_2m >= 5 && current.temperature_2m <= 32 && (rainProbability === undefined || rainProbability < 70)) {
      recommendations.push({ icon: "🌱", title: "Field operations", text: "Current temperature and rain outlook are suitable for routine field operations." });
    }
    return recommendations.length ? recommendations : ["Insufficient weather data for recommendation."];
  }, [weather]);

  const current = weather?.current;
  const currentCondition = current ? getWeatherCondition(current.weather_code) : null;
  const daily = weather?.daily;
  const dailyIndex = Math.max(0, daily?.time?.indexOf(current?.time?.slice(0, 10)) ?? 0);
  const todayRainProbability = daily?.precipitation_probability_max?.[dailyIndex];
  const airAqi = airQuality?.us_aqi;

  return (
    <div className="page-wrapper weather-page">
      <div className="page-header weather-page-header">
        <div>
          <p className="dashboard-brand">FIELD CONDITIONS</p>
          <h1>Weather Station</h1>
          <p>Live forecasts and agricultural conditions for your selected farm.</p>
        </div>
        <div className="weather-header-actions">
          {canManage && <button type="button" onClick={() => setIsObserveModalOpen(true)} className="btn-secondary">＋ Log Observation</button>}
          <button type="button" className="btn-primary" disabled={!selectedFarmId || refreshing} onClick={() => fetchWeatherData(selectedFarmId, { refresh: true })}>
            <span aria-hidden="true">↻</span> {refreshing ? "Refreshing..." : "Refresh Weather"}
          </button>
        </div>
      </div>

      <section className="weather-toolbar">
        <div className="weather-farm-select">
          <label htmlFor="weather-farm">Selected farm</label>
          <select id="weather-farm" value={selectedFarmId} onChange={(event) => setSelectedFarmId(event.target.value)} disabled={!farms.length}>
            {farms.length ? farms.map((farm) => <option key={farm.id} value={farm.id}>{farm.name}</option>) : <option value="">No farms available</option>}
          </select>
          <span>{selectedFarm?.location || "Farm location not added"}</span>
        </div>
        <div className="weather-updated">{updatedAt ? `Weather updated ${updatedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Live Open-Meteo forecast"}</div>
      </section>

      {selectedFarm && (!selectedFarm.latitude || !selectedFarm.longitude) && (
        <form className="weather-location-search" onSubmit={handleLocationSearch}>
          <div><strong>Set this farm’s weather location</strong><span>Search for a town or region to locate it with Open-Meteo.</span></div>
          <label className="visually-hidden" htmlFor="weather-location">Location search</label>
          <input id="weather-location" value={locationQuery} onChange={(event) => setLocationQuery(event.target.value)} placeholder="Search location, e.g. Lusaka" />
          <button className="btn-secondary" type="submit">Search</button>
          {locationError && <p className="weather-inline-error" role="alert">{locationError}</p>}
          {!!locationMatches.length && (
            <div className="weather-location-results">
              {locationMatches.map((match) => (
                <button type="button" key={`${match.id}-${match.latitude}`} onClick={() => handleUseLocation(match)}>
                  <span><strong>{match.name}</strong><small>{[match.admin1, match.country].filter(Boolean).join(", ")}</small></span><b>Use location →</b>
                </button>
              ))}
            </div>
          )}
        </form>
      )}

      {alerts.length > 0 && (
        <div className="weather-risk-banner"><span aria-hidden="true">⚠</span><div><strong>Farm weather alert</strong><p>{alerts[0].title || alerts[0].alert_type} · {alerts[0].description || alerts[0].message}</p></div></div>
      )}

      {error && (
        <div className="weather-error" role="alert"><span>{error}</span><button className="btn-secondary" type="button" onClick={() => fetchWeatherData(selectedFarmId, { refresh: true })}>Retry</button></div>
      )}

      {loading && !weather ? (
        <div className="weather-loading"><Loading message="Loading farm weather..." /></div>
      ) : !selectedFarm ? (
        <section className="weather-empty"><span>⌂</span><h2>Add a farm to begin</h2><p>Weather forecasts use each farm’s stored coordinates or a location you search for.</p><button className="btn-primary" type="button" onClick={() => window.location.assign("/farm")}>Open Farms & Fields</button></section>
      ) : weather && current ? (
        <>
          <section className="weather-current-grid" aria-label="Current weather conditions">
            <article className="weather-current-card">
              <div className="weather-current-copy">
                <p className="weather-kicker">CURRENT CONDITIONS</p>
                <div className="weather-current-main"><span className="weather-current-icon" aria-hidden="true">{currentCondition.icon}</span><strong>{Math.round(current.temperature_2m)}°</strong><span className="weather-unit">C</span></div>
                <h2>{currentCondition.condition}</h2>
                <p className="weather-feels-like">Feels like {Math.round(current.apparent_temperature)}°C</p>
                <span className="weather-location-line">{weather.resolved_location || selectedFarm.name}{weather.timezone ? ` · ${weather.timezone.replaceAll("_", " ")}` : ""}</span>
              </div>
              <div className="weather-current-metrics">
                <div><span>Humidity</span><strong>{current.relative_humidity_2m}%</strong></div>
                <div><span>Precipitation</span><strong>{current.precipitation} mm</strong></div>
                <div><span>Wind</span><strong>{Math.round(current.wind_speed_10m)} km/h {windDirectionLabel(current.wind_direction_10m)}</strong></div>
                <div><span>Today’s rain chance</span><strong>{todayRainProbability ?? "—"}{todayRainProbability !== undefined ? "%" : ""}</strong></div>
              </div>
            </article>
            <aside className="weather-farm-summary">
              <p className="weather-kicker">TODAY’S FARM WEATHER</p>
              <h2>{daily?.temperature_2m_max?.[dailyIndex] ?? "—"}° <span>/ {daily?.temperature_2m_min?.[dailyIndex] ?? "—"}°C</span></h2>
              <div className="weather-summary-line"><span>Rainfall</span><strong>{daily?.precipitation_sum?.[dailyIndex] ?? "—"} mm</strong></div>
              <div className="weather-summary-line"><span>Rain probability</span><strong>{todayRainProbability ?? "—"}{todayRainProbability !== undefined ? "%" : ""}</strong></div>
              <div className="weather-summary-line"><span>ET₀</span><strong>{daily?.et0_fao_evapotranspiration?.[dailyIndex] !== undefined ? `${daily.et0_fao_evapotranspiration[dailyIndex].toFixed(1)} mm` : "—"}</strong></div>
              <div className="weather-summary-sun"><span>↑ {daily?.sunrise?.[dailyIndex]?.slice(-5) || "—"} sunrise</span><span>↓ {daily?.sunset?.[dailyIndex]?.slice(-5) || "—"} sunset</span></div>
            </aside>
          </section>

          <section className="weather-section weather-hourly-section">
            <div className="weather-section-heading"><div><p className="weather-kicker">PLAN THE DAY</p><h2>Hourly forecast</h2></div><span>Next 24 hours</span></div>
            {hourlyRows.length ? (
              <div className="weather-hourly-strip">
                {hourlyRows.map((hour) => {
                  const condition = getWeatherCondition(hour.code);
                  return <article className="weather-hour" key={hour.time}><time>{formatHour(hour.time)}</time><span>{condition.icon}</span><strong>{Math.round(hour.temperature)}°</strong><small>{hour.probability ?? "—"}% rain</small></article>;
                })}
              </div>
            ) : <p className="weather-no-data">Hourly forecast is not available for this farm.</p>}
          </section>

          <section className="weather-section weather-daily-section">
            <div className="weather-section-heading"><div><p className="weather-kicker">OUTLOOK</p><h2>7-day forecast</h2></div><span>{weather.timezone?.replaceAll("_", " ")}</span></div>
            <div className="weather-daily-list">
              {daily.time.map((day, index) => {
                const condition = getWeatherCondition(daily.weather_code[index]);
                return <article className="weather-daily-row" key={day}><time>{formatDay(day)}</time><span className="weather-daily-condition"><span>{condition.icon}</span>{condition.condition}</span><span className="weather-daily-rain">{daily.precipitation_probability_max?.[index] ?? "—"}% rain</span><strong>{Math.round(daily.temperature_2m_max[index])}° <small>/ {Math.round(daily.temperature_2m_min[index])}°</small></strong><span className="weather-daily-sun">☀ {daily.sunrise?.[index]?.slice(-5) || "—"} / ☾ {daily.sunset?.[index]?.slice(-5) || "—"}</span><span className="weather-daily-total">{daily.precipitation_sum?.[index] ?? "—"} mm</span></article>;
              })}
            </div>
          </section>

          <section className="weather-section weather-agriculture-section">
            <div className="weather-section-heading"><div><p className="weather-kicker">FIELD PLANNING</p><h2>Agricultural insights</h2></div></div>
            <div className="weather-insight-grid">
              {insights.map((insight) => <article className="weather-insight" key={insight.title || insight}><span>{insight.icon || "ℹ️"}</span><div><strong>{insight.title || "Weather guidance"}</strong><p>{insight.text || insight}</p></div></article>)}
              <article className="weather-insight"><span>🌡️</span><div><strong>Soil temperature</strong><p>{weather.hourly?.soil_temperature_0cm?.[currentHourIndex(weather.hourly, current.time)] !== undefined ? `${weather.hourly.soil_temperature_0cm[currentHourIndex(weather.hourly, current.time)].toFixed(1)}°C at the surface.` : "Insufficient weather data for recommendation."}</p></div></article>
              <article className="weather-insight"><span>🌬️</span><div><strong>Vapour pressure deficit</strong><p>{weather.hourly?.vapour_pressure_deficit?.[currentHourIndex(weather.hourly, current.time)] !== undefined ? `${weather.hourly.vapour_pressure_deficit[currentHourIndex(weather.hourly, current.time)].toFixed(2)} kPa at the current hour.` : "Insufficient weather data for recommendation."}</p></div></article>
            </div>
          </section>

          {airAqi !== undefined && (
            <section className="weather-air-quality"><div><p className="weather-kicker">OPTIONAL ENVIRONMENTAL DATA</p><h2>Air quality</h2></div><div><span>US AQI</span><strong>{airAqi}</strong></div><div><span>PM2.5</span><strong>{airQuality.pm2_5 ?? "—"} μg/m³</strong></div><div><span>PM10</span><strong>{airQuality.pm10 ?? "—"} μg/m³</strong></div></section>
          )}
        </>
      ) : !error && !loading ? (
        <section className="weather-empty"><span>☁</span><h2>Weather is not available</h2><p>There is no live forecast for the selected farm yet.</p></section>
      ) : null}

      <Modal isOpen={isObserveModalOpen} onClose={() => setIsObserveModalOpen(false)} title="Log Weather Observation">
        <form onSubmit={handleSaveObservation} className="weather-observation-form">
          <div className="form-field"><label htmlFor="observation-temperature">Temperature (°C) *</label><input id="observation-temperature" type="number" step="0.1" required value={observeForm.temperature_c} onChange={(event) => setObserveForm({ ...observeForm, temperature_c: event.target.value })} /></div>
          <div className="form-field"><label htmlFor="observation-humidity">Humidity (%)</label><input id="observation-humidity" type="number" min="0" max="100" value={observeForm.humidity_pct} onChange={(event) => setObserveForm({ ...observeForm, humidity_pct: event.target.value })} /></div>
          <div className="form-field"><label htmlFor="observation-rain">Rainfall (mm)</label><input id="observation-rain" type="number" min="0" step="0.1" value={observeForm.rainfall_mm} onChange={(event) => setObserveForm({ ...observeForm, rainfall_mm: event.target.value })} /></div>
          <div className="form-field"><label htmlFor="observation-wind">Wind speed (km/h)</label><input id="observation-wind" type="number" min="0" step="0.1" value={observeForm.wind_speed_kmh} onChange={(event) => setObserveForm({ ...observeForm, wind_speed_kmh: event.target.value })} /></div>
          <div className="form-field"><label htmlFor="observation-condition">Conditions</label><input id="observation-condition" type="text" value={observeForm.condition_summary} onChange={(event) => setObserveForm({ ...observeForm, condition_summary: event.target.value })} placeholder="Optional field notes" /></div>
          <button type="submit" disabled={submitting} className="auth-button">{submitting ? "Saving..." : "Record Observation"}</button>
        </form>
      </Modal>
    </div>
  );
}

export default Weather;
