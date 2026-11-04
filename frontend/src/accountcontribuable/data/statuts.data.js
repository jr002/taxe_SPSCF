/**
 * Légende unique des libellés et statuts du portail contribuable.
 *
 * Les clés sont celles renvoyées par l'API (`declarations.statut`,
 * `rapprochements.statut`, `droits_communication.statut`, `relances.statut`,
 * `recoupements.source`…). Chaque entrée porte trois champs :
 *
 * - `label` : le mot affiché dans le tableau ;
 * - `badge` : la classe CSS du pastillage (`.badge.conforme`, `.primitive`…) ;
 * - `sens` : la phrase qui explique ce que le statut veut dire pour le
 *   contribuable. Elle sert à la fois à la page d'aide (glossaire) et à la
 *   légende de la section « Rapprochement et confrontation », donc les deux
 *   lectures ne peuvent plus se contredire.
 */

export const STATUT_DECLARATION = {
  conforme: {
    label: 'Conforme',
    badge: 'conforme',
    sens: 'Votre paiement couvre la TVA attendue sur cette période.',
  },
  alerte: {
    label: 'À surveiller',
    badge: 'surveillance',
    sens: 'La DGI note un point à surveiller, sans décision de redressement.',
  },
  critique: {
    label: 'Point critique',
    badge: 'critique',
    sens: 'Un écart important est enregistré : préparez vos justificatifs.',
  },
  non_conforme: {
    label: 'Écart constaté',
    badge: 'surveillance',
    sens: 'La TVA payée est inférieure à la TVA théorique sur cette période.',
  },
  primitive_envoyée: {
    label: 'Notification primitive',
    badge: 'primitive',
    sens: 'Proposition de rectification : vous disposez d’un délai pour répondre et produire vos pièces.',
  },
  primitive_envoyee: {
    label: 'Notification primitive',
    badge: 'primitive',
    sens: 'Proposition de rectification : vous disposez d’un délai pour répondre et produire vos pièces.',
  },
  définitive_envoyée: {
    label: 'Notification définitive',
    badge: 'definitive',
    sens: 'La procédure contradictoire est close : le montant indiqué devient exigible.',
  },
  definitive_envoyee: {
    label: 'Notification définitive',
    badge: 'definitive',
    sens: 'La procédure contradictoire est close : le montant indiqué devient exigible.',
  },
};

export const STATUT_RAPPROCHEMENT = {
  rapproche: {
    label: 'Rapproché',
    badge: 'conforme',
    sens: 'Le montant déclaré et le montant recoupé concordent.',
  },
  valide: {
    label: 'Validé',
    badge: 'conforme',
    sens: 'Le contrôle a été validé : rien à vous demander sur cette ligne.',
  },
  a_verifier: {
    label: 'À vérifier',
    badge: 'surveillance',
    sens: 'Une différence reste à expliquer. Ce n’est pas une imposition : aucune somme n’est encore due de ce fait.',
  },
  ecart: {
    label: 'Écart',
    badge: 'critique',
    sens: 'Une différence chiffrée est retenue ; elle peut devenir un redressement après la procédure contradictoire.',
  },
  rejete: {
    label: 'Rejeté',
    badge: 'critique',
    sens: 'Le rapprochement n’a pas été retenu par l’instruction.',
  },
  annule: {
    label: 'Annulé',
    badge: 'surveillance',
    sens: 'Le rapprochement a été annulé : il ne produit plus d’effet.',
  },
};

export const STATUT_DROIT = {
  demande: {
    label: 'Demande en cours',
    badge: 'surveillance',
    sens: 'La DGI a demandé des documents à un tiers ; sa réponse n’est pas encore parvenue.',
  },
  reponse: {
    label: 'Réponse reçue',
    badge: 'conforme',
    sens: 'Le tiers a répondu à la demande de documents.',
  },
  partiel: {
    label: 'Réponse partielle',
    badge: 'surveillance',
    sens: 'Le tiers n’a transmis qu’une partie des documents demandés.',
  },
  relance: {
    label: 'Relance émise',
    badge: 'critique',
    sens: 'Une relance a été adressée au tiers faute de réponse complète.',
  },
  sans_suite: {
    label: 'Sans suite',
    badge: 'critique',
    sens: 'La demande est restée sans réponse et a été close.',
  },
};

/** Relances : mêmes clés que la contrainte `relances_type_relance_check` de la base. */
export const TYPE_RELANCE = {
  rappel1: { label: 'Premier rappel', sens: 'Invitation à payer dans un délai de 8 jours francs.' },
  rappel2: { label: 'Deuxième rappel', sens: 'Seconde invitation à payer, même délai de 8 jours francs.' },
  mise_en_demeure: { label: 'Mise en demeure', sens: 'Acte formel de recouvrement : délai de 5 jours francs, puis poursuites.' },
  demande_eclaircissement: { label: "Demande d'éclaircissements", sens: 'Premier acte contradictoire : la DGI vous demande des explications et des pièces, pas un paiement.' },
};

export const STATUT_RELANCE = {
  emise: { label: 'En cours', sens: 'La relance n’est pas encore régularisée.' },
  regularisee: { label: 'Régularisée', sens: 'Le paiement ou la justification a clos la relance.' },
  annulee: { label: 'Annulée', sens: 'La relance a été retirée.' },
};

export const TYPE_RAPPROCHEMENT = {
  exact: { label: 'Exact', sens: 'Les deux montants sont identiques au franc près.' },
  tolerance: { label: 'Tolérance', sens: 'Une petite différence est admise par la règle de rapprochement.' },
  partiel: { label: 'Partiel', sens: 'Une partie seulement des montants correspond.' },
  manuel: { label: 'Manuel', sens: 'Le rapprochement a été fait à la main par l’agent instructeur.' },
};

export const SOURCE_RECOUPEMENT = {
  tiers_declarant: 'Tiers déclarant',
  banque: 'Banque',
  fournisseur: 'Fournisseur',
  client: 'Client',
  administration: 'Administration',
  assurance: 'Assurance',
  notaire: 'Notaire',
  autre: 'Autre',
};

export const OPERATION_RECOUPEMENT = {
  vente: 'Vente',
  achat: 'Achat',
  service: 'Service',
  autre: 'Autre',
};

export const TYPE_TIER = {
  banque: 'Banque',
  assurance: 'Assurance',
  administration: 'Administration',
  notaire: 'Notaire',
  fournisseur: 'Fournisseur',
  client: 'Client',
  autre: 'Autre',
};

/**
 * Traduction d'une valeur technique lue dans la base : remplace les tirets bas
 * par des espaces plutôt que d'afficher le code brut.
 */
export const libelleBrut = (value) => String(value || '—').replaceAll('_', ' ');

const entree = (referentiel, value) =>
  referentiel[String(value ?? '').toLocaleLowerCase('fr')]
  || { label: libelleBrut(value), badge: '', sens: '' };

export const statutDeclaration = (value) => entree(STATUT_DECLARATION, value);
export const statutRapprochement = (value) => entree(STATUT_RAPPROCHEMENT, value);
export const statutDroit = (value) => entree(STATUT_DROIT, value);
export const typeRapprochement = (value) => entree(TYPE_RAPPROCHEMENT, value);
export const typeRelance = (value) => entree(TYPE_RELANCE, value);
export const statutRelance = (value) => entree(STATUT_RELANCE, value);
