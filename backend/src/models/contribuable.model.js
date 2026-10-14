const prisma = require('../config/prisma');

class ContribuableModel {
  // Créer un contribuable
  static async create(data) {
    const {
      nif,
      raison_sociale,
      secteur_activite,
      adresse,
      telephone,
      email,
      regime_fiscal,
      id_centre,
      centre_fiscal_ref,
    } = data;
    
    return await prisma.contribuables.create({
      data: {
        nif,
        raison_sociale,
        secteur_activite,
        adresse: adresse || null,
        telephone: telephone || null,
        email: email || null,
        regime_fiscal: regime_fiscal || null,
        id_centre: id_centre ? Number(id_centre) : null,
        centre_fiscal_ref: centre_fiscal_ref || null,
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
          orderBy: { annee: 'desc' },
        },
        centres: true,
        etat_contribuable: {
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
    const dernierEtat = contribuable.etat_contribuable?.[0] || null;

    return {
      ...contribuable,
      nb_declarations: String(nb_declarations),
      ca_moyen: ca_moyen !== null ? String(ca_moyen) : null,
      dernier_etat: dernierEtat,
      statut_activite: dernierEtat?.statut_activite || 'Actif',
      statut_conformite: dernierEtat?.statut_conformite || 'En règle',
    };
  }

  // Liste des contribuables avec pagination et recherche
  static async findAll({ page = 1, limit = 20, search = '', centre_fiscal_ref } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 20);
    const offset = (pageNum - 1) * limitNum;

    const where = search
      ? {
          OR: [
            { nif: { contains: search, mode: 'insensitive' } },
            { raison_sociale: { contains: search, mode: 'insensitive' } },
            { secteur_activite: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};
    if (centre_fiscal_ref) where.centre_fiscal_ref = centre_fiscal_ref;

    const [total, rows] = await Promise.all([
      prisma.contribuables.count({ where }),
      prisma.contribuables.findMany({
        where,
        skip: offset,
        take: limitNum,
        orderBy: { date_creation: 'desc' },
        include: {
          declarations: {
            orderBy: { annee: 'desc' },
          },
          _count: {
            select: { declarations: true },
          },
          centres: true,
          etat_contribuable: {
            orderBy: { date_modification: 'desc' },
            take: 1,
          },
        },
      }),
    ]);

    const data = rows.map((row) => {
      const { _count, etat_contribuable, ...rest } = row;
      const dernierEtat = etat_contribuable?.[0] || null;
      return {
        ...rest,
        nb_declarations: String(_count?.declarations || 0),
        dernier_etat: dernierEtat,
        statut_activite: dernierEtat?.statut_activite || 'Actif',
        statut_conformite: dernierEtat?.statut_conformite || 'En règle',
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
    const allowedFields = [
      'raison_sociale',
      'secteur_activite',
      'adresse',
      'telephone',
      'email',
      'regime_fiscal',
      'id_centre',
      'centre_fiscal_ref',
    ];
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updateData[field] = field === 'id_centre'
          ? (data[field] ? Number(data[field]) : null)
          : field === 'centre_fiscal_ref'
            ? (data[field] || null)
            : data[field];
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