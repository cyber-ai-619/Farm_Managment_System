import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = (e) => {
    e.preventDefault();

    if (!name || !email || !password) {
      alert("Please fill in all fields.");
      return;
    }

    alert("Account created successfully!");
    navigate("/");
  };

  return (
    <div>
      <h1>Create FFMS Account</h1>

      <p>Register for the Farm Management System.</p>

      <form onSubmit={handleRegister}>
        <div>
          <label>Full Name</label>
          <br />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your full name"
          />
        </div>

        <br />

        <div>
          <label>Email</label>
          <br />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
          />
        </div>

        <br />

        <div>
          <label>Password</label>
          <br />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a password"
          />
        </div>

        <br />

        <button type="submit">Register</button>
      </form>

      <p>
        Already have an account?{" "}
        <Link to="/">Login here</Link>
      </p>
    </div>
  );
}

export default Register;