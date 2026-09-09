import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function getGreeting(hour) {
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  return "Good evening";
}

function Dashboard() {
  const session = JSON.parse(localStorage.getItem("ffms_session") || "null");
  const [currentDate, setCurrentDate] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentDate(new Date());
    }, 60000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  const formattedDate = currentDate.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const displayName = session?.name || "Farmer";
  const firstName = displayName.split(" ")[0];
  const greeting = getGreeting(currentDate.getHours());
  const stats = [
    { icon: "⌂", label: "Total farms", value: "0", note: "Add your first farm", route: "/farm" },
    { icon: "▥", label: "Active crops", value: "0", note: "No crop records yet", route: "/crops" },
    { icon: "◌", label: "Livestock", value: "0", note: "No livestock records yet", route: "/livestock" },
    { icon: "▦", label: "Inventory items", value: "0", note: "Stock is ready to track", route: "/inventory" },
  ];
  const quickActions = [
    { label: "Add farm", route: "/farm", icon: "+" },
    { label: "Add crop", route: "/crops", icon: "▥" },
    { label: "Record harvest", route: "/harvest", icon: "⌁" },
    { label: "Add expense", route: "/money", icon: "¤" },
  ];

  return (
    <div className="dashboard-page">
      <section className="dashboard-hero">
        <div>
          <p className="dashboard-brand">AgriHud / Field overview</p>
          <h1><span className="dashboard-greeting" key={greeting}>{greeting}, {firstName}</span></h1>
          <p className="dashboard-intro">Here is your farm command centre. Add your first records to start seeing the season take shape.</p>
        </div>
        <div className="season-mark" aria-hidden="true" title={formattedDate}>
          <span>{currentDate.getDate()}</span>
          <small>{currentDate.toLocaleDateString("en-GB", { month: "short" }).toUpperCase()}<br />{currentDate.getFullYear()}</small>
        </div>
      </section>

      <section className="dashboard-cards" aria-label="Farm summary">
        {stats.map((stat) => (
          <Link className="dashboard-card" to={stat.route} key={stat.label}>
            <span className="stat-icon" aria-hidden="true">{stat.icon}</span>
            <h3>{stat.label}</h3>
            <p>{stat.value}</p>
            <small>{stat.note}</small>
          </Link>
        ))}
      </section>

      <div className="dashboard-grid">
        <section className="dashboard-panel performance-panel" aria-labelledby="performance-heading">
          <div className="panel-heading"><div><p className="section-kicker">Season at a glance</p><h2 id="performance-heading">Farm performance</h2></div><span className="panel-chip">Live overview</span></div>
          <div className="performance-chart" role="img" aria-label="Farm performance chart with no records yet">
            <div className="chart-y-axis"><span>100%</span><span>50%</span><span>0%</span></div>
            <div className="chart-area">
              {["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((month) => <div className="chart-column" key={month}><span className="chart-bar" /><small>{month}</small></div>)}
              <span className="chart-empty-label">Add farm records to reveal performance</span>
            </div>
          </div>
        </section>

        <section className="dashboard-panel weather-panel" aria-labelledby="weather-heading">
          <div className="panel-heading"><div><p className="section-kicker">Field conditions</p><h2 id="weather-heading">Weather watch</h2></div><span className="weather-symbol" aria-hidden="true">☼</span></div>
          <div className="weather-reading"><strong>--°</strong><span>Awaiting local weather data</span></div>
          <div className="weather-details"><span>Rain probability <b>--</b></span><span>Humidity <b>--</b></span><span>Wind <b>--</b></span></div>
          <Link className="text-link" to="/weather">Open weather records <span aria-hidden="true">→</span></Link>
        </section>

        <section className="dashboard-panel overview-panel" aria-labelledby="crops-heading">
          <div className="panel-heading"><div><p className="section-kicker">Growing season</p><h2 id="crops-heading">Crop overview</h2></div><Link className="text-link" to="/crops">Manage crops <span aria-hidden="true">→</span></Link></div>
          <div className="empty-state"><span className="empty-state-icon" aria-hidden="true">▥</span><strong>No crop records yet</strong><p>Your fields and growth stages will appear here.</p></div>
        </section>

        <section className="dashboard-panel overview-panel" aria-labelledby="livestock-heading">
          <div className="panel-heading"><div><p className="section-kicker">Herd & flock</p><h2 id="livestock-heading">Livestock overview</h2></div><Link className="text-link" to="/livestock">Manage livestock <span aria-hidden="true">→</span></Link></div>
          <div className="livestock-metrics"><div><strong>0</strong><span>Total animals</span></div><div><strong>0</strong><span>Healthy</span></div><div><strong>0</strong><span>Attention</span></div></div>
          <div className="empty-state compact"><p>Livestock activity will appear after your first entry.</p></div>
        </section>
      </div>

      <section className="dashboard-lower-grid">
        <section className="dashboard-panel activity-panel" aria-labelledby="activity-heading">
          <div className="panel-heading"><div><p className="section-kicker">Your farm log</p><h2 id="activity-heading">Recent activity</h2></div></div>
          <div className="timeline-empty"><span className="timeline-dot" aria-hidden="true" /><p>No recent activity yet.<br /><small>New records will be tracked here.</small></p></div>
        </section>
        <section className="dashboard-panel actions-panel" aria-labelledby="actions-heading">
          <div className="panel-heading"><div><p className="section-kicker">Move work forward</p><h2 id="actions-heading">Quick actions</h2></div></div>
          <div className="quick-actions">{quickActions.map((action) => <Link to={action.route} className="quick-action" key={action.label}><span aria-hidden="true">{action.icon}</span>{action.label}</Link>)}</div>
        </section>
      </section>

    </div>
  );
}

export default Dashboard;
