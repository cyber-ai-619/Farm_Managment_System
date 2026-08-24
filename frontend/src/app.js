const moduleGrid = document.getElementById('module-grid');
const apiStatus = document.getElementById('api-status');
const apiDetail = document.getElementById('api-detail');

const fallbackModules = [
  'Farm and field',
  'Crop',
  'Irrigation',
  'Livestock',
  'Inventory',
  'Equipment',
  'Labour',
  'Pest and disease',
  'Weather',
  'Harvest',
  'Sales and market',
  'Finance',
  'Suppliers and procurement',
  'Storage',
  'Analytics',
  'Notifications',
  'Security',
];

function renderModules(modules) {
  moduleGrid.innerHTML = modules
    .map(
      (module) => `
        <article class="module-card">
          <span class="module-key">${module.key}</span>
          <h3>${module.label}</h3>
          <p>Status: ${module.status}</p>
        </article>
      `,
    )
    .join('');
}

async function loadModules() {
  try {
    const [healthResponse, modulesResponse] = await Promise.all([
      fetch('/api/health'),
      fetch('/api/modules'),
    ]);

    if (!healthResponse.ok || !modulesResponse.ok) {
      throw new Error('Backend responded with an error');
    }

    const health = await healthResponse.json();
    const modules = await modulesResponse.json();

    apiStatus.textContent = health.status === 'ok' ? 'Connected' : 'Partial';
    apiDetail.textContent = `Backend timestamp: ${health.timestamp}`;
    renderModules(modules.modules || []);
  } catch (error) {
    apiStatus.textContent = 'Offline';
    apiDetail.textContent = 'Using local fallback data';

    renderModules(
      fallbackModules.map((label) => ({
        key: label.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
        label,
        status: 'placeholder',
      })),
    );
  }
}

loadModules();

