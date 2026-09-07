import { useState } from "react";
import { Link } from "react-router-dom";

const farmerTypes = [
  "Small-scale farmer",
  "Commercial farmer",
  "Livestock farmer",
  "Mixed farmer",
  "Other",
];

function Dashboard() {
  const session = JSON.parse(localStorage.getItem("ffms_session") || "null");
  const users = JSON.parse(localStorage.getItem("ffms_users") || "{}");
  const storedUser = users[session?.email] || session || {};
  const [profile, setProfile] = useState(storedUser);
  const [draft, setDraft] = useState(storedUser);
  const [isEditing, setIsEditing] = useState(false);

  const updateDraft = (field, value) => {
    setDraft((currentDraft) => ({ ...currentDraft, [field]: value }));
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => updateDraft("photo", reader.result);
    reader.readAsDataURL(file);
  };

  const handleSave = (event) => {
    event.preventDefault();
    const normalizedEmail = session?.email;
    const updatedProfile = { ...profile, ...draft };
    const updatedUsers = { ...users, [normalizedEmail]: updatedProfile };
    localStorage.setItem("ffms_users", JSON.stringify(updatedUsers));
    localStorage.setItem("ffms_session", JSON.stringify({
      ...session,
      name: updatedProfile.name,
      email: normalizedEmail,
      location: updatedProfile.location,
      farmerType: updatedProfile.farmerType,
      phone: updatedProfile.phone,
      physicalAddress: updatedProfile.physicalAddress,
      photo: updatedProfile.photo,
    }));
    setProfile(updatedProfile);
    setDraft(updatedProfile);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setDraft(profile);
    setIsEditing(false);
  };

  const displayName = profile.name || session?.name || "Farmer";
  const firstName = displayName.split(" ")[0];
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
          <h1>Good morning, {firstName}.</h1>
          <p className="dashboard-intro">Here is your farm command centre. Add your first records to start seeing the season take shape.</p>
        </div>
        <div className="season-mark" aria-hidden="true"><span>06</span><small>SEP<br />2026</small></div>
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

      <section className="profile-panel" aria-labelledby="profile-heading">
        <div className="profile-panel-header">
          <div><p className="section-kicker">Your account</p><h2 id="profile-heading">Profile details</h2></div>
          {!isEditing && <button type="button" className="profile-edit-button" onClick={() => setIsEditing(true)}>Edit details</button>}
        </div>

        {isEditing ? (
          <form className="profile-form" onSubmit={handleSave}>
            <div className="profile-photo-area"><div className="profile-photo profile-photo-preview">{draft.photo ? <img src={draft.photo} alt="Profile preview" /> : <span>{draft.name?.charAt(0) || "U"}</span>}</div><label className="photo-upload-button" htmlFor="profile-photo">Upload picture<input id="profile-photo" type="file" accept="image/*" onChange={handlePhotoChange} /></label></div>
            <div className="profile-fields">
              <div className="form-field"><label htmlFor="profile-name">Full Name</label><input id="profile-name" type="text" value={draft.name || ""} onChange={(e) => updateDraft("name", e.target.value)} required /></div>
              <div className="form-field"><label htmlFor="profile-email">Email</label><input id="profile-email" type="email" value={draft.email || session?.email || ""} disabled /></div>
              <div className="form-field"><label htmlFor="profile-location">Location</label><input id="profile-location" type="text" value={draft.location || ""} onChange={(e) => updateDraft("location", e.target.value)} /></div>
              <div className="form-field"><label htmlFor="profile-phone">Phone Number</label><input id="profile-phone" type="tel" value={draft.phone || ""} onChange={(e) => updateDraft("phone", e.target.value)} /></div>
              <div className="form-field"><label htmlFor="profile-physical-address">Physical Address</label><textarea id="profile-physical-address" rows="3" value={draft.physicalAddress || ""} onChange={(e) => updateDraft("physicalAddress", e.target.value)} /></div>
              <div className="form-field"><label htmlFor="profile-farmer-type">Type of Farmer</label><select id="profile-farmer-type" value={draft.farmerType || ""} onChange={(e) => updateDraft("farmerType", e.target.value)}><option value="">Select your farmer type</option>{farmerTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select></div>
            </div>
            <div className="profile-actions"><button type="submit" className="profile-save-button">Save changes</button><button type="button" className="profile-cancel-button" onClick={handleCancel}>Cancel</button></div>
          </form>
        ) : (
          <div className="profile-summary">
            <div className="profile-photo">{profile.photo ? <img src={profile.photo} alt={`${profile.name || "User"}'s profile`} /> : <span>{profile.name?.charAt(0) || "U"}</span>}</div>
            <div className="profile-details-grid">
              <div><span>Full Name</span><strong>{profile.name || "Not provided"}</strong></div><div><span>Email</span><strong>{profile.email || session?.email || "Not provided"}</strong></div><div><span>Location</span><strong>{profile.location || "Not provided"}</strong></div><div><span>Phone Number</span><strong>{profile.phone || "Not provided"}</strong></div><div><span>Physical Address</span><strong>{profile.physicalAddress || "Not provided"}</strong></div><div><span>Type of Farmer</span><strong>{profile.farmerType || "Not provided"}</strong></div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default Dashboard;
