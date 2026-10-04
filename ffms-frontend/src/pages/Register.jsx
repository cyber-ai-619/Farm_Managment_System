import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import { useAuth } from "../hooks/useAuth";

const ROLES = [
  { id: 2, label: "Farm Owner" },
  { id: 3, label: "Farm Manager" },
  { id: 4, label: "Agronomist" },
  { id: 5, label: "Worker / Operator" },
  { id: 6, label: "Accountant / Auditor" },
];

function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [roleId, setRoleId] = useState(2); // Default to Farm Owner for easy onboarding
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [developerDetails, setDeveloperDetails] = useState(null);
  const [showDevDetails, setShowDevDetails] = useState(false);

  const isValidEmail = (emailStr) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setDeveloperDetails(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName || !trimmedEmail || !password || !confirmPassword) {
      setErrorMessage("Please fill in all required fields.");
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setErrorMessage("Please enter a valid email address (e.g. farmer@estate.com).");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please re-enter your password.");
      return;
    }

    try {
      setSubmitting(true);
      await register({
        name: trimmedName,
        email: trimmedEmail,
        password,
        role_id: Number(roleId),
      });
      navigate("/dashboard");
    } catch (err) {
      setErrorMessage(err.message || "Registration failed. Please try again.");
      if (err.developerDetails) {
        setDeveloperDetails(err.developerDetails);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-shell">
        <section className="auth-card">
        <Logo className="auth-logo" />
        <p className="auth-brand">AgriHud</p>
        <h1>Create FFMS Account</h1>
        <p>Register for the Farm Management System.</p>

        {errorMessage && (
          <div
            style={{
              backgroundColor: "rgba(192, 57, 43, 0.12)",
              color: "#C0392B",
              border: "1px solid rgba(192, 57, 43, 0.3)",
              padding: "0.85rem 1rem",
              borderRadius: "8px",
              marginBottom: "1.25rem",
              fontSize: "0.9rem",
              textAlign: "left",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
              <span style={{ fontSize: "1.1rem", lineHeight: "1" }}>⚠️</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{errorMessage}</div>

                {/* Developer Mode Diagnostics Toggle */}
                {import.meta.env.DEV && developerDetails && (
                  <div style={{ marginTop: "8px", borderTop: "1px dashed rgba(192, 57, 43, 0.25)", paddingTop: "6px" }}>
                    <button
                      type="button"
                      onClick={() => setShowDevDetails((prev) => !prev)}
                      style={{
                        background: "none",
                        border: "none",
                        padding: 0,
                        color: "#8B251B",
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        textDecoration: "underline",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      {showDevDetails ? "▲ Hide Technical Details" : "▼ Developer Diagnostics (Dev Mode Only)"}
                    </button>

                    {showDevDetails && (
                      <div
                        style={{
                          marginTop: "6px",
                          padding: "8px",
                          backgroundColor: "#FFF",
                          borderRadius: "4px",
                          border: "1px solid #DDD",
                          color: "#333",
                          fontSize: "0.75rem",
                          fontFamily: "monospace",
                          lineHeight: "1.4",
                          overflowX: "auto",
                        }}
                      >
                        <div>
                          <strong>Status:</strong> {developerDetails.status || "0 (Connection Refused / Offline)"}
                        </div>
                        <div>
                          <strong>Endpoint:</strong> {developerDetails.endpoint || developerDetails.url}
                        </div>
                        {developerDetails.rawMessage && (
                          <div>
                            <strong>Raw Message:</strong> {developerDetails.rawMessage}
                          </div>
                        )}
                        {developerDetails.debug && (
                          <div style={{ marginTop: "4px" }}>
                            <strong>Server Trace:</strong>
                            <pre style={{ margin: 0, fontSize: "0.7rem", whiteSpace: "pre-wrap" }}>
                              {JSON.stringify(developerDetails.debug, null, 2)}
                            </pre>
                          </div>
                        )}
                        <div style={{ marginTop: "6px", color: "#666", fontStyle: "italic" }}>
                          ℹ️ Full trace logged in Browser Console (Press F12).
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleRegister}>
          <div className="form-field">
            <label htmlFor="register-name">Full Name *</label>
            <input
              id="register-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errorMessage) setErrorMessage("");
              }}
              placeholder="e.g. Jane Doe"
              disabled={submitting}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="register-email">Email Address *</label>
            <input
              id="register-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errorMessage) setErrorMessage("");
              }}
              placeholder="e.g. farmer@estate.com"
              disabled={submitting}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="register-role">System Role *</label>
            <select
              id="register-role"
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              disabled={submitting}
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                borderRadius: "8px",
                border: "1px solid #d4a54a40",
                backgroundColor: "var(--color-cream, #F5EAD0)",
                color: "var(--color-charcoal, #2B2622)",
                fontSize: "0.95rem",
                outline: "none",
              }}
            >
              {ROLES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="register-password">Password (min 8 characters) *</label>
            <div className="password-field">
              <input
                id="register-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage("");
                }}
                placeholder="Create password"
                disabled={submitting}
                minLength={8}
                required
              />
              <button
                className="password-toggle"
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                disabled={submitting}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="register-confirm-password">Confirm Password *</label>
            <div className="password-field">
              <input
                id="register-confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errorMessage) setErrorMessage("");
                }}
                placeholder="Confirm your password"
                disabled={submitting}
                minLength={8}
                required
              />
              <button
                className="password-toggle"
                type="button"
                onClick={() => setShowConfirmPassword((visible) => !visible)}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                disabled={submitting}
              >
                {showConfirmPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {password && confirmPassword && password !== confirmPassword && (
            <p style={{ color: "#C0392B", fontSize: "0.82rem", marginTop: "-0.5rem", marginBottom: "0.75rem" }}>
              ⚠️ Passwords do not match
            </p>
          )}

          <button className="auth-button" type="submit" disabled={submitting}>
            {submitting ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p className="auth-link">
          Already have an account? <Link to="/">Login here</Link>
        </p>
        </section>

        <aside className="auth-visual" aria-label="Farm landscape">
          <div className="auth-visual-content">
            <span className="auth-kicker">A better season starts here</span>
            <h2>From first planting to final harvest.</h2>
            <p>One trusted place to plan, monitor, and grow your operation with confidence.</p>
            <span className="auth-visual-line" aria-hidden="true" />
            <span className="auth-location">Farm operations, beautifully connected</span>
          </div>
        </aside>
      </div>
    </main>
  );
}

export default Register;