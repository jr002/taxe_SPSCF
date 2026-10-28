const app = require('./src/app');
const config = require('./src/config/env');

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
  console.log(`📦 Environnement: ${config.env}`);
  console.log(`📊 Base de données: ${config.db.database}`);
});
