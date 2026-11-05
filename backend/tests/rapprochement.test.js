/**
 * Suite de tests du moteur de rapprochement.
 *
 * Le runner est celui de Node (`node --test`) : aucune dépendance de test n'est
 * installée dans le projet et la suite reste lisible sur un poste neuf, sans
 * `.env` ni base accessible — les trois modèles traversés par `confronter` sont
 * doublés, donc rien n'atteint PostgreSQL.
 *
 * Deux invariants justifient la suite :
 * - un recoupement n'est jamais confronté à la déclaration d'un autre exercice ;
 * - `écart = montant déclaré − montant recoupé`, typé en quatre paliers
 *   (concordance, tolérance de 1 000 Ar, partiel à 5 % du CA, écart à analyser),
 *   avec des valeurs `type_rapprochement` et `statut` conformes aux contraintes
 *   `chk_rapprochements_*` de la base.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const prisma = require('../src/config/prisma');
const DeclarationModel = require('../src/models/declaration.model');
const RecoupementModel = require('../src/models/recoupement.model');
const {
  RapprochementModel,
  TYPES_RAPPROCHEMENT,
  STATUTS_RAPPROCHEMENT,
} = require('../src/models/rapprochement.model');
const RapprochementService = require('../src/services/rapprochement.service');

const VERITABLES = {
  findByIdDeclaration: DeclarationModel.findById,
  findByIdRecoupement: RecoupementModel.findById,
  findByContribuableDeclaration: DeclarationModel.findByContribuable,
  findByContribuableRecoupement: RecoupementModel.findByContribuable,
  create: RapprochementModel.create,
  findFirst: prisma.rapprochements.findFirst,
};

/**
 * Installe les doublures et rend les rapprochements tels qu'ils seraient écrits
 * en base. `t.after` les restitue, y compris si une assertion échoue.
 */
const doublerLeMoteur = (t, { declarations = [], recoupements = [], rapprochements = [] } = {}) => {
  const ecrits = [];

  DeclarationModel.findById = async (id) =>
    declarations.find((dec) => dec.id_declaration === Number(id)) ?? null;
  RecoupementModel.findById = async (id) =>
    recoupements.find((rec) => rec.id_recoupement === Number(id)) ?? null;
  DeclarationModel.findByContribuable = async () => declarations;
  RecoupementModel.findByContribuable = async () => recoupements;
  prisma.rapprochements.findFirst = async ({ where }) =>
    rapprochements.find(
      (rap) => rap.id_declaration === where.id_declaration
        && rap.id_recoupement === where.id_recoupement,
    ) ?? null;
  RapprochementModel.create = async (data) => {
    ecrits.push(data);
    return data;
  };

  t.after(() => Object.assign(
    DeclarationModel,
    {
      findById: VERITABLES.findByIdDeclaration,
      findByContribuable: VERITABLES.findByContribuableDeclaration,
    },
  ));
  t.after(() => Object.assign(
    RecoupementModel,
    {
      findById: VERITABLES.findByIdRecoupement,
      findByContribuable: VERITABLES.findByContribuableRecoupement,
    },
  ));
  t.after(() => {
    RapprochementModel.create = VERITABLES.create;
    prisma.rapprochements.findFirst = VERITABLES.findFirst;
  });

  return ecrits;
};

/** Confronter une ligne de déclaration et une ligne de recoupement. */
const confronter = async (ecrits, dec = 1, rec = 10, options = {}) => {
  assert.equal(ecrits.length, 0, 'un seul rapprochement attendu par test');
  return RapprochementService.confronter(dec, rec, options);
};

const uneDeclaration = (surcharger = {}) => ({
  id_declaration: 1,
  id_contribuable: 84,
  annee: 2025,
  periode: null,
  ca: 100000,
  ...surcharger,
});

const unRecoupement = (surcharger = {}) => ({
  id_recoupement: 10,
  id_contribuable: 84,
  periode: null,
  date_operation: null,
  somme_recoupee: null,
  montant_ttc: null,
  montant_declare: null,
  source: 'tiers_declarant',
  ...surcharger,
});

describe('Périmètre de la confrontation : jamais deux exercices différents', () => {
  it('retient la période mensuelle identique', () => {
    const dec = uneDeclaration({ periode: '2025-03' });
    const rec = unRecoupement({ periode: '2025-03' });
    assert.equal(RapprochementService.isPeriodCompatible(dec, rec, null), true);
  });

  it('écarte deux mois du même exercice', () => {
    const dec = uneDeclaration({ periode: '2025-03' });
    const rec = unRecoupement({ periode: '2025-04' });
    assert.equal(RapprochementService.isPeriodCompatible(dec, rec, null), false);
  });

  it('sans période de la part du recoupement, la date d’opération fait l’année', () => {
    const dec = uneDeclaration({ periode: '2025-03', annee: null });
    const rec = unRecoupement({ date_operation: new Date('2025-06-15T00:00:00Z') });
    assert.equal(RapprochementService.isPeriodCompatible(dec, rec, null), true);
  });

  it('écarte une date d’opération d’un autre exercice', () => {
    const dec = uneDeclaration({ periode: '2025-03' });
    const rec = unRecoupement({ date_operation: new Date('2024-12-31T00:00:00Z') });
    assert.equal(RapprochementService.isPeriodCompatible(dec, rec, null), false);
  });

  it('une période demandée en année seule couvre tout l’exercice', () => {
    const dec = uneDeclaration({ annee: 2025 });
    const rec = unRecoupement({ periode: '2025-09' });
    assert.equal(RapprochementService.isPeriodCompatible(dec, rec, '2025'), true);
  });

  it('une année demandée refuse un recoupement de l’année précédente', () => {
    const dec = uneDeclaration({ annee: 2025 });
    const rec = unRecoupement({ periode: '2024-12' });
    assert.equal(RapprochementService.isPeriodCompatible(dec, rec, '2025'), false);
  });

  it('un mois demandé se replie sur l’année de la déclaration annuelle', () => {
    const dec = uneDeclaration({ annee: 2025, periode: null });
    const rec = unRecoupement({ periode: '2025-03' });
    assert.equal(RapprochementService.isPeriodCompatible(dec, rec, '2025-03'), true);
  });

  it('un mois demandé refuse une déclaration d’un autre mois', () => {
    const dec = uneDeclaration({ annee: 2025, periode: '2025-02' });
    const rec = unRecoupement({ periode: '2025-03' });
    assert.equal(RapprochementService.isPeriodCompatible(dec, rec, '2025-03'), false);
  });

  it('écarte un recoupement sans aucune information de période', () => {
    const dec = uneDeclaration({ periode: '2025-03' });
    assert.equal(RapprochementService.isPeriodCompatible(dec, unRecoupement(), null), false);
  });

  it('écarte une déclaration sans année ni période', () => {
    const dec = uneDeclaration({ annee: null, periode: null });
    const rec = unRecoupement({ periode: '2025-03' });
    assert.equal(RapprochementService.isPeriodCompatible(dec, rec, null), false);
  });
});

describe('Typage de l’écart', () => {
  it('montant strictement égal : concordance exacte', async (t) => {
    const ecrits = doublerLeMoteur(t, {
      declarations: [uneDeclaration()],
      recoupements: [unRecoupement({ somme_recoupee: 100000 })],
    });
    const rap = await confronter(ecrits);

    assert.equal(rap.type_rapprochement, 'exact');
    assert.equal(rap.statut, 'rapproche');
    assert.equal(rap.score, 100);
    assert.equal(rap.ecart, 0);
    assert.equal(rap.motif, 'Montant déclaré strictement égal au montant recoupé');
  });

  it('écart nul même sans somme recoupée : les deux montants absents concordent', async (t) => {
    const ecrits = doublerLeMoteur(t, {
      declarations: [uneDeclaration({ ca: 0 })],
      recoupements: [unRecoupement()],
    });
    const rap = await confronter(ecrits);

    assert.equal(rap.statut, 'rapproche');
    assert.equal(rap.montant_recoupe, 0);
  });

  it('écart de 1 000 Ar : tolérance, à vérifier', async (t) => {
    const ecrits = doublerLeMoteur(t, {
      declarations: [uneDeclaration()],
      recoupements: [unRecoupement({ somme_recoupee: 99000 })],
    });
    const rap = await confronter(ecrits);

    assert.equal(rap.type_rapprochement, 'tolerance');
    assert.equal(rap.statut, 'a_verifier');
    assert.equal(rap.score, 90);
    assert.equal(rap.motif.startsWith('Écart de '), true);
  });

  it('premier Ar au-delà de la tolérance : plus une tolérance', async (t) => {
    const ecrits = doublerLeMoteur(t, {
      declarations: [uneDeclaration()],
      recoupements: [unRecoupement({ somme_recoupee: 98999.99 })],
    });
    const rap = await confronter(ecrits);

    assert.equal(rap.ecart, 1000.01);
    assert.equal(rap.type_rapprochement, 'partiel');
    assert.equal(rap.statut, 'a_verifier');
  });

  it('écart exactement à 5 % du chiffre d’affaires : rapprochement partiel', async (t) => {
    const ecrits = doublerLeMoteur(t, {
      declarations: [uneDeclaration()],
      recoupements: [unRecoupement({ somme_recoupee: 95000 })],
    });
    const rap = await confronter(ecrits);

    assert.equal(rap.type_rapprochement, 'partiel');
    assert.equal(rap.statut, 'a_verifier');
    assert.equal(rap.score, 70);
  });

  it('au-delà de 5 % : partiel avec le statut écart et un score nul', async (t) => {
    const ecrits = doublerLeMoteur(t, {
      declarations: [uneDeclaration()],
      recoupements: [unRecoupement({ somme_recoupee: 94999, source: 'banque' })],
    });
    const rap = await confronter(ecrits);

    assert.equal(rap.type_rapprochement, 'partiel');
    assert.equal(rap.statut, 'ecart');
    assert.equal(rap.score, 0);
    assert.equal(rap.motif.includes('Banque'), true, 'la source du recoupement est nommée');
  });

  it('chiffre d’affaires nul : l’écart est signalé, jamais noyé dans un pourcentage', async (t) => {
    const ecrits = doublerLeMoteur(t, {
      declarations: [uneDeclaration({ ca: 0 })],
      recoupements: [unRecoupement({ somme_recoupee: 5000 })],
    });
    const rap = await confronter(ecrits);

    assert.equal(rap.statut, 'ecart');
    assert.equal(rap.type_rapprochement, 'partiel');
  });

  it('chiffre d’affaires nul mais écart dans la tolérance : tolérance d’abord', async (t) => {
    const ecrits = doublerLeMoteur(t, {
      declarations: [uneDeclaration({ ca: 0 })],
      recoupements: [unRecoupement({ somme_recoupee: 800 })],
    });
    const rap = await confronter(ecrits);

    assert.equal(rap.type_rapprochement, 'tolerance');
  });

  it('sens de l’écart : déclaré − recoupé', async (t) => {
    const declare = doublerLeMoteur(t, {
      declarations: [uneDeclaration({ ca: 200000 })],
      recoupements: [unRecoupement({ somme_recoupee: 140000 })],
    });
    const versLeHaut = await confronter(declare);
    assert.equal(versLeHaut.ecart, 60000);
    assert.equal(
      versLeHaut.motif.includes('le montant déclaré dépasse le montant recoupé'),
      true,
    );
  });

  it('sens inverse quand le recoupement dépasse la déclaration', async (t) => {
    const ecrits = doublerLeMoteur(t, {
      declarations: [uneDeclaration({ ca: 200000 })],
      recoupements: [unRecoupement({ somme_recoupee: 260000 })],
    });
    const rap = await confronter(ecrits);

    assert.equal(rap.ecart, -60000);
    assert.equal(
      rap.motif.includes('le montant recoupé dépasse le montant déclaré'),
      true,
    );
  });

  it('l’arrondi tient à deux décimales', async (t) => {
    const ecrits = doublerLeMoteur(t, {
      declarations: [uneDeclaration({ ca: 1234.567 })],
      recoupements: [unRecoupement({ somme_recoupee: 0 })],
    });
    const rap = await confronter(ecrits);

    assert.equal(rap.ecart, 1234.57);
  });

  it('toutes les valeurs typées respectent les contraintes de la base', async (t) => {
    for (const montant_recoupe of [0, 800, 95000, 98999.99, 120000]) {
      const ecrits = doublerLeMoteur(t, {
        declarations: [uneDeclaration()],
        recoupements: [unRecoupement({ somme_recoupee: montant_recoupe })],
      });
      const rap = await RapprochementService.confronter(1, 10);

      assert.equal(TYPES_RAPPROCHEMENT.includes(rap.type_rapprochement), true);
      assert.equal(STATUTS_RAPPROCHEMENT.includes(rap.statut), true);
      assert.equal(rap.id_declaration, 1);
      assert.equal(rap.id_recoupement, 10);
      assert.equal(rap.id_controle, null);
    }
  });
});

describe('Montant recoupé de référence', () => {
  it('la somme recoupée prime sur le montant TTC', async (t) => {
    const ecrits = doublerLeMoteur(t, {
      declarations: [uneDeclaration({ ca: 60000 })],
      recoupements: [unRecoupement({ somme_recoupee: 60000, montant_ttc: 12000, montant_declare: 999 })],
    });
    const rap = await confronter(ecrits);

    assert.equal(rap.montant_recoupe, 60000);
    assert.equal(rap.statut, 'rapproche');
  });

  it('à défaut de somme recoupée, le TTC est retenu', async (t) => {
    const ecrits = doublerLeMoteur(t, {
      declarations: [uneDeclaration({ ca: 12000 })],
      recoupements: [unRecoupement({ montant_ttc: 12000, montant_declare: 999 })],
    });
    const rap = await confronter(ecrits);

    assert.equal(rap.montant_recoupe, 12000);
  });

  it('à défaut de TTC, le montant déclaré du tiers est retenu', async (t) => {
    const ecrits = doublerLeMoteur(t, {
      declarations: [uneDeclaration({ ca: 3000 })],
      recoupements: [unRecoupement({ montant_declare: 3000 })],
    });
    const rap = await confronter(ecrits);

    assert.equal(rap.montant_recoupe, 3000);
  });

  it('les montants Prisma (Decimal) sont lus comme des nombres', async (t) => {
    const ecrits = doublerLeMoteur(t, {
      declarations: [uneDeclaration({ ca: { toString: () => '100000' } })],
      recoupements: [unRecoupement({ somme_recoupee: { toString: () => '100000' } })],
    });
    const rap = await confronter(ecrits);

    assert.equal(rap.montant_declare, 100000);
    assert.equal(rap.montant_recoupe, 100000);
    assert.equal(rap.statut, 'rapproche');
  });
});

describe('Options de confrontation', () => {
  it('un montant_declare explicitement nul ne retombe pas sur le CA déclaré', async (t) => {
    const ecrits = doublerLeMoteur(t, {
      declarations: [uneDeclaration({ ca: 100000 })],
      recoupements: [unRecoupement({ somme_recoupee: 0 })],
    });
    const rap = await confronter(ecrits, 1, 10, { montant_declare: 0 });

    assert.equal(rap.montant_declare, 0);
    assert.equal(rap.ecart, 0);
    assert.equal(rap.statut, 'rapproche');
  });

  it('montant_recoupe imposé depuis l’écran de confrontation', async (t) => {
    const ecrits = doublerLeMoteur(t, {
      declarations: [uneDeclaration({ ca: 100000 })],
      recoupements: [unRecoupement({ somme_recoupee: 100000 })],
    });
    const rap = await confronter(ecrits, 1, 10, { montant_recoupe: 40000 });

    assert.equal(rap.ecart, 60000);
    assert.equal(rap.statut, 'ecart');
  });

  it('le statut et le motif saisis par l’agent priment sur le typage', async (t) => {
    const ecrits = doublerLeMoteur(t, {
      declarations: [uneDeclaration()],
      recoupements: [unRecoupement({ somme_recoupee: 100000 })],
    });
    const rap = await confronter(ecrits, 1, 10, {
      statut: 'valide',
      motif: 'Écart justifié par une note de crédit',
      id_controle: 42,
    });

    assert.equal(rap.statut, 'valide');
    assert.equal(rap.motif, 'Écart justifié par une note de crédit');
    assert.equal(rap.id_controle, 42);
    assert.equal(rap.type_rapprochement, 'exact', 'le typage reste calculé');
  });
});

describe('Rapprochement automatique d’un contribuable', () => {
  const dossier = () => ({
    declarations: [
      uneDeclaration({ id_declaration: 1, annee: 2024, periode: null, ca: 500000 }),
      uneDeclaration({ id_declaration: 2, annee: 2025, periode: '2025-03', ca: 90000 }),
    ],
    recoupements: [
      unRecoupement({ id_recoupement: 10, periode: null, date_operation: new Date('2024-07-01T00:00:00Z'), somme_recoupee: 500000 }),
      unRecoupement({ id_recoupement: 11, periode: '2025-03', somme_recoupee: 90000 }),
      unRecoupement({ id_recoupement: 12 }),
    ],
  });

  it(' rattache chaque paire compatible et signale le recoupement non daté', async (t) => {
    const lignes = dossier();
    doublerLeMoteur(t, lignes);
    const resultat = await RapprochementService.autoRapprocherContribuable(84);

    assert.equal(resultat.count, 2);
    assert.equal(resultat.created, 2);
    assert.equal(resultat.existing, 0);
    assert.equal(resultat.ignored, 1);
    assert.deepEqual(
      resultat.rapprochements.map((rap) => [rap.id_declaration, rap.id_recoupement]),
      [[1, 10], [2, 11]],
    );
  });

  it('ne recrée pas un rapprochement déjà écrit', async (t) => {
    const lignes = dossier();
    doublerLeMoteur(t, {
      ...lignes,
      rapprochements: [{ id_declaration: 2, id_recoupement: 11, ecart: 0 }],
    });
    const resultat = await RapprochementService.autoRapprocherContribuable(84);

    assert.equal(resultat.count, 2);
    assert.equal(resultat.created, 1);
    assert.equal(resultat.existing, 1);
    assert.equal(
      resultat.rapprochements.some((rap) => rap.ecart === 0 && rap.id_recoupement === 11),
      true,
      'la ligne existante est rendue telle quelle',
    );
  });

  it('ne marie pas deux mois différents du même exercice', async (t) => {
    doublerLeMoteur(t, {
      declarations: [uneDeclaration({ id_declaration: 1, annee: null, periode: '2025-03', ca: 90000 })],
      recoupements: [unRecoupement({ id_recoupement: 10, periode: '2025-04', somme_recoupee: 90000 })],
    });
    const resultat = await RapprochementService.autoRapprocherContribuable(84);

    assert.equal(resultat.count, 0);
    assert.equal(resultat.created, 0);
    assert.equal(resultat.ignored, 1);
  });

  it('une période imposée limite le rattachement', async (t) => {
    const lignes = dossier();
    doublerLeMoteur(t, lignes);
    const resultat = await RapprochementService.autoRapprocherContribuable(84, { periode: '2025-03' });

    assert.equal(resultat.count, 1);
    assert.equal(resultat.created, 1);
    assert.equal(resultat.ignored, 2);
    assert.equal(resultat.rapprochements[0].id_recoupement, 11);
  });

  it('refuse un identifiant de contribuable inutilisable', async () => {
    await assert.rejects(
      () => RapprochementService.autoRapprocherContribuable('abc'),
      /ID contribuable invalide/,
    );
  });

  it('signale une déclaration ou un recoupement introuvable', async (t) => {
    doublerLeMoteur(t, { declarations: [uneDeclaration()] });
    await assert.rejects(
      () => RapprochementService.confronter(1, 999),
      /Recoupement introuvable/,
    );

    doublerLeMoteur(t, { recoupements: [unRecoupement()] });
    await assert.rejects(
      () => RapprochementService.confronter(999, 10),
      /Déclaration introuvable/,
    );
  });
});
