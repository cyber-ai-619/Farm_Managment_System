function Farm() {
  return (
    <div className="page-wrapper">
      <h1>Farms</h1>
      <p>Manage your farms and farm information here.</p>
      
      <div className="page-content-section">
        <h2>Your Farms</h2>
        <div className="content-grid">
          {/* Farm items will be rendered here */}
          <div className="content-card">
            <h4>Example Farm</h4>
            <p>Add your farm data here</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Farm;