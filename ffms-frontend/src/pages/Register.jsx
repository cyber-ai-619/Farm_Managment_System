import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Logo from "../components/Logo";
import { useAuth } from "../hooks/useAuth";
import authService from "../services/authService";

function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { acceptInvite } = useAuth();

  const inviteToken = searchParams.get("invite");
  const inviteEmail = searchParams.get("email");
  const verifyToken = searchParams.get("verify_token");
  const verifyEmail = searchParams.get("email");

  const [name, setName] = useState("");
  const [email, setEmail] = useState(() => {
    if (inviteEmail) return decodeURIComponent(inviteEmail);
    if (verifyEmail) return decodeURIComponent(verifyEmail);
    return "";
  });
  const [farmName, setFarmName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Invite states
  const [inviteData, setInviteData] = useState(null);
  const [inviteLoading, setInviteLoading] = useState(Boolean(inviteToken));

  // Verification token states (Step 2 of owner registration)
  const [verifyData, setVerifyData] = useState(null);
  const [verifyLoading, setVerifyLoading] = useState(Boolean(verifyToken));

  // Step 1 success feedback
  const [requestSent, setRequestSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");

  // Handle Team Invite Token
  useEffect(() => {
    if (!inviteToken) return;

    let isMounted = true;
    async function loadInvite() {
      try {
        setInviteLoading(true);
        const data = await authService.getInvite(inviteToken);
        if (isMounted && data) {
          setInviteData(data);
          if (data.name) setName(data.name);
          if (data.email) setEmail(data.email);
        }
      } catch (err) {
        if (isMounted) {
          setErrorMessage(err.message || "This invitation link is invalid or has expired.");
          if (inviteEmail) setEmail(decodeURIComponent(inviteEmail));
        }
      } finally {
        if (isMounted) setInviteLoading(false);
      }
    }

    loadInvite();
  }, [inviteToken, inviteEmail]);

  // Handle Temporal Verification Token
  useEffect(() => {
    if (!verifyToken) return;

    let isMounted = true;
    async function checkVerificationToken() {
      try {
        setVerifyLoading(true);
        const res = await authService.verifyRegistration(verifyToken);
        if (isMounted && res) {
          setVerifyData(res);
          if (res.name) setName(res.name);
          if (res.email) setEmail(res.email);
          if (res.farm_name) setFarmName(res.farm_name);
        }
      } catch (err) {
        if (isMounted) {
          setErrorMessage(
            err.message ||
              "This registration verification link has expired (24-hour limit) or is invalid. Please request a new one."
          );
        }
      } finally {
        if (isMounted) setVerifyLoading(false);
      }
    }

    checkVerificationToken();
  }, [verifyToken]);

  const isValidEmail = (emailStr) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr);
  };

  // Step 1: Send 24-hour temporal verification email
  const handleRequestVerification = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedFarmName = farmName.trim() || `${trimmedName}'s Farm`;

    if (!trimmedName || !trimmedEmail) {
      setErrorMessage("Please fill in your name and email address.");
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setErrorMessage("Please enter a valid email address (e.g. farmer@estate.com).");
      return;
    }

    try {
      setSubmitting(true);
      await authService.requestRegistration({
        name: trimmedName,
        email: trimmedEmail,
        farm_name: trimmedFarmName,
      });
      setSentEmail(trimmedEmail);
      setRequestSent(true);
    } catch (err) {
      setErrorMessage(err.message || "Failed to send verification email. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Step 2 or Team Invite: Submit password and finalize registration
  const handleFinalizeRegistration = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedFarmName = farmName.trim();

    if (!password || !confirmPassword) {
      setErrorMessage("Please enter and confirm your password.");
      return;
    }

    if (password.length < 8 || password.length > 72) {
      setErrorMessage("Password must be between 8 and 72 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please re-enter your password.");
      return;
    }

    try {
      setSubmitting(true);

      if (inviteToken) {
        // Accept farm invitation mode
        const res = await acceptInvite({
          token: inviteToken,
          name: trimmedName,
          password,
        });

        const targetRole = res?.user?.role_name || res?.user?.role || inviteData?.role_name;
        if (targetRole === "worker") {
          navigate("/my-work", { replace: true });
        } else {
          navigate("/dashboard", { replace: true });
        }
      } else if (verifyToken) {
        // Complete registration via temporal email verification token
        await authService.completeRegistration({
          token: verifyToken,
          password,
          name: trimmedName,
          farm_name: trimmedFarmName,
        });
        navigate("/dashboard", { replace: true });
      }
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
          <h1>
            {inviteData
              ? "Accept Team Invitation"
              : verifyToken
              ? "Activate Farm Workspace"
              : "Create Farm Account"}
          </h1>
          <p>
            {inviteData
              ? "Activate your account to join your farm team and access your workspace."
              : verifyToken
              ? "Email confirmed! Set your password to complete your account setup."
              : "Register as a Farm Owner to manage operations and onboard your team."}
          </p>

          {/* Invitation Details Banner */}
          {inviteData && (
            <div
              style={{
                backgroundColor: "#F0FDF4",
                border: "1px solid #BBF7D0",
                borderRadius: "8px",
                padding: "12px 14px",
                marginBottom: "16px",
                textAlign: "left",
              }}
            >
              <div style={{ fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700, color: "#166534" }}>
                Farm Team Invitation
              </div>
              <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--color-forest)", margin: "2px 0" }}>
                {inviteData.farm_name}
              </div>
              <div style={{ fontSize: "0.85rem", color: "#374151" }}>
                Assigned Role: <strong style={{ color: "#166534" }}>{inviteData.role_name?.replace(/_/g, " ").toUpperCase()}</strong>
              </div>
            </div>
          )}

          {/* Verified Token Details Banner */}
          {verifyData && (
            <div
              style={{
                backgroundColor: "#F0FDF4",
                border: "1px solid #BBF7D0",
                borderRadius: "8px",
                padding: "12px 14px",
                marginBottom: "16px",
                textAlign: "left",
              }}
            >
              <div style={{ fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700, color: "#166534" }}>
                ✅ Email Verified
              </div>
              <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "#15803d", margin: "2px 0" }}>
                {verifyData.farm_name}
              </div>
              <div style={{ fontSize: "0.85rem", color: "#374151" }}>
                Account Owner: <strong>{verifyData.name}</strong> ({verifyData.email})
              </div>
            </div>
          )}

          {(inviteLoading || verifyLoading) && (
            <div style={{ padding: "10px", fontSize: "0.9rem", color: "#4B5563", marginBottom: "12px" }}>
              Verifying link security token...
            </div>
          )}

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
              {errorMessage.includes("expired") && (
                <div style={{ marginTop: "8px" }}>
                  <Link to="/register" style={{ color: "#C0392B", fontWeight: 700, textDecoration: "underline" }}>
                    Start a fresh registration &rarr;
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* CASE A: Verification email successfully dispatched (Step 1 feedback) */}
          {requestSent ? (
            <div
              style={{
                backgroundColor: "#F0FDF4",
                border: "1px solid #BBF7D0",
                color: "#166534",
                padding: "18px",
                borderRadius: "8px",
                marginBottom: "20px",
                textAlign: "left",
                lineHeight: "1.5",
              }}
            >
              <div style={{ fontSize: "1.5rem", marginBottom: "8px" }}>📬</div>
              <h2 style={{ fontSize: "1.15rem", margin: "0 0 8px 0", color: "#14532d" }}>
                Verification Link Sent!
              </h2>
              <p style={{ margin: "0 0 12px 0", fontSize: "0.93rem" }}>
                We have sent an email to <strong>{sentEmail}</strong> containing a secure temporal link to prove email ownership and set your password.
              </p>
              <div style={{ fontSize: "0.85rem", color: "#15803d", borderTop: "1px dashed #86efac", paddingTop: "8px" }}>
                ⏱️ <strong>Note:</strong> Your verification link remains active for <strong>24 hours</strong>. If you don't see it, please check your spam folder.
              </div>
              <div style={{ marginTop: "16px", display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setRequestSent(false)}
                  style={{
                    background: "none",
                    border: "1px solid #16a34a",
                    color: "#16a34a",
                    borderRadius: "6px",
                    padding: "8px 14px",
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Resend or Edit Details
                </button>
                <Link
                  to="/"
                  style={{
                    display: "inline-block",
                    backgroundColor: "#166534",
                    color: "#FFF",
                    borderRadius: "6px",
                    padding: "8px 14px",
                    fontSize: "0.85rem",
                    textDecoration: "none",
                    fontWeight: 600,
                  }}
                >
                  Go to Login
                </Link>
              </div>
            </div>
          ) : verifyToken || inviteToken ? (
            /* CASE B: Setting password with valid token (Step 2 or Invite) */
            <form onSubmit={handleFinalizeRegistration}>
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
                <label htmlFor="register-email">
                  Email Address * <span style={{ color: "#166534", fontSize: "0.75rem", fontWeight: 700 }}>(Verified)</span>
                </label>
                <input
                  id="register-email"
                  type="email"
                  value={email}
                  readOnly
                  disabled
                  style={{ backgroundColor: "#F9FAFB", cursor: "not-allowed" }}
                />
              </div>

              {!inviteData && (
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
              )}

              <div className="form-field">
                <label htmlFor="register-password">Set Password (8-72 characters) *</label>
                <div className="password-field">
                  <input
                    id="register-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMessage) setErrorMessage("");
                    }}
                    placeholder="Enter secure password"
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
                    placeholder="Re-enter password"
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

              <button className="auth-button" type="submit" disabled={submitting || inviteLoading || verifyLoading}>
                {submitting
                  ? "Activating Account..."
                  : inviteData
                  ? "Activate Account & Join Team"
                  : "Complete Registration & Enter Farm"}
              </button>
            </form>
          ) : (
            /* CASE C: Step 1 Owner Registration (Enter details to receive 24h verification email) */
            <form onSubmit={handleRequestVerification}>
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

              <button className="auth-button" type="submit" disabled={submitting}>
                {submitting ? "Sending Verification Email..." : "Send Verification Email & Continue"}
              </button>
            </form>
          )}

          <p className="auth-link">
            Already have an account? <Link to="/">Login here</Link>
          </p>
        </section>

        <aside className="auth-visual" aria-label="Farm landscape">
          <div className="auth-visual-content">
            <span className="auth-kicker">A better season starts here</span>
            <h2>
              {inviteData
                ? `Welcome to ${inviteData.farm_name}`
                : verifyToken
                ? "Almost there! Choose your password."
                : "From first planting to final harvest."}
            </h2>
            <p>
              {inviteData
                ? `You have been added as ${inviteData.role_name?.replace(/_/g, " ")}. Activate your account to start collaborating.`
                : verifyToken
                ? "Your email is confirmed. Lock in your secure password to launch your farm dashboard."
                : "Enter your farm details to receive a 24-hour verification link directly in your inbox."}
            </p>
            <span className="auth-visual-line" aria-hidden="true" />
            <span className="auth-location">Farm operations, beautifully connected</span>
          </div>
        </aside>
      </div>
    </main>
  );
}

export default Register;