const prisma = require('../config/prisma');

class DeclarationModel {
  // Créer une déclaration
  static async create(data) {
    const { 
      id_contribuable, annee, ca, benefice, 
      tva_collectee, tva_deductible, tva_payee,
      tva_theorique, statut 
    } = data;
    
    return await prisma.declarations.create({
      data: {
        id_contribuable: id_contribuable ? parseInt(id_contribuable, 10) : null,
        annee: parseInt(annee, 10),
        ca: ca !== undefined ? ca : 0,
        benefice: benefice !== undefined ? benefice : 0,
        tva_collectee: tva_collectee !== undefined ? tva_collectee : 0,
        tva_deductible: tva_deductible !== undefined ? tva_deductible : 0,
        tva_payee: tva_payee !== undefined ? tva_payee : 0,
        tva_theorique: tva_theorique !== undefined ? tva_theorique : 0,
        statut: statut || 'conforme',
        date_creation: new Date(),
      },
    });
  }

  // Trouver par ID avec informations du contribuable
  static async findById(id) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) return null;

    const declaration = await prisma.declarations.findUnique({
      where: { id_declaration: numericId },
      include: {
        contribuables: {
          select: {
            nif: true,
            raison_sociale: true,
            secteur_activite: true,
          },
        },
      },
    });

    if (!declaration) return null;

    const { contribuables, ...fields } = declaration;
    return {
      ...fields,
      nif: contribuables?.nif || null,
      raison_sociale: contribuables?.raison_sociale || null,
      secteur_activite: contribuables?.secteur_activite || null,
    };
  }

  // Déclarations d'un contribuable
  static async findByContribuable(id_contribuable) {
    const numericId = parseInt(id_contribuable, 10);
    if (isNaN(numericId)) return [];

    return await prisma.declarations.findMany({
      where: { id_contribuable: numericId },
      orderBy: { annee: 'desc' },
    });
  }

  // Liste avec filtres et pagination
  static async findAll({ page = 1, limit = 20, search = '', statut = '', annee = '' } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 20);
    const offset = (pageNum - 1) * limitNum;

    const where = {};
    if (statut) {
      where.statut = statut;
    }
    if (annee) {
      where.annee = parseInt(annee, 10);
    }
    if (search) {
      where.contribuables = {
        OR: [
          { nif: { contains: search, mode: 'insensitive' } },
          { raison_sociale: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const [total, rows] = await Promise.all([
      prisma.declarations.count({ where }),
      prisma.declarations.findMany({
        where,
        skip: offset,
        take: limitNum,
        orderBy: { date_creation: 'desc' },
        include: {
          contribuables: {
            select: {
              nif: true,
              raison_sociale: true,
              secteur_activite: true,
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
        secteur_activite: contribuables?.secteur_activite || null,
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

  // Mettre à jour
  static async update(id, data) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) return null;

    const updateData = {};
    const allowedFields = ['ca', 'benefice', 'tva_collectee', 'tva_deductible', 'tva_payee', 'tva_theorique', 'statut'];
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    }
    updateData.date_modification = new Date();

    try {
      return await prisma.declarations.update({
        where: { id_declaration: numericId },
        data: updateData,
      });
    } catch (err) {
      if (err.code === 'P2025') return null;
      throw err;
    }
  }

  // Statistiques
  static async getStats() {
    const [total, conformes, alertes, critiques, aggregations] = await Promise.all([
      prisma.declarations.count(),
      prisma.declarations.count({ where: { statut: 'conforme' } }),
      prisma.declarations.count({ where: { statut: 'alerte' } }),
      prisma.declarations.count({ where: { statut: 'critique' } }),
      prisma.declarations.aggregate({
        _avg: { ca: true },
        _sum: { tva_payee: true, tva_theorique: true },
      }),
    ]);

    const caMoyen = aggregations._avg.ca ? Number(aggregations._avg.ca) : 0;
    const tvaTotale = aggregations._sum.tva_payee ? Number(aggregations._sum.tva_payee) : 0;
    const tvaTheoriqueTotale = aggregations._sum.tva_theorique ? Number(aggregations._sum.tva_theorique) : 0;
    const ecartTotal = tvaTheoriqueTotale - tvaTotale;

    return {
      total: String(total),
      conformes: String(conformes),
      alertes: String(alertes),
      critiques: String(critiques),
      ca_moyen: String(caMoyen),
      tva_totale: String(tvaTotale),
      tva_theorique_totale: String(tvaTheoriqueTotale),
      ecart_total: String(ecartTotal),
    };
  }
}

module.exports = DeclarationModel;