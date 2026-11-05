import { formatAriary, formatPeriode, toNumber } from '@/utils';

/**
 * Construction de la file de travail : regroupe en actes à poser ce que les
 * déclarations, les rapprochements et les relances portent déjà.
 *
 * Aucune règle fiscale nouvelle n'est inventée ici : les délais sont ceux déjà
 * enregistrés (date limite de réponse) ou ceux des actes de relance, et les
 * montants sont ceux des pièces existantes.
 */

const JOUR_MS = 24 * 60 * 60 * 1000;

/** Délai de réponse attaché à chaque acte de relance, en jours francs. */
const DELAIS_RELANCE = {
  rappel1: 8,
  rappel2: 8,
  mise_en_demeure: 5,
  demande_eclaircissement: 30,
};

const LIBELLES_RELANCE = {
  rappel1: '1er rappel à l’ordre',
  rappel2: '2ème rappel à l’ordre',
  mise_en_demeure: 'Mise en demeure',
  demande_eclaircissement: 'Demande d’éclaircissements',
};

export const PRIORITES = {
  1: { label: 'En retard', className: 'file-priorite-retard' },
  2: { label: 'Cette semaine', className: 'file-priorite-semaine' },
  3: { label: 'À suivre', className: 'file-priorite-suivre' },
};

export const CATEGORIES = {
  procedure: 'Procédure',
  ecart: 'Écart',
  relance: 'Relance',
};

/**
 * Jours calendaires entre une date et aujourd'hui (négatif : dépassée, 0 :
 * aujourd'hui). Les délais légaux se comptent en jours, pas en heures : une
 * échéance de la journée reste « aujourd'hui » même si l'heure est passée.
 */
const debutDeJour = (valeur) => {
  const date = new Date(valeur);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
};

const joursRestants = (date) => Math.round((debutDeJour(date) - debutDeJour(new Date())) / JOUR_MS);

const dateLisible = (valeur) => (valeur ? new Date(valeur).toLocaleDateString('fr-FR') : '—');

const contribuableDeDeclaration = (declaration) => ({
  id: declaration.id_contribuable,
  nom: declaration.raison_sociale || 'Contribuable',
  nif: declaration.nif || '',
});

const periodeDeDeclaration = (declaration) =>
  declaration.periode
    ? formatPeriode(declaration.periode)
    : declaration.annee
      ? `Exercice ${declaration.annee}`
      : 'Période non renseignée';

/** Une primitive est au dossier dès qu'une date ou le statut l'enregistre. */
const primitiveOuverte = (declaration) =>
  Boolean(declaration?.date_notification_primitive)
  || String(declaration?.statut || '').toUpperCase() === 'PRIMITIVE_ENVOYÉE';

/** La définitive close la phase de notification : il ne reste plus d'acte à proposer. */
const definitiveEmise = (declaration) =>
  Boolean(declaration?.date_notification_definitive)
  || String(declaration?.statut || '').toUpperCase() === 'DÉFINITIVE_ENVOYÉE';

/**
 * @param {object} sources
 * @param {Array} sources.declarations
 * @param {Array} sources.rapprochements  rapprochements `a_verifier` et `ecart`
 * @param {Array} sources.relances        relances au statut `emise`
 * @returns {Array} actes triés par urgence
 */
export const construireFile = ({ declarations = [], rapprochements = [], relances = [] } = {}) => {
  const actes = [];
  const declarationsCouvertes = new Set();
  // Une relance porte `id_declaration` : c'est le seul moyen de savoir si l'acte
  // qu'elle appelle a déjà été enregistré au dossier.
  const declarationsParId = new Map(declarations.map((d) => [d.id_declaration, d]));

  // 1. Procédure contradictoire : une primitive ouverte attend sa suite.
  declarations.forEach((declaration) => {
    if (!primitiveOuverte(declaration) || definitiveEmise(declaration)) return;

    declarationsCouvertes.add(declaration.id_declaration);
    const limite = declaration.date_limite_reponse ? new Date(declaration.date_limite_reponse) : null;
    const reste = limite ? joursRestants(limite) : null;
    if (reste !== null && reste > 7) return;

    actes.push({
      id: `procedure-${declaration.id_declaration}`,
      categorie: 'procedure',
      priorite: reste !== null && reste < 0 ? 1 : 2,
      echeance: limite,
      acte: 'Émettre la notification définitive',
      motif: limite
        ? `Primitive du ${dateLisible(declaration.date_notification_primitive)} · réponse ${reste < 0 ? 'échue le' : 'attendue avant le'} ${dateLisible(limite)}`
        : 'Notification primitive émise sans échéance enregistrée',
      contribuable: contribuableDeDeclaration(declaration),
      montant: toNumber(declaration.montant_net_a_payer),
      to: `/suivi/${declaration.id_declaration}`,
      action: 'Ouvrir le dossier',
    });
  });

  // 2. Actes de relance encore ouverts.
  relances.forEach((relance) => {
    if (relance.statut !== 'emise') return;

    const delai = DELAIS_RELANCE[relance.type_relance] ?? 30;
    const echeance = new Date(new Date(relance.date_emission).getTime() + delai * JOUR_MS);
    const reste = joursRestants(echeance);
    const contribuable = {
      id: relance.id_contribuable,
      nom: relance.contribuables?.raison_sociale || 'Contribuable',
      nif: relance.contribuables?.nif || '',
    };
    const libelle = LIBELLES_RELANCE[relance.type_relance] || 'Relance';

    if (relance.type_relance === 'demande_eclaircissement') {
      // Tant que le délai de réponse court, il n'y a pas d'acte à poser.
      if (reste > 7) return;

      // L'éclaircissement appelle la primitive. Si le dossier en porte déjà une,
      // l'acte a été posé : c'est le bloc 1 qui propose la définitive, avec sa
      // propre échéance. Le proposer une seconde fois contredirait le dossier.
      const declaration = declarationsParId.get(relance.id_declaration);
      if (declaration && (definitiveEmise(declaration) || primitiveOuverte(declaration))) return;

      actes.push({
        id: `eclaircissement-${relance.id_relance}`,
        categorie: 'procedure',
        priorite: reste < 0 ? 1 : 2,
        echeance,
        acte: 'Émettre la notification primitive',
        motif: `${libelle} du ${dateLisible(relance.date_emission)} · délai de 30 jours ${reste < 0 ? 'échu' : `expire le ${dateLisible(echeance)}`}`,
        contribuable,
        montant: toNumber(relance.montant_du),
        to: relance.id_declaration
          ? `/suivi/${relance.id_declaration}`
          : `/contribuables/${relance.id_contribuable}/relances`,
        action: 'Ouvrir le dossier',
      });
      return;
    }

    actes.push({
      id: `relance-${relance.id_relance}`,
      categorie: 'relance',
      priorite: reste < 0 ? 1 : 3,
      echeance,
      acte: 'Relancer ou constater le silence',
      motif: `${libelle} du ${dateLisible(relance.date_emission)} · ${reste < 0 ? 'sans réponse' : `réponse attendue le ${dateLisible(echeance)}`}`,
      contribuable,
      montant: toNumber(relance.montant_du),
      to: `/contribuables/${relance.id_contribuable}/relances`,
      action: 'Voir les relances',
    });
  });

  // 3. Écarts de rapprochement encore ouverts : un acte par dossier. La
  //    confrontation se mène contribuable par contribuable — quarante écarts
  //    d'un même dossier forment une visite, pas quarante lignes de file.
  const dossiersOuverts = new Map();
  rapprochements.forEach((rapprochement) => {
    const declaration = rapprochement.declarations || {};
    const rattachement = declaration.contribuables;
    if (!rattachement?.id_contribuable) return;
    if (rapprochement.id_declaration) declarationsCouvertes.add(rapprochement.id_declaration);

    const cle = rattachement.id_contribuable;
    const dossier = dossiersOuverts.get(cle) || {
      contribuable: {
        id: cle,
        nom: rattachement.raison_sociale || 'Contribuable',
        nif: rattachement.nif || '',
      },
      ecarts: 0,
      aVerifier: 0,
      periodes: [],
      cumul: 0,
    };
    if (rapprochement.statut === 'ecart') dossier.ecarts += 1;
    else dossier.aVerifier += 1;
    dossier.periodes.push(periodeDeDeclaration(declaration));
    dossier.cumul += toNumber(rapprochement.ecart);
    dossiersOuverts.set(cle, dossier);
  });

  dossiersOuverts.forEach((dossier, cle) => {
    const { ecarts, aVerifier, periodes, cumul } = dossier;
    const horsPremieres = Math.max(0, periodes.length - 3);
    const libellePeriodes = `${periodes.slice(0, 3).join(', ')}${
      horsPremieres ? ` + ${horsPremieres} autre(s)` : ''
    }`;

    actes.push({
      id: `rapprochement-${cle}`,
      categorie: 'ecart',
      priorite: ecarts > 0 ? 2 : 3,
      echeance: null,
      acte: ecarts > 0 ? 'Traiter les écarts confirmés' : 'Vérifier les rapprochements',
      motif: `${periodes.length} ligne(s) ouverte(s) · ${ecarts} écart(s) confirmé(s), ${aVerifier} à vérifier · ${libellePeriodes} · cumul déclaré − recoupé`,
      contribuable: dossier.contribuable,
      montant: cumul,
      to: `/contribuables/${cle}/confrontation`,
      action: 'Confronter',
    });
  });

  // 4. Écarts de TVA sans procédure ni rapprochement : il reste à les examiner.
  declarations.forEach((declaration) => {
    if (declarationsCouvertes.has(declaration.id_declaration)) return;
    if (String(declaration.statut || '').toUpperCase() !== 'CRITIQUE') return;

    const ecart = toNumber(declaration.tva_theorique) - toNumber(declaration.tva_payee);
    actes.push({
      id: `declaration-${declaration.id_declaration}`,
      categorie: 'ecart',
      priorite: 2,
      echeance: null,
      acte: 'Examiner un écart de TVA',
      motif: `${periodeDeDeclaration(declaration)} · TVA théorique − payée = ${formatAriary(ecart)}`,
      contribuable: contribuableDeDeclaration(declaration),
      montant: ecart,
      to: `/suivi/${declaration.id_declaration}`,
      action: 'Ouvrir le dossier',
    });
  });

  return trierFile(actes);
};

/** Urgence d'abord, puis l'échéance la plus proche, puis le montant le plus fort. */
export const trierFile = (actes) => {
  const echeanceDe = (acte) => (acte.echeance ? acte.echeance.getTime() : Number.MAX_SAFE_INTEGER);
  return [...actes].sort(
    (a, b) => a.priorite - b.priorite
      || echeanceDe(a) - echeanceDe(b)
      || b.montant - a.montant,
  );
};

export const compterParPriorite = (actes) =>
  actes.reduce(
    (compteurs, acte) => ({ ...compteurs, [acte.priorite]: (compteurs[acte.priorite] || 0) + 1 }),
    { 1: 0, 2: 0, 3: 0 },
  );

/** « Échéance dépassée », « Aujourd'hui », « Dans 4 j », « — ». */
export const libelleEcheance = (echeance) => {
  if (!echeance) return { texte: '—', detail: '' };
  const reste = joursRestants(echeance);
  const date = dateLisible(echeance);
  if (reste < 0) return { texte: date, detail: `dépassée de ${Math.abs(reste)} j` };
  if (reste === 0) return { texte: date, detail: "aujourd'hui" };
  return { texte: date, detail: `dans ${reste} j` };
};
