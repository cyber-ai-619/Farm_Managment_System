function PestDisease() {
  return (
    <div className="page-wrapper">
      <h1>Pest & Disease</h1>
      <p>Monitor and manage crop pests and diseases.</p>
      
      <div className="page-content-section">
        <h2>Active Records</h2>
        <div className="content-grid">
          {/* Pest/Disease items will be rendered here */}
          <div className="content-card">
            <h4>Incident Record</h4>
            <p>Add your pest/disease data here</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PestDisease;