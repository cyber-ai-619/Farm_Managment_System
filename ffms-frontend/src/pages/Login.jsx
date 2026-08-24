import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();

    if (!email || !password) {
      alert("Please enter your email and password.");
      return;
    }

    // Temporary login
    // We will connect this to the backend later.
    navigate("/dashboard");
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-brand">FFMS</div>
        <h1>FFMS Login</h1>

        <p>Login to your Farm Management System.</p>

        <form onSubmit={handleLogin}>
          <div className="form-field">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button className="auth-button" type="submit">
            Login
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