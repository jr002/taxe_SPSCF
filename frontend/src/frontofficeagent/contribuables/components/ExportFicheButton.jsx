/**
 * Bouton d'export Excel des données listées sur la fiche d'un contribuable.
 *
 * Le libellé et l'infobulle dépendent de l'onglet actif ; le bouton est
 * désactivé lorsque l'onglet courant n'a aucune ligne à exporter. Le style
 * reprend celui du bouton « Exporter Excel » de la liste des contribuables
 * (`ContribuablesFilters.jsx`).
 */
export default function ExportFicheButton({ disabled = false, label, onExport, title }) {
  return (
    <button
      type="button"
      className="export-fiche-button inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-300 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      disabled={disabled}
      onClick={onExport}
      title={title}
    >
      {label}
    </button>
  );
}
