function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar-left">
        <h2>FFMS</h2>
        <span>Farm Management System</span>
      </div>

      <div className="navbar-right">
        <span>Welcome</span>
        <button>Logout</button>
      </div>
    </header>
  );
}

export default Navbar;