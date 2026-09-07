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
    } = data;
    
    return await prisma.recoupements.create({
      data: {
        id_contribuable: id_contribuable ? parseInt(id_contribuable, 10) : null,
        source,
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

  // Trouver par ID avec informations du contribuable
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

  // Recoupements d'un contribuable
  static async findByContribuable(id_contribuable) {
    const numericId = parseInt(id_contribuable, 10);
    if (isNaN(numericId)) return [];

    return await prisma.recoupements.findMany({
      where: { id_contribuable: numericId },
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
      'source', 'merchandise_sold', 'goods_purchased', 
      'services_purchased', 'third_party_payments', 
      'local_products', 'import_expenses', 'somme_recoupee',
    ];
    
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
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

  // Statistiques des sources
  static async getSourceStats() {
    const grouped = await prisma.recoupements.groupBy({
      by: ['source'],
      _count: { _all: true },
      _avg: { somme_recoupee: true },
    });

    return grouped
      .map((g) => ({
        source: g.source,
        total: String(g._count._all),
        moyenne_recoupee: g._avg.somme_recoupee ? Number(g._avg.somme_recoupee) : 0,
      }))
      .sort((a, b) => Number(b.total) - Number(a.total));
  }
}

module.exports = RecoupementModel;