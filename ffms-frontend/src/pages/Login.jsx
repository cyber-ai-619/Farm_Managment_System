import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../components/Logo";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState(null);

  const handleLogin = (e) => {
    e.preventDefault();
    setStatus(null);

    if (!email || !password) {
      setStatus({ type: "error", message: "Please enter your email and password." });
      return;
    }

    const users = JSON.parse(localStorage.getItem("ffms_users") || "{}");
    const normalizedEmail = email.trim().toLowerCase();
    const user = users[normalizedEmail];

    if (!user || user.password !== password) {
      setStatus({ type: "error", message: "Invalid email or password." });
      return;
    }

    localStorage.setItem(
      "ffms_session",
      JSON.stringify({
        name: user.name,
        email: normalizedEmail,
        location: user.location,
        farmerType: user.farmerType,
        phone: user.phone,
        physicalAddress: user.physicalAddress,
        photo: user.photo,
      }),
    );
    setStatus({ type: "success", message: "Login successful. Opening your dashboard..." });
    setTimeout(() => navigate("/dashboard"), 700);
  };

  return (
    <main className="auth-page">
      <div className="auth-shell">
        <section className="auth-card">
        <Logo className="auth-logo" />
        <p className="auth-brand">AgriHud</p>
        <h1>Welcome back</h1>

        <p>Sign in to keep your farm moving forward.</p>

        {status && (
          <p className={`form-message ${status.type}`} role="alert">
            {status.message}
          </p>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-field">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                className="password-toggle"
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <button className="auth-button" type="submit">
            Login
          </button>
        </form>

        <p className="auth-link">
          Don't have an account? <Link to="/register">Create an account</Link>
        </p>
        </section>

        <aside className="auth-visual" aria-label="Farm landscape">
          <div className="auth-visual-content">
            <span className="auth-kicker">Built for the way you farm</span>
            <h2>Good decisions grow good seasons.</h2>
            <p>Bring your crops, people, livestock, and harvest into one calm, clear view.</p>
            <span className="auth-visual-line" aria-hidden="true" />
            <span className="auth-location">Farm operations, beautifully connected</span>
          </div>
        </aside>
      </div>
    </main>
  );
}

export default Login;