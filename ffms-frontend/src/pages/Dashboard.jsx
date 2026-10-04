import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import farmService from "../services/farmService";
import cropService from "../services/cropService";
import livestockService from "../services/livestockService";
import irrigationService from "../services/irrigationService";
import weatherService from "../services/weatherService";
import alertService from "../services/alertService";
import Loading from "../components/Loading";
import { useAuth } from "../hooks/useAuth";

const EMPTY_DATA = {
  farms: [],
  crops: [],
  fields: [],
  animals: [],
  systems: [],
  schedules: [],
  alerts: [],
  weather: null,
};

function list(value) {
  return Array.isArray(value) ? value : [];
}

function dateLabel(value) {
  if (!value) return "Date not recorded";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? "Date not recorded"
    : parsed.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function scheduleRunsToday(schedule, now = new Date()) {
  if (!Number(schedule.is_active ?? 1)) return false;
  const frequency = schedule.frequency || "daily";
  if (frequency === "daily" || frequency === "twice_daily") return true;
  if (frequency === "weekly") {
    const dayNames = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
    const selectedDays = String(schedule.days_of_week || "").toLowerCase();
    return selectedDays.includes(dayNames[now.getDay()]);
  }
  if (frequency === "alternate_days") {
    const created = new Date(schedule.created_at);
    return !Number.isNaN(created.getTime()) && Math.floor((now - created) / 86400000) % 2 === 0;
  }
  if (frequency === "custom") {
    const dayNames = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
    return String(schedule.days_of_week || "").toLowerCase().includes(dayNames[now.getDay()]);
  }
  return false;
}

function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [hasLoadError, setHasLoadError] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setLoading(true);
      setHasLoadError(false);
      try {
        const [farmResult, cropResult] = await Promise.allSettled([
          farmService.getFarms(),
          cropService.getCrops(),
        ]);
        if (farmResult.status === "rejected" || cropResult.status === "rejected") {
          setHasLoadError(true);
        }
        const farms = farmResult.status === "fulfilled" ? list(farmResult.value) : [];
        const crops = cropResult.status === "fulfilled" ? list(cropResult.value) : [];

        const farmDetails = await Promise.all(farms.map(async (farm) => {
          const [fieldsResult, animalsResult, systemsResult, alertsResult, weatherResult] = await Promise.allSettled([
            farmService.getFields(farm.id),
            livestockService.getAnimals(farm.id),
            irrigationService.getSystems(farm.id),
            alertService.getActiveAlerts(farm.id, true),
            weatherService.getCurrent(farm.id),
          ]);
          const systems = systemsResult.status === "fulfilled" ? list(systemsResult.value) : [];
          const schedulesBySystem = await Promise.all(systems.map((system) =>
            irrigationService.getSchedules(system.id).catch(() => []),
          ));

          return {
            fields: fieldsResult.status === "fulfilled" ? list(fieldsResult.value) : [],
            animals: animalsResult.status === "fulfilled" ? list(animalsResult.value) : [],
            systems,
            schedules: schedulesBySystem.flatMap(list),
            alerts: alertsResult.status === "fulfilled" ? list(alertsResult.value) : [],
            weather: weatherResult.status === "fulfilled" ? weatherResult.value : null,
          };
        }));

        const nextData = {
          farms,
          crops,
          fields: farmDetails.flatMap((detail) => detail.fields),
          animals: farmDetails.flatMap((detail) => detail.animals),
          systems: farmDetails.flatMap((detail) => detail.systems),
          schedules: farmDetails.flatMap((detail) => detail.schedules),
          alerts: farmDetails.flatMap((detail) => detail.alerts.map((alert) => ({
            ...alert,
            farm_name: alert.farm_name || farms.find((farm) => Number(farm.id) === Number(alert.farm_id))?.name,
          }))),
          weather: farmDetails.find((detail) => detail.weather)?.weather || null,
        };

        if (active) {
          setData(nextData);
          setLastUpdated(new Date());
        }
      } catch (error) {
        console.error("Dashboard data could not be loaded:", error);
        if (active) setHasLoadError(true);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDashboard();
    return () => {
      active = false;
    };
  }, []);

  const criticalAlerts = data.alerts.filter((alert) =>
    ["critical", "high"].includes(String(alert.severity || "").toLowerCase()),
  );
  const todaySchedules = data.schedules.filter((schedule) => scheduleRunsToday(schedule));
  const recentActivity = [
    ...data.farms.map((item) => ({ ...item, kind: "Farm added", date: item.created_at, to: "/farm" })),
    ...data.fields.map((item) => ({ ...item, kind: "Field recorded", date: item.created_at, to: "/farm" })),
    ...data.crops.map((item) => ({ ...item, kind: "Crop recorded", date: item.created_at, to: "/crops" })),
    ...data.animals.map((item) => ({ ...item, kind: "Livestock recorded", date: item.created_at, to: "/livestock" })),
  ]
    .filter((item) => item.date)
    .sort((first, second) => new Date(second.date) - new Date(first.date))
    .slice(0, 4);
  const farmsWithoutCriticalAlerts = Math.max(data.farms.length - new Set(
    criticalAlerts.map((alert) => Number(alert.farm_id)),
  ).size, 0);
  const farmHealth = data.farms.length
    ? Math.round((farmsWithoutCriticalAlerts / data.farms.length) * 100)
    : null;
  const weatherCurrent = data.weather?.live_api_current;
  const weatherObservation = data.weather?.latest_logged_observation;
  const temperature = weatherCurrent?.temperature_2m ?? weatherCurrent?.temperature ?? weatherCurrent?.temperature_c ?? weatherObservation?.temperature_c;
  const weatherDescription = weatherCurrent?.weather_description || weatherCurrent?.description || (weatherObservation ? "Latest field observation" : weatherCurrent ? "Current local conditions" : "No local reading yet");
  const greeting = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 17 ? "Good afternoon" : "Good evening";

  if (loading) {
    return <div className="dashboard-page dashboard-loading"><Loading message="Preparing your farm overview..." /></div>;
  }

  return (
    <div className="dashboard-page dashboard-refined">
      <section className="dashboard-hero">
        <div>
          <p className="dashboard-brand">AgriHud <span>/ FIELD OVERVIEW</span></p>
          <h1>{greeting}, {user?.name?.trim().split(/\s+/)[0] || "Farmer"}</h1>
          <p className="dashboard-intro">A clear view of your farms, resources, and the work ahead.</p>
        </div>
        <div className="dashboard-hero-meta">
          <span className="dashboard-live-mark" aria-hidden="true" />
          <span>{lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Overview"}</span>
        </div>
      </section>

      {hasLoadError && (
        <div className="dashboard-notice" role="status">
          Some farm data could not be reached. Available records are still shown.
        </div>
      )}

      <section className="dashboard-cards dashboard-stat-grid" aria-label="Farm summary">
        <Link className="dashboard-card stat-card stat-card-farms" to="/farm">
          <span className="stat-card-top"><span className="stat-icon">⌂</span><span className="stat-trend">ESTATES</span></span>
          <span className="stat-label">Farms & fields</span>
          <strong>{data.farms.length}<small> farms</small></strong>
          <span className="stat-footnote">{data.fields.length} fields in your portfolio <span>→</span></span>
        </Link>
        <Link className="dashboard-card stat-card stat-card-crops" to="/crops">
          <span className="stat-card-top"><span className="stat-icon">✳</span><span className="stat-trend">GROWING</span></span>
          <span className="stat-label">Crop records</span>
          <strong>{data.crops.length}</strong>
          <span className="stat-footnote">{data.crops.length ? "Crop types tracked" : "Ready for your first planting"} <span>→</span></span>
        </Link>
        <Link className="dashboard-card stat-card stat-card-livestock" to="/livestock">
          <span className="stat-card-top"><span className="stat-icon">◉</span><span className="stat-trend">HERD</span></span>
          <span className="stat-label">Livestock</span>
          <strong>{data.animals.length}</strong>
          <span className="stat-footnote">{data.animals.length ? "Animals registered" : "No animal records yet"} <span>→</span></span>
        </Link>
        <Link className={`dashboard-card stat-card ${criticalAlerts.length ? "stat-card-alerts has-alerts" : "stat-card-alerts"}`} to="/alerts">
          <span className="stat-card-top"><span className="stat-icon">!</span><span className="stat-trend">ATTENTION</span></span>
          <span className="stat-label">Priority alerts</span>
          <strong>{criticalAlerts.length}</strong>
          <span className="stat-footnote">{criticalAlerts.length ? "Needs review" : "No critical alerts"} <span>→</span></span>
        </Link>
      </section>

      <div className="dashboard-content-grid">
        <section className="dashboard-panel dashboard-health-panel">
          <div className="panel-heading">
            <div><p className="section-kicker">Portfolio snapshot</p><h2>Farm health</h2></div>
            <Link className="text-link" to="/reports">View reports <span>→</span></Link>
          </div>
          {farmHealth === null ? (
            <div className="dashboard-empty-inline"><span className="empty-state-icon">⌂</span><div><strong>Your farm health starts here</strong><p>Add a farm to track crops, livestock, irrigation, and alerts together.</p></div><Link to="/farm">Add a farm <span>→</span></Link></div>
          ) : (
            <>
              <div className="health-score-row">
                <div><strong className="health-score">{farmHealth}<small>%</small></strong><span className="health-caption">of farms without priority alerts</span></div>
                <span className={`health-status ${criticalAlerts.length ? "health-status-watch" : ""}`}><i />{criticalAlerts.length ? "Needs attention" : "Clear"}</span>
              </div>
              <div className="health-meter" role="img" aria-label={`${farmHealth}% of farms have no priority alerts`}><span style={{ width: `${farmHealth}%` }} /></div>
              <div className="health-breakdown">
                <Link to="/crops"><span className="health-breakdown-icon">✳</span><span><strong>{data.crops}</strong><small>Crop records</small></span><b>→</b></Link>
                <Link to="/livestock"><span className="health-breakdown-icon">◉</span><span><strong>{data.animals}</strong><small>Animals</small></span><b>→</b></Link>
                <Link to="/irrigation"><span className="health-breakdown-icon">⌁</span><span><strong>{data.systems.length}</strong><small>Water systems</small></span><b>→</b></Link>
              </div>
            </>
          )}
        </section>

        <section className="dashboard-panel dashboard-weather-panel">
          <div className="panel-heading">
            <div><p className="section-kicker">Field conditions</p><h2>Weather watch</h2></div>
            <span className="weather-symbol" aria-hidden="true">☼</span>
          </div>
          {temperature !== undefined && temperature !== null ? (
            <div className="dashboard-weather-reading">
              <strong>{Math.round(Number(temperature))}°</strong>
              <div><span>{weatherDescription}</span><small>{data.weather?.farm_name || data.farms[0]?.name || "Selected farm"}</small></div>
            </div>
          ) : (
            <div className="weather-empty-state"><span>--°</span><p>{data.farms.length ? "Weather data has not been recorded for your farms." : "Add a farm to see local field conditions."}</p></div>
          )}
          <Link className="dashboard-panel-link" to="/weather">Open weather station <span>→</span></Link>
        </section>

        <section className="dashboard-panel dashboard-activity-panel">
          <div className="panel-heading">
            <div><p className="section-kicker">Farm log</p><h2>Recent activity</h2></div>
            <Link className="text-link" to="/reports">All activity <span>→</span></Link>
          </div>
          {recentActivity.length ? (
            <div className="activity-list">
              {recentActivity.map((item) => (
                <Link className="activity-item" to={item.to} key={`${item.kind}-${item.id}`}>
                  <span className="activity-marker" />
                  <span className="activity-copy"><strong>{item.name || item.crop_name || item.kind}</strong><small>{item.kind}</small></span>
                  <time>{dateLabel(item.date)}</time>
                </Link>
              ))}
            </div>
          ) : (
            <div className="dashboard-empty-inline compact-empty"><span className="empty-state-icon">◷</span><div><strong>No recent activity yet</strong><p>New farm and resource records will appear here.</p></div></div>
          )}
        </section>

        <section className="dashboard-panel dashboard-operations-panel">
          <div className="panel-heading">
            <div><p className="section-kicker">Plan the day</p><h2>Today’s operations</h2></div>
            <Link className="text-link" to="/irrigation">Schedules <span>→</span></Link>
          </div>
          <div className="operations-summary"><span className="operations-count">{todaySchedules.length}</span><span>{todaySchedules.length === 1 ? "irrigation schedule" : "irrigation schedules"} active today</span></div>
          {todaySchedules.length ? (
            <div className="operation-list">
              {todaySchedules.slice(0, 3).map((schedule) => (
                <Link className="operation-item" to="/irrigation" key={schedule.id}>
                  <span className="operation-time">{schedule.start_time ? String(schedule.start_time).slice(0, 5) : "Today"}</span>
                  <span><strong>{schedule.field_name || schedule.field || "Scheduled irrigation"}</strong><small>{schedule.duration_minutes ? `${schedule.duration_minutes} min` : "Active schedule"}</small></span>
                  <span className="operation-arrow">→</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="operations-empty"><p>{data.systems.length ? "No active irrigation schedules for today." : "No irrigation systems are connected yet."}</p><Link to="/irrigation">Review irrigation setup <span>→</span></Link></div>
          )}
          <div className="operations-shortcuts">
            <Link to="/harvest">Record harvest <span>→</span></Link>
            <Link to="/labour">Review tasks <span>→</span></Link>
            <Link to="/inventory">Check stock <span>→</span></Link>
          </div>
        </section>

        <section className="dashboard-panel dashboard-alert-panel">
          <div className="panel-heading">
            <div><p className="section-kicker">Needs a look</p><h2>Active alerts</h2></div>
            <Link className="text-link" to="/alerts">View all <span>→</span></Link>
          </div>
          {data.alerts.length ? (
            <div className="alert-list">
              {data.alerts.slice(0, 3).map((alert) => (
                <Link className="dashboard-alert-item" to="/alerts" key={alert.id}>
                  <span className={`alert-severity-dot severity-${String(alert.severity || "info").toLowerCase()}`} />
                  <span><strong>{alert.title || "Farm alert"}</strong><small>{alert.farm_name || "Farm alert"}{alert.created_at ? ` · ${dateLabel(alert.created_at)}` : ""}</small></span>
                  <span className="operation-arrow">→</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="dashboard-empty-inline compact-empty"><span className="alert-clear-mark">✓</span><div><strong>All clear</strong><p>{data.farms.length ? "No active alerts across your farms." : "Alerts will appear here as you add farm records."}</p></div></div>
          )}
        </section>

        <section className="dashboard-panel dashboard-farms-panel">
          <div className="panel-heading">
            <div><p className="section-kicker">Your portfolio</p><h2>Farms & fields</h2></div>
            <Link className="text-link" to="/farm">Manage farms <span>→</span></Link>
          </div>
          {data.farms.length ? (
            <div className="farm-list">
              {data.farms.slice(0, 3).map((farm) => (
                <Link className="farm-list-item" to="/farm" key={farm.id}>
                  <span className="farm-list-mark">⌂</span>
                  <span><strong>{farm.name}</strong><small>{farm.location || "Location not added"}</small></span>
                  <span className="farm-area">{farm.total_area_ha ? `${farm.total_area_ha} ha` : "View details"}<b>→</b></span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="dashboard-empty-inline compact-empty"><span className="empty-state-icon">⌂</span><div><strong>No farms added</strong><p>Create your first farm to start organizing fields and operations.</p></div><Link to="/farm">Add farm <span>→</span></Link></div>
          )}
        </section>
      </div>
    </div>
  );
}

export default Dashboard;
