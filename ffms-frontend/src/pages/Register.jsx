import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import { useAuth } from "../hooks/useAuth";

function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [farmName, setFarmName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const isValidEmail = (emailStr) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedFarmName = farmName.trim();

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

    if (password.length > 72) {
      setErrorMessage("Password cannot exceed 72 characters.");
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
        farm_name: trimmedFarmName || `${trimmedName}'s Farm`,
      });
      navigate("/dashboard");
    } catch (err) {
      setErrorMessage(err.message || "Registration failed. Please try again.");
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
          <h1>Create Farm Account</h1>
          <p>Register as a Farm Owner to manage operations and onboard your team.</p>

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
                <div style={{ flex: 1, fontWeight: 600 }}>{errorMessage}</div>
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
                maxLength={150}
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
                maxLength={255}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="register-farm-name">Farm or Estate Name *</label>
              <input
                id="register-farm-name"
                type="text"
                value={farmName}
                onChange={(e) => {
                  setFarmName(e.target.value);
                  if (errorMessage) setErrorMessage("");
                }}
                placeholder="e.g. Green Valley Farm"
                disabled={submitting}
                maxLength={150}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="register-password">Password (8-72 characters) *</label>
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
                  maxLength={72}
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
                  maxLength={72}
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
              {submitting ? "Creating Account..." : "Create Farm Account"}
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