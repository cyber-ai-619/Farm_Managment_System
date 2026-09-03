import { useState } from "react";

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
    localStorage.setItem(
      "ffms_session",
      JSON.stringify({
        ...session,
        name: updatedProfile.name,
        email: normalizedEmail,
        location: updatedProfile.location,
        farmerType: updatedProfile.farmerType,
        phone: updatedProfile.phone,
        physicalAddress: updatedProfile.physicalAddress,
        photo: updatedProfile.photo,
      }),
    );
    setProfile(updatedProfile);
    setDraft(updatedProfile);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setDraft(profile);
    setIsEditing(false);
  };

  return (
    <div className="dashboard-page">
      <p className="dashboard-brand">AgriHud</p>
      <h1>Farm Management Dashboard</h1>

      <p>
        Welcome to the Farm Management System. Here you can manage your
        farms, crops, livestock, inventory, equipment, and other farm
        activities.
      </p>

      <div className="dashboard-cards">
        <div className="dashboard-card">
          <h3>Total Farms</h3>
          <p>0</p>
        </div>

        <div className="dashboard-card">
          <h3>Total Crops</h3>
          <p>0</p>
        </div>

        <div className="dashboard-card">
          <h3>Livestock</h3>
          <p>0</p>
        </div>

        <div className="dashboard-card">
          <h3>Inventory Items</h3>
          <p>0</p>
        </div>
      </div>

      <section className="profile-panel" aria-labelledby="profile-heading">
        <div className="profile-panel-header">
          <div>
            <p className="section-kicker">Your account</p>
            <h2 id="profile-heading">Profile details</h2>
          </div>
          {!isEditing && (
            <button type="button" className="profile-edit-button" onClick={() => setIsEditing(true)}>
              Edit details
            </button>
          )}
        </div>

        {isEditing ? (
          <form className="profile-form" onSubmit={handleSave}>
            <div className="profile-photo-area">
              <div className="profile-photo profile-photo-preview">
                {draft.photo ? <img src={draft.photo} alt="Profile preview" /> : <span>{draft.name?.charAt(0) || "U"}</span>}
              </div>
              <label className="photo-upload-button" htmlFor="profile-photo">
                Upload picture
                <input id="profile-photo" type="file" accept="image/*" onChange={handlePhotoChange} />
              </label>
            </div>

            <div className="profile-fields">
              <div className="form-field">
                <label htmlFor="profile-name">Full Name</label>
                <input id="profile-name" type="text" value={draft.name || ""} onChange={(e) => updateDraft("name", e.target.value)} required />
              </div>
              <div className="form-field">
                <label htmlFor="profile-email">Email</label>
                <input id="profile-email" type="email" value={draft.email || session?.email || ""} disabled />
              </div>
              <div className="form-field">
                <label htmlFor="profile-location">Location</label>
                <input id="profile-location" type="text" value={draft.location || ""} onChange={(e) => updateDraft("location", e.target.value)} />
              </div>
              <div className="form-field">
                <label htmlFor="profile-phone">Phone Number</label>
                <input id="profile-phone" type="tel" value={draft.phone || ""} onChange={(e) => updateDraft("phone", e.target.value)} />
              </div>
              <div className="form-field">
                <label htmlFor="profile-physical-address">Physical Address</label>
                <textarea id="profile-physical-address" rows="3" value={draft.physicalAddress || ""} onChange={(e) => updateDraft("physicalAddress", e.target.value)} />
              </div>
              <div className="form-field">
                <label htmlFor="profile-farmer-type">Type of Farmer</label>
                <select id="profile-farmer-type" value={draft.farmerType || ""} onChange={(e) => updateDraft("farmerType", e.target.value)}>
                  <option value="">Select your farmer type</option>
                  {farmerTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
            </div>

            <div className="profile-actions">
              <button type="submit" className="profile-save-button">Save changes</button>
              <button type="button" className="profile-cancel-button" onClick={handleCancel}>Cancel</button>
            </div>
          </form>
        ) : (
          <div className="profile-summary">
            <div className="profile-photo">
              {profile.photo ? <img src={profile.photo} alt={`${profile.name || "User"}'s profile`} /> : <span>{profile.name?.charAt(0) || "U"}</span>}
            </div>
            <div className="profile-details-grid">
              <div><span>Full Name</span><strong>{profile.name || "Not provided"}</strong></div>
              <div><span>Email</span><strong>{profile.email || session?.email || "Not provided"}</strong></div>
              <div><span>Location</span><strong>{profile.location || "Not provided"}</strong></div>
              <div><span>Phone Number</span><strong>{profile.phone || "Not provided"}</strong></div>
              <div><span>Physical Address</span><strong>{profile.physicalAddress || "Not provided"}</strong></div>
              <div><span>Type of Farmer</span><strong>{profile.farmerType || "Not provided"}</strong></div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default Dashboard;