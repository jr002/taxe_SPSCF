import { buildPeriodOptions, formatAriary, formatEcart } from './utils';

const TYPE_BARS = [['Exact', 'exact', '#237a43'], ['Tolérance', 'tolerance', '#f2b84b'], ['Partiel', 'partiel', '#946200'], ['Manuel', 'manuel', '#1769aa']];
const STATUS_BARS = [
  ['Rapproché', 'rapproche', '#237a43'],
  ['À vérifier', 'a_verifier', '#8a5d00'],
  ['Validé', 'valide', '#1769aa'],
  ['Écart', 'ecart', '#b42318'],
  ['Rejeté', 'rejete', '#657083'],
  ['Annulé', 'annule', '#94a3b8'],
];

export default function Synthese({
  loading,
  error,
  stats,
  period,
  onPeriodChange,
  apercu = null,
  onGoToLaunch,
  onShowList,
}) {
  if (loading) return <p className="status">Chargement…</p>;
  if (error) return <p className="empty error">{error}</p>;

  const { annees: periodesAnnee, mois: periodesMois } = buildPeriodOptions(apercu);
  const actifs = stats?.actifs || 0;
  const aTraiter = (stats?.a_verifier || 0) + (stats?.ecart || 0);
  const part = (valeur) => `${actifs ? Math.round(valeur / actifs * 100) : 0}%`;

  return (
    <div>
      <div className="section-heading">
        <span className="section-number">2</span>
        <div>
          <h2>Synthèse de la confrontation</h2>
          <p>Périmètre analysé, décisions prises et montants rapprochés pour ce contribuable.</p>
        </div>
      </div>

      <label className="field cf-period-filter" htmlFor="cf-stats-periode">
        Période
        <select
          id="cf-stats-periode"
          className="cf-select"
          value={period}
          onChange={(event) => onPeriodChange(event.target.value)}
        >
          <option value="">Toutes les périodes</option>
          {periodesAnnee.length > 0 && (
            <optgroup label="Exercices déclarés">
              {periodesAnnee.map((entree) => <option key={entree.value} value={entree.value}>{entree.label}</option>)}
            </optgroup>
          )}
          {periodesMois.length > 0 && (
            <optgroup label="Mois recoupés">
              {periodesMois.map((entree) => <option key={entree.value} value={entree.value}>{entree.label}</option>)}
            </optgroup>
          )}
        </select>
      </label>

      {!stats || stats.total === 0 ? (
        <div className="result-card alert">
          <h3>Aucun rapprochement à synthétiser</h3>
          <p>Aucune confrontation ne correspond à cette période. Lancez une confrontation ou élargissez la période.</p>
          <button type="button" className="primary" onClick={onGoToLaunch}>Lancer une confrontation</button>
        </div>
      ) : (
        <>
          <p className="eyebrow">Périmètre analysé</p>
          <div className="cf-kpis">
            <article className="cf-kpi"><span>Rapprochements</span><strong>{stats.total}</strong></article>
            <article className="cf-kpi"><span>Rapprochements actifs</span><strong>{stats.actifs}</strong></article>
            <article className="cf-kpi"><span>Déclarations confrontées</span><strong>{stats.declarations}</strong></article>
            <article className="cf-kpi"><span>Recoupements confrontés</span><strong>{stats.recoupements}</strong></article>
          </div>

          <p className="eyebrow">Décisions</p>
          <div className="cf-kpis">
            <article className="cf-kpi"><span>À traiter</span><strong style={{ color: '#8a5d00' }}>{aTraiter}</strong></article>
            <article className="cf-kpi"><span>Taux de concordance exacte</span><strong>{part(stats.exact)}</strong></article>
            <article className="cf-kpi"><span>Part en écart</span><strong>{part(stats.ecart)}</strong></article>
            <article className="cf-kpi"><span>Rejetés / annulés</span><strong>{stats.rejete + stats.annule}</strong></article>
          </div>

          {aTraiter > 0 && (
            <div className="cf-actions">
              <button type="button" className="primary" onClick={() => onShowList({ statut: stats.a_verifier > 0 ? 'a_verifier' : 'ecart', periode: period })}>
                Voir les {aTraiter} rapprochement(s) à traiter
              </button>
            </div>
          )}

          <div className="cf-two-columns">
            <div>
              <p className="eyebrow">Répartition par type</p>
              <div className="cf-bars">
                {TYPE_BARS.map(([label, key, color]) => (
                  <div className="cf-bar-col" key={label}>
                    <div className="cf-bar-col-wrap">
                      <div
                        className="cf-bar-col-fill"
                        style={{ height: `${Math.max(4, Math.round(stats[key] / stats.total * 100))}%`, background: color }}
                      />
                    </div>
                    <strong>{stats[key]}</strong>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="eyebrow">Répartition par statut</p>
              <div className="cf-bars">
                {STATUS_BARS.map(([label, key, color]) => (
                  <div className="cf-bar-col" key={key}>
                    <div className="cf-bar-col-wrap">
                      <div
                        className="cf-bar-col-fill"
                        style={{ height: `${Math.max(4, Math.round(stats[key] / stats.total * 100))}%`, background: color }}
                      />
                    </div>
                    <strong>{stats[key]}</strong>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p className="eyebrow">Montants hors rapprochements rejetés ou annulés</p>
          <div className="cf-three-columns">
            <div className="sum-field">
              <span>Chiffre d’affaires total déclaré</span>
              <strong style={{ color: '#1769aa' }}>{formatAriary(stats.montant_declare_total)}</strong>
            </div>
            <div className="sum-field">
              <span>Montants recoupés (TTC)</span>
              <strong style={{ color: '#237a43' }}>{formatAriary(stats.montant_recoupe_total)}</strong>
            </div>
            <div className="sum-field">
              <span>Écart global (CA déclaré − recoupé)</span>
              <strong style={{ color: Number(stats.ecart_total) > 0 ? '#b42318' : '#237a43' }}>
                {formatEcart(stats.ecart_total)}
              </strong>
            </div>
          </div>

          <div className="rule-box">
            <strong>Ce que l’on compare</strong>
            <span>
              Le moteur compare le chiffre d’affaires déclaré au montant recoupé toutes taxes
              comprises. La TVA figure seulement dans le détail de la déclaration, à titre informatif.
              Un écart n’est pas automatiquement une fraude : il s’analyse avec les pièces
              justificatives.
            </span>
          </div>
        </>
      )}
    </div>
  );
}
