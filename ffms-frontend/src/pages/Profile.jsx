import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

const farmerTypes = [
  "Small-scale farmer",
  "Commercial farmer",
  "Livestock farmer",
  "Mixed farmer",
  "Other",
];

function getStoredProfile() {
  const session = JSON.parse(localStorage.getItem("ffms_session") || "null");
  const users = JSON.parse(localStorage.getItem("ffms_users") || "{}");
  return {
    session,
    profile: users[session?.email] || session || {},
    users,
  };
}

function Profile() {
  const [searchParams] = useSearchParams();
  const { session, profile: storedProfile, users } = getStoredProfile();
  const [profile, setProfile] = useState(storedProfile);
  const [draft, setDraft] = useState(storedProfile);
  const [isEditing, setIsEditing] = useState(searchParams.get("edit") === "1");
  const [status, setStatus] = useState(null);

  useEffect(() => {
    if (searchParams.get("edit") === "1") setIsEditing(true);
  }, [searchParams]);

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
    const updatedProfile = {
      ...profile,
      ...draft,
      email: normalizedEmail,
      role: draft.role || draft.farmerType || "Farmer",
      institution: draft.institution || "Not provided",
    };
    const updatedUsers = { ...users, [normalizedEmail]: updatedProfile };
    localStorage.setItem("ffms_users", JSON.stringify(updatedUsers));
    localStorage.setItem("ffms_session", JSON.stringify({
      ...session,
      name: updatedProfile.name,
      email: normalizedEmail,
      role: updatedProfile.role,
      institution: updatedProfile.institution,
      location: updatedProfile.location,
      farmerType: updatedProfile.farmerType,
      phone: updatedProfile.phone,
      physicalAddress: updatedProfile.physicalAddress,
      photo: updatedProfile.photo,
    }));
    setProfile(updatedProfile);
    setDraft(updatedProfile);
    setIsEditing(false);
    setStatus("Profile updated successfully.");
  };

  const handleCancel = () => {
    setDraft(profile);
    setIsEditing(false);
    setStatus(null);
  };

  const displayName = profile.name || session?.name || "Farmer";
  const role = profile.role || profile.farmerType || "Farmer";
  const institution = profile.institution || "Not provided";

  return (
    <div className="profile-page">
      <Link className="profile-back-link" to="/dashboard">← Back to dashboard</Link>
      <section className="profile-page-header">
        <div>
          <p className="section-kicker">Your account</p>
          <h1>Profile</h1>
          <p>Keep your account details current so your farm workspace stays personal and useful.</p>
        </div>
        {!isEditing && <button type="button" className="profile-edit-button" onClick={() => setIsEditing(true)}>Edit profile</button>}
      </section>

      {status && <p className="profile-status" role="status">{status}</p>}

      <section className="profile-panel profile-page-card" aria-labelledby="profile-details-heading">
        <div className="profile-page-card-heading">
          <div className="profile-photo profile-photo-large">
            {draft.photo ? <img src={draft.photo} alt={`${displayName}'s profile`} /> : <span>{displayName.charAt(0).toUpperCase()}</span>}
          </div>
          <div>
            <p className="section-kicker">Personal details</p>
            <h2 id="profile-details-heading">{displayName}</h2>
            <p>{profile.email || session?.email || "No email provided"}</p>
          </div>
        </div>

        {isEditing ? (
          <form className="profile-form profile-page-form" onSubmit={handleSave}>
            <div className="profile-photo-area">
              <label className="photo-upload-button" htmlFor="profile-photo">Upload picture<input id="profile-photo" type="file" accept="image/*" onChange={handlePhotoChange} /></label>
            </div>
            <div className="profile-fields">
              <div className="form-field"><label htmlFor="profile-name">Full Name</label><input id="profile-name" type="text" value={draft.name || ""} onChange={(e) => updateDraft("name", e.target.value)} required /></div>
              <div className="form-field"><label htmlFor="profile-email">Email</label><input id="profile-email" type="email" value={draft.email || session?.email || ""} disabled /></div>
              <div className="form-field"><label htmlFor="profile-role">Role</label><input id="profile-role" type="text" value={draft.role || draft.farmerType || ""} onChange={(e) => updateDraft("role", e.target.value)} placeholder="e.g. Farm administrator" /></div>
              <div className="form-field"><label htmlFor="profile-institution">Institution</label><input id="profile-institution" type="text" value={draft.institution || ""} onChange={(e) => updateDraft("institution", e.target.value)} placeholder="Your school, organisation, or farm" /></div>
              <div className="form-field"><label htmlFor="profile-location">Location</label><input id="profile-location" type="text" value={draft.location || ""} onChange={(e) => updateDraft("location", e.target.value)} /></div>
              <div className="form-field"><label htmlFor="profile-phone">Phone Number</label><input id="profile-phone" type="tel" value={draft.phone || ""} onChange={(e) => updateDraft("phone", e.target.value)} /></div>
              <div className="form-field"><label htmlFor="profile-physical-address">Physical Address</label><textarea id="profile-physical-address" rows="3" value={draft.physicalAddress || ""} onChange={(e) => updateDraft("physicalAddress", e.target.value)} /></div>
              <div className="form-field"><label htmlFor="profile-farmer-type">Type of Farmer</label><select id="profile-farmer-type" value={draft.farmerType || ""} onChange={(e) => updateDraft("farmerType", e.target.value)}><option value="">Select your farmer type</option>{farmerTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select></div>
            </div>
            <div className="profile-actions"><button type="submit" className="profile-save-button">Save changes</button><button type="button" className="profile-cancel-button" onClick={handleCancel}>Cancel</button></div>
          </form>
        ) : (
          <div className="profile-details-grid profile-page-details">
            <div><span>Full Name</span><strong>{displayName}</strong></div>
            <div><span>Email</span><strong>{profile.email || session?.email || "Not provided"}</strong></div>
            <div><span>Role</span><strong>{role}</strong></div>
            <div><span>Institution</span><strong>{institution}</strong></div>
            <div><span>Location</span><strong>{profile.location || "Not provided"}</strong></div>
            <div><span>Phone Number</span><strong>{profile.phone || "Not provided"}</strong></div>
            <div><span>Physical Address</span><strong>{profile.physicalAddress || "Not provided"}</strong></div>
            <div><span>Type of Farmer</span><strong>{profile.farmerType || "Not provided"}</strong></div>
          </div>
        )}
      </section>

      <section className="profile-panel account-settings-panel" id="account-settings" aria-labelledby="account-settings-heading">
        <div className="panel-heading"><div><p className="section-kicker">Account</p><h2 id="account-settings-heading">Account settings</h2></div></div>
        <div className="account-setting-row"><div><strong>Sign-in email</strong><span>{profile.email || session?.email || "Not provided"}</span></div><span className="account-setting-note">Managed securely</span></div>
      </section>
    </div>
  );
}

export default Profile;
