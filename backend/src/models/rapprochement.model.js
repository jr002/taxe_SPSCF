const prisma = require('../config/prisma');

class RapprochementModel {
  // Créer un rapprochement
  static async create(data) {
    const {
      id_controle,
      id_declaration,
      id_recoupement,
      type_rapprochement = 'exact',
      score = 100,
      montant_declare = 0,
      montant_recoupe = 0,
      ecart,
      statut = 'a_verifier',
      motif,
    } = data;

    const calculatedEcart = ecart !== undefined 
      ? Number(ecart) 
      : Math.round((Number(montant_declare) - Number(montant_recoupe)) * 100) / 100;

    return await prisma.rapprochements.create({
      data: {
        id_controle: id_controle ? parseInt(id_controle, 10) : null,
        id_declaration: id_declaration ? parseInt(id_declaration, 10) : null,
        id_recoupement: id_recoupement ? parseInt(id_recoupement, 10) : null,
        type_rapprochement: type_rapprochement || 'exact',
        score: score !== undefined ? score : 0,
        montant_declare: montant_declare !== undefined ? montant_declare : 0,
        montant_recoupe: montant_recoupe !== undefined ? montant_recoupe : 0,
        ecart: calculatedEcart,
        statut: statut || 'a_verifier',
        motif: motif || null,
        date_rapprochement: new Date(),
      },
      include: {
        declarations: {
          include: {
            contribuables: {
              select: {
                id_contribuable: true,
                nif: true,
                raison_sociale: true,
              },
            },
          },
        },
        recoupements: true,
        controles: true,
      },
    });
  }

  // Trouver par ID avec tous les détails
  static async findById(id) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) return null;

    return await prisma.rapprochements.findUnique({
      where: { id_rapprochement: numericId },
      include: {
        declarations: {
          include: {
            contribuables: {
              select: {
                id_contribuable: true,
                nif: true,
                raison_sociale: true,
              },
            },
          },
        },
        recoupements: {
          include: {
            contribuables: {
              select: {
                id_contribuable: true,
                nif: true,
                raison_sociale: true,
              },
            },
          },
        },
        controles: true,
      },
    });
  }

  // Liste paginée avec filtres
  static async findAll({
    page = 1,
    limit = 20,
    statut = '',
    type_rapprochement = '',
    id_declaration = null,
    id_recoupement = null,
    id_controle = null,
    id_contribuable = null,
  } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 20);
    const offset = (pageNum - 1) * limitNum;

    const where = {};
    if (statut) where.statut = statut;
    if (type_rapprochement) where.type_rapprochement = type_rapprochement;
    if (id_declaration) where.id_declaration = parseInt(id_declaration, 10);
    if (id_recoupement) where.id_recoupement = parseInt(id_recoupement, 10);
    if (id_controle) where.id_controle = parseInt(id_controle, 10);
    if (id_contribuable) {
      where.OR = [
        { declarations: { id_contribuable: parseInt(id_contribuable, 10) } },
        { recoupements: { id_contribuable: parseInt(id_contribuable, 10) } },
      ];
    }

    const [total, rows] = await Promise.all([
      prisma.rapprochements.count({ where }),
      prisma.rapprochements.findMany({
        where,
        skip: offset,
        take: limitNum,
        orderBy: { date_rapprochement: 'desc' },
        include: {
          declarations: {
            select: {
              id_declaration: true,
              annee: true,
              periode: true,
              type_declaration: true,
              ca: true,
              tva_payee: true,
              statut: true,
              contribuables: {
                select: {
                  id_contribuable: true,
                  nif: true,
                  raison_sociale: true,
                },
              },
            },
          },
          recoupements: {
            select: {
              id_recoupement: true,
              source: true,
              periode: true,
              reference: true,
              type_operation: true,
              nif_tiers: true,
              somme_recoupee: true,
              montant_ttc: true,
            },
          },
          controles: {
            select: {
              id_controle: true,
              resultat: true,
              ecart: true,
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

  // Rapprochements d'une déclaration
  static async findByDeclaration(id_declaration) {
    const numericId = parseInt(id_declaration, 10);
    if (isNaN(numericId)) return [];

    return await prisma.rapprochements.findMany({
      where: { id_declaration: numericId },
      include: {
        recoupements: true,
      },
      orderBy: { date_rapprochement: 'desc' },
    });
  }

  // Rapprochements d'un recoupement
  static async findByRecoupement(id_recoupement) {
    const numericId = parseInt(id_recoupement, 10);
    if (isNaN(numericId)) return [];

    return await prisma.rapprochements.findMany({
      where: { id_recoupement: numericId },
      include: {
        declarations: true,
      },
      orderBy: { date_rapprochement: 'desc' },
    });
  }

  // Mettre à jour
  static async update(id, data) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) return null;

    const updateData = {};
    const allowedFields = [
      'id_controle', 'id_declaration', 'id_recoupement',
      'type_rapprochement', 'score', 'montant_declare', 'montant_recoupe',
      'ecart', 'statut', 'motif'
    ];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        if (field === 'id_controle' || field === 'id_declaration' || field === 'id_recoupement') {
          updateData[field] = data[field] ? parseInt(data[field], 10) : null;
        } else {
          updateData[field] = data[field];
        }
      }
    }

    try {
      return await prisma.rapprochements.update({
        where: { id_rapprochement: numericId },
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
      return await prisma.rapprochements.delete({
        where: { id_rapprochement: numericId },
      });
    } catch (err) {
      if (err.code === 'P2025') return null;
      throw err;
    }
  }

  // Statistiques
  static async getStats() {
    const [total, groupedStatut, groupedType, aggregates] = await Promise.all([
      prisma.rapprochements.count(),
      prisma.rapprochements.groupBy({
        by: ['statut'],
        _count: { _all: true },
      }),
      prisma.rapprochements.groupBy({
        by: ['type_rapprochement'],
        _count: { _all: true },
      }),
      prisma.rapprochements.aggregate({
        _avg: { score: true, ecart: true },
        _sum: { ecart: true, montant_declare: true, montant_recoupe: true },
      }),
    ]);

    return {
      total: String(total),
      par_statut: groupedStatut.map((g) => ({ statut: g.statut, total: String(g._count._all) })),
      par_type: groupedType.map((g) => ({ type: g.type_rapprochement, total: String(g._count._all) })),
      score_moyen: aggregates._avg.score ? Number(aggregates._avg.score) : 0,
      ecart_moyen: aggregates._avg.ecart ? Number(aggregates._avg.ecart) : 0,
      ecart_total: aggregates._sum.ecart ? Number(aggregates._sum.ecart) : 0,
      montant_declare_total: aggregates._sum.montant_declare ? Number(aggregates._sum.montant_declare) : 0,
      montant_recoupe_total: aggregates._sum.montant_recoupe ? Number(aggregates._sum.montant_recoupe) : 0,
    };
  }
}

module.exports = RapprochementModel;
