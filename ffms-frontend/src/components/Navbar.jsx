import { useState, useEffect } from "react";
import Logo from "./Logo";
import { Link } from "react-router-dom";
import alertService from "../services/alertService";
import AccountMenu from "./AccountMenu";

function Navbar({ onToggleSidebar, sidebarOpen = false }) {
  const [unreadAlertsCount, setUnreadAlertsCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const checkAlerts = async () => {
      try {
        const alerts = await alertService.getActiveAlerts(1, true);
        if (isMounted) {
          const unread = alerts.filter((a) => !a.is_read || a.is_read === 0).length;
          setUnreadAlertsCount(unread);
        }
      } catch {
        // Silently ignore background polling errors
      }
    };

    checkAlerts();
    const interval = setInterval(checkAlerts, 30000); // poll every 30s
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <header className="navbar">
      <div className="navbar-left">
        <button
          type="button"
          className="mobile-menu-btn"
          onClick={onToggleSidebar}
          aria-label={sidebarOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-controls="primary-navigation"
          aria-expanded={sidebarOpen}
        >
          <span aria-hidden="true">{sidebarOpen ? "×" : "☰"}</span>
        </button>
        <div className="navbar-brand">
          <Logo className="navbar-logo" />
          <span>Farm Management System</span>
        </div>
      </div>

      <div className="navbar-right" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <Link
          to="/alerts"
          style={{
            position: "relative",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "7px 14px",
            borderRadius: "20px",
            backgroundColor: "rgba(255, 255, 255, 0.08)",
            border: "1px solid rgba(212, 165, 74, 0.3)",
            color: "var(--color-gold, #D4A54A)",
            textDecoration: "none",
            fontSize: "13px",
            fontWeight: 700,
            transition: "all 0.18s ease",
          }}
          title="System Alerts"
        >
          <span>🔔 Alerts</span>
          {unreadAlertsCount > 0 && (
            <span
              style={{
                marginLeft: "6px",
                padding: "2px 6px",
                borderRadius: "10px",
                fontSize: "11px",
                fontWeight: 700,
                backgroundColor: "#C0392B",
                color: "#FFF",
                lineHeight: "1",
              }}
            >
              {unreadAlertsCount}
            </span>
          )}
        </Link>

        {/* Consolidated Profile & Account Menu */}
        <AccountMenu />
      </div>
    </header>
  );
}

export default Navbar;