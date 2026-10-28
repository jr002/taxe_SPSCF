import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DossierFiscalNavigation from '@/components/common/DossierFiscalNavigation';
import { getDeclarations, getErrorMessage } from '@/api/api';
import { formatAriary, toNumber } from '@/utils/formatters';
import { readSearchParam, updateSearchParams } from '@/utils/searchParams.utils';

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
    return { label: 'Rien à signaler', className: 'conforme' };
  }

  const tauxEcart = ((tvaTheorique - tvaPayee) / tvaTheorique) * 100;

  if (tauxEcart <= 25) {
    return { label: 'Rien à signaler', className: 'conforme' };
  }
  if (tauxEcart <= 50) {
    return { label: 'Risque moyen', className: 'surveillance' };
  }
  return { label: 'À risque', className: 'critique' };
};

/** Tri appliqué quand l'URL ne porte aucune intention explicite. */
const DEFAULT_SORT = { field: 'annee', direction: 'desc' };

/** Valeurs de `?statut=` : les mêmes clés que les classes de `getControleStatus`. */
const STATUT_FILTERS = [
  ['', 'Tous les statuts'],
  ['conforme', 'Rien à signaler'],
  ['surveillance', 'Risque moyen'],
  ['critique', 'À risque'],
  ['primitive', 'Primitive envoyée (30j)'],
  ['definitive', 'Définitive envoyée'],
];

/**
 * Page de suivi fiscal : Historique, filtres, recherche et pagination des déclarations.
 * Recherche, tri et page vivent dans l'URL (`?q=`, `?tri=`, `?ordre=`, `?page=`).
 */
export default function SuiviFiscal() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const pageSize = 20;

  const filter = readSearchParam(searchParams, 'q', '');
  const statutFilter = readSearchParam(searchParams, 'statut', '');
  const sortField = readSearchParam(searchParams, 'tri', DEFAULT_SORT.field);
  const sortDirection = readSearchParam(searchParams, 'ordre', DEFAULT_SORT.direction);
  const requestedPage = Number(searchParams.get('page')) || 1;

  const patchParams = (changes) => {
    setSearchParams(updateSearchParams(searchParams, changes), { replace: true });
  };

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

  /**
   * Chiffres de tête : ils répondent aux trois questions d'entrée (« combien de
   * dossiers ? », « combien à examiner ? », « quel écart cumulé ? ») sans
   * obliger à parcourir la table.
   */
  const synthese = useMemo(() => {
    const contribuables = new Set(rows.map((row) => row.nif).filter(Boolean));
    let aExaminer = 0;
    let aRisque = 0;
    let enProcedure = 0;
    let ecartTotal = 0;

    rows.forEach((row) => {
      const statut = getControleStatus(row).className;
      if (statut === 'surveillance') aExaminer += 1;
      if (statut === 'critique') {
        aExaminer += 1;
        aRisque += 1;
      }
      if (statut === 'primitive' || statut === 'definitive') enProcedure += 1;
      ecartTotal += Math.max(0, toNumber(row.tva_theorique) - toNumber(row.tva_payee));
    });

    return { total: rows.length, contribuables: contribuables.size, aExaminer, aRisque, enProcedure, ecartTotal };
  }, [rows]);

  // Filtrage local en temps réel (recherche libre et statut survivent au tri)
  const visibleRows = useMemo(() => {
    const normalizedFilter = filter.trim().toLowerCase();
    const filteredRows = rows.filter((row) => {
      if (statutFilter && getControleStatus(row).className !== statutFilter) return false;
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
  }, [filter, rows, sortDirection, sortField, statutFilter]);

  const totalPages = Math.max(1, Math.ceil(visibleRows.length / pageSize));
  const safePage = Math.min(requestedPage, totalPages);
  const paginatedRows = visibleRows.slice((safePage - 1) * pageSize, safePage * pageSize);

  const changeSort = (field) => {
    const nextDirection =
      sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    const backToDefault = field === DEFAULT_SORT.field && nextDirection === DEFAULT_SORT.direction;

    patchParams({
      tri: backToDefault ? '' : field,
      ordre: backToDefault ? '' : nextDirection,
      page: '',
    });
  };

  const clearFilters = () => {
    patchParams({ q: '', statut: '', page: '' });
  };
  const hasFilters = filter.trim() !== '' || statutFilter !== '';

  const goToPage = (value) => {
    patchParams({ page: value <= 1 ? '' : value });
  };

  const sortIndicator = (field) => {
    if (sortField !== field) return '';
    return sortDirection === 'asc' ? ' ↑' : ' ↓';
  };

  return (
    <section className="page dossier-fiscal-page">
      <div className="page-heading">
        <p className="eyebrow">Contrôle fiscal</p>
        <h1>Dossier fiscal</h1>
        <p>
          Vue consolidée des déclarations suivies. Repérez les écarts de TVA, filtrez par statut,
          puis ouvrez un dossier de contrôle pour engager la procédure.
        </p>
      </div>

      <DossierFiscalNavigation />

      <div className="kpis">
        <article>
          <span>Déclarations suivies</span>
          <strong>{synthese.total}</strong>
          <small>Toutes années confondues</small>
        </article>
        <article>
          <span>Contribuables concernés</span>
          <strong>{synthese.contribuables}</strong>
          <small>Au moins une déclaration</small>
        </article>
        <article>
          <span>Écarts au-delà du seuil</span>
          <strong>{synthese.aExaminer}</strong>
          <small>{synthese.aRisque} à risque (&gt; 50 %)</small>
        </article>
        <article>
          <span>Écart de TVA cumulé</span>
          <strong>{formatAriary(synthese.ecartTotal)}</strong>
          <small>Tous écarts positifs, y compris sous le seuil</small>
        </article>
      </div>

      <div className="rule-box">
        <strong>Comment lire cette liste</strong>
        <span>
          Écart de TVA jusqu'à 25 % de la TVA théorique : <b>Rien à signaler</b> · de 25 à 50 % :{' '}
          <b>Risque moyen</b> · au-delà de 50 % : <b>À risque</b>.
          {synthese.enProcedure > 0 && ` ${synthese.enProcedure} dossier(s) sont déjà en procédure contradictoire.`}
          {' '}Sélectionnez une ligne pour ouvrir le dossier de contrôle.
        </span>
      </div>

      <div className="datatable-toolbar">
        <input
          value={filter}
          onChange={(e) => patchParams({ q: e.target.value, page: '' })}
          aria-label="Rechercher par NIF, raison sociale, année ou statut"
          placeholder="Rechercher par NIF, raison sociale, année ou statut..."
        />
        <select
          value={statutFilter}
          onChange={(e) => patchParams({ statut: e.target.value, page: '' })}
          aria-label="Filtrer par statut constaté"
        >
          {STATUT_FILTERS.map(([value, label]) => (
            <option key={value || 'tous'} value={value}>{label}</option>
          ))}
        </select>
        <span>
          {visibleRows.length
            ? `${Math.min((safePage - 1) * pageSize + 1, visibleRows.length)}-${Math.min(
                safePage * pageSize,
                visibleRows.length
              )}`
            : '0-0'}{' '}
          / {visibleRows.length} déclaration(s)
          {visibleRows.length !== rows.length && ` (sur ${rows.length})`}
        </span>
        {hasFilters && (
          <button type="button" onClick={clearFilters} title="Effacer la recherche et le filtre de statut">
            ✕ Effacer
          </button>
        )}
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
                      Exercice {sortIndicator('annee')}
                    </button>
                  </th>
                  <th>CA déclaré</th>
                  <th>TVA payée</th>
                  <th>TVA théorique</th>
                  <th>Écart de TVA</th>
                  <th>
                    <button type="button" onClick={() => changeSort('statut')}>
                      Situation {sortIndicator('statut')}
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
                  const tauxEcart = tvaTheorique > 0 && ecart > 0
                    ? (ecart / tvaTheorique) * 100
                    : null;

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
                      <td className={ecart > 0 ? 'ecart-cell' : ''}>
                        {formatAriary(ecart)}
                        {tauxEcart !== null && (
                          <small>{tauxEcart.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} % de la TVA théorique</small>
                        )}
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
                onClick={() => goToPage(Math.max(1, safePage - 1))}
                disabled={safePage === 1}
              >
                Précédent
              </button>

              {Array.from({ length: totalPages }, (_, index) => index + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => goToPage(p)}
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
                onClick={() => goToPage(Math.min(totalPages, safePage + 1))}
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
