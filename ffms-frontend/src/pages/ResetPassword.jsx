import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Logo from "../components/Logo";
import authService from "../services/authService";

function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const emailParam = searchParams.get("email") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleReset = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!token) {
      setErrorMessage("Missing reset token. Please request a new reset link.");
      return;
    }

    if (password.length < 8 || password.length > 72) {
      setErrorMessage("Password must be between 8 and 72 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await authService.resetPassword({ token, password });
      setSuccessMessage(res.message || "Password reset successfully! You can now log in.");
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 2500);
    } catch (err) {
      setErrorMessage(err.message || "Failed to reset password. The link may have expired (10-minute limit).");
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
          <h1>Set New Password</h1>
          <p>
            {emailParam ? `Choose a new secure password for ${emailParam}.` : "Choose a new secure password for your account."}
          </p>

          {!token && (
            <div
              style={{
                backgroundColor: "#FDF2F2",
                border: "1px solid #F8B4B4",
                color: "#9B1C1C",
                padding: "16px",
                borderRadius: "8px",
                marginBottom: "20px",
                fontSize: "0.95rem",
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: "4px" }}>⚠️ Missing Reset Token</div>
              <p style={{ margin: "0 0 12px 0" }}>
                This reset link is incomplete or invalid. Please request a new password reset link.
              </p>
              <Link to="/forgot-password" className="auth-button" style={{ display: "inline-block", textDecoration: "none", textAlign: "center" }}>
                Request New Link
              </Link>
            </div>
          )}

          {errorMessage && (
            <div
              className="error-banner"
              style={{
                backgroundColor: "#FDF2F2",
                border: "1px solid #F8B4B4",
                color: "#9B1C1C",
                padding: "12px",
                borderRadius: "6px",
                marginBottom: "20px",
                fontSize: "0.9rem",
                textAlign: "left",
              }}
            >
              ⚠️ {errorMessage}
              {errorMessage.includes("expired") && (
                <div style={{ marginTop: "8px" }}>
                  <Link to="/forgot-password" style={{ color: "#9B1C1C", fontWeight: 700, textDecoration: "underline" }}>
                    Request a fresh 10-minute link &rarr;
                  </Link>
                </div>
              )}
            </div>
          )}

          {successMessage ? (
            <div
              style={{
                backgroundColor: "#F0FDF4",
                border: "1px solid #BBF7D0",
                color: "#166534",
                padding: "16px",
                borderRadius: "8px",
                marginBottom: "20px",
                fontSize: "0.95rem",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "1.4rem", marginBottom: "6px" }}>✅</div>
              <div style={{ fontWeight: 700, marginBottom: "6px" }}>{successMessage}</div>
              <p style={{ margin: "0 0 12px 0", fontSize: "0.88rem", color: "#15803d" }}>
                Redirecting you to the sign-in page...
              </p>
              <Link to="/" className="auth-button" style={{ display: "inline-block", textDecoration: "none", textAlign: "center" }}>
                Sign In Now
              </Link>
            </div>
          ) : (
            token && (
              <form onSubmit={handleReset}>
                <div className="form-field">
                  <label htmlFor="new-password">New Password (min 8 characters)</label>
                  <div className="password-field">
                    <input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errorMessage) setErrorMessage("");
                      }}
                      disabled={submitting}
                      required
                      minLength={8}
                      maxLength={72}
                    />
                    <button
                      className="password-toggle"
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      disabled={submitting}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <div className="form-field">
                  <label htmlFor="confirm-password">Confirm New Password</label>
                  <input
                    id="confirm-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errorMessage) setErrorMessage("");
                    }}
                    disabled={submitting}
                    required
                    minLength={8}
                    maxLength={72}
                  />
                </div>

                <button className="auth-button" type="submit" disabled={submitting}>
                  {submitting ? "Updating Password..." : "Save New Password"}
                </button>
              </form>
            )
          )}

          <p className="auth-link">
            Remember your credentials? <Link to="/">Sign In</Link>
          </p>
        </section>

        <aside className="auth-visual" aria-label="Farm security landscape">
          <div className="auth-visual-content">
            <span className="auth-kicker">Secured Access</span>
            <h2>Fresh credentials, uninterrupted operations.</h2>
            <p>Your farm security is our priority. Ensure your new password is unique and memorable.</p>
            <span className="auth-visual-line" aria-hidden="true" />
            <span className="auth-location">Farm Management System</span>
          </div>
        </aside>
      </div>
    </main>
  );
}

export default ResetPassword;
