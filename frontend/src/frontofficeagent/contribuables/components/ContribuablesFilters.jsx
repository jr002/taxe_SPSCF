import { Link } from 'react-router-dom';

const categories = [
  ['Tous', 'Tous'],
  ['Grand', 'Grand Contribuable'],
  ['Moyen', 'Moyen Contribuable'],
  ['Petit', 'Petit Contribuable'],
];

export default function ContribuablesFilters({ allCount, category, counts, filter, hasActiveFilters, loading, onCategoryChange, onClearFilters, onExport, onFilterChange, onImport, onRefresh, resultCount, page, pageSize }) {
  const firstResult = resultCount ? (page - 1) * pageSize + 1 : 0;
  const lastResult = resultCount ? Math.min(page * pageSize, resultCount) : 0;

  return <>
    <div className="categorie-tabs">
      {categories.map(([value, label]) => (
        <button
          key={value}
          type="button"
          className={`categorie-tab${category === value ? ' active' : ''}${value !== 'Tous' ? ` tab-${value.toLowerCase()}` : ''}`}
          onClick={() => onCategoryChange(value)}
        >
          {value === 'Tous' ? `Tous (${allCount})` : `${label}s (${counts[value] || 0})`}
        </button>
      ))}
    </div>

    <div className="datatable-toolbar contribuables-toolbar flex-wrap gap-2">
      <input value={filter} onChange={(event) => onFilterChange(event.target.value)} placeholder="Rechercher par NIF, raison sociale ou secteur..." />
      <button
        type="button"
        onClick={onClearFilters}
        disabled={!hasActiveFilters}
        title="Effacer la recherche et la catégorie sélectionnée"
      >
        ✕ Effacer les filtres
      </button>
      <span>{resultCount ? `${firstResult}-${lastResult} / ${resultCount} contribuable(s)` : '0 / 0 contribuable(s)'}</span>
      <button type="button" onClick={onRefresh} disabled={loading}>Actualiser</button>
      <button type="button" onClick={onImport} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-300 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer" title="Importer des contribuables depuis un fichier Excel ou CSV">
        📊 Importer Excel / CSV
      </button>
      <button
        type="button"
        onClick={onExport}
        disabled={loading || !resultCount}
        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-300 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        title="Exporter tous les contribuables correspondant aux filtres en fichier Excel"
      >
        📥 Exporter Excel
      </button>
      <Link className="primary add-contribuable-button" to="/entreprises/nouveau">+ Ajouter un contribuable</Link>
    </div>
  </>;
}
