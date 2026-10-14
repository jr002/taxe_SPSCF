const prisma = require('../config/prisma');

class RecoupementModel {
  // Créer un recoupement avec source par défaut
  static async create(data) {
    const { 
      id_contribuable, 
      source = 'tiers_declarant',
      merchandise_sold, 
      goods_purchased,
      services_purchased, 
      third_party_payments, 
      local_products,
      import_expenses, 
      somme_recoupee,
      periode,
      reference,
      type_operation,
      nif_tiers,
      date_operation,
      montant_declare,
      montant_tva,
      montant_ttc,
    } = data;
    
    return await prisma.recoupements.create({
      data: {
        id_contribuable: id_contribuable ? parseInt(id_contribuable, 10) : null,
        source,
        periode: periode || null,
        reference: reference || null,
        type_operation: type_operation || null,
        nif_tiers: nif_tiers || null,
        date_operation: date_operation ? new Date(date_operation) : null,
        montant_declare: montant_declare !== undefined ? montant_declare : 0,
        montant_tva: montant_tva !== undefined ? montant_tva : 0,
        montant_ttc: montant_ttc !== undefined ? montant_ttc : 0,
        merchandise_sold: merchandise_sold !== undefined ? merchandise_sold : 0,
        goods_purchased: goods_purchased !== undefined ? goods_purchased : 0,
        services_purchased: services_purchased !== undefined ? services_purchased : 0,
        third_party_payments: third_party_payments !== undefined ? third_party_payments : 0,
        local_products: local_products !== undefined ? local_products : 0,
        import_expenses: import_expenses !== undefined ? import_expenses : 0,
        somme_recoupee: somme_recoupee !== undefined ? somme_recoupee : 0,
        date_creation: new Date(),
      },
    });
  }

  // Trouver par ID avec informations du contribuable et rapprochements
  static async findById(id) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) return null;

    const recoupement = await prisma.recoupements.findUnique({
      where: { id_recoupement: numericId },
      include: {
        contribuables: {
          select: {
            nif: true,
            raison_sociale: true,
          },
        },
        rapprochements: true,
      },
    });

    if (!recoupement) return null;

    const { contribuables, ...fields } = recoupement;
    return {
      ...fields,
      nif: contribuables?.nif || null,
      raison_sociale: contribuables?.raison_sociale || null,
    };
  }

  // Liste paginée avec filtres
  static async findAll({ page = 1, limit = 20, search = '', periode = '', source = '', type_operation = '', id_contribuable = null } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 20);
    const offset = (pageNum - 1) * limitNum;

    const where = {};
    if (id_contribuable) {
      where.id_contribuable = parseInt(id_contribuable, 10);
    }
    if (source) {
      where.source = source;
    }
    if (periode) {
      where.periode = periode;
    }
    if (type_operation) {
      where.type_operation = type_operation;
    }
    if (search) {
      where.OR = [
        { reference: { contains: search, mode: 'insensitive' } },
        { nif_tiers: { contains: search, mode: 'insensitive' } },
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

    const [total, rows] = await Promise.all([
      prisma.recoupements.count({ where }),
      prisma.recoupements.findMany({
        where,
        skip: offset,
        take: limitNum,
        orderBy: { date_creation: 'desc' },
        include: {
          contribuables: {
            select: {
              nif: true,
              raison_sociale: true,
            },
          },
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
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    };
  }

  // Recoupements d'un contribuable
  static async findByContribuable(id_contribuable, options = {}) {
    const numericId = parseInt(id_contribuable, 10);
    if (isNaN(numericId)) return [];

    const where = { id_contribuable: numericId };
    if (options.periode) where.periode = options.periode;
    if (options.source) where.source = options.source;

    return await prisma.recoupements.findMany({
      where,
      orderBy: { date_creation: 'desc' },
    });
  }

  // Dernier recoupement
  static async findLastByContribuable(id_contribuable) {
    const numericId = parseInt(id_contribuable, 10);
    if (isNaN(numericId)) return null;

    return await prisma.recoupements.findFirst({
      where: { id_contribuable: numericId },
      orderBy: { date_creation: 'desc' },
    });
  }

  // Mettre à jour
  static async update(id, data) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) return null;

    const updateData = {};
    const allowedFields = [
      'source', 'periode', 'reference', 'type_operation', 'nif_tiers',
      'date_operation', 'montant_declare', 'montant_tva', 'montant_ttc',
      'merchandise_sold', 'goods_purchased', 
      'services_purchased', 'third_party_payments', 
      'local_products', 'import_expenses', 'somme_recoupee',
    ];
    
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        if (field === 'date_operation') {
          updateData[field] = data[field] ? new Date(data[field]) : null;
        } else {
          updateData[field] = data[field];
        }
      }
    }

    try {
      return await prisma.recoupements.update({
        where: { id_recoupement: numericId },
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
      return await prisma.recoupements.delete({
        where: { id_recoupement: numericId },
      });
    } catch (err) {
      if (err.code === 'P2025') return null;
      throw err;
    }
  }

  // Statistiques des sources
  static async getSourceStats() {
    const grouped = await prisma.recoupements.groupBy({
      by: ['source'],
      _count: { _all: true },
      _avg: { somme_recoupee: true },
      _sum: { montant_ttc: true, montant_tva: true },
    });

    return grouped
      .map((g) => ({
        source: g.source,
        total: String(g._count._all),
        moyenne_recoupee: g._avg.somme_recoupee ? Number(g._avg.somme_recoupee) : 0,
        montant_ttc_total: g._sum.montant_ttc ? Number(g._sum.montant_ttc) : 0,
        montant_tva_total: g._sum.montant_tva ? Number(g._sum.montant_tva) : 0,
      }))
      .sort((a, b) => Number(b.total) - Number(a.total));
  }
}

module.exports = RecoupementModel;