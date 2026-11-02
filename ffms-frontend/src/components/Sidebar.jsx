import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", roles: ["admin", "farm_owner", "farm_manager", "agronomist", "accountant", "veterinarian"] },
  { to: "/my-work", label: "My Work & Tasks", roles: ["worker", "admin", "farm_owner", "farm_manager"] },
  { to: "/farm", label: "Farms & Fields", roles: ["admin", "farm_owner", "farm_manager", "agronomist"] },
  { to: "/crops", label: "Crops & Planting", roles: ["admin", "farm_owner", "farm_manager", "agronomist"] },
  { to: "/livestock", label: "Livestock & Herds", roles: ["admin", "farm_owner", "farm_manager", "veterinarian"] },
  { to: "/irrigation", label: "Irrigation Systems", roles: ["admin", "farm_owner", "farm_manager", "agronomist", "worker"] },
  { to: "/inventory", label: "Inventory & Stock", roles: ["admin", "farm_owner", "farm_manager", "accountant"] },
  { to: "/tools", label: "Tools & Equipment", roles: ["admin", "farm_owner", "farm_manager", "worker"] },
  { to: "/labour", label: "Labour & Workforce", roles: ["admin", "farm_owner", "farm_manager"] },
  { to: "/team", label: "Farm Team & Access", roles: ["admin", "farm_owner"] },
  { to: "/pest-disease", label: "Pest & Disease", roles: ["admin", "farm_owner", "farm_manager", "agronomist"] },
  { to: "/weather", label: "Weather Station", roles: ["admin", "farm_owner", "farm_manager", "agronomist", "worker"] },
  { to: "/harvest", label: "Harvest Produce", roles: ["admin", "farm_owner", "farm_manager", "agronomist"] },
  { to: "/sales", label: "Sales & Orders", roles: ["admin", "farm_owner", "farm_manager", "accountant"] },
  { to: "/money", label: "Finance & Budgets", roles: ["admin", "farm_owner", "accountant"] },
  { to: "/suppliers", label: "Suppliers & Procurement", roles: ["admin", "farm_owner", "farm_manager", "accountant"] },
  { to: "/storage", label: "Storage & Warehouses", roles: ["admin", "farm_owner", "farm_manager", "accountant"] },
  { to: "/reports", label: "Analytics & Reports", roles: ["admin", "farm_owner", "farm_manager", "agronomist", "accountant", "veterinarian"] },
  { to: "/alerts", label: "System Alerts", roles: ["admin", "farm_owner", "farm_manager", "agronomist", "accountant", "worker", "veterinarian"] },
];

function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const { role } = useAuth();
  const [isMobileViewport, setIsMobileViewport] = useState(() => (
    typeof window !== "undefined" && window.matchMedia("(max-width: 900px)").matches
  ));

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 900px)");
    const updateViewport = (event) => setIsMobileViewport(event.matches);
    mediaQuery.addEventListener("change", updateViewport);
    return () => mediaQuery.removeEventListener("change", updateViewport);
  }, []);

  const handleLinkClick = () => {
    if (onClose) onClose();
  };

  const userRole = role || "worker";
  const visibleNavItems = NAV_ITEMS.filter((item) => item.roles.includes(userRole));

  return (
    <>
      {isOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          onClick={onClose}
          aria-label="Close navigation menu"
        />
      )}
      <aside
        id="primary-navigation"
        className={`sidebar ${isOpen ? "open" : ""}`}
        aria-label="Primary navigation"
        aria-hidden={isMobileViewport && !isOpen}
        inert={isMobileViewport && !isOpen}
      >
        <div className="sidebar-header-mobile">
          <span style={{ color: "#F5EAD0", fontWeight: 700, fontSize: "16px" }}>Farm Navigation</span>
          <button type="button" className="sidebar-close-btn" onClick={onClose} aria-label="Close menu">
            &times;
          </button>
        </div>
        <nav className="sidebar-menu">
          {visibleNavItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={isActive ? "active" : ""}
                aria-current={isActive ? "page" : undefined}
                onClick={handleLinkClick}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

export default Sidebar;