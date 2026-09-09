import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getContribuables as fetchContribuables, getErrorMessage } from '../api/api';
import { formatAriary, toNumber } from '../utils/formatters';
import { getCategorie } from '../utils/contribuable.utils';
import ExcelImportModal from '../components/forms/ExcelImportModal';

/**
 * Page du registre des contribuables avec synthèse annuelle, import Excel,
 * et filtre par catégorie (Grand / Moyen / Petit contribuable).
 */
export default function Contribuables() {
  const navigate = useNavigate();
  const [contribuables, setContribuables] = useState([]);
  const [filter, setFilter] = useState('');
  const [categorieFilter, setCategorieFilter] = useState('Tous');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await fetchContribuables({ limit: 10000 });
      setContribuables(result.data || result);
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

  const allContribuables = useMemo(
    () => contribuables.map((contribuable) => ({
      ...contribuable,
      key: String(contribuable.id_contribuable),
      declarations: contribuable.declarations || [],
      categorie: getCategorie(contribuable),
    })),
    [contribuables]
  );

  /* ---------- compteurs par catégorie ---------- */
  const counts = useMemo(() => {
    const c = { Grand: 0, Moyen: 0, Petit: 0 };
    allContribuables.forEach((ct) => { c[ct.categorie] = (c[ct.categorie] || 0) + 1; });
    return c;
  }, [allContribuables]);

  /* ---------- filtre combiné (texte + catégorie) ---------- */
  const contribuablesFiltres = useMemo(() => {
    const normalized = filter.trim().toLowerCase();

    return allContribuables.filter((c) => {
      // filtre catégorie
      if (categorieFilter !== 'Tous' && c.categorie !== categorieFilter) return false;

      // filtre texte
      if (normalized) {
        return [c.nif, c.raison_sociale, c.secteur_activite].some((val) =>
          String(val || '').toLowerCase().includes(normalized)
        );
      }
      return true;
    });
  }, [allContribuables, filter, categorieFilter]);

  const openDetail = (contribuable) => {
    navigate(`/contribuables/${encodeURIComponent(contribuable.key)}`, {
      state: { contribuable },
    });
  };

  /** Classe CSS du badge catégorie */
  const badgeClass = (cat) => {
    if (cat === 'Grand') return 'badge critique';
    if (cat === 'Moyen') return 'badge surveillance';
    return 'badge conforme';
  };

  return (
    <section className="page">
      <div className="page-heading">
        <p className="eyebrow">Registre fiscal</p>
        <h1>Contribuables</h1>
        <p>Retrouvez chaque contribuable et consultez ses déclarations et paiements cumulés.</p>
      </div>

      {/* ---- Onglets de filtrage par catégorie ---- */}
      <div className="categorie-tabs">
        {['Tous', 'Grand', 'Moyen', 'Petit'].map((cat) => (
          <button
            key={cat}
            type="button"
            className={`categorie-tab${categorieFilter === cat ? ' active' : ''}${
              cat !== 'Tous' ? ` tab-${cat.toLowerCase()}` : ''
            }`}
            onClick={() => setCategorieFilter(cat)}
          >
            {cat === 'Tous'
              ? `Tous (${allContribuables.length})`
              : `${cat}s (${counts[cat] || 0})`}
          </button>
        ))}
      </div>

      <div className="datatable-toolbar contribuables-toolbar flex-wrap gap-2">
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Rechercher par NIF, raison sociale ou secteur..."
        />
        <span>
          {contribuablesFiltres.length} / {allContribuables.length} contribuable(s)
        </span>
        <button type="button" onClick={loadData} disabled={loading}>
          Actualiser
        </button>
        <button
          type="button"
          onClick={() => setIsExcelModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-300 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer"
          title="Importer des contribuables depuis un fichier Excel ou CSV"
        >
          📊 Importer Excel / CSV
        </button>
        <Link className="primary add-contribuable-button" to="/entreprises/nouveau">
          + Ajouter un contribuable
        </Link>
      </div>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <p className="status">Chargement des contribuables...</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Contribuable</th>
                <th>Dernière année</th>
                <th>Années suivies</th>
                <th>TVA payée cumulée</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {contribuablesFiltres.map((contribuable) => {
                const latest = contribuable.declarations[0];
                const totalPaid = contribuable.declarations.reduce(
                  (total, row) => total + toNumber(row.tva_payee),
                  0
                );

                return (
                  <tr
                    key={contribuable.key}
                    onClick={() => openDetail(contribuable)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        openDetail(contribuable);
                      }
                    }}
                    tabIndex="0"
                    title="Afficher l'historique complet du contribuable"
                  >
                    <td>
                      <strong>{contribuable.raison_sociale || 'Contribuable non renseigné'}</strong>
                      <small>{contribuable.nif || 'NIF non renseigné'}</small>
                    </td>

                    <td>{latest?.annee || 'N/A'}</td>
                    <td>{contribuable.declarations.length} déclaration(s)</td>
                    <td>{formatAriary(totalPaid)}</td>
                    <td>
                      <button
                        className="table-action"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDetail(contribuable);
                        }}
                      >
                        Voir la fiche →
                      </button>
                    </td>
                  </tr>
                );
              })}

              {!contribuablesFiltres.length && (
                <tr>
                  <td colSpan="5" className="empty">
                    {allContribuables.length
                      ? 'Aucun contribuable ne correspond à votre recherche.'
                      : 'Aucun contribuable enregistré.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pop-up personnalisée d'importation Excel / CSV */}
      <ExcelImportModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        onSuccess={loadData}
      />
    </section>
  );
}
