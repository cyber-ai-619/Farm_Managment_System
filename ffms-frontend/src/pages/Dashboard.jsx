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
  const { user, role } = useAuth();
  const [data, setData] = useState(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [hasLoadError, setHasLoadError] = useState(false);

  const userRole = role || "farm_owner";

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

  const getRoleStatCards = () => {
    switch (userRole) {
      case "worker":
        return [
          { to: "/irrigation", cardClass: "stat-card-crops", icon: "⌁", trend: "TASKS", label: "Active operations", value: todaySchedules.length, unit: "runs today", footnote: "Irrigation schedules today" },
          { to: "/tools", cardClass: "stat-card-farms", icon: "⚒", trend: "FLEET", label: "Equipment", value: "Fleet", unit: "Ready", footnote: "Check machines & tools" },
          { to: "/weather", cardClass: "stat-card-livestock", icon: "☼", trend: "STATION", label: "Field weather", value: temperature !== undefined && temperature !== null ? `${Math.round(Number(temperature))}°` : "--°", unit: "", footnote: weatherDescription },
          { to: "/alerts", cardClass: criticalAlerts.length ? "stat-card-alerts has-alerts" : "stat-card-alerts", icon: "!", trend: "SAFETY", label: "Priority alerts", value: criticalAlerts.length, unit: criticalAlerts.length === 1 ? "alert" : "alerts", footnote: criticalAlerts.length ? "Needs review" : "All clear" },
        ];
      case "accountant":
        return [
          { to: "/money", cardClass: "stat-card-farms", icon: "$", trend: "LEDGER", label: "Finance & budgets", value: "Ledger", unit: "Active", footnote: "Review accounts & budgets" },
          { to: "/sales", cardClass: "stat-card-crops", icon: "🛒", trend: "REVENUE", label: "Sales & orders", value: "Orders", unit: "Tracked", footnote: "Review sales orders" },
          { to: "/inventory", cardClass: "stat-card-livestock", icon: "📦", trend: "STOCK", label: "Inventory assets", value: "Inputs", unit: "Stocked", footnote: "Audit farm inputs & stock" },
          { to: "/alerts", cardClass: criticalAlerts.length ? "stat-card-alerts has-alerts" : "stat-card-alerts", icon: "!", trend: "ATTENTION", label: "Financial alerts", value: criticalAlerts.length, unit: criticalAlerts.length === 1 ? "alert" : "alerts", footnote: criticalAlerts.length ? "Action required" : "No critical alerts" },
        ];
      case "agronomist":
        return [
          { to: "/crops", cardClass: "stat-card-crops", icon: "✳", trend: "GROWING", label: "Crops tracked", value: data.crops.length, unit: data.crops.length === 1 ? "crop" : "crops", footnote: `${data.crops.length} crops active` },
          { to: "/pest-disease", cardClass: "stat-card-farms", icon: "☣", trend: "SCOUTING", label: "Pest & disease", value: "Active", unit: "Surveillance", footnote: "Review field observations" },
          { to: "/weather", cardClass: "stat-card-livestock", icon: "☼", trend: "CLIMATE", label: "Weather station", value: temperature !== undefined && temperature !== null ? `${Math.round(Number(temperature))}°` : "--°", unit: "", footnote: weatherDescription },
          { to: "/alerts", cardClass: criticalAlerts.length ? "stat-card-alerts has-alerts" : "stat-card-alerts", icon: "!", trend: "ATTENTION", label: "Agronomic alerts", value: criticalAlerts.length, unit: criticalAlerts.length === 1 ? "alert" : "alerts", footnote: criticalAlerts.length ? "Needs review" : "All clear" },
        ];
      case "veterinarian":
        return [
          { to: "/livestock", cardClass: "stat-card-livestock", icon: "◉", trend: "HERD", label: "Livestock registry", value: data.animals.length, unit: "animals", footnote: "Animals under medical care" },
          { to: "/livestock", cardClass: "stat-card-crops", icon: "💉", trend: "HEALTH", label: "Vaccines & therapy", value: "Health", unit: "Active", footnote: "Vaccine and treatment records" },
          { to: "/alerts", cardClass: criticalAlerts.length ? "stat-card-alerts has-alerts" : "stat-card-alerts", icon: "!", trend: "ATTENTION", label: "Health alerts", value: criticalAlerts.length, unit: criticalAlerts.length === 1 ? "alert" : "alerts", footnote: criticalAlerts.length ? "Needs review" : "No critical alerts" },
          { to: "/weather", cardClass: "stat-card-farms", icon: "☼", trend: "STATION", label: "Field conditions", value: temperature !== undefined && temperature !== null ? `${Math.round(Number(temperature))}°` : "--°", unit: "", footnote: weatherDescription },
        ];
      case "farm_manager":
      case "farm_owner":
      case "admin":
      default:
        return [
          { to: "/farm", cardClass: "stat-card-farms", icon: "⌂", trend: "ESTATES", label: "Farms & fields", value: data.farms.length, unit: data.farms.length === 1 ? "farm" : "farms", footnote: `${data.fields.length} fields in your portfolio` },
          { to: "/crops", cardClass: "stat-card-crops", icon: "✳", trend: "GROWING", label: "Crop records", value: data.crops.length, unit: data.crops.length === 1 ? "variety" : "varieties", footnote: data.crops.length ? "Crop types tracked" : "Ready for your first planting" },
          { to: "/livestock", cardClass: "stat-card-livestock", icon: "◉", trend: "HERD", label: "Livestock", value: data.animals.length, unit: "animals", footnote: data.animals.length ? "Animals registered" : "No animal records yet" },
          { to: "/alerts", cardClass: criticalAlerts.length ? "stat-card-alerts has-alerts" : "stat-card-alerts", icon: "!", trend: "ATTENTION", label: "Priority alerts", value: criticalAlerts.length, unit: criticalAlerts.length === 1 ? "alert" : "alerts", footnote: criticalAlerts.length ? "Needs review" : "No critical alerts" },
        ];
    }
  };

  const getRoleSubtitle = () => {
    switch (userRole) {
      case "worker":
        return "Daily field tasks, equipment status, and weather safety.";
      case "accountant":
        return "Financial ledgers, sales orders, and procurement overview.";
      case "agronomist":
        return "Crop development, soil conditions, and scouting alerts.";
      case "veterinarian":
        return "Livestock health monitoring, vaccine schedules, and medical treatment records.";
      case "farm_manager":
        return "Operational management, daily activities, and workforce logistics.";
      case "admin":
        return "System administration, tenant farms, and global platform health.";
      case "farm_owner":
      default:
        return "A clear view of your farms, workforce, and the work ahead.";
    }
  };

  const statCards = getRoleStatCards();

  if (loading) {
    return <div className="dashboard-page dashboard-loading"><Loading message="Preparing your farm overview..." /></div>;
  }

  return (
    <div className="dashboard-page dashboard-refined">
      <section className="dashboard-hero">
        <div>
          <p className="dashboard-brand">
            AgriHud <span>/ {userRole === "farm_owner" ? "FARM EXECUTIVE OVERVIEW" : `${userRole.toUpperCase().replace("_", " ")} OVERVIEW`}</span>
          </p>
          <h1 style={{ margin: "4px 0" }}>{greeting}, {user?.name?.trim().split(/\s+/)[0] || "Farmer"}</h1>
          <p className="dashboard-intro">{getRoleSubtitle()}</p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          {["admin", "farm_owner"].includes(userRole) && (
            <Link
              to="/team"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                padding: "8px 16px",
                borderRadius: "20px",
                backgroundColor: "#1E4632",
                color: "#F5EAD0",
                fontSize: "13px",
                fontWeight: 700,
                textDecoration: "none",
                boxShadow: "0 4px 12px rgba(30, 70, 50, 0.2)",
                transition: "all 0.18s ease",
              }}
            >
              <span style={{ fontSize: "16px", lineHeight: "1" }}>+</span> Invite Team Member
            </Link>
          )}

          <div className="dashboard-hero-meta">
            <span className="dashboard-live-mark" aria-hidden="true" />
            <span>{lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Overview"}</span>
          </div>
        </div>
      </section>

      {hasLoadError && (
        <div className="dashboard-notice" role="status">
          Some farm data could not be reached. Available records are still shown.
        </div>
      )}

      <section className="dashboard-cards dashboard-stat-grid" aria-label="Role summary">
        {statCards.map((card, idx) => (
          <Link
            key={idx}
            className={`dashboard-card stat-card ${card.cardClass}`}
            to={card.to}
          >
            <span className="stat-card-top">
              <span className="stat-icon">{card.icon}</span>
              <span className="stat-trend">{card.trend}</span>
            </span>
            <span className="stat-label">{card.label}</span>
            <strong>
              {card.value}
              {card.unit && <small> {card.unit}</small>}
            </strong>
            <span className="stat-footnote">
              {card.footnote} <span>→</span>
            </span>
          </Link>
        ))}
      </section>

      <div className="dashboard-content-grid">
        {/* Health Panel (Owners, Managers, Agronomists, Veterinarians) */}
        {["admin", "farm_owner", "farm_manager", "agronomist", "veterinarian"].includes(userRole) && (
          <section className="dashboard-panel dashboard-health-panel">
            <div className="panel-heading">
              <div><p className="section-kicker">Portfolio snapshot</p><h2>Farm health</h2></div>
              <Link className="text-link" to="/reports">View reports <span>→</span></Link>
            </div>
            {farmHealth === null ? (
              <div className="dashboard-empty-inline">
                <span className="empty-state-icon">⌂</span>
                <div><strong>Your farm health starts here</strong><p>Add a farm to track crops, livestock, irrigation, and alerts together.</p></div>
                <Link to="/farm">Add a farm <span>→</span></Link>
              </div>
            ) : (
              <>
                <div className="health-score-row">
                  <div><strong className="health-score">{farmHealth}<small>%</small></strong><span className="health-caption">of farms without priority alerts</span></div>
                  <span className={`health-status ${criticalAlerts.length ? "health-status-watch" : ""}`}><i />{criticalAlerts.length ? "Needs attention" : "Clear"}</span>
                </div>
                <div className="health-meter" role="img" aria-label={`${farmHealth}% of farms have no priority alerts`}><span style={{ width: `${farmHealth}%` }} /></div>
                <div className="health-breakdown">
                  <Link to="/crops"><span className="health-breakdown-icon">✳</span><span><strong>{data.crops.length}</strong><small>Crop records</small></span><b>→</b></Link>
                  {["admin", "farm_owner", "farm_manager", "veterinarian"].includes(userRole) && (
                    <Link to="/livestock"><span className="health-breakdown-icon">◉</span><span><strong>{data.animals.length}</strong><small>Animals</small></span><b>→</b></Link>
                  )}
                  <Link to="/irrigation"><span className="health-breakdown-icon">⌁</span><span><strong>{data.systems.length}</strong><small>Water systems</small></span><b>→</b></Link>
                </div>
              </>
            )}
          </section>
        )}

        {/* Weather Watch */}
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

        {/* Recent Activity (Owners, Managers, Agronomists, Accountants) */}
        {userRole !== "worker" && (
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
        )}

        {/* Operations Panel */}
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
            {["admin", "farm_owner", "farm_manager", "agronomist"].includes(userRole) && <Link to="/harvest">Record harvest <span>→</span></Link>}
            {["admin", "farm_owner", "farm_manager"].includes(userRole) && <Link to="/labour">Review tasks <span>→</span></Link>}
            {["admin", "farm_owner", "farm_manager", "accountant"].includes(userRole) && <Link to="/inventory">Check stock <span>→</span></Link>}
            {["admin", "farm_owner", "farm_manager", "veterinarian"].includes(userRole) && <Link to="/livestock">Livestock records <span>→</span></Link>}
            {userRole === "worker" && <Link to="/tools">Check equipment <span>→</span></Link>}
          </div>
        </section>

        {/* Active Alerts */}
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

        {/* Farm & Fields (Owners, Managers, Agronomists) */}
        {["admin", "farm_owner", "farm_manager", "agronomist"].includes(userRole) && (
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
        )}
      </div>
    </div>
  );
}

export default Dashboard;
