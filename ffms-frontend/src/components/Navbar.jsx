import Logo from "./Logo";

import { useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();
  const session = JSON.parse(localStorage.getItem("ffms_session") || "null");

  const handleLogout = () => {
    sessionStorage.clear();
    localStorage.removeItem("ffms_session");
    navigate("/");
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
        <span className="welcome-text">
          <span className="welcome-label">Welcome</span> <span className="user-name">{session?.name || "User"}</span>
        </span>
        <button type="button" onClick={handleLogout}>Logout</button>
      </div>
    </header>
  );
}

export default Navbar;