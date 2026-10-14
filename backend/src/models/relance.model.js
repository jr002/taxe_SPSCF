const prisma = require('../config/prisma');

class RelanceModel {
  // Créer une relance
  static async create(data) {
    const {
      id_contribuable,
      id_declaration,
      id_agent,
      type_relance,
      statut = 'emise',
      annee,
      montant_du,
      jours_retard = 0,
      date_emission = new Date(),
      date_regularisation,
      document_url,
      observations,
    } = data;

    return await prisma.relances.create({
      data: {
        id_contribuable: parseInt(id_contribuable, 10),
        id_declaration: id_declaration ? parseInt(id_declaration, 10) : null,
        id_agent: id_agent ? parseInt(id_agent, 10) : null,
        type_relance,
        statut: statut || 'emise',
        annee: parseInt(annee, 10),
        montant_du: montant_du !== undefined ? montant_du : 0,
        jours_retard: parseInt(jours_retard, 10) || 0,
        date_emission: date_emission ? new Date(date_emission) : new Date(),
        date_regularisation: date_regularisation ? new Date(date_regularisation) : null,
        document_url: document_url || null,
        observations: observations || null,
        date_creation: new Date(),
      },
      include: {
        contribuables: {
          select: {
            id_contribuable: true,
            nif: true,
            raison_sociale: true,
          },
        },
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

  // Trouver par ID
  static async findById(id) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) return null;

    return await prisma.relances.findUnique({
      where: { id_relance: numericId },
      include: {
        contribuables: true,
        declarations: true,
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

  // Liste paginée avec filtres
  static async findAll({
    page = 1,
    limit = 20,
    search = '',
    statut = '',
    type_relance = '',
    annee = '',
    id_contribuable = null,
  } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 20);
    const offset = (pageNum - 1) * limitNum;

    const where = {};
    if (statut) where.statut = statut;
    if (type_relance) where.type_relance = type_relance;
    if (annee) where.annee = parseInt(annee, 10);
    if (id_contribuable) where.id_contribuable = parseInt(id_contribuable, 10);
    if (search) {
      where.contribuables = {
        OR: [
          { nif: { contains: search, mode: 'insensitive' } },
          { raison_sociale: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const [total, rows] = await Promise.all([
      prisma.relances.count({ where }),
      prisma.relances.findMany({
        where,
        skip: offset,
        take: limitNum,
        orderBy: { date_emission: 'desc' },
        include: {
          contribuables: {
            select: {
              id_contribuable: true,
              nif: true,
              raison_sociale: true,
              telephone: true,
              email: true,
            },
          },
          agents: {
            select: {
              id_agent: true,
              nom: true,
              prenom: true,
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

  // Relances d'un contribuable
  static async findByContribuable(id_contribuable) {
    const numericId = parseInt(id_contribuable, 10);
    if (isNaN(numericId)) return [];

    return await prisma.relances.findMany({
      where: { id_contribuable: numericId },
      orderBy: { date_emission: 'desc' },
      include: {
        declarations: true,
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

  // Mettre à jour une relance
  static async update(id, data) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) return null;

    const updateData = {};
    const allowedFields = [
      'statut', 'montant_du', 'jours_retard', 'type_relance',
      'date_regularisation', 'document_url', 'observations', 'id_agent'
    ];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        if (field === 'date_regularisation') {
          updateData[field] = data[field] ? new Date(data[field]) : null;
        } else if (field === 'id_agent') {
          updateData[field] = data[field] ? parseInt(data[field], 10) : null;
        } else if (field === 'jours_retard') {
          updateData[field] = parseInt(data[field], 10);
        } else {
          updateData[field] = data[field];
        }
      }
    }
    updateData.date_modification = new Date();

    try {
      return await prisma.relances.update({
        where: { id_relance: numericId },
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
      return await prisma.relances.delete({
        where: { id_relance: numericId },
      });
    } catch (err) {
      if (err.code === 'P2025') return null;
      throw err;
    }
  }

  // Statistiques
  static async getStats() {
    const [total, groupedStatut, aggregates] = await Promise.all([
      prisma.relances.count(),
      prisma.relances.groupBy({
        by: ['statut'],
        _count: { _all: true },
        _sum: { montant_du: true },
      }),
      prisma.relances.aggregate({
        _sum: { montant_du: true },
        _avg: { jours_retard: true },
      }),
    ]);

    return {
      total: String(total),
      montant_total_du: aggregates._sum.montant_du ? Number(aggregates._sum.montant_du) : 0,
      retard_moyen_jours: aggregates._avg.jours_retard ? Math.round(Number(aggregates._avg.jours_retard)) : 0,
      par_statut: groupedStatut.map((g) => ({
        statut: g.statut,
        total: String(g._count._all),
        montant: g._sum.montant_du ? Number(g._sum.montant_du) : 0,
      })),
    };
  }
}

module.exports = RelanceModel;
