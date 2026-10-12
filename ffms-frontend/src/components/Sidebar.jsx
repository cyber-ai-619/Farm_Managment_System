import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
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

  const navItems = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/farm", label: "Farms & Fields" },
    { to: "/crops", label: "Crops & Planting" },
    { to: "/livestock", label: "Livestock & Herds" },
    { to: "/irrigation", label: "Irrigation Systems" },
    { to: "/inventory", label: "Inventory & Stock" },
    { to: "/tools", label: "Equipment & Fleet" },
    { to: "/labour", label: "Labour & Tasks" },
    { to: "/pest-disease", label: "Pest & Disease" },
    { to: "/weather", label: "Weather Station" },
    { to: "/harvest", label: "Harvest Produce" },
    { to: "/sales", label: "Sales & Orders" },
    { to: "/money", label: "Finance & Budgets" },
    { to: "/suppliers", label: "Suppliers & Procurement" },
    { to: "/storage", label: "Storage & Warehouses" },
    { to: "/reports", label: "Analytics & Reports" },
    { to: "/alerts", label: "System Alerts" },
  ];

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
          {navItems.map((item) => {
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