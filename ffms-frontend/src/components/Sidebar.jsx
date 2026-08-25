import { Link } from "react-router-dom";
import Logo from "./Logo";

function Sidebar() {
  return (
    <aside className="sidebar">
      <Logo className="sidebar-logo" />

      <nav className="sidebar-menu">
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/farm">Farms</Link>
        <Link to="/crops">Crops</Link>
        <Link to="/livestock">Livestock</Link>
        <Link to="/irrigation">Irrigation</Link>
        <Link to="/inventory">Inventory</Link>
        <Link to="/tools">Equipment</Link>
        <Link to="/labour">Labour</Link>
        <Link to="/pest-disease">Pest & Disease</Link>
        <Link to="/weather">Weather</Link>
        <Link to="/harvest">Harvest</Link>
        <Link to="/sales">Sales</Link>
        <Link to="/money">Finance</Link>
        <Link to="/suppliers">Suppliers</Link>
        <Link to="/storage">Storage</Link>
        <Link to="/reports">Reports</Link>
        <Link to="/alerts">Notifications</Link>
      </nav>
    </aside>
  );
}

export default Sidebar;