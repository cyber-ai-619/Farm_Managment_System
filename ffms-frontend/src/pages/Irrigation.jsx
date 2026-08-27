function Irrigation() {
  return (
    <div className="page-wrapper">
      <h1>Irrigation</h1>
      <p>Manage irrigation systems and schedules.</p>
      
      <div className="page-content-section">
        <h2>Irrigation Systems</h2>
        <div className="content-grid">
          {/* Irrigation items will be rendered here */}
          <div className="content-card">
            <h4>System Overview</h4>
            <p>Add your irrigation data here</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Irrigation;