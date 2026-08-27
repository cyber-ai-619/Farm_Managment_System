import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../components/Logo";

function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = (e) => {
    e.preventDefault();

    if (!name || !email || !password) {
      alert("Please fill in all fields.");
      return;
    }

    const users = JSON.parse(localStorage.getItem("ffms_users") || "{}");
    const normalizedEmail = email.trim().toLowerCase();

    if (users[normalizedEmail]) {
      alert("An account with this email already exists.");
      return;
    }

    users[normalizedEmail] = {
      name: name.trim(),
      password,
    };
    localStorage.setItem("ffms_users", JSON.stringify(users));
    alert("Account created successfully!");
    navigate("/");
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <Logo className="auth-logo" />
        <p className="auth-brand">AgriHud</p>
        <h1>Create FFMS Account</h1>

        <p>Register for the Farm Management System.</p>

        <form onSubmit={handleRegister}>
          <div className="form-field">
            <label htmlFor="register-name">Full Name</label>
            <input
              id="register-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
            />
          </div>

          <div className="form-field">
            <label htmlFor="register-email">Email</label>
            <input
              id="register-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
            />
          </div>

          <div className="form-field">
            <label htmlFor="register-password">Password</label>
            <div className="password-field">
              <input
                id="register-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
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

          <button className="auth-button" type="submit">Register</button>
        </form>

        <p className="auth-link">
          Already have an account? <Link to="/">Login here</Link>
        </p>
      </section>
    </main>
  );
}

export default Register;