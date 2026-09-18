import { useState, useEffect } from "react";
import Logo from "./Logo";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import alertService from "../services/alertService";

function Navbar() {
  const navigate = useNavigate();
  const { user, role, logout } = useAuth();
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

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const formatRole = (r) => {
    if (!r) return "User";
    return r
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <header className="navbar">
      <div className="navbar-left">
        <div className="navbar-brand">
          <Logo className="navbar-logo" />
          <span>Farm Management System</span>
        </div>
      </div>

      <div className="navbar-right">
        <Link
          to="/alerts"
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "6px 12px",
            borderRadius: "8px",
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            border: "1px solid rgba(212, 165, 74, 0.3)",
            color: "var(--color-gold, #D4A54A)",
            textDecoration: "none",
            fontSize: "14px",
            fontWeight: 600,
            marginRight: "10px",
          }}
          title="System Alerts"
        >
          🔔 Alerts
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
              }}
            >
              {unreadAlertsCount}
            </span>
          )}
        </Link>

        <span className="welcome-text">
          <span className="welcome-label">Welcome</span>{" "}
          <span className="user-name">{user?.name || "User"}</span>
          <span
            style={{
              marginLeft: "0.5rem",
              padding: "0.2rem 0.6rem",
              borderRadius: "12px",
              fontSize: "0.75rem",
              fontWeight: 600,
              backgroundColor: "rgba(212, 165, 74, 0.2)",
              color: "var(--color-gold, #D4A54A)",
              border: "1px solid rgba(212, 165, 74, 0.4)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {formatRole(role)}
          </span>
        </span>
        <button type="button" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}

export default Navbar;