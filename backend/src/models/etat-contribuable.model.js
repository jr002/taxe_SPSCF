const prisma = require('../config/prisma');
const { applyScope } = require('../utils/data-scope');

// Reprises telles quelles sur les contraintes `check_statut_activite` et
// `check_statut_conformite` de la base : une valeur hors liste serait refusée
// par PostgreSQL en erreur 23514 (500) au lieu d'un 400 de validation.
const STATUTS_ACTIVITE = ['Actif', 'En sommeil', 'En cessation', 'Radié'];
const STATUTS_CONFORMITE = ['En règle', 'Défaillant', 'Sous contrôle', 'Bloqué'];

class EtatContribuableModel {
  // Créer ou enregistrer un nouvel état pour un contribuable
  static async create(data) {
    const {
      id_contribuable,
      statut_activite = STATUTS_ACTIVITE[0],
      statut_conformite = STATUTS_CONFORMITE[0],
      id_agent,
      motif,
    } = data;

    return await prisma.etat_contribuable.create({
      data: {
        id_contribuable: parseInt(id_contribuable, 10),
        statut_activite: statut_activite || STATUTS_ACTIVITE[0],
        statut_conformite: statut_conformite || STATUTS_CONFORMITE[0],
        id_agent: id_agent ? parseInt(id_agent, 10) : null,
        motif: motif || null,
        date_modification: new Date(),
      },
      include: {
        agents: {
          select: {
            id_agent: true,
            nom: true,
            prenom: true,
            email: true,
          },
        },
      },
    });
  }

  // Trouver par ID
  static async findById(id) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) return null;

    return await prisma.etat_contribuable.findUnique({
      where: { id_etat: numericId },
      include: {
        agents: {
          select: {
            id_agent: true,
            nom: true,
            prenom: true,
            email: true,
          },
        },
        contribuables: {
          select: {
            id_contribuable: true,
            nif: true,
            raison_sociale: true,
          },
        },
      },
    });
  }

  // Historique des états d'un contribuable
  static async findByContribuable(id_contribuable) {
    const numericId = parseInt(id_contribuable, 10);
    if (isNaN(numericId)) return [];

    return await prisma.etat_contribuable.findMany({
      where: { id_contribuable: numericId },
      orderBy: { date_modification: 'desc' },
      include: {
        agents: {
          select: {
            id_agent: true,
            nom: true,
            prenom: true,
          },
        },
      },
    });
  }

  // Dernier état d'un contribuable
  static async findLatestByContribuable(id_contribuable) {
    const numericId = parseInt(id_contribuable, 10);
    if (isNaN(numericId)) return null;

    return await prisma.etat_contribuable.findFirst({
      where: { id_contribuable: numericId },
      orderBy: { date_modification: 'desc' },
      include: {
        agents: {
          select: {
            id_agent: true,
            nom: true,
            prenom: true,
          },
        },
      },
    });
  }

  // Liste paginée avec filtres
  static async findAll({ page = 1, limit = 20, statut_activite = '', statut_conformite = '', id_contribuable = null, scope } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 20);
    const offset = (pageNum - 1) * limitNum;

    const where = {};
    if (id_contribuable) where.id_contribuable = parseInt(id_contribuable, 10);
    if (statut_activite) where.statut_activite = statut_activite;
    if (statut_conformite) where.statut_conformite = statut_conformite;
    applyScope(where, scope, { relation: 'contribuables' });

    const [total, rows] = await Promise.all([
      prisma.etat_contribuable.count({ where }),
      prisma.etat_contribuable.findMany({
        where,
        skip: offset,
        take: limitNum,
        orderBy: { date_modification: 'desc' },
        include: {
          agents: {
            select: {
              id_agent: true,
              nom: true,
              prenom: true,
            },
          },
          contribuables: {
            select: {
              id_contribuable: true,
              nif: true,
              raison_sociale: true,
            },
          },
        },
      }),
    ]);

    return {
      data: rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    };
  }

  // Mettre à jour un enregistrement d'état
  static async update(id, data) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) return null;

    const updateData = {};
    const allowedFields = ['statut_activite', 'statut_conformite', 'motif', 'id_agent'];
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updateData[field] = field === 'id_agent' && data[field] ? parseInt(data[field], 10) : data[field];
      }
    }
    updateData.date_modification = new Date();

    try {
      return await prisma.etat_contribuable.update({
        where: { id_etat: numericId },
        data: updateData,
      });
    } catch (err) {
      if (err.code === 'P2025') return null;
      throw err;
    }
  }

  // Supprimer
  static async delete(id) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) return null;

    try {
      return await prisma.etat_contribuable.delete({
        where: { id_etat: numericId },
      });
    } catch (err) {
      if (err.code === 'P2025') return null;
      throw err;
    }
  }

  // Statistiques sur les états
  static async getStats(scope) {
    const where = applyScope({}, scope, { relation: 'contribuables' });

    const [activite, conformite, total] = await Promise.all([
      prisma.etat_contribuable.groupBy({
        by: ['statut_activite'],
        _count: { _all: true },
        where,
      }),
      prisma.etat_contribuable.groupBy({
        by: ['statut_conformite'],
        _count: { _all: true },
        where,
      }),
      prisma.etat_contribuable.count({ where }),
    ]);

    return {
      total,
      par_activite: activite.map((a) => ({ statut: a.statut_activite, total: a._count._all })),
      par_conformite: conformite.map((c) => ({ statut: c.statut_conformite, total: c._count._all })),
    };
  }
}

module.exports = { EtatContribuableModel, STATUTS_ACTIVITE, STATUTS_CONFORMITE };
