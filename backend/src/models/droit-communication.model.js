const prisma = require('../config/prisma');
const { applyScope } = require('../utils/data-scope');

const STATUTS = ['demande', 'reponse', 'partiel', 'relance', 'sans_suite'];

class DroitCommunicationModel {
  static async create(data) {
    return await prisma.droits_communication.create({
      data: {
        id_contribuable: parseInt(data.id_contribuable, 10),
        id_agent: data.id_agent ? parseInt(data.id_agent, 10) : null,
        tier: data.tier,
        type_tier: data.type_tier || 'autre',
        nif_tier: data.nif_tier || null,
        objet: data.objet,
        pieces_demandees: data.pieces_demandees || null,
        date_demande: new Date(data.date_demande),
        date_reponse: data.date_reponse ? new Date(data.date_reponse) : null,
        statut: STATUTS.includes(data.statut) ? data.statut : 'demande',
        documents_recus: data.documents_recus || null,
        observations: data.observations || null,
        date_creation: new Date(),
      },
    });
  }

  static async findById(id) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) return null;

    const droit = await prisma.droits_communication.findUnique({
      where: { id_droit: numericId },
      include: {
        contribuables: { select: { nif: true, raison_sociale: true } },
        agents: { select: { nom: true, prenom: true } },
      },
    });

    if (!droit) return null;

    const { contribuables, agents, ...fields } = droit;
    return {
      ...fields,
      nif: contribuables?.nif || null,
      raison_sociale: contribuables?.raison_sociale || null,
      agent_nom: [agents?.prenom, agents?.nom].filter(Boolean).join(' ') || null,
    };
  }

  static async findAll({
    page = 1,
    limit = 20,
    search = '',
    statut = '',
    type_tier = '',
    id_contribuable = null,
    scope,
  } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 20);
    const offset = (pageNum - 1) * limitNum;

    const where = {};
    if (id_contribuable) where.id_contribuable = parseInt(id_contribuable, 10);
    if (statut) where.statut = statut;
    if (type_tier) where.type_tier = type_tier;
    if (search) {
      where.OR = [
        { tier: { contains: search, mode: 'insensitive' } },
        { objet: { contains: search, mode: 'insensitive' } },
        { nif_tier: { contains: search, mode: 'insensitive' } },
        {
          contribuables: {
            OR: [
              { nif: { contains: search, mode: 'insensitive' } },
              { raison_sociale: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }
    applyScope(where, scope, { relation: 'contribuables' });

    const [total, rows] = await Promise.all([
      prisma.droits_communication.count({ where }),
      prisma.droits_communication.findMany({
        where,
        skip: offset,
        take: limitNum,
        orderBy: { date_demande: 'desc' },
        include: {
          contribuables: { select: { nif: true, raison_sociale: true } },
        },
      }),
    ]);

    const data = rows.map((row) => {
      const { contribuables, ...fields } = row;
      return {
        ...fields,
        nif: contribuables?.nif || null,
        raison_sociale: contribuables?.raison_sociale || null,
      };
    });

    return {
      data,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    };
  }

  static async findByContribuable(id_contribuable) {
    const numericId = parseInt(id_contribuable, 10);
    if (isNaN(numericId)) return [];

    return await prisma.droits_communication.findMany({
      where: { id_contribuable: numericId },
      orderBy: { date_demande: 'desc' },
    });
  }

  static async update(id, data) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) return null;

    const updateData = {};
    const allowedFields = [
      'tier', 'type_tier', 'nif_tier', 'objet', 'pieces_demandees',
      'date_reponse', 'statut', 'documents_recus', 'observations',
    ];

    for (const field of allowedFields) {
      if (data[field] !== undefined) updateData[field] = data[field];
    }
    if (data.date_demande !== undefined) updateData.date_demande = new Date(data.date_demande);
    if (data.date_reponse !== undefined) {
      updateData.date_reponse = data.date_reponse ? new Date(data.date_reponse) : null;
    }
    if (data.statut !== undefined && !STATUTS.includes(data.statut)) delete updateData.statut;

    updateData.date_modification = new Date();

    try {
      return await prisma.droits_communication.update({
        where: { id_droit: numericId },
        data: updateData,
      });
    } catch (err) {
      if (err.code === 'P2025') return null;
      throw err;
    }
  }

  static async delete(id) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) return null;

    try {
      return await prisma.droits_communication.delete({ where: { id_droit: numericId } });
    } catch (err) {
      if (err.code === 'P2025') return null;
      throw err;
    }
  }

  static async getStatutStats(id_contribuable, scope) {
    const where = applyScope({}, scope, { relation: 'contribuables' });
    const numericId = parseInt(id_contribuable, 10);
    if (!isNaN(numericId)) where.id_contribuable = numericId;

    const grouped = await prisma.droits_communication.groupBy({
      by: ['statut'],
      where,
      _count: { _all: true },
    });

    return grouped.map((g) => ({ statut: g.statut, total: g._count._all }));
  }
}

module.exports = DroitCommunicationModel;
