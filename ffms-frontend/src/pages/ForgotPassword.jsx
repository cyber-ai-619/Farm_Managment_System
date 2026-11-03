import { useState } from "react";
import { Link } from "react-router-dom";
import Logo from "../components/Logo";
import authService from "../services/authService";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setErrorMessage("Please enter your registered email address.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await authService.forgotPassword(trimmedEmail);
      setSuccessMessage(
        res.message ||
          "If an account exists with that email address, a password reset link has been dispatched. Please check your inbox (link expires in 10 minutes)."
      );
    } catch (err) {
      setErrorMessage(err.message || "Failed to process request. Please try again.");
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
          <h1>Reset Password</h1>
          <p>Enter your email address and we'll send you a secure 10-minute password reset link.</p>

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
                marginBottom: "24px",
                fontSize: "0.95rem",
                textAlign: "left",
                lineHeight: "1.5",
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>📬</span> Email Dispatched
              </div>
              <p style={{ margin: "0 0 10px 0" }}>{successMessage}</p>
              <div style={{ fontSize: "0.85rem", color: "#15803d", borderTop: "1px dashed #86efac", paddingTop: "8px" }}>
                ⏱️ <strong>Note:</strong> Reset links are strictly valid for <strong>10 minutes</strong>. If you do not see the email, remember to check your spam/junk folder.
              </div>
              <div style={{ marginTop: "16px", textAlign: "center" }}>
                <Link
                  to="/"
                  className="auth-button"
                  style={{
                    display: "inline-block",
                    textDecoration: "none",
                    textAlign: "center",
                    padding: "10px 20px",
                  }}
                >
                  Return to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-field">
                <label htmlFor="reset-email">Registered Email Address</label>
                <input
                  id="reset-email"
                  type="email"
                  placeholder="e.g. farmer@estate.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMessage) setErrorMessage("");
                  }}
                  disabled={submitting}
                  required
                />
              </div>

              <button className="auth-button" type="submit" disabled={submitting}>
                {submitting ? "Sending Link..." : "Send Password Reset Link"}
              </button>
            </form>
          )}

          <p className="auth-link">
            Remembered your password? <Link to="/">Return to Sign In</Link>
          </p>
        </section>

        <aside className="auth-visual" aria-label="Farm security landscape">
          <div className="auth-visual-content">
            <span className="auth-kicker">Account Security</span>
            <h2>Keeping your farm data safe and accessible.</h2>
            <p>Temporal reset links ensure only you can recover access to your fields, finances, and team.</p>
            <span className="auth-visual-line" aria-hidden="true" />
            <span className="auth-location">Farm Management System</span>
          </div>
        </aside>
      </div>
    </main>
  );
}

export default ForgotPassword;
