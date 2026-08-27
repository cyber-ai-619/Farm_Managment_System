function Crops() {
  return (
    <div className="page-wrapper">
      <h1>Crops</h1>
      <p>Manage crops on your farm.</p>
      
      <div className="page-content-section">
        <h2>Your Crops</h2>
        <div className="content-grid">
          {/* Crop items will be rendered here */}
          <div className="content-card">
            <h4>Example Crop</h4>
            <p>Add your crop data here</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Crops;