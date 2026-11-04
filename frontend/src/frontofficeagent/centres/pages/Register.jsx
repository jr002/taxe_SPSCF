import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCentres, getErrorMessage } from '@/api';
import { useFiltresUrl } from '@/hooks';

const PAGE_SIZE = 10;

/**
 * Registre des centres et de leurs informations administratives.
 */
export default function Register() {
  const navigate = useNavigate();
  const { lire, patch, page } = useFiltresUrl();
  const [centres, setCentres] = useState([]);
  const search = lire('q', '');
  const typeFilter = lire('type', '');
  const sortField = lire('tri', 'nom_centre');
  const sortDirection = lire('sens', 'asc') === 'desc' ? 'desc' : 'asc';
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
      const firstValue = sortField === 'contribuables'
        ? first._count?.contribuables || 0
        : first[sortField] || '';
      const secondValue = sortField === 'contribuables'
        ? second._count?.contribuables || 0
        : second[sortField] || '';
      const comparison = typeof firstValue === 'number'
        ? firstValue - secondValue
        : String(firstValue).localeCompare(String(secondValue), 'fr', { sensitivity: 'base' });

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [centres, search, sortField, sortDirection, typeFilter]);

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const visiblePage = Math.min(page, pageCount);
  const visibleRows = rows.slice((visiblePage - 1) * PAGE_SIZE, visiblePage * PAGE_SIZE);

  const goToPage = (valeur) => patch({ page: valeur <= 1 ? '' : valeur });

  const changeSort = (field) => {
    const prochainSens = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    patch({
      tri: field === 'nom_centre' ? '' : field,
      sens: prochainSens === 'asc' ? '' : 'desc',
      page: '',
    });
  };

  const sortIndicator = (field) => {
    if (sortField !== field) return '↕';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  return (
    <section className="page">
      <div className="page-heading">
        <p className="eyebrow">Administration fiscale</p>
        <h1>Registre des centres</h1>
        <p>Liste des centres et de leurs informations administratives.</p>
      </div>

      <div className="datatable-toolbar register-toolbar">
        <input
          value={search}
          onChange={(event) => patch({ q: event.target.value, page: '' })}
          placeholder="Rechercher un centre..."
          aria-label="Rechercher un centre"
        />
        <select
          value={typeFilter}
          onChange={(event) => patch({ type: event.target.value, page: '' })}
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

      {error && <p className="error" role="alert">{error}</p>}

      {loading ? (
        <p className="status" role="status">Chargement des centres...</p>
      ) : (
        <>
          <div className="table-wrap">
            <table aria-label="Registre des centres fiscaux" className="register-table">
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
        </>
      )}

      <div className="home-footer-note">
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
