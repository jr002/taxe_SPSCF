const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

pool.on('connect', () => {
  console.log('Connecté à la base de données PostgreSQL (DGI DB)');
});

pool.on('error', (err) => {
  console.error('Erreur inattendue du pool PostgreSQL:', err);
});

module.exports = pool;
