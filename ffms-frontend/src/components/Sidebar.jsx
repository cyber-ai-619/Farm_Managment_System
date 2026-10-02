import { Link, useLocation } from "react-router-dom";

function Sidebar({ isOpen, onClose }) {
  const location = useLocation();

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
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} />}
      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
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