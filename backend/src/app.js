const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const config = require('./config/env');

// Routes
const contribuableRoutes = require('./routes/contribuable.routes');
const declarationRoutes = require('./routes/declaration.routes');
const controleRoutes = require('./routes/controle.routes');
const recoupementRoutes = require('./routes/recoupement.routes');
const droitCommunicationRoutes = require('./routes/droit-communication.routes');
const centreRoutes = require('./routes/centre.routes');
const authRoutes = require('./routes/auth.routes');
const agentRoutes = require('./routes/agent.routes');
const rapprochementRoutes = require('./routes/rapprochement.routes');
const etatContribuableRoutes = require('./routes/etat-contribuable.routes');
const relanceRoutes = require('./routes/relance.routes');
const accesContribuableRoutes = require('./routes/acces-contribuable.routes');
const { authenticate } = require('./middlewares/auth.middleware');
const { enforceDataScope } = require('./middlewares/data-scope.middleware');

// Middleware d'erreur
const errorHandler = require('./middlewares/error.middleware');
const { swaggerSpec, swaggerUi } = require('./config/swagger');

const app = express();
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175',
];

// Middlewares
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('Origine non autorisée par CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

// Dossier uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Portail contribuable : le jeton et la vérification NIF/e-mail remplacent la
// session agent. Ces routes doivent rester avant la barrière d'authentification.
app.use('/api/acces-contribuable', accesContribuableRoutes);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', authenticate, enforceDataScope);
app.use('/api/contribuables', contribuableRoutes);
app.use('/api/declarations', declarationRoutes);
app.use('/api/controles', controleRoutes);
app.use('/api/recoupements', recoupementRoutes);
app.use('/api/droits-communication', droitCommunicationRoutes);
app.use('/api/centres', centreRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/rapprochements', rapprochementRoutes);
app.use('/api/etat-contribuable', etatContribuableRoutes);
app.use('/api/relances', relanceRoutes);
app.get('/api-docs/swagger.json', (req, res) => {
  res.json(swaggerSpec);
});
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Route santé
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'API de contrôle fiscal en ligne',
    version: '1.0.0'
  });
});

// Route 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée'
  });
});

// Gestionnaire d'erreurs
app.use(errorHandler);

module.exports = app;