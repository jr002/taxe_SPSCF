const swaggerUi = require('swagger-ui-express');

const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'SSIF API',
    version: '1.0.0',
    description: 'API de suivi et de contrôle fiscal.',
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Serveur local',
    },
  ],
  tags: [
    { name: 'Santé', description: 'Disponibilité de l’API' },
    { name: 'Contribuables', description: 'Gestion des contribuables' },
    { name: 'Déclarations', description: 'Déclarations fiscales' },
    { name: 'Contrôles', description: 'Contrôles fiscaux' },
    { name: 'Recoupements', description: 'Recoupements avec des tiers' },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Santé'],
        summary: 'Vérifier la disponibilité de l’API',
        responses: { 200: { description: 'API disponible' } },
      },
    },
    '/api/contribuables': {
      get: {
        tags: ['Contribuables'],
        summary: 'Lister les contribuables',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Liste paginée' } },
      },
      post: {
        tags: ['Contribuables'],
        summary: 'Créer un contribuable',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ContribuableInput' },
            },
          },
        },
        responses: { 201: { description: 'Contribuable créé' }, 400: { description: 'Données invalides' } },
      },
    },
    '/api/contribuables/{id}': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
      get: {
        tags: ['Contribuables'],
        summary: 'Récupérer un contribuable',
        responses: { 200: { description: 'Contribuable trouvé' }, 404: { description: 'Introuvable' } },
      },
      put: {
        tags: ['Contribuables'],
        summary: 'Modifier un contribuable',
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ContribuableInput' },
            },
          },
        },
        responses: { 200: { description: 'Contribuable modifié' }, 404: { description: 'Introuvable' } },
      },
    },
    '/api/declarations': {
      get: {
        tags: ['Déclarations'],
        summary: 'Lister les déclarations',
        responses: { 200: { description: 'Liste des déclarations' } },
      },
      post: {
        tags: ['Déclarations'],
        summary: 'Créer une déclaration',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/DeclarationInput' } } },
        },
        responses: { 201: { description: 'Déclaration créée' }, 400: { description: 'Données invalides' } },
      },
    },
    '/api/declarations/stats': {
      get: {
        tags: ['Déclarations'],
        summary: 'Récupérer les statistiques des déclarations',
        responses: { 200: { description: 'Statistiques' } },
      },
    },
    '/api/declarations/{id}': {
      get: {
        tags: ['Déclarations'],
        summary: 'Récupérer une déclaration',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Déclaration trouvée' }, 404: { description: 'Introuvable' } },
      },
    },
    '/api/controles/stats': {
      get: {
        tags: ['Contrôles'],
        summary: 'Récupérer les statistiques de contrôle',
        responses: { 200: { description: 'Statistiques' } },
      },
    },
    '/api/controles/{id_declaration}/effectuer': {
      post: {
        tags: ['Contrôles'],
        summary: 'Effectuer un contrôle fiscal',
        parameters: [{ name: 'id_declaration', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Contrôle effectué' } },
      },
    },
    '/api/controles/{id_declaration}/historique': {
      get: {
        tags: ['Contrôles'],
        summary: 'Récupérer l’historique des contrôles',
        parameters: [{ name: 'id_declaration', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Historique' } },
      },
    },
    '/api/recoupements': {
      post: {
        tags: ['Recoupements'],
        summary: 'Créer un recoupement',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/RecoupementInput' } } },
        },
        responses: { 201: { description: 'Recoupement créé' } },
      },
    },
    '/api/recoupements/{id_contribuable}/analyser': {
      get: {
        tags: ['Recoupements'],
        summary: 'Analyser les recoupements d’un contribuable',
        parameters: [{ name: 'id_contribuable', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Analyse des recoupements' } },
      },
    },
    '/api/recoupements/stats/sources': {
      get: {
        tags: ['Recoupements'],
        summary: 'Récupérer les statistiques par source',
        responses: { 200: { description: 'Statistiques' } },
      },
    },
  },
  components: {
    schemas: {
      ContribuableInput: {
        type: 'object',
        required: ['nif', 'raison_sociale', 'secteur_activite', 'adresse', 'telephone'],
        properties: {
          nif: { type: 'string', example: '1234567890' },
          raison_sociale: { type: 'string', example: 'Ma Société' },
          secteur_activite: { type: 'string', example: 'Commerce' },
          adresse: { type: 'string', example: 'Antananarivo' },
          telephone: { type: 'string', example: '+261340000000' },
          email: { type: 'string', format: 'email' },
          regime_fiscal: { type: 'string', enum: ['IS', 'IR'] },
        },
      },
      DeclarationInput: {
        type: 'object',
        required: ['id_contribuable', 'annee', 'ca', 'benefice'],
        properties: {
          id_contribuable: { type: 'integer', example: 1 },
          annee: { type: 'integer', example: 2025 },
          ca: { type: 'number', example: 500000000 },
          benefice: { type: 'number', example: 100000000 },
          tva_collectee: { type: 'number', example: 90000000 },
          tva_deductible: { type: 'number', example: 30000000 },
          tva_payee: { type: 'number', example: 60000000 },
          regime_fiscal: { type: 'string', enum: ['IS', 'IR'] },
        },
      },
      RecoupementInput: {
        type: 'object',
        required: ['id_contribuable'],
        properties: {
          id_contribuable: { type: 'integer', example: 1 },
          source: { type: 'string', example: 'tiers_declarant' },
          merchandise_sold: { type: 'number', example: 1000000 },
          goods_purchased: { type: 'number', example: 400000 },
          services_purchased: { type: 'number', example: 100000 },
          third_party_payments: { type: 'number', example: 50000 },
          local_products: { type: 'number', example: 200000 },
          import_expenses: { type: 'number', example: 100000 },
          ca_declare: { type: 'number', example: 1000000 },
        },
      },
    },
  },
};

module.exports = { swaggerSpec, swaggerUi };
