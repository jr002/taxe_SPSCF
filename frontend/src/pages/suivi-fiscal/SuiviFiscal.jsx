import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDeclarations, getErrorMessage } from '../../api/api';
import { formatAriary, toNumber } from '../../utils/formatters';

/**
 * Détermine le statut de contrôle en fonction du statut juridique et de l'écart constaté
 */
const getControleStatus = (row) => {
  const statutUpper = String(row.statut || '').toUpperCase();
  if (statutUpper === 'PRIMITIVE_ENVOYÉE') {
    return { label: 'Primitive envoyée (30j)', className: 'primitive' };
  }
  if (statutUpper === 'DÉFINITIVE_ENVOYÉE') {
    return { label: 'Définitive envoyée', className: 'definitive' };
  }

  const tvaPayee = toNumber(row.tva_payee);
  const tvaTheorique = toNumber(row.tva_theorique);

  if (tvaTheorique <= 0 || tvaPayee >= tvaTheorique) {
    return { label: 'Conforme', className: 'conforme' };
  }

  const tauxEcart = ((tvaTheorique - tvaPayee) / tvaTheorique) * 100;

  if (tauxEcart <= 25) {
    return { label: 'Conforme', className: 'conforme' };
  }
  if (tauxEcart <= 50) {
    return { label: 'À surveiller', className: 'surveillance' };
  }
  return { label: 'Critique', className: 'critique' };
};

/**
 * Page de suivi fiscal : Historique, filtres, recherche et pagination des déclarations
 */
export default function SuiviFiscal() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [filter, setFilter] = useState('');
  const [sortField, setSortField] = useState('annee');
  const [sortDirection, setSortDirection] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const pageSize = 20;

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await getDeclarations({ limit: 10000 });
      setRows(result.data || result);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      setLoading(true);
      setError('');

      try {
        const result = await getDeclarations({ limit: 10000 });
        if (isMounted) {
          setRows(result.data || result);
        }
      } catch (requestError) {
        if (isMounted) {
          setError(getErrorMessage(requestError));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Filtrage local en temps réel
  const visibleRows = useMemo(() => {
    const normalizedFilter = filter.trim().toLowerCase();
    const filteredRows = rows.filter((row) => {
      if (!normalizedFilter) return true;

      return [row.nif, row.raison_sociale, row.annee, row.statut].some((val) =>
        String(val || '').toLowerCase().includes(normalizedFilter)
      );
    });

    return filteredRows.sort((a, b) => {
      const firstVal = a[sortField] || '';
      const secondVal = b[sortField] || '';
      const comparison = String(firstVal).localeCompare(String(secondVal), 'fr', {
        numeric: true,
      });

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filter, rows, sortDirection, sortField]);

  const totalPages = Math.max(1, Math.ceil(visibleRows.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedRows = visibleRows.slice((safePage - 1) * pageSize, safePage * pageSize);

  const changeSort = (field) => {
    setCurrentPage(1);

    if (sortField === field) {
      setSortDirection((dir) => (dir === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortField(field);
    setSortDirection('asc');
  };

  const sortIndicator = (field) => {
    if (sortField !== field) return '';
    return sortDirection === 'asc' ? ' ↑' : ' ↓';
  };

  return (
    <section className="page">
      <div className="page-heading">
        <p className="eyebrow">Contrôle fiscal</p>
        <h1>Suivi fiscal</h1>
        <p>Historique consolidé des déclarations, filtrable par NIF ou raison sociale.</p>
      </div>

      <div className="datatable-toolbar">
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Rechercher par NIF, raison sociale, année ou statut..."
        />
        <span>
          {visibleRows.length
            ? `${Math.min((safePage - 1) * pageSize + 1, visibleRows.length)}-${Math.min(
                safePage * pageSize,
                visibleRows.length
              )}`
            : '0-0'}{' '}
          / {visibleRows.length} déclaration(s)
        </span>
        <button type="button" onClick={loadData} disabled={loading}>
          Actualiser
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <p className="status">Chargement des déclarations...</p>
      ) : (
        <>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>
                    <button type="button" onClick={() => changeSort('raison_sociale')}>
                      Contribuable {sortIndicator('raison_sociale')}
                    </button>
                  </th>
                  <th>
                    <button type="button" onClick={() => changeSort('annee')}>
                      Année {sortIndicator('annee')}
                    </button>
                  </th>
                  <th>CA déclaré</th>
                  <th>TVA payée</th>
                  <th>TVA théorique</th>
                  <th>Écart constaté</th>
                  <th>
                    <button type="button" onClick={() => changeSort('statut')}>
                      Statut {sortIndicator('statut')}
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedRows.map((row) => {
                  const tvaPayee = toNumber(row.tva_payee);
                  const tvaTheorique = toNumber(row.tva_theorique);
                  const controleStatus = getControleStatus(row);
                  const ecart = tvaTheorique - tvaPayee;

                  return (
                    <tr
                      key={row.id_declaration}
                      className={`statut-row row-${controleStatus.className}`}
                      onClick={() =>
                        navigate(`/suivi/${row.id_declaration}`, {
                          state: { declaration: row },
                        })
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          navigate(`/suivi/${row.id_declaration}`, {
                            state: { declaration: row },
                          });
                        }
                      }}
                      tabIndex="0"
                      title="Cliquer pour afficher la fiche détaillée"
                    >
                      <td>
                        <strong>{row.raison_sociale || 'Contribuable'}</strong>
                        <small>{row.nif}</small>
                      </td>
                      <td>{row.annee}</td>
                      <td>{formatAriary(row.ca)}</td>
                      <td>{formatAriary(tvaPayee)}</td>
                      <td>{formatAriary(tvaTheorique)}</td>
                      <td className={ecart > 0 ? 'text-amber-700 font-semibold' : ''}>
                        {formatAriary(ecart)}
                      </td>
                      <td>
                        <span className={`badge ${controleStatus.className}`}>
                          {controleStatus.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}

                {!paginatedRows.length && (
                  <tr>
                    <td colSpan="7" className="empty">
                      {rows.length
                        ? 'Aucun résultat correspondant à cette recherche.'
                        : 'Aucune déclaration enregistrée.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Contrôles de pagination */}
          {visibleRows.length > pageSize && (
            <div
              className="pagination-controls"
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '0.5rem',
                marginTop: '1.5rem',
                flexWrap: 'wrap',
              }}
            >
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
              >
                Précédent
              </button>

              {Array.from({ length: totalPages }, (_, index) => index + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setCurrentPage(p)}
                  className={p === safePage ? 'active' : ''}
                  style={{
                    minWidth: '2.25rem',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #dfe5ed',
                    background: p === safePage ? '#1d4ed8' : '#fff',
                    color: p === safePage ? '#fff' : '#172033',
                    fontWeight: 700,
                  }}
                >
                  {p}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
              >
                Suivant
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
