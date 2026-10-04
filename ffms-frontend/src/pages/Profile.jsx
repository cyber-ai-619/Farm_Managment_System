import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

function Profile() {
  const { user, role, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const updatedName = name.trim();
    if (!updatedName || updatedName.length > 150) {
      setErrorMessage("Enter a name between 1 and 150 characters.");
      return;
    }

    try {
      setIsSaving(true);
      const updatedUser = await updateProfile({ name: updatedName });
      setName(updatedUser.name);
      setSuccessMessage("Profile updated.");
    } catch (error) {
      setErrorMessage(error.message || "Could not update your profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const resetName = () => {
    setName(user?.name || "");
    setErrorMessage("");
    setSuccessMessage("");
  };

  return (
    <div className="page-wrapper profile-page">
      <div className="page-header profile-page-header">
        <div>
          <p className="dashboard-brand">Account</p>
          <h1>Profile</h1>
        </div>
        <Link className="btn-secondary" to="/dashboard">Back to dashboard</Link>
      </div>

      <section className="page-content-section profile-editor" aria-labelledby="profile-heading">
        <div className="profile-editor-heading">
          <span className="profile-avatar-large" aria-hidden="true">
            {(user?.name || "U").trim().charAt(0).toUpperCase()}
          </span>
          <div>
            <h2 id="profile-heading">Account details</h2>
            <p>Update the name shown across your farm workspace.</p>
          </div>
        </div>

        {errorMessage && <p className="profile-feedback profile-feedback-error" role="alert">{errorMessage}</p>}
        {successMessage && <p className="profile-feedback profile-feedback-success" role="status">{successMessage}</p>}

        <form className="profile-editor-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="profile-name">Full name</label>
            <input
              id="profile-name"
              autoComplete="name"
              maxLength={150}
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={isSaving}
              required
            />
          </div>
          <div className="form-field">
            <label htmlFor="profile-email">Email address</label>
            <input id="profile-email" type="email" value={user?.email || ""} readOnly />
          </div>
          <div className="form-field">
            <label htmlFor="profile-role">Role</label>
            <input id="profile-role" value={role.replaceAll("_", " ")} readOnly />
          </div>
          <div className="profile-editor-actions">
            <button className="btn-primary" type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save changes"}
            </button>
            <button className="btn-secondary" type="button" onClick={resetName} disabled={isSaving}>
              Reset
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default Profile;
