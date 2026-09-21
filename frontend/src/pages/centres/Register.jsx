import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCentres, getErrorMessage } from '../../api/api';

const PAGE_SIZE = 10;

/**
 * Registre des centres et de leurs informations administratives.
 */
export default function Register() {
  const navigate = useNavigate();
  const [centres, setCentres] = useState([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sort, setSort] = useState({ field: 'nom_centre', direction: 'asc' });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      setCentres(await getCentres());
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, []);

  const rows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const filtered = centres.filter((centre) => {
      const searchable = [
        centre.nom_centre,
        centre.type_centre,
        centre.numero_centre,
        centre.email_centre,
        centre.telephone_centre,
      ].join(' ').toLowerCase();

      return (
        (!normalizedSearch || searchable.includes(normalizedSearch)) &&
        (!typeFilter || centre.type_centre === typeFilter)
      );
    });

    return filtered.sort((first, second) => {
      const firstValue = sort.field === 'contribuables'
        ? first._count?.contribuables || 0
        : first[sort.field] || '';
      const secondValue = sort.field === 'contribuables'
        ? second._count?.contribuables || 0
        : second[sort.field] || '';
      const comparison = typeof firstValue === 'number'
        ? firstValue - secondValue
        : String(firstValue).localeCompare(String(secondValue), 'fr', { sensitivity: 'base' });

      return sort.direction === 'asc' ? comparison : -comparison;
    });
  }, [centres, search, sort, typeFilter]);

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const visibleRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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

  return (
    <section className="page">
      <div className="page-heading">
        <p className="eyebrow">Administration fiscale</p>
        <h1>Centres fiscaux</h1>
        <p>Liste des centres et de leurs informations administratives.</p>
      </div>

      <div className="datatable-toolbar register-toolbar">
        <input
          value={search}
          onChange={(event) => changeFilter(setSearch, event.target.value)}
          placeholder="Rechercher un centre..."
          aria-label="Rechercher un centre"
        />
        <select
          value={typeFilter}
          onChange={(event) => changeFilter(setTypeFilter, event.target.value)}
          aria-label="Filtrer par type de centre"
        >
          <option value="">Tous les types</option>
          <option value="Centre Fiscal">Centre Fiscal</option>
          <option value="SRE">SRE</option>
          <option value="DGE">DGE</option>
          <option value="autre">Autre</option>
        </select>
        <button type="button" onClick={loadData} disabled={loading}>Actualiser</button>
        <span>{rows.length} centre(s)</span>
      </div>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <p className="status">Chargement des centres...</p>
      ) : (
        <>
          <div className="table-wrap">
            <table className="register-table">
              <thead>
                <tr>
                  {[
                    ['nom_centre', 'Nom du centre'],
                    ['type_centre', 'Type'],
                    ['numero_centre', 'Numéro du centre'],
                    ['email_centre', 'E-mail du centre'],
                    ['telephone_centre', 'Téléphone'],
                    ['contribuables', 'Contribuables rattachés'],
                  ].map(([field, label]) => (
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
                {visibleRows.map((centre) => (
                  <tr
                    key={centre.id_centre}
                    className="clickable-row"
                    onClick={() => navigate(`/centres/${centre.id_centre}`)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        navigate(`/centres/${centre.id_centre}`);
                      }
                    }}
                    tabIndex="0"
                    title="Voir les contribuables de ce centre"
                  >
                    <td><strong>{centre.nom_centre}</strong></td>
                    <td>{centre.type_centre}</td>
                    <td>{centre.numero_centre}</td>
                    <td>{centre.email_centre || '—'}</td>
                    <td>{centre.telephone_centre || '—'}</td>
                    <td>{centre._count?.contribuables || 0}</td>
                  </tr>
                ))}
                {!visibleRows.length && (
                  <tr>
                    <td colSpan="6" className="empty">
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
        </>
      )}

      <div className="home-footer-note" style={{ marginTop: '2rem' }}>
        <button
          className="detail-close"
          onClick={() => navigate('/')}
          title="Retourner à l'accueil"
        >
          ←
        </button>
        <p><strong>Retourner</strong> à la page d'accueil</p>
      </div>
    </section>
  );
}
