/**
 * Export Excel des données listées sur la fiche d'un contribuable.
 *
 * Chaque onglet de la fiche possède son propre jeu de colonnes : l'onglet actif
 * est transmis par `ContribuableDetail.jsx`. Le classeur généré contient deux
 * feuilles : une fiche d'identification du contribuable, puis les données de
 * l'onglet courant.
 *
 * Le formatage des montants reprend la convention de la liste des contribuables
 * (`Contribuables.jsx`) : valeurs numériques et format Excel `#,##0 "Ar"`.
 */
import * as XLSX from 'xlsx';

import { SEUIL_GRAND, SEUIL_MOYEN } from '@/frontofficeagent/contribuables/utils/classificationCgi.utils.js';
import { toNumber } from '@/utils';
import { formatDateRelance, relanceStatut, relanceType } from '@/frontofficeagent/relance/utils/relance.utils';

const AMOUNT_FORMAT = '#,##0 "Ar"';

/** Nom de feuille et suffixe de fichier pour chaque onglet de la fiche. */
const TAB_SHEETS = {
  overview: { sheet: 'Synthèse', file: 'synthese' },
  classification: { sheet: 'Nature d’impôt', file: 'nature-impot' },
  declarations: { sheet: 'Déclarations', file: 'declarations' },
  relances: { sheet: 'Relances', file: 'relances' },
};

/** Catégorie d'une déclaration, d'après son chiffre d'affaires. */
function getCategorieDeclaration(ca) {
  const amount = toNumber(ca);

  if (amount >= SEUIL_GRAND) return 'Grand';
  if (amount >= SEUIL_MOYEN) return 'Moyen';

  return 'Petit';
}

/** Feuille « Identification » transposée : une colonne par rubrique. */
function buildIdentificationRows(contribuable, fiche, declarations) {
  const totalPaid = declarations.reduce(
    (total, declaration) => total + toNumber(declaration.tva_payee),
    0,
  );

  return [{
    'Raison sociale': contribuable.raison_sociale || '',
    NIF: contribuable.nif || '',
    "Secteur d'activité": contribuable.secteur_activite || '',
    Adresse: contribuable.adresse || '',
    Téléphone: contribuable.telephone || '',
    'E-mail': contribuable.email || '',
    'Centre gestionnaire': contribuable.centres?.nom_centre || 'Non rattaché',
    'Nature d’impôt': contribuable.regime_fiscal || '',
    Catégorie: fiche?.label || '',
    'Années suivies': declarations.length,
    'TVA payée cumulée (Ar)': totalPaid,
    'Export généré le': new Date().toLocaleDateString('fr-FR'),
  }];
}

/** Onglet Synthèse : reprise annuelle des montants suivis. */
function buildOverviewRows(annualData, declarations) {
  return annualData.map((item) => {
    const yearDeclarations = declarations.filter(
      (declaration) => Number(declaration.annee) === Number(item.year),
    );
    const paid = yearDeclarations.reduce(
      (total, declaration) => total + toNumber(declaration.tva_payee),
      0,
    );
    const theoretical = yearDeclarations.reduce(
      (total, declaration) => total + toNumber(declaration.tva_theorique),
      0,
    );

    return {
      Année: item.year,
      'Déclarations déposées': item.tva,
      'TVA payée (Ar)': paid,
      'TVA théorique (Ar)': theoretical,
      'Écart (Ar)': Math.max(0, theoretical - paid),
    };
  });
}

/** Onglet Déclarations : mêmes colonnes que le tableau affiché. */
function buildDeclarationRows(declarations) {
  return declarations.map((declaration) => ({
    Année: Number(declaration.annee) || '',
    "Chiffre d'affaires (Ar)": toNumber(declaration.ca),
    Catégorie: getCategorieDeclaration(declaration.ca),
    'TVA collectée (Ar)': toNumber(declaration.tva_collectee),
    'TVA déductible (Ar)': toNumber(declaration.tva_deductible),
    'TVA payée (Ar)': toNumber(declaration.tva_payee),
    'TVA théorique (Ar)': toNumber(declaration.tva_theorique),
    Statut: declaration.statut || 'Conforme',
  }));
}

/** Onglet Nature d’impôt : fiche réglementaire de la catégorie. */
function buildClassificationRows(fiche) {
  if (!fiche) return [];

  return [
    { Rubrique: 'Catégorie', Valeur: fiche.label },
    { Rubrique: 'Seuil', Valeur: fiche.seuil },
    { Rubrique: 'Nature d’impôt & comptable', Valeur: fiche.regime },
    {
      Rubrique: 'Pénalités de retard de paiement',
      Valeur: (fiche.penaliteRetard || []).join(' ; '),
    },
    {
      Rubrique: 'Amendes administratives',
      Valeur: (fiche.amendes || [])
        .map(
          (amende) =>
            `${amende.motif} : ${toNumber(amende.montant)} Ar${
              amende.unite ? ` (${amende.unite})` : ''
            }`,
        )
        .join(' ; '),
    },
    { Rubrique: 'Référence légale', Valeur: fiche.refArticle },
  ];
}

/** Onglet Relances : relances enregistrées en base pour ce contribuable. */
function buildRelanceRows(relances) {
  return relances.map((relance) => ({
    Date: formatDateRelance(relance.date_emission),
    Type: relanceType(relance.type_relance).label,
    'Montant (Ar)': toNumber(relance.montant_du),
    Statut: relanceStatut(relance.statut).label,
  }));
}

/** Construit les lignes de l'onglet demandé. */
function buildRows(activeTab, data) {
  switch (activeTab) {
    case 'declarations':
      return buildDeclarationRows(data.declarations);
    case 'relances':
      return buildRelanceRows(data.relances);
    case 'classification':
      return buildClassificationRows(data.fiche);
    default:
      return buildOverviewRows(data.annualData, data.declarations);
  }
}

/** Normalise les propriétés reçues du composant de page. */
function toData({ annualData = [], declarations = [], fiche, relances = [] }) {
  return {
    annualData,
    declarations,
    fiche,
    relances,
  };
}

/** Crée une feuille et applique largeurs de colonnes et format monétaire. */
function buildSheet(rows) {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const headers = Object.keys(rows[0] || {});

  worksheet['!cols'] = headers.map((header) => ({
    wch: Math.min(Math.max(header.length + 6, 14), 60),
  }));

  headers.forEach((header, index) => {
    if (!header.includes('(Ar)')) return;

    const column = XLSX.utils.encode_col(index);
    for (let row = 2; row <= rows.length + 1; row += 1) {
      const cell = worksheet[`${column}${row}`];
      if (cell) cell.z = AMOUNT_FORMAT;
    }
  });

  return worksheet;
}

/** Nombre de lignes qui seraient exportées pour l'onglet actif. */
export function countExportRows(props) {
  return buildRows(props.activeTab, toData(props)).length;
}

/**
 * Exporte les données de l'onglet actif dans un fichier `.xlsx`.
 * @returns {{ count: number, label: string }} Nombre de lignes et feuille utilisée.
 */
export function exportFicheContribuable(props) {
  const { activeTab, contribuable } = props;
  const tab = TAB_SHEETS[activeTab] || TAB_SHEETS.overview;
  const rows = buildRows(activeTab, toData(props));

  if (!contribuable || !rows.length) {
    return { count: 0, label: tab.sheet };
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    buildSheet(buildIdentificationRows(contribuable, props.fiche, props.declarations || [])),
    'Identification',
  );
  XLSX.utils.book_append_sheet(workbook, buildSheet(rows), tab.sheet);

  const nif = String(contribuable.nif || contribuable.id_contribuable || 'contribuable')
    .replace(/[^0-9A-Za-z_-]+/g, '');
  const date = new Date().toISOString().slice(0, 10);

  XLSX.writeFile(workbook, `contribuable-${nif}-${tab.file}-${date}.xlsx`);

  return { count: rows.length, label: tab.sheet };
}
