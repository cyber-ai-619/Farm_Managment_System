import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

function formatRole(role = "User") {
  return role
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getInitials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("") || "U";
}

function Avatar({ user, size = "small", decorative = true }) {
  const photo = user?.profile_photo;
  const [failedPhoto, setFailedPhoto] = useState(null);
  const imageFailed = failedPhoto === photo;

  return (
    <span
      className={`profile-avatar profile-avatar-${size}`}
      aria-hidden={decorative ? "true" : undefined}
      aria-label={decorative ? undefined : `${user?.name || "User"} profile photo`}
      role={decorative ? undefined : "img"}
    >
      {photo && !imageFailed ? (
        <img src={photo} alt={decorative ? "" : `${user?.name || "User"} profile`} onError={() => setFailedPhoto(photo)} />
      ) : getInitials(user?.name)}
    </span>
  );
}

function readImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read this image. Try another file."));
    reader.readAsDataURL(file);
  });
}

function AccountDrawer({ mode, onClose, onSaved, onModeChange }) {
  const { user, role, updateProfile, changePassword } = useAuth();
  const nameParts = (user?.name || "").trim().split(/\s+/).filter(Boolean);
  const [firstName, setFirstName] = useState(nameParts[0] || "");
  const [lastName, setLastName] = useState(nameParts.slice(1).join(" "));
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [location, setLocation] = useState(user?.location || "");
  const [photo, setPhoto] = useState(user?.profile_photo || null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const dialogRef = useRef(null);
  const nameInputRef = useRef(null);
  const closingTimerRef = useRef(null);

  const requestClose = useCallback(() => {
    if (closingTimerRef.current) return;
    setIsClosing(true);
    closingTimerRef.current = window.setTimeout(onClose, 180);
  }, [onClose]);

  const finishSaved = useCallback((message) => {
    setIsClosing(true);
    closingTimerRef.current = window.setTimeout(() => onSaved(message), 180);
  }, [onSaved]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousRootOverflow = document.documentElement.style.overflow;
    const handleEscape = (event) => {
      if (event.key === "Escape") requestClose();
    };
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.addEventListener("keydown", handleEscape);
    nameInputRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      document.documentElement.style.overflow = previousRootOverflow;
      document.removeEventListener("keydown", handleEscape);
      if (closingTimerRef.current) window.clearTimeout(closingTimerRef.current);
    };
  }, [requestClose]);

  const trapFocus = (event) => {
    if (event.key !== "Tab" || !dialogRef.current) return;
    const elements = [...dialogRef.current.querySelectorAll(
      'button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
    )];
    if (!elements.length) return;
    const first = elements[0];
    const last = elements[elements.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const handlePhoto = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setErrorMessage("");

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setErrorMessage("Choose a JPG, PNG, or WEBP image.");
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setErrorMessage("Profile photos must be 5 MB or smaller.");
      return;
    }

    try {
      const bitmap = await createImageBitmap(file);
      bitmap.close();
      setPhoto(await readImage(file));
    } catch {
      setErrorMessage("This file could not be opened as an image. Choose another file.");
    }
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    const cleanFirst = firstName.trim();
    const cleanLast = lastName.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();

    if (!cleanFirst || !cleanLast) {
      setErrorMessage("Enter both your first and last name.");
      return;
    }
    if (`${cleanFirst} ${cleanLast}`.length > 150) {
      setErrorMessage("Your full name must be 150 characters or fewer.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMessage("Enter a valid email address.");
      return;
    }
    if (cleanPhone && !/^[0-9+().\-\s]{7,30}$/.test(cleanPhone)) {
      setErrorMessage("Enter a valid phone number.");
      return;
    }

    try {
      setIsSaving(true);
      await updateProfile({
        name: `${cleanFirst} ${cleanLast}`,
        email: cleanEmail,
        phone: cleanPhone,
        location: location.trim(),
        profile_photo: photo,
      });
      finishSaved("Profile updated successfully.");
    } catch (error) {
      setErrorMessage(error.message || "Could not update your profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    if (newPassword.length < 8) {
      setErrorMessage("Your new password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage("The new passwords do not match.");
      return;
    }

    try {
      setIsSaving(true);
      await changePassword({ current_password: currentPassword, new_password: newPassword });
      finishSaved("Password changed successfully.");
    } catch (error) {
      setErrorMessage(error.message || "Could not change your password.");
    } finally {
      setIsSaving(false);
    }
  };

  const title = mode === "profile" ? "Edit Profile" : mode === "password" ? "Change Password" : "Account Settings";
  const subtitle = mode === "profile"
    ? "Update your personal information"
    : mode === "password"
      ? "Choose a new password for your account"
      : "Review your sign-in and account details";

  return createPortal((
    <div className={`account-drawer-backdrop${isClosing ? " is-closing" : ""}`} onMouseDown={(event) => event.target === event.currentTarget && requestClose()}>
      <section
        aria-labelledby="account-drawer-title"
        aria-modal="true"
        className="account-drawer"
        onKeyDown={trapFocus}
        ref={dialogRef}
        role="dialog"
      >
        <header className="account-drawer-header">
          <div>
            <p className="section-kicker">Your account</p>
            <h2 id="account-drawer-title">{title}</h2>
            <p>{subtitle}</p>
          </div>
          <button className="account-close-button" type="button" onClick={requestClose} aria-label="Close account panel">×</button>
        </header>

        {errorMessage && <p className="account-feedback account-feedback-error" role="alert">{errorMessage}</p>}

        {mode === "profile" && (
          <form className="account-form" onSubmit={handleProfileSave}>
            <div className="account-photo-editor">
              <Avatar user={{ ...user, profile_photo: photo, name: `${firstName} ${lastName}` }} size="editor" decorative={false} />
              <div>
                <label className="account-photo-button" htmlFor="account-photo-input">Change photo</label>
                <input
                  accept="image/jpeg,image/png,image/webp"
                  className="visually-hidden"
                  id="account-photo-input"
                  onChange={handlePhoto}
                  type="file"
                />
                {photo && <button className="account-remove-photo" type="button" onClick={() => setPhoto(null)}>Remove photo</button>}
                <small>JPG, PNG or WEBP. Maximum 5 MB.</small>
              </div>
            </div>
            <div className="account-form-grid">
              <div className="form-field">
                <label htmlFor="account-first-name">First name</label>
                <input ref={nameInputRef} id="account-first-name" autoComplete="given-name" maxLength={75} value={firstName} onChange={(event) => setFirstName(event.target.value)} required />
              </div>
              <div className="form-field">
                <label htmlFor="account-last-name">Last name</label>
                <input id="account-last-name" autoComplete="family-name" maxLength={75} value={lastName} onChange={(event) => setLastName(event.target.value)} required />
              </div>
              <div className="form-field account-form-wide">
                <label htmlFor="account-email">Email address</label>
                <input id="account-email" type="email" autoComplete="email" maxLength={255} value={email} onChange={(event) => setEmail(event.target.value)} required />
              </div>
              <div className="form-field">
                <label htmlFor="account-phone">Phone number</label>
                <input id="account-phone" type="tel" autoComplete="tel" maxLength={30} value={phone} onChange={(event) => setPhone(event.target.value)} />
              </div>
              <div className="form-field">
                <label htmlFor="account-location">Location</label>
                <input id="account-location" autoComplete="address-level2" maxLength={255} value={location} onChange={(event) => setLocation(event.target.value)} />
              </div>
            </div>
            <footer className="account-drawer-actions">
              <button className="btn-secondary" type="button" onClick={requestClose} disabled={isSaving}>Cancel</button>
              <button className="btn-primary" type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Save Changes"}</button>
            </footer>
          </form>
        )}

        {mode === "settings" && (
          <div className="account-settings-content">
            <div><span>Email address</span><strong>{user?.email}</strong></div>
            <div><span>Account role</span><strong>{formatRole(role)}</strong></div>
            <div><span>Account created</span><strong>{user?.created_at ? new Date(user.created_at).toLocaleDateString() : "Available after next sign in"}</strong></div>
            <button className="btn-primary" type="button" onClick={() => onModeChange("profile")}>Edit personal information</button>
          </div>
        )}

        {mode === "password" && (
          <form className="account-form account-password-form" onSubmit={handlePasswordChange}>
            <div className="form-field">
              <label htmlFor="current-password">Current password</label>
              <input ref={nameInputRef} id="current-password" type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required />
            </div>
            <div className="form-field">
              <label htmlFor="new-password">New password</label>
              <input id="new-password" type="password" autoComplete="new-password" minLength={8} maxLength={72} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required />
            </div>
            <div className="form-field">
              <label htmlFor="confirm-password">Confirm new password</label>
              <input id="confirm-password" type="password" autoComplete="new-password" minLength={8} maxLength={72} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required />
            </div>
            <footer className="account-drawer-actions">
              <button className="btn-secondary" type="button" onClick={requestClose} disabled={isSaving}>Cancel</button>
              <button className="btn-primary" type="submit" disabled={isSaving}>{isSaving ? "Updating..." : "Update Password"}</button>
            </footer>
          </form>
        )}
      </section>
    </div>
  ), document.body);
}

function AccountMenu() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const triggerRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState(null);
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    if (!isOpen) return undefined;
    const onPointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) setIsOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!savedMessage) return undefined;
    const timeout = window.setTimeout(() => setSavedMessage(""), 4000);
    return () => window.clearTimeout(timeout);
  }, [savedMessage]);

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
    navigate("/");
  };

  const openDrawer = (mode) => {
    setSavedMessage("");
    setIsOpen(false);
    setDrawerMode(mode);
  };

  const closeDrawer = useCallback(() => {
    setDrawerMode(null);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  const handleSaved = useCallback((message) => {
    closeDrawer();
    setSavedMessage(message);
  }, [closeDrawer]);

  const handleMenuKeyDown = (event) => {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    const items = [...menuRef.current.querySelectorAll('[role="menuitem"]')];
    if (!items.length) return;
    event.preventDefault();
    const currentIndex = items.indexOf(document.activeElement);
    const nextIndex = event.key === "Home"
      ? 0
      : event.key === "End"
        ? items.length - 1
        : currentIndex < 0
          ? (event.key === "ArrowDown" ? 0 : items.length - 1)
          : (currentIndex + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
    items[nextIndex].focus();
  };

  return (
    <>
      <div className="account-menu" ref={menuRef}>
        <button
          aria-expanded={isOpen}
          aria-haspopup="menu"
          aria-label={`Account menu for ${user?.name || "User"}`}
          className={`welcome-trigger${isOpen ? " is-open" : ""}`}
          onClick={() => setIsOpen((open) => !open)}
          ref={triggerRef}
          type="button"
        >
          <Avatar key={user?.profile_photo || "no-photo"} user={user} />
          <span className="account-trigger-name">{user?.name || "User"}</span>
          <span className="profile-chevron" aria-hidden="true">⌄</span>
        </button>
        {isOpen && (
          <div className="profile-popover" onKeyDown={handleMenuKeyDown} role="menu" aria-label="Account options">
            <div className="profile-popover-summary">
              <Avatar user={user} size="large" />
              <div>
                <strong>{user?.name || "User"}</strong>
                <span>{formatRole(role)}</span>
                <span>{user?.email || ""}</span>
              </div>
            </div>
            <div className="profile-popover-actions">
              <button role="menuitem" type="button" onClick={() => openDrawer("profile")}>Edit Profile</button>
              <button role="menuitem" type="button" onClick={() => openDrawer("settings")}>Account Settings</button>
              <Link role="menuitem" to="/alerts" onClick={() => setIsOpen(false)}>Notifications</Link>
              <button role="menuitem" type="button" onClick={() => openDrawer("password")}>Change Password</button>
              <button className="account-logout-action" role="menuitem" type="button" onClick={handleLogout}>Logout</button>
            </div>
          </div>
        )}
      </div>
      {savedMessage && <div className="account-toast" role="status">{savedMessage}</div>}
      {drawerMode && <AccountDrawer key={drawerMode} mode={drawerMode} onClose={closeDrawer} onModeChange={setDrawerMode} onSaved={handleSaved} />}
    </>
  );
}

export default AccountMenu;