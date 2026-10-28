const prisma = require('../config/prisma');
const { applyScope } = require('../utils/data-scope');
const {
  TYPE_CENTRE_PAR_CLE_UNITE,
  centreFiscalRefFromCentre,
  splitCentreFiscalRef,
} = require('../utils/unite-fiscale.utils');

/**
 * `id_centre` (table `centres`, portée par le périmètre des agents) et
 * `centre_fiscal_ref` (référentiel `unitefiscal.json`, format `cle:nom`)
 * décrivent le même rattachement fiscal. La colonne présente dans l'écriture
 * détermine l'autre : `id_centre` d'abord, car `forceCentreOnWrite` l'impose
 * pour un agent centré ; à défaut la référence textuelle, dont on retrouve le
 * centre quand il existe en base. Un centre sans équivalent dans le
 * référentiel (ex. `SSIF`) donne une référence nulle plutôt qu'une valeur
 * rejetée par `isValidCentreFiscalRef`.
 */
const alignerRattachementFiscal = async (values) => {
  if ('id_centre' in values) {
    const centre = values.id_centre
      ? await prisma.centres.findUnique({
          where: { id_centre: Number(values.id_centre) },
          select: { type_centre: true, nom_centre: true },
        })
      : null;
    values.centre_fiscal_ref = centreFiscalRefFromCentre(centre);
    return;
  }

  if (!('centre_fiscal_ref' in values)) return;

  const parties = splitCentreFiscalRef(values.centre_fiscal_ref);
  const type_centre = TYPE_CENTRE_PAR_CLE_UNITE[parties?.type];
  if (!parties || !type_centre) return;

  const centre = await prisma.centres.findFirst({
    where: { type_centre, nom_centre: parties.nom },
    select: { id_centre: true },
  });
  if (centre) values.id_centre = centre.id_centre;
};

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
    } = data;

    const rattachement = {};
    if (data.id_centre !== undefined) {
      rattachement.id_centre = data.id_centre ? Number(data.id_centre) : null;
    }
    if (data.centre_fiscal_ref !== undefined) {
      rattachement.centre_fiscal_ref = data.centre_fiscal_ref || null;
    }
    await alignerRattachementFiscal(rattachement);

    return await prisma.contribuables.create({
      data: {
        nif,
        raison_sociale,
        secteur_activite,
        adresse: adresse || null,
        telephone: telephone || null,
        email: email || null,
        regime_fiscal: regime_fiscal || null,
        id_centre: rattachement.id_centre ?? null,
        centre_fiscal_ref: rattachement.centre_fiscal_ref ?? null,
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
  static async findAll({ page = 1, limit = 20, search = '', centre_fiscal_ref, scope } = {}) {
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
    // Périmètre de l'agent : un rôle centré ne voit que les dossiers de son centre.
    applyScope(where, scope);

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
    await alignerRattachementFiscal(updateData);
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