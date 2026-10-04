import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Logo from "../components/Logo";
import { useAuth } from "../hooks/useAuth";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [developerDetails, setDeveloperDetails] = useState(null);
  const [showDevDetails, setShowDevDetails] = useState(false);

  const from = location.state?.from?.pathname || "/dashboard";

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setDeveloperDetails(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    try {
      setSubmitting(true);
      await login(trimmedEmail, password);
      navigate(from, { replace: true });
    } catch (err) {
      setErrorMessage(err.message || "Failed to log in. Please check your credentials.");
      if (err.developerDetails) {
        setDeveloperDetails(err.developerDetails);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <Logo className="auth-logo" />
        <p className="auth-brand">AgriHud</p>
        <h1>FFMS Login</h1>
        <p>Sign in to access your Farm Management System.</p>

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

        <form onSubmit={handleLogin}>
          <div className="form-field">
            <label htmlFor="login-email">Email Address</label>
            <input
              id="login-email"
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

          <div className="form-field">
            <label htmlFor="login-password">Password</label>
            <div className="password-field">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage("");
                }}
                disabled={submitting}
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

          <button className="auth-button" type="submit" disabled={submitting}>
            {submitting ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="auth-link">
          Don't have an account? <Link to="/register">Create an account</Link>
        </p>
      </section>
    </main>
  );
}

export default Login;