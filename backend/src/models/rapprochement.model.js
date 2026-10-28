const prisma = require('../config/prisma');
const { applyScopeViaRelations } = require('../utils/data-scope');

// Mêmes listes que `chk_rapprochements_type` et `chk_rapprochements_statut`.
const TYPES_RAPPROCHEMENT = ['exact', 'tolerance', 'partiel', 'manuel'];
const STATUTS_RAPPROCHEMENT = ['rapproche', 'a_verifier', 'ecart', 'valide', 'rejete', 'annule'];
const STATUT_RAPPROCHEMENT_PAR_DEFAUT = 'a_verifier';

/**
 * Filtre de période d'une ligne de rapprochement. Une valeur « AAAA » cible
 * tout l'exercice (déclaration annuelle comprise), « AAAA-MM » cible le mois
 * déclaré ou le mois du recoupement — y compris via sa date d'opération quand
 * la période mensuelle n'est pas renseignée.
 */
const periodeWhere = (periode) => {
  const valeur = String(periode);
  const branches = [
    { declarations: { periode: valeur } },
    { recoupements: { periode: valeur } },
  ];

  if (/^\d{4}$/.test(valeur)) {
    const debut = new Date(`${valeur}-01-01T00:00:00.000Z`);
    const fin = new Date(`${Number(valeur) + 1}-01-01T00:00:00.000Z`);
    branches.push(
      { declarations: { annee: Number(valeur) } },
      { recoupements: { periode: { startsWith: valeur } } },
      { recoupements: { date_operation: { gte: debut, lt: fin } } },
    );
  } else {
    const [annee, mois] = valeur.split('-').map(Number);
    if (annee && mois) {
      branches.push({
        recoupements: {
          date_operation: {
            gte: new Date(Date.UTC(annee, mois - 1, 1)),
            lt: new Date(Date.UTC(annee, mois, 1)),
          },
        },
      });
    }
  }

  return { OR: branches };
};

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
      statut = STATUT_RAPPROCHEMENT_PAR_DEFAUT,
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
        statut: statut || STATUT_RAPPROCHEMENT_PAR_DEFAUT,
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

  /**
   * Construit le `where` Prisma commun à la liste, aux statistiques et à
   * l'export PDF : chaque filtre relationnel est empilé dans `AND` pour
   * pouvoir combiner contribuable, période et recherche.
   */
  static buildWhere({
    statut = '',
    type_rapprochement = '',
    search = '',
    periode = '',
    id_declaration = null,
    id_recoupement = null,
    id_controle = null,
    id_contribuable = null,
  } = {}, scope) {
    const where = {};
    if (statut) where.statut = statut;
    if (type_rapprochement) where.type_rapprochement = type_rapprochement;
    if (id_declaration) where.id_declaration = parseInt(id_declaration, 10);
    if (id_recoupement) where.id_recoupement = parseInt(id_recoupement, 10);
    if (id_controle) where.id_controle = parseInt(id_controle, 10);

    // Le rapprochement n'a pas de contribuable propre : il passe par sa
    // déclaration ou son recoupement.
    const and = [];
    if (id_contribuable) {
      and.push({
        OR: [
          { declarations: { id_contribuable: parseInt(id_contribuable, 10) } },
          { recoupements: { id_contribuable: parseInt(id_contribuable, 10) } },
        ],
      });
    }
    if (periode) and.push(periodeWhere(periode));
    if (search) {
      and.push({
        OR: [
          { recoupements: { reference: { contains: search, mode: 'insensitive' } } },
          { recoupements: { nif_tiers: { contains: search, mode: 'insensitive' } } },
          { declarations: { contribuables: { nif: { contains: search, mode: 'insensitive' } } } },
          { declarations: { contribuables: { raison_sociale: { contains: search, mode: 'insensitive' } } } },
        ],
      });
    }
    if (and.length) where.AND = and;

    return applyScopeViaRelations(where, scope, [
      ['declarations', 'contribuables'],
      ['recoupements', 'contribuables'],
    ]);
  }

  // Liste paginée avec filtres
  static async findAll({
    page = 1,
    limit = 20,
    statut = '',
    type_rapprochement = '',
    search = '',
    periode = '',
    id_declaration = null,
    id_recoupement = null,
    id_controle = null,
    id_contribuable = null,
    scope,
  } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 20);
    const offset = (pageNum - 1) * limitNum;

    const where = this.buildWhere({
      statut,
      type_rapprochement,
      search,
      periode,
      id_declaration,
      id_recoupement,
      id_controle,
      id_contribuable,
    }, scope);

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

  // Toutes les lignes filtrées, sans pagination (export PDF).
  static async findAllForExport(filters = {}, scope) {
    const where = this.buildWhere(filters, scope);

    return prisma.rapprochements.findMany({
      where,
      orderBy: { date_rapprochement: 'desc' },
      include: {
        declarations: {
          select: {
            id_declaration: true,
            annee: true,
            periode: true,
            type_declaration: true,
          },
        },
        recoupements: {
          select: {
            id_recoupement: true,
            source: true,
            periode: true,
            reference: true,
            date_operation: true,
          },
        },
      },
    });
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

  /**
   * Statistiques d'un périmètre, éventuellement restreint à un contribuable et
   * à une période. Les montants excluent les rapprochements rejetés ou annulés ;
   * les compteurs de volume restent complets pour que la Synthèse distingue
   * « enregistré » de « encore actif ».
   */
  static async getStats(scope, { id_contribuable = null, periode = '' } = {}) {
    const where = this.buildWhere({ id_contribuable, periode }, scope);
    const activeWhere = { AND: [where, { statut: { notIn: ['rejete', 'annule'] } }] };

    const [
      total,
      actifs,
      groupedStatut,
      groupedType,
      aggregates,
      declarations,
      recoupements,
    ] = await Promise.all([
      prisma.rapprochements.count({ where }),
      prisma.rapprochements.count({ where: activeWhere }),
      prisma.rapprochements.groupBy({
        by: ['statut'],
        _count: { _all: true },
        where,
      }),
      prisma.rapprochements.groupBy({
        by: ['type_rapprochement'],
        _count: { _all: true },
        where,
      }),
      prisma.rapprochements.aggregate({
        where: activeWhere,
        _avg: { score: true, ecart: true },
        _sum: { ecart: true, montant_declare: true, montant_recoupe: true },
      }),
      prisma.rapprochements.findMany({
        where,
        select: { id_declaration: true },
        distinct: ['id_declaration'],
      }),
      prisma.rapprochements.findMany({
        where,
        select: { id_recoupement: true },
        distinct: ['id_recoupement'],
      }),
    ]);

    const compteStatut = (statut) => Number(
      groupedStatut.find((groupe) => groupe.statut === statut)?._count._all || 0,
    );
    const compteType = (type) => Number(
      groupedType.find((groupe) => groupe.type_rapprochement === type)?._count._all || 0,
    );

    return {
      total,
      actifs,
      declarations: declarations.filter((ligne) => ligne.id_declaration !== null).length,
      recoupements: recoupements.filter((ligne) => ligne.id_recoupement !== null).length,
      exact: compteType('exact'),
      tolerance: compteType('tolerance'),
      partiel: compteType('partiel'),
      manuel: compteType('manuel'),
      rapproche: compteStatut('rapproche'),
      a_verifier: compteStatut('a_verifier'),
      ecart: compteStatut('ecart'),
      valide: compteStatut('valide'),
      rejete: compteStatut('rejete'),
      annule: compteStatut('annule'),
      score_moyen: aggregates._avg.score ? Number(aggregates._avg.score) : 0,
      ecart_moyen: aggregates._avg.ecart ? Number(aggregates._avg.ecart) : 0,
      ecart_total: aggregates._sum.ecart ? Number(aggregates._sum.ecart) : 0,
      montant_declare_total: aggregates._sum.montant_declare ? Number(aggregates._sum.montant_declare) : 0,
      montant_recoupe_total: aggregates._sum.montant_recoupe ? Number(aggregates._sum.montant_recoupe) : 0,
      par_statut: groupedStatut.map((g) => ({ statut: g.statut, total: Number(g._count._all) })),
      par_type: groupedType.map((g) => ({ type: g.type_rapprochement, total: Number(g._count._all) })),
    };
  }
}

module.exports = {
  RapprochementModel,
  TYPES_RAPPROCHEMENT,
  STATUTS_RAPPROCHEMENT,
  STATUT_RAPPROCHEMENT_PAR_DEFAUT,
};
