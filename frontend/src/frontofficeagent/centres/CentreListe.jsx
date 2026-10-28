import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import fiscalData from '../../../../unitefiscal.json';
import { getAllOperationalUnits } from '../../utils/uniteFiscale.utils';

const PAGE_SIZE = 10;
const TYPE_LABELS = {
  dge: 'DGE',
  sre: 'SRE',
  centres_fiscaux: 'Centre Fiscal',
};

const normalizeText = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLocaleLowerCase('fr');

const getRegions = (item) =>
  item.regions_couvertes?.join(', ') || item.region || 'Non renseignée';

const getTelephone = (telephone) => {
  if (!telephone) return '—';
  return Array.isArray(telephone) ? telephone.join(' / ') : telephone;
};

const getSortableValue = (centre, field) => {
  if (field === 'regions') return getRegions(centre.item);
  if (field === 'telephone') return getTelephone(centre.item.telephone);
  if (field === 'email') return centre.item.email || '';
  if (field === 'adresse') return centre.item.adresse || '';
  if (field === 'dri') return centre.item.dri || centre.item.rattachement || '';
  if (field === 'type') return centre.item.type || TYPE_LABELS[centre.type];
  return centre.item.nom || '';
};

export default function CentreListe() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sort, setSort] = useState({ field: 'nom', direction: 'asc' });
  const [page, setPage] = useState(1);

  const centres = useMemo(() => getAllOperationalUnits(), []);

  const filteredCentres = useMemo(() => {
    const normalizedSearch = normalizeText(search.trim());

    return centres
      .filter(({ item, type }) => {
        const searchText = normalizeText([
          item.nom,
          item.type || TYPE_LABELS[type],
          item.dri,
          item.rattachement,
          item.region,
          ...(item.regions_couvertes || []),
          item.adresse,
          item.email,
          getTelephone(item.telephone),
        ].filter(Boolean).join(' '));

        return (!normalizedSearch || searchText.includes(normalizedSearch))
          && (!typeFilter || type === typeFilter);
      })
      .sort((first, second) => {
        const comparison = String(getSortableValue(first, sort.field))
          .localeCompare(String(getSortableValue(second, sort.field)), 'fr', {
            sensitivity: 'base',
            numeric: true,
          });
        return sort.direction === 'asc' ? comparison : -comparison;
      });
  }, [centres, search, sort, typeFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredCentres.length / PAGE_SIZE));
  const visibleCentres = filteredCentres.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const changeFilter = (setter, value) => {
    setter(value);
    setPage(1);
  };

  const changeSort = (field) => {
    setSort((previous) => ({
      field,
      direction: previous.field === field && previous.direction === 'asc' ? 'desc' : 'asc',
    }));
    setPage(1);
  };

  const sortIndicator = (field) => {
    if (sort.field !== field) return '↕';
    return sort.direction === 'asc' ? '↑' : '↓';
  };

  const openCentre = ({ type, index }) => {
    navigate(`/centres-fiscaux/${type}/${index}`);
  };

  const columns = [
    ['nom', 'Nom du centre'],
    ['type', 'Type'],
    ['regions', 'Région(s)'],
    ['dri', 'DRI / rattachement'],
    ['adresse', 'Adresse'],
    ['telephone', 'Téléphone'],
    ['email', 'E-mail'],
  ];

  return (
    <section className="page">
      <div className="page-heading">
        <p className="eyebrow">Administration fiscale</p>
        <h1>Centres fiscaux et unités opérationnelles</h1>
        <p>Pays : {fiscalData.pays}</p>
      </div>

      <div className="datatable-toolbar register-toolbar">
        <input
          value={search}
          onChange={(event) => changeFilter(setSearch, event.target.value)}
          placeholder="Rechercher un centre, une région, une DRI..."
          aria-label="Rechercher un centre"
        />
        <select
          value={typeFilter}
          onChange={(event) => changeFilter(setTypeFilter, event.target.value)}
          aria-label="Filtrer par type de centre"
        >
          <option value="">Tous les types</option>
          <option value="dge">DGE</option>
          <option value="sre">SRE</option>
          <option value="centres_fiscaux">Centre Fiscal</option>
        </select>
        <span>{filteredCentres.length} unité(s)</span>
      </div>

      <div className="table-wrap">
        <table className="register-table">
          <thead>
            <tr>
              {columns.map(([field, label]) => (
                <th key={field}>
                  <button
                    type="button"
                    className="table-sort-button"
                    onClick={() => changeSort(field)}
                  >
                    {label} <span>{sortIndicator(field)}</span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleCentres.map((centre) => (
              <tr
                key={`${centre.type}-${centre.index}`}
                className="clickable-row"
                onClick={() => openCentre(centre)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openCentre(centre);
                  }
                }}
                tabIndex="0"
                title={`Voir le détail de ${centre.item.nom}`}
              >
                <td><strong>{centre.item.nom}</strong></td>
                <td>{centre.item.type || TYPE_LABELS[centre.type]}</td>
                <td>{getRegions(centre.item)}</td>
                <td>{centre.item.dri || centre.item.rattachement || '—'}</td>
                <td>{centre.item.adresse || '—'}</td>
                <td>{getTelephone(centre.item.telephone)}</td>
                <td>{centre.item.email || '—'}</td>
              </tr>
            ))}
            {!visibleCentres.length && (
              <tr>
                <td colSpan={columns.length} className="empty">
                  Aucun centre ne correspond aux filtres.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="datatable-pagination">
        <span>Page {page} sur {pageCount}</span>
        <div>
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page === 1}
          >
            ← Précédent
          </button>
          <button
            type="button"
            onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
            disabled={page === pageCount}
          >
            Suivant →
          </button>
        </div>
      </div>
    </section>
  );
}
