import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { getContribuableById, getErrorMessage } from '../api/api';
import { getRegime } from '../utils/decisionnel.utils';
import { formatAriary, toNumber } from '../utils/formatters';
import { getCategorie, getFicheCategorie } from '../utils/contribuable.utils';
import {
  ContribVolumeChart,
  ContribComparisonChart,
} from '../components/charts/Diagrammes';

/**
 * Fiche détaillée d'un contribuable : classification, régime, pénalités,
 * historique des paiements et analyse graphique sur 5 ans
 */
export default function ContribuableDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [contribuable, setContribuable] = useState(location.state?.contribuable || null);
  const [declarations, setDeclarations] = useState(
    location.state?.contribuable?.declarations || []
  );
  const [loading, setLoading] = useState(!location.state?.contribuable);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
      try {
        const result = await getContribuableById(id);
        setContribuable(result);
        setDeclarations(result.declarations || []);
      } catch (requestError) {
        setError(getErrorMessage(requestError));
      } finally {
        setLoading(false);
      }
    };

    if (!location.state?.contribuable) {
      loadHistory();
    }
  }, [id, location.state?.contribuable]);

  const currentRegime = contribuable ? getRegime(contribuable) : 'IS';
  const totalPaid = declarations.reduce(
    (total, row) => total + toNumber(row.tva_payee),
    0
  );

  /* ---- Classification ---- */
  const categorie = contribuable ? getCategorie(contribuable) : 'Petit';
  const fiche = getFicheCategorie(categorie);

  const chartYears = useMemo(
    () =>
      [...new Set(declarations.map((row) => Number(row.annee)).filter(Boolean))]
        .sort((a, b) => a - b)
        .slice(-5),
    [declarations]
  );

  const annualData = useMemo(
    () =>
      chartYears.map((year) => {
        const yearDeclarations = declarations.filter((row) => Number(row.annee) === year);
        return {
          year,
          tva: yearDeclarations.length,
          regimeCount: yearDeclarations.filter((row) => getRegime(row) === currentRegime).length,
        };
      }),
    [chartYears, currentRegime, declarations]
  );

  const curveData = useMemo(
    () =>
      chartYears.slice(-2).map((year) => {
        const yearDeclarations = declarations.filter((row) => Number(row.annee) === year);
        return {
          year,
          paid: yearDeclarations.reduce((total, row) => total + toNumber(row.tva_payee), 0),
          theoretical: yearDeclarations.reduce(
            (total, row) => total + toNumber(row.tva_theorique),
            0
          ),
        };
      }),
    [chartYears, declarations]
  );

  const maxBars = Math.max(
    ...annualData.flatMap((item) => [item.tva, item.regimeCount]),
    1
  );
  const curveValues = curveData.flatMap((item) => [item.paid, item.theoretical]);
  const curveMax = Math.max(...curveValues, 1);

  if (loading) {
    return <p className="page status">Chargement de l'historique du contribuable...</p>;
  }

  if (error || !contribuable) {
    return (
      <section className="page error">
        <h1>Contribuable indisponible</h1>
        <p>{error || 'Aucune donnée disponible pour ce contribuable.'}</p>
        <Link className="primary detail-back" to="/contribuables">
          Retour à la liste des contribuables
        </Link>
      </section>
    );
  }

  return (
    <section className="page declaration-page">
      <Link className="detail-back-link" to="/contribuables">
        ← Retour aux contribuables
      </Link>

      <div className="page-heading declaration-page-heading">
        <p className="eyebrow">Fiche contribuable</p>
        <h1>
          {contribuable.raison_sociale || 'Contribuable'}
          <span
            className="categorie-badge-inline"
            style={{ background: fiche.background, color: fiche.couleur }}
          >
            {fiche.label}
          </span>
        </h1>
        <p>
          NIF : {contribuable.nif || 'N/A'} · {declarations.length} année(s) suivie(s)
        </p>
      </div>

      <div className="declaration-summary">
        <div>
          <span>TVA payée cumulée</span>
          <strong>{formatAriary(totalPaid)}</strong>
        </div>
        <div>
          <span>Dernière déclaration enregistrée</span>
          <strong>{declarations[0]?.annee || 'N/A'}</strong>
        </div>
      </div>

      {/* ========== PANNEAU CLASSIFICATION ========== */}
      <div
        className="classification-panel"
        style={{ borderLeftColor: fiche.couleur }}
      >
        <div className="classification-panel-header">
          <span
            className="classification-panel-badge"
            style={{ background: fiche.background, color: fiche.couleur }}
          >
            {fiche.label}
          </span>
          <span className="classification-panel-seuil">{fiche.seuil}</span>
        </div>

        {/* Régime fiscal */}
        <div className="classification-panel-section">
          <h3>📋 Régime fiscal &amp; comptable</h3>
          <p>{fiche.regime}</p>
        </div>

        {/* Pénalités de retard */}
        <div className="classification-panel-section">
          <h3>⏱️ Pénalités de retard de paiement <small>({fiche.refArticle})</small></h3>
          <ul>
            {fiche.penaliteRetard.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </div>

        {/* Amendes */}
        <div className="classification-panel-section">
          <h3>⚠️ Amendes administratives</h3>
          <div className="amendes-grid">
            {fiche.amendes.map((a, i) => (
              <div key={i} className="amende-card">
                <span className="amende-motif">{a.motif}</span>
                <strong className="amende-montant">{formatAriary(a.montant)}</strong>
                {a.unite && <small className="amende-unite">{a.unite}</small>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Graphiques déportés dans components/charts/Diagrammes.jsx */}
      <div className="contrib-chart-grid">
        <ContribVolumeChart
          annualData={annualData}
          maxBars={maxBars}
          currentRegime={currentRegime}
        />
        <ContribComparisonChart
          curveData={curveData}
          curveMax={curveMax}
          currentRegime={currentRegime}
        />
      </div>

      <div className="history-heading">
        <h2>Historique des déclarations</h2>
        <span>{declarations.length} déclaration(s)</span>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Année</th>
              <th>Chiffre d'affaires</th>
              <th>Catégorie</th>
              <th>TVA collectée</th>
              <th>TVA déductible</th>
              <th>TVA payée</th>
              <th>TVA théorique</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {declarations.map((declaration) => {
              const declCa = toNumber(declaration.ca);
              const declCat =
                declCa >= 400_000_000
                  ? 'Grand'
                  : declCa >= 100_000_000
                    ? 'Moyen'
                    : 'Petit';
              const declBadge =
                declCat === 'Grand'
                  ? 'badge critique'
                  : declCat === 'Moyen'
                    ? 'badge surveillance'
                    : 'badge conforme';

              return (
                <tr
                  key={declaration.id_declaration}
                  className="clickable-row"
                  title="Voir le détail de cette déclaration"
                  onClick={() =>
                    navigate(`/suivi/${declaration.id_declaration}`, {
                      state: { declaration },
                    })
                  }
                >
                  <td>
                    <strong>{declaration.annee}</strong>
                  </td>
                  <td>{formatAriary(declaration.ca)}</td>
                  <td>
                    <span className={declBadge}>{declCat}</span>
                  </td>
                  <td>{formatAriary(declaration.tva_collectee)}</td>
                  <td>{formatAriary(declaration.tva_deductible)}</td>
                  <td>
                    <strong>{formatAriary(declaration.tva_payee)}</strong>
                  </td>
                  <td>{formatAriary(declaration.tva_theorique)}</td>
                  <td>{declaration.statut || 'Conforme'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
