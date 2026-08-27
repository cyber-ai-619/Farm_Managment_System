function Harvest() {
  return (
    <div className="page-wrapper">
      <h1>Harvest</h1>
      <p>Track and manage harvest activities.</p>
      
      <div className="page-content-section">
        <h2>Harvest Records</h2>
        <div className="content-grid">
          {/* Harvest items will be rendered here */}
          <div className="content-card">
            <h4>Recent Harvest</h4>
            <p>Add your harvest data here</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Harvest;