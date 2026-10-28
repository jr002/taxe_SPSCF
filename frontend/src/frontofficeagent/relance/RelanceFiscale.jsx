import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DossierFiscalNavigation from '@/components/common/DossierFiscalNavigation';
import { getDeclarations, getContribuables, getErrorMessage, getRelances } from '@/api';
import { toNumber } from '@/utils/formatters.jsx';
import { readSearchParam, updateSearchParams } from '@/utils/searchParams.utils';
import { formatDateRelance, relanceStatut, relanceType } from '@/utils/relance.utils';
import RelanceKPICards from './components/RelanceKPICards';

/**
 * Calcule le nombre de jours de retard entre une date limite (ou création) et aujourd'hui.
 */
function calcJoursRetard(declaration) {
  const ref =
    declaration.date_limite_reponse ||
    declaration.date_notification_primitive ||
    declaration.date_creation;
  if (!ref) return 0;
  const diff = Date.now() - new Date(ref).getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

/**
 * Retourne la sévérité du retard et le label badge correspondant.
 */
function getSeverite(jours) {
  if (jours <= 0) return { label: 'Conforme', cls: 'sev-conforme' };
  if (jours < 15) return { label: `${jours}j`, cls: 'sev-faible' };
  if (jours < 30) return { label: `${jours}j`, cls: 'sev-moyen' };
  return { label: `${jours}j`, cls: 'sev-critique' };
}

/**
 * Retourne si un contribuable est « non en règle » selon ses déclarations.
 */
function isNonEnRegle(declarations) {
  return declarations.some((d) => {
    const statut = String(d.statut || '').toUpperCase();
    const tvaP = toNumber(d.tva_payee);
    const tvaT = toNumber(d.tva_theorique);
    const ecart = tvaT > 0 ? ((tvaT - tvaP) / tvaT) * 100 : 0;
    return (
      statut === 'CRITIQUE' ||
      statut === 'ALERTE' ||
      ecart > 50 ||
      (statut === 'PRIMITIVE_ENVOYÉE' && calcJoursRetard(d) > 30) ||
      toNumber(d.montant_net_a_payer) > 0
    );
  });
}

// Onglets disponibles
const TABS = [
  { id: 'retards', label: '🕐 Retards de paiement' },
  { id: 'non-regle', label: '✗ Non en règle' },
  { id: 'historique', label: '📋 Historique des relances' },
];
const DEFAULT_TAB = 'retards';

/** Champs de recherche d'une ligne, qu'elle vienne des déclarations ou des relances. */
function searchValuesOf(row) {
  const contribuable = row.contribuables || {};
  return [
    row.nif,
    contribuable.nif,
    row.raisonSociale || row.raison_sociale || contribuable.raison_sociale,
    row.secteur || row.secteur_activite,
  ];
}

/**
 * Page principale de Relance Fiscale.
 * Chaque ligne de la liste dispose d'un seul bouton "Voir le dossier"
 * qui redirige vers /contribuables/:id où toutes les actions de relance sont disponibles.
 */
export default function RelanceFiscale() {
  const navigate = useNavigate();
  const [declarations, setDeclarations] = useState([]);
  const [contribuables, setContribuables] = useState([]);
  const [relances, setRelances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const pageSize = 15;

  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = readSearchParam(searchParams, 'onglet', DEFAULT_TAB);
  const activeTab = TABS.some((tab) => tab.id === requestedTab) ? requestedTab : DEFAULT_TAB;
  const filter = readSearchParam(searchParams, 'q', '');
  const severiteFilter = readSearchParam(searchParams, 'severite', 'Tous');
  const requestedPage = Number(searchParams.get('page')) || 1;

  const patchParams = (changes) =>
    setSearchParams(updateSearchParams(searchParams, changes), { replace: true });

  const hasActiveFilters = filter.trim() !== '' || severiteFilter !== 'Tous';

  // Chargement des données
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [declResult, ctbResult, relanceResult] = await Promise.all([
          getDeclarations({ limit: 10000 }),
          getContribuables({ limit: 10000 }),
          getRelances({ limit: 10000 }),
        ]);
        if (isMounted) {
          setDeclarations(declResult.data || declResult || []);
          setContribuables(ctbResult.data || ctbResult || []);
          setRelances(relanceResult?.data || []);
        }
      } catch (err) {
        if (isMounted) setError(getErrorMessage(err));
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    void load();
    return () => { isMounted = false; };
  }, []);

  // ─── Liste des dossiers en retard de paiement ─────────────────────────────
  const dossiersRetard = useMemo(() => {
    return declarations
      .filter((d) => {
        const statut = String(d.statut || '').toUpperCase();
        const montantDu = toNumber(d.montant_net_a_payer);
        const tvaPayee = toNumber(d.tva_payee);
        const tvaTheo = toNumber(d.tva_theorique);
        const ecart = tvaTheo > 0 ? ((tvaTheo - tvaPayee) / tvaTheo) * 100 : 0;
        return (
          montantDu > 0 ||
          statut === 'PRIMITIVE_ENVOYÉE' ||
          statut === 'DÉFINITIVE_ENVOYÉE' ||
          (ecart > 25 && statut !== 'conforme')
        );
      })
      .map((d) => {
        const jours = calcJoursRetard(d);
        const montantDu =
          toNumber(d.montant_net_a_payer) ||
          Math.max(0, toNumber(d.tva_theorique) - toNumber(d.tva_payee));
        return { ...d, jours, montantDu, raisonSociale: d.raison_sociale };
      })
      .sort((a, b) => b.jours - a.jours);
  }, [declarations]);

  // ─── Liste des contribuables non en règle ─────────────────────────────────
  const nonEnRegle = useMemo(() => {
    const ctbMap = {};
    contribuables.forEach((c) => { ctbMap[c.id_contribuable] = c; });

    const perCtb = {};
    declarations.forEach((d) => {
      if (!d.id_contribuable) return;
      if (!perCtb[d.id_contribuable]) perCtb[d.id_contribuable] = [];
      perCtb[d.id_contribuable].push(d);
    });

    return Object.entries(perCtb)
      .filter(([, decls]) => isNonEnRegle(decls))
      .map(([id, decls]) => {
        const ctb = ctbMap[id] || {};
        const totalDu = decls.reduce(
          (sum, d) =>
            sum +
            (toNumber(d.montant_net_a_payer) ||
              Math.max(0, toNumber(d.tva_theorique) - toNumber(d.tva_payee))),
          0
        );
        const lastDecl = decls[0];
        return {
          id_contribuable: id,
          nif: ctb.nif || lastDecl?.nif || '—',
          raisonSociale: ctb.raison_sociale || lastDecl?.raison_sociale || '—',
          secteur: ctb.secteur_activite || lastDecl?.secteur_activite || '—',
          nbDeclarations: decls.length,
          totalDu,
          annee: lastDecl?.annee || '—',
          statut: lastDecl?.statut || '—',
        };
      })
      .sort((a, b) => b.totalDu - a.totalDu);
  }, [declarations, contribuables]);

  // ─── KPI Stats ────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    totalImpaye: dossiersRetard.reduce((s, d) => s + d.montantDu, 0),
    nbRetards: dossiersRetard.length,
    nbNonEnRegle: nonEnRegle.length,
    nbRelancesEmises: relances.filter((r) => r.statut !== 'annulee').length,
  }), [dossiersRetard, nonEnRegle, relances]);

  // ─── Filtres et Pagination ────────────────────────────────────────────────
  const sourceData = activeTab === 'retards' ? dossiersRetard : activeTab === 'non-regle' ? nonEnRegle : relances;

  const filteredData = useMemo(() => {
    const norm = filter.trim().toLowerCase();
    return sourceData.filter((row) => {
      const matchText =
        !norm || searchValuesOf(row).some((value) => String(value || '').toLowerCase().includes(norm));
      if (!matchText) return false;

      if (activeTab === 'retards' && severiteFilter !== 'Tous') {
        const { cls } = getSeverite(row.jours);
        if (severiteFilter === 'Critique' && cls !== 'sev-critique') return false;
        if (severiteFilter === 'Moyen' && cls !== 'sev-moyen') return false;
        if (severiteFilter === 'Faible' && cls !== 'sev-faible') return false;
      }
      return true;
    });
  }, [sourceData, filter, severiteFilter, activeTab]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const safePage = Math.min(requestedPage, totalPages);
  const paginated = filteredData.slice((safePage - 1) * pageSize, safePage * pageSize);

  const changeTab = (tabId) =>
    patchParams({
      onglet: tabId === DEFAULT_TAB ? '' : tabId,
      // La sévérité n'a de sens que sur les retards de paiement.
      severite: tabId === 'retards' ? severiteFilter : '',
      page: '',
    });

  const clearFilters = () => patchParams({ q: '', severite: '', page: '' });
  const goToPage = (value) => patchParams({ page: value <= 1 ? '' : value });

  // ─── Navigation vers la fiche contribuable ────────────────────────────────
  const goToDossier = (row) => {
    const ctbId = row.id_contribuable ?? row.contribuables?.id_contribuable;
    if (ctbId) {
      navigate(`/contribuables/${ctbId}`, {
        state: { fromRelance: true },
      });
    }
  };

  // ─── Rendu ────────────────────────────────────────────────────────────────
  return (
    <div className="relance-page page">
      {/* En-tête */}
      <div className="page-heading">
        <p className="eyebrow">DGI · Recouvrement fiscal</p>
        <h1>Relance Fiscale</h1>
        <p>
          Suivi des arriérés de paiement et des contribuables non en règle.
          Cliquez sur <strong>Voir le dossier</strong> pour accéder à la fiche du contribuable
          et émettre les rappels à l'ordre, mises en demeure et régularisations.
        </p>
      </div>

      <DossierFiscalNavigation />

      {/* KPI Cards */}
      <RelanceKPICards stats={stats} />

      {/* Onglets */}
      <div className="relance-tabs" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            role="tab"
            type="button"
            aria-selected={activeTab === tab.id}
            className={`relance-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => changeTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Barre de filtres */}
      <div className="register-toolbar relance-toolbar">
        <input
          id="relance-search"
          type="search"
          placeholder="Rechercher (NIF, raison sociale, secteur…)"
          value={filter}
          onChange={(e) => patchParams({ q: e.target.value, page: '' })}
        />
        {activeTab === 'retards' && (
          <select
            id="relance-severite-filter"
            value={severiteFilter}
            onChange={(e) => patchParams({ severite: e.target.value === 'Tous' ? '' : e.target.value, page: '' })}
          >
            <option value="Tous">Toutes sévérités</option>
            <option value="Critique">🔴 Critique (&gt; 30j)</option>
            <option value="Moyen">🟠 Moyen (15–30j)</option>
            <option value="Faible">🟡 Faible (&lt; 15j)</option>
          </select>
        )}
        <button
          type="button"
          onClick={clearFilters}
          disabled={!hasActiveFilters}
          title="Effacer la recherche et la sévérité sélectionnée"
        >
          ✕ Effacer les filtres
        </button>
        <span>{filteredData.length} dossier{filteredData.length > 1 ? 's' : ''}</span>
      </div>

      {/* Contenu */}
      {loading && <p className="relance-status">⏳ Chargement des données fiscales…</p>}
      {error && <p className="relance-status relance-error">⚠ {error}</p>}

      {!loading && !error && activeTab === 'retards' && (
        <RetardsList rows={paginated} onVoirDossier={goToDossier} />
      )}

      {!loading && !error && activeTab === 'non-regle' && (
        <NonEnRegleList rows={paginated} onVoirDossier={goToDossier} />
      )}

      {!loading && !error && activeTab === 'historique' && (
        <HistoriqueList rows={paginated} onVoirDossier={goToDossier} />
      )}

      {/* Pagination */}
      {!loading && !error && filteredData.length > pageSize && (
        <div className="datatable-pagination">
          <span>
            Page {safePage} / {totalPages} — {filteredData.length} résultats
          </span>
          <div>
            <button
              id="btn-relance-prev"
              type="button"
              disabled={safePage <= 1}
              onClick={() => goToPage(safePage - 1)}
            >
              ‹ Préc.
            </button>
            <button
              id="btn-relance-next"
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => goToPage(safePage + 1)}
            >
              Suiv. ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sous-composant : liste des retards ───────────────────────────────────
function RetardsList({ rows, onVoirDossier }) {
  const fmt = (v) =>
    new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Number(v) || 0);

  if (rows.length === 0) {
    return (
      <div className="relance-empty">
        <span>✅</span>
        <p>Aucun dossier en retard de paiement</p>
      </div>
    );
  }

  return (
    <div className="table-scroll">
      <table className="register-table relance-table">
        <thead>
          <tr>
            <th>NIF</th>
            <th>Raison Sociale</th>
            <th>Année</th>
            <th>Statut</th>
            <th>Retard</th>
            <th>Montant dû (Ar)</th>
            <th>Dossier</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const { label, cls } = getSeverite(row.jours);
            return (
              <tr
                key={`${row.id_declaration}-${row.annee}`}
                className="relance-row clickable-row"
                onClick={() => onVoirDossier(row)}
                title="Cliquer pour voir la fiche et émettre une relance"
              >
                <td><code className="relance-nif">{row.nif}</code></td>
                <td>
                  <strong>{row.raison_sociale || row.raisonSociale}</strong>
                  <small>{row.secteur_activite}</small>
                </td>
                <td>{row.annee}</td>
                <td>
                  <span className={`relance-statut-badge relance-statut-${String(row.statut || '').toLowerCase().replace(/_/g, '-').replace(/[éè]/g, 'e')}`}>
                    {row.statut}
                  </span>
                </td>
                <td>
                  <span className={`relance-severite-badge ${cls}`}>{label}</span>
                </td>
                <td className="relance-montant">{fmt(row.montantDu)} Ar</td>
                <td>
                  <button
                    id={`btn-voir-${row.id_declaration}`}
                    type="button"
                    className="relance-btn relance-btn-primary"
                    onClick={(e) => { e.stopPropagation(); onVoirDossier(row); }}
                  >
                    📂 Voir le dossier
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Sous-composant : non en règle ────────────────────────────────────────
function NonEnRegleList({ rows, onVoirDossier }) {
  const fmt = (v) =>
    new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Number(v) || 0);

  if (rows.length === 0) {
    return (
      <div className="relance-empty">
        <span>✅</span>
        <p>Aucun contribuable non en règle détecté</p>
      </div>
    );
  }

  return (
    <div className="table-scroll">
      <table className="register-table relance-table">
        <thead>
          <tr>
            <th>NIF</th>
            <th>Raison Sociale</th>
            <th>Secteur</th>
            <th>Nb Décl.</th>
            <th>Dernier statut</th>
            <th>Total dû (Ar)</th>
            <th>Dossier</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id_contribuable}
              className="relance-row clickable-row"
              onClick={() => onVoirDossier(row)}
              title="Cliquer pour voir la fiche et émettre une relance"
            >
              <td><code className="relance-nif">{row.nif}</code></td>
              <td><strong>{row.raisonSociale}</strong></td>
              <td><small>{row.secteur}</small></td>
              <td className="relance-center">{row.nbDeclarations}</td>
              <td>
                <span className={`relance-statut-badge relance-statut-${String(row.statut || '').toLowerCase().replace(/_/g, '-').replace(/[éè]/g, 'e')}`}>
                  {row.statut}
                </span>
              </td>
              <td className="relance-montant">{fmt(row.totalDu)} Ar</td>
              <td>
                <button
                  id={`btn-voir-ner-${row.id_contribuable}`}
                  type="button"
                  className="relance-btn relance-btn-primary"
                  onClick={(e) => { e.stopPropagation(); onVoirDossier(row); }}
                >
                  📂 Voir le dossier
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Sous-composant : historique ─────────────────────────────────────────
function HistoriqueList({ rows, onVoirDossier }) {
  const fmt = (v) =>
    new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Number(v) || 0);

  if (rows.length === 0) {
    return (
      <div className="relance-empty">
        <span>📋</span>
        <p>Aucune relance émise pour l'instant</p>
        <small>Les relances sont émises depuis la fiche du contribuable.</small>
      </div>
    );
  }

  return (
    <div className="table-scroll">
      <table className="register-table relance-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>NIF</th>
            <th>Raison Sociale</th>
            <th>Année</th>
            <th>Type de relance</th>
            <th>Montant (Ar)</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((relance) => {
            const contribuable = relance.contribuables || {};
            const type = relanceType(relance.type_relance);
            const statut = relanceStatut(relance.statut);
            return (
              <tr
                key={relance.id_relance}
                className="relance-row clickable-row"
                onClick={() => onVoirDossier(relance)}
                title="Cliquer pour voir la fiche du contribuable"
              >
                <td>{formatDateRelance(relance.date_emission)}</td>
                <td><code className="relance-nif">{contribuable.nif || '—'}</code></td>
                <td><strong>{contribuable.raison_sociale || '—'}</strong></td>
                <td>{relance.annee}</td>
                <td>
                  <span className={`relance-severite-badge ${type.severity}`}>{type.label}</span>
                </td>
                <td className="relance-montant">{fmt(relance.montant_du)} Ar</td>
                <td>
                  <span className={`relance-statut-badge ${statut.cls}`}>{statut.label}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
