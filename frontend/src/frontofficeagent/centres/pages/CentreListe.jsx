import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import fiscalData from '@/data/referentiel-unites';
import { useFiltresUrl } from '@/hooks';
import { getAllOperationalUnits } from '@/frontofficeagent/centres/utils/uniteFiscale.utils';

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
  const { lire, patch, page } = useFiltresUrl();
  const search = lire('q', '');
  const typeFilter = lire('type', '');
  const sortField = lire('tri', 'nom');
  const sortDirection = lire('sens', 'asc') === 'desc' ? 'desc' : 'asc';

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
        const comparison = String(getSortableValue(first, sortField))
          .localeCompare(String(getSortableValue(second, sortField)), 'fr', {
            sensitivity: 'base',
            numeric: true,
          });
        return sortDirection === 'asc' ? comparison : -comparison;
      });
  }, [centres, search, sortField, sortDirection, typeFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredCentres.length / PAGE_SIZE));
  const visiblePage = Math.min(page, pageCount);
  const visibleCentres = filteredCentres.slice((visiblePage - 1) * PAGE_SIZE, visiblePage * PAGE_SIZE);

  const goToPage = (valeur) => patch({ page: valeur <= 1 ? '' : valeur });

  const changeSort = (field) => {
    const prochainSens = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    patch({
      tri: field === 'nom' ? '' : field,
      sens: prochainSens === 'asc' ? '' : 'desc',
      page: '',
    });
  };

  const sortIndicator = (field) => {
    if (sortField !== field) return '↕';
    return sortDirection === 'asc' ? '↑' : '↓';
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
          onChange={(event) => patch({ q: event.target.value, page: '' })}
          placeholder="Rechercher un centre, une région, une DRI..."
          aria-label="Rechercher un centre"
        />
        <select
          value={typeFilter}
          onChange={(event) => patch({ type: event.target.value, page: '' })}
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
        <table aria-label="Centres fiscaux" className="register-table">
          <thead>
            <tr>
              {columns.map(([field, label]) => (
                <th
                  key={field}
                  aria-sort={
                    sortField !== field
                      ? 'none'
                      : sortDirection === 'asc'
                        ? 'ascending'
                        : 'descending'
                  }
                >
                  <button
                    type="button"
                    className="table-sort-button"
                    onClick={() => changeSort(field)}
                  >
                    {label} <span aria-hidden="true">{sortIndicator(field)}</span>
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
        <span>Page {visiblePage} sur {pageCount}</span>
        <div>
          <button
            type="button"
            onClick={() => goToPage(visiblePage - 1)}
            disabled={visiblePage === 1}
          >
            ← Précédent
          </button>
          <button
            type="button"
            onClick={() => goToPage(visiblePage + 1)}
            disabled={visiblePage === pageCount}
          >
            Suivant →
          </button>
        </div>
      </div>
    </section>
  );
}
