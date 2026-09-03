import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../components/Logo";

const zambianProvinces = [
  "Central",
  "Copperbelt",
  "Eastern",
  "Luapula",
  "Lusaka",
  "Muchinga",
  "Northern",
  "North-Western",
  "Southern",
  "Western",
];

function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [location, setLocation] = useState("");
  const [farmerType, setFarmerType] = useState("");
  const [phone, setPhone] = useState("");
  const [physicalAddress, setPhysicalAddress] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState(null);

  const handleRegister = (e) => {
    e.preventDefault();
    setStatus(null);

    if (!name || !email || !password || !location || !farmerType || !phone || !physicalAddress) {
      setStatus({ type: "error", message: "Please complete all registration fields." });
      return;
    }

    if (!/^\+260\d{9}$/.test(phone.trim())) {
      setStatus({ type: "error", message: "Phone number must start with +260 and contain 9 digits after it." });
      return;
    }

    if (password.length < 8) {
      setStatus({ type: "error", message: "Password must be at least 8 characters long." });
      return;
    }

    const users = JSON.parse(localStorage.getItem("ffms_users") || "{}");
    const normalizedEmail = email.trim().toLowerCase();

    if (users[normalizedEmail]) {
      setStatus({ type: "error", message: "An account with this email already exists." });
      return;
    }

    users[normalizedEmail] = {
      name: name.trim(),
      location: location.trim(),
      farmerType,
      phone: phone.trim(),
      physicalAddress: physicalAddress.trim(),
      password,
    };
    localStorage.setItem("ffms_users", JSON.stringify(users));
    setStatus({ type: "success", message: "Registration successful. You can now log in." });
    setTimeout(() => navigate("/"), 900);
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <Logo className="auth-logo" />
        <p className="auth-brand">AgriHud</p>
        <h1>Create FFMS Account</h1>

        <p>Register for the Farm Management System.</p>

        {status && (
          <p className={`form-message ${status.type}`} role="alert">
            {status.message}
          </p>
        )}

        <form onSubmit={handleRegister}>
          <div className="form-field">
            <label htmlFor="register-name">Full Name</label>
            <input
              id="register-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              required
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
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="register-phone">Phone Number</label>
            <input
              id="register-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+260  XXX XXX XXX"
              pattern="\+260[0-9]{9}"
              title="Enter a phone number starting with +260 followed by 9 digits"
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="register-location">Location</label>
            <select
              id="register-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            >
              <option value="" disabled>Select your province</option>
              {zambianProvinces.map((province) => (
                <option key={province} value={province}>{province}</option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="register-physical-address">Physical Address</label>
            <textarea
              id="register-physical-address"
              value={physicalAddress}
              onChange={(e) => setPhysicalAddress(e.target.value)}
              placeholder="Enter your physical address"
              required
              rows="3"
            />
          </div>

          <div className="form-field">
            <label htmlFor="register-farmer-type">Type of Farmer</label>
            <select
              id="register-farmer-type"
              value={farmerType}
              onChange={(e) => setFarmerType(e.target.value)}
              required
            >
              <option value="" disabled>Select your farmer type</option>
              <option value="Small-scale farmer">Small-scale farmer</option>
              <option value="Commercial farmer">Commercial farmer</option>
              <option value="Livestock farmer">Livestock farmer</option>
              <option value="Mixed farmer">Mixed farmer</option>
              <option value="Other">Other</option>
            </select>
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
                minLength="8"
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