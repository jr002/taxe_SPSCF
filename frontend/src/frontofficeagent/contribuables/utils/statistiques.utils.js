import { formatAriary, formatNumber } from '../../../utils/formatters';

// VSP / CSP n'est pas stocké en base : une procédure est tenue pour « vérification sur
// place » dès que la déclaration a été notifiée ou qu'un redressement a été notifié.
export const isVSP = (declaration) =>
  Boolean(declaration?.date_notification_primitive || declaration?.date_notification_definitive) ||
  Number(declaration?.montant_redressement || 0) > 0;

export const getProcedure = (declaration) => (isVSP(declaration) ? 'VSP' : 'CSP');

export const PROCEDURES = [
  { key: 'VSP', label: 'VSP · vérification sur place', short: 'VSP', couleur: '#1769aa' },
  { key: 'CSP', label: 'CSP · contrôle sur pièces', short: 'CSP', couleur: '#f59e0b' },
];

// « nature d'impôt » de la fiche : IS et IR forment leur propre catégorie, tout le
// reste (RNS, RS, non renseigné) est suivi comme déclarations TVA.
export const CATEGORIES = ['IS', 'IR', 'TVA'];

export function getCategorieImpot(contribuable) {
  const nature = String(contribuable?.regime_fiscal || '').trim().toUpperCase();
  return CATEGORIES.includes(nature) ? nature : 'TVA';
}

const PALETTE = {
  'IS-VSP': '#1769aa',
  'IS-CSP': '#8cb8e0',
  'IR-VSP': '#138b79',
  'IR-CSP': '#7fc9bb',
  'TVA-VSP': '#d86b5e',
  'TVA-CSP': '#f0a99f',
};

export const COULEUR_VENTILATION = PALETTE;

export function buildStatistiques(contribuables = []) {
  const lignes = [];

  contribuables.forEach((contribuable) => {
    const categorie = getCategorieImpot(contribuable);
    (contribuable.declarations || []).forEach((declaration) => {
      lignes.push({
        id_contribuable: contribuable.id_contribuable,
        annee: Number(declaration.annee) || 0,
        categorie,
        procedure: getProcedure(declaration),
        redressement: Number(declaration.montant_redressement || 0),
      });
    });
  });

  const somme = (filter) => lignes.filter(filter).reduce((acc, l) => acc + l.redressement, 0);
  const compte = (filter) => lignes.filter(filter).length;

  const parProcedure = PROCEDURES.map((p) => ({
    id: p.key,
    label: p.label,
    short: p.short,
    couleur: p.couleur,
    valeur: somme((l) => l.procedure === p.key),
    dossiers: compte((l) => l.procedure === p.key),
  }));

  const annees = [...new Set(lignes.map((l) => l.annee).filter(Boolean))].sort();
  const parAnnee = annees.map((annee) => ({
    label: String(annee),
    VSP: compte((l) => l.annee === annee && l.procedure === 'VSP'),
    CSP: compte((l) => l.annee === annee && l.procedure === 'CSP'),
  }));

  const ventilation = [];
  CATEGORIES.forEach((categorie) => {
    PROCEDURES.forEach((p) => {
      ventilation.push({
        id: `${categorie}-${p.key}`,
        label: `${categorie} · ${p.short}`,
        categorie,
        procedure: p.key,
        couleur: PALETTE[`${categorie}-${p.key}`],
        valeur: somme((l) => l.categorie === categorie && l.procedure === p.key),
        dossiers: compte((l) => l.categorie === categorie && l.procedure === p.key),
      });
    });
  });

  const parCategorie = CATEGORIES.map((categorie) => ({
    label: categorie,
    VSP: compte((l) => l.categorie === categorie && l.procedure === 'VSP'),
    CSP: compte((l) => l.categorie === categorie && l.procedure === 'CSP'),
  }));

  return {
    totalDossiers: lignes.length,
    totalContribuables: contribuables.length,
    totalRedresse: somme(() => true),
    dossiersRedresses: compte((l) => l.redressement > 0),
    parProcedure,
    parAnnee,
    ventilation,
    parCategorie,
  };
}

export const formatMontant = formatAriary;
export const formatDossiers = (valeur) => `${formatNumber(valeur)} dossier(s)`;
