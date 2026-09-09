import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "./Logo";

function Navbar() {
  const navigate = useNavigate();
  const profileMenuRef = useRef(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const session = JSON.parse(localStorage.getItem("ffms_session") || "null");
  const users = JSON.parse(localStorage.getItem("ffms_users") || "{}");
  const profile = users[session?.email] || session || {};
  const displayName = profile.name || session?.name || "User";
  const role = profile.role || profile.farmerType || "Farmer";
  const institution = profile.institution || "Not provided";

  const handleLogout = () => {
    sessionStorage.clear();
    localStorage.removeItem("ffms_session");
    navigate("/");
  };

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    const handleEscape = (event) => {
      if (event.key === "Escape") setIsProfileOpen(false);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <header className="navbar">
      <div className="navbar-left">
        <div className="navbar-brand">
          <Logo className="navbar-logo" />
          <span>Farm Management System</span>
        </div>
      </div>

      <div className="navbar-right">
        <div className="profile-menu" ref={profileMenuRef}>
          <button
            type="button"
            className={`welcome-trigger${isProfileOpen ? " is-open" : ""}`}
            aria-label={`Welcome, ${displayName}. Open profile menu`}
            aria-expanded={isProfileOpen}
            aria-haspopup="dialog"
            onClick={() => setIsProfileOpen((isOpen) => !isOpen)}
          >
            <span className="profile-avatar profile-avatar-small">
              {profile.photo ? <img src={profile.photo} alt="" /> : displayName.charAt(0).toUpperCase()}
            </span>
            <span className="welcome-text"><span className="welcome-label">Welcome,</span> <span className="user-name">{displayName}</span></span>
            <span className="profile-chevron" aria-hidden="true">⌄</span>
          </button>

          {isProfileOpen && (
            <div className="profile-popover" role="dialog" aria-label="Profile menu">
              <div className="profile-popover-summary">
                <span className="profile-avatar profile-avatar-large">
                  {profile.photo ? <img src={profile.photo} alt={`${displayName}'s profile`} /> : displayName.charAt(0).toUpperCase()}
                </span>
                <div><strong>{displayName}</strong><span>{profile.email || session?.email || "No email provided"}</span></div>
              </div>
              <div className="profile-popover-meta"><span>{role}</span><span>{institution}</span></div>
              <div className="profile-popover-actions">
                <Link to="/profile" onClick={() => setIsProfileOpen(false)}>View Profile</Link>
                <Link to="/profile?edit=1" onClick={() => setIsProfileOpen(false)}>Edit Profile</Link>
                <Link to="/profile#account-settings" onClick={() => setIsProfileOpen(false)}>Account Settings</Link>
                <button type="button" onClick={handleLogout}>Logout</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;