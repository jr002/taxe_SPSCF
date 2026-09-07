const prisma = require('../config/prisma');

class ContribuableModel {
  // Créer un contribuable
  static async create(data) {
    const { nif, raison_sociale, secteur_activite, adresse, telephone, email, regime_fiscal } = data;
    
    return await prisma.contribuables.create({
      data: {
        nif,
        raison_sociale,
        secteur_activite,
        adresse: adresse || null,
        telephone: telephone || null,
        email: email || null,
        regime_fiscal: regime_fiscal || null,
        date_creation: new Date(),
      },
    });
  }

  // Trouver par NIF
  static async findByNif(nif) {
    return await prisma.contribuables.findUnique({
      where: { nif },
    });
  }

  // Trouver par ID avec statistiques de déclarations
  static async findById(id) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) return null;

    const contribuable = await prisma.contribuables.findUnique({
      where: { id_contribuable: numericId },
      include: {
        declarations: {
          select: {
            id_declaration: true,
            ca: true,
          },
        },
      },
    });

    if (!contribuable) return null;

    const nb_declarations = contribuable.declarations.length;
    const totalCa = contribuable.declarations.reduce(
      (sum, d) => sum + (d.ca ? Number(d.ca) : 0),
      0
    );
    const ca_moyen = nb_declarations > 0 ? (totalCa / nb_declarations).toFixed(2) : null;

    const { declarations, ...fields } = contribuable;
    return {
      ...fields,
      nb_declarations: String(nb_declarations),
      ca_moyen: ca_moyen !== null ? String(ca_moyen) : null,
    };
  }

  // Liste des contribuables avec pagination et recherche
  static async findAll({ page = 1, limit = 20, search = '' } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 20);
    const offset = (pageNum - 1) * limitNum;

    const where = search
      ? {
          OR: [
            { nif: { contains: search, mode: 'insensitive' } },
            { raison_sociale: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [total, rows] = await Promise.all([
      prisma.contribuables.count({ where }),
      prisma.contribuables.findMany({
        where,
        skip: offset,
        take: limitNum,
        orderBy: { date_creation: 'desc' },
        include: {
          _count: {
            select: { declarations: true },
          },
        },
      }),
    ]);

    const data = rows.map((row) => {
      const { _count, ...rest } = row;
      return {
        ...rest,
        nb_declarations: String(_count?.declarations || 0),
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

  // Mettre à jour un contribuable
  static async update(id, data) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) return null;

    const updateData = {};
    const allowedFields = ['raison_sociale', 'secteur_activite', 'adresse', 'telephone', 'email', 'regime_fiscal'];
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    }
    updateData.date_modification = new Date();

    try {
      return await prisma.contribuables.update({
        where: { id_contribuable: numericId },
        data: updateData,
      });
    } catch (err) {
      if (err.code === 'P2025') return null;
      throw err;
    }
  }
}

module.exports = ContribuableModel;