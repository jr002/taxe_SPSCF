/**
 * Vocabulaire partagé des relances fiscales entre la fiche contribuable, la page
 * Relance Fiscale et la lettre imprimable. Les clés `type_relance` et `statut`
 * sont celles acceptées par la base (`relances_type_relance_check` et
 * `relances_statut_check`) : inutile de les traduire une seconde fois côté API.
 */
export const RELANCE_TYPES = {
  rappel1: { label: '1er Rappel à l’Ordre', titre: "1ER RAPPEL À L'ORDRE", delai: '8 (huit) jours francs', ref: 'R1', couleur: '#f2b84b', severity: 'sev-faible' },
  rappel2: { label: '2ème Rappel à l’Ordre', titre: "2ÈME RAPPEL À L'ORDRE", delai: '8 (huit) jours francs', ref: 'R2', couleur: '#e07b00', severity: 'sev-moyen' },
  mise_en_demeure: { label: 'Mise en Demeure de Payer', titre: 'MISE EN DEMEURE DE PAYER', delai: '5 (cinq) jours francs', ref: 'MD', couleur: '#b42318', severity: 'sev-critique' },
  demande_eclaircissement: { label: "Demande d'Éclaircissements", titre: "DEMANDE D'ÉCLAIRCISSEMENTS", delai: '30 (trente) jours', ref: 'DE', couleur: '#0f766e', severity: 'sev-faible' },
};

export const RELANCE_STATUTS = {
  emise: { label: 'Émise', cls: 'relance-statut-emis' },
  regularisee: { label: 'Régularisée', cls: 'relance-statut-conforme' },
  annulee: { label: 'Annulée', cls: 'relance-statut-emis' },
};

export const relanceType = (type) => RELANCE_TYPES[type] || { label: type, severity: 'sev-ok', couleur: '#657083', ref: 'RL', delai: '—', titre: type };
export const relanceStatut = (statut) => RELANCE_STATUTS[statut] || { label: statut, cls: 'relance-statut-emis' };

/** Date ISO ou objet Date → « 21/10/2026 » ; `null` si la date est illisible. */
export const formatDateRelance = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('fr-FR');
};
