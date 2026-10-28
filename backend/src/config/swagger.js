const swaggerUi = require('swagger-ui-express');

const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'SSIF API',
    version: '1.1.0',
    description: 'API de suivi et de contrôle fiscal (SP2CF / TVA•SSIF) conforme au schéma bdprjet.sql.',
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
    { name: 'Droits de communication', description: 'Demandes de communication adressées aux tiers' },
    { name: 'Rapprochements', description: 'Confrontation déclarations / recoupements' },
    { name: 'État Contribuable', description: 'Suivi de l’activité et de la conformité' },
    { name: 'Relances', description: 'Relances et recouvrement' },
    { name: 'Centres', description: 'Centres et unités fiscales' },
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
        summary: 'Lister les contribuables avec pagination, recherche et état',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'centre_fiscal_ref', in: 'query', schema: { type: 'string' } },
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
        summary: 'Récupérer un contribuable et son dernier état',
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
    '/api/contribuables/{id}/etat': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
      get: {
        tags: ['État Contribuable'],
        summary: 'Historique des statuts du contribuable',
        responses: { 200: { description: 'Historique' } },
      },
      post: {
        tags: ['État Contribuable'],
        summary: 'Mettre à jour l’état d’un contribuable',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/EtatContribuableInput' },
            },
          },
        },
        responses: { 201: { description: 'État créé' } },
      },
    },
    '/api/declarations': {
      get: {
        tags: ['Déclarations'],
        summary: 'Lister les déclarations',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'statut', in: 'query', schema: { type: 'string' } },
          { name: 'annee', in: 'query', schema: { type: 'integer' } },
          { name: 'type_declaration', in: 'query', schema: { type: 'string' } },
          { name: 'periode', in: 'query', schema: { type: 'string' } },
        ],
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
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
      get: {
        tags: ['Déclarations'],
        summary: 'Récupérer une déclaration',
        responses: { 200: { description: 'Déclaration trouvée' }, 404: { description: 'Introuvable' } },
      },
      put: {
        tags: ['Déclarations'],
        summary: 'Mettre à jour une déclaration',
        responses: { 200: { description: 'Déclaration mise à jour' }, 404: { description: 'Introuvable' } },
      },
    },
    '/api/recoupements': {
      get: {
        tags: ['Recoupements'],
        summary: 'Lister les recoupements',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'periode', in: 'query', schema: { type: 'string' } },
          { name: 'source', in: 'query', schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Liste des recoupements' } },
      },
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
    '/api/recoupements/{id}': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
      get: {
        tags: ['Recoupements'],
        summary: 'Détail d’un recoupement',
        responses: { 200: { description: 'Détail' }, 404: { description: 'Introuvable' } },
      },
      put: {
        tags: ['Recoupements'],
        summary: 'Modifier un recoupement',
        responses: { 200: { description: 'Modifié' } },
      },
      delete: {
        tags: ['Recoupements'],
        summary: 'Supprimer un recoupement',
        responses: { 200: { description: 'Supprimé' } },
      },
    },
    '/api/droits-communication': {
      get: {
        tags: ['Droits de communication'],
        summary: 'Lister les droits de communication',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'statut', in: 'query', schema: { type: 'string' } },
          { name: 'type_tier', in: 'query', schema: { type: 'string' } },
          { name: 'id_contribuable', in: 'query', schema: { type: 'integer' } },
        ],
        responses: { 200: { description: 'Liste des droits de communication' } },
      },
      post: {
        tags: ['Droits de communication'],
        summary: 'Enregistrer un droit de communication',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/DroitCommunicationInput' } } },
        },
        responses: { 201: { description: 'Droit de communication enregistré' }, 400: { description: 'Données invalides' } },
      },
    },
    '/api/droits-communication/stats/statuts': {
      get: {
        tags: ['Droits de communication'],
        summary: 'Répartition des droits de communication par statut',
        responses: { 200: { description: 'Statistiques' } },
      },
    },
    '/api/droits-communication/{id}': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
      get: {
        tags: ['Droits de communication'],
        summary: 'Détail d’un droit de communication',
        responses: { 200: { description: 'Détail' }, 404: { description: 'Introuvable' } },
      },
      put: {
        tags: ['Droits de communication'],
        summary: 'Modifier un droit de communication',
        responses: { 200: { description: 'Modifié' }, 404: { description: 'Introuvable' } },
      },
      delete: {
        tags: ['Droits de communication'],
        summary: 'Supprimer un droit de communication',
        responses: { 200: { description: 'Supprimé' }, 404: { description: 'Introuvable' } },
      },
    },
    '/api/rapprochements': {
      get: {
        tags: ['Rapprochements'],
        summary: 'Lister les rapprochements',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'statut', in: 'query', schema: { type: 'string' } },
          { name: 'type_rapprochement', in: 'query', schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Liste des rapprochements' } },
      },
      post: {
        tags: ['Rapprochements'],
        summary: 'Créer un rapprochement',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/RapprochementInput' } } },
        },
        responses: { 201: { description: 'Créé' } },
      },
    },
    '/api/rapprochements/confronter': {
      post: {
        tags: ['Rapprochements'],
        summary: 'Confronter automatiquement une déclaration et un recoupement',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['id_declaration', 'id_recoupement'],
                properties: {
                  id_declaration: { type: 'integer' },
                  id_recoupement: { type: 'integer' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Confrontation réussie' } },
      },
    },
    '/api/rapprochements/stats': {
      get: {
        tags: ['Rapprochements'],
        summary: 'Statistiques des rapprochements',
        responses: { 200: { description: 'Statistiques' } },
      },
    },
    '/api/relances': {
      get: {
        tags: ['Relances'],
        summary: 'Lister les relances',
        responses: { 200: { description: 'Liste des relances' } },
      },
      post: {
        tags: ['Relances'],
        summary: 'Créer une relance',
        responses: { 201: { description: 'Relance créée' } },
      },
    },
    '/api/relances/stats': {
      get: {
        tags: ['Relances'],
        summary: 'Statistiques des relances',
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
          id_centre: { type: 'integer' },
          centre_fiscal_ref: { type: 'string', example: 'cdi:tsaralalana' },
        },
      },
      DeclarationInput: {
        type: 'object',
        required: ['id_contribuable', 'annee', 'ca', 'benefice'],
        properties: {
          id_contribuable: { type: 'integer', example: 1 },
          annee: { type: 'integer', example: 2025 },
          type_declaration: { type: 'string', default: 'TVA', example: 'TVA' },
          periode: { type: 'string', example: '2025-01' },
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
        properties: {
          id_contribuable: { type: 'integer', example: 1 },
          source: { type: 'string', example: 'tiers_declarant' },
          periode: { type: 'string', example: '2025-01' },
          reference: { type: 'string', example: 'REC-2025-001' },
          type_operation: { type: 'string', example: 'vente' },
          nif_tiers: { type: 'string', example: '9876543210' },
          date_operation: { type: 'string', format: 'date', example: '2025-01-15' },
          montant_declare: { type: 'number', example: 1000000 },
          montant_tva: { type: 'number', example: 200000 },
          montant_ttc: { type: 'number', example: 1200000 },
          merchandise_sold: { type: 'number', example: 1000000 },
          goods_purchased: { type: 'number', example: 400000 },
          services_purchased: { type: 'number', example: 100000 },
          third_party_payments: { type: 'number', example: 50000 },
          local_products: { type: 'number', example: 200000 },
          import_expenses: { type: 'number', example: 100000 },
          ca_declare: { type: 'number', example: 1000000 },
        },
      },
      DroitCommunicationInput: {
        type: 'object',
        required: ['id_contribuable', 'tier', 'objet', 'date_demande'],
        properties: {
          id_contribuable: { type: 'integer', example: 1 },
          tier: { type: 'string', example: 'Banza / Banque BNP' },
          type_tier: { type: 'string', example: 'banque' },
          nif_tier: { type: 'string', example: '9876543210' },
          objet: { type: 'string', example: 'Relevés de compte 2025' },
          pieces_demandees: { type: 'string', example: 'Relevés bancaires, chèque' },
          date_demande: { type: 'string', format: 'date', example: '2025-03-10' },
          date_reponse: { type: 'string', format: 'date', example: '2025-03-30' },
          statut: { type: 'string', enum: ['demande', 'reponse', 'partiel', 'relance', 'sans_suite'] },
          documents_recus: { type: 'string', example: '12 relevés' },
          observations: { type: 'string', example: 'Réponse partielle, relance prévue' },
        },
      },
      EtatContribuableInput: {
        type: 'object',
        properties: {
          id_contribuable: { type: 'integer', example: 1 },
          statut_activite: { type: 'string', example: 'Actif' },
          statut_conformite: { type: 'string', example: 'En règle' },
          motif: { type: 'string', example: 'Régularisation effectuée' },
        },
      },
      RapprochementInput: {
        type: 'object',
        properties: {
          id_declaration: { type: 'integer', example: 1 },
          id_recoupement: { type: 'integer', example: 1 },
          id_controle: { type: 'integer' },
          type_rapprochement: { type: 'string', example: 'exact' },
          score: { type: 'number', example: 100 },
          montant_declare: { type: 'number', example: 1200000 },
          montant_recoupe: { type: 'number', example: 1200000 },
          ecart: { type: 'number', example: 0 },
          statut: { type: 'string', example: 'valide' },
          motif: { type: 'string', example: 'Concordance' },
        },
      },
    },
  },
};

module.exports = { swaggerSpec, swaggerUi };
