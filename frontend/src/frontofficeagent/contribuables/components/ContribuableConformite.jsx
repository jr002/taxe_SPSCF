import { Link } from 'react-router-dom';

import { AideTerme } from '@/frontofficeagent/aide';
import { ecartSens, formatAriary, formatEcart } from '@/frontofficeagent/confrontation/utils/confrontation.utils.js';
import { conformiteRecoupee } from '@/frontofficeagent/confrontation/utils/conformiteRecoupee.utils.js';

/**
 * Tête du dossier : l'écart général recoupement / déclaration et la conformité
 * recoupée, lus depuis les rapprochements enregistrés par la confrontation. Tant
 * qu'aucune confrontation active n'existe, le dossier est « non recoupé » : on
 * montre la matière disponible, jamais un écart inventé.
 */
export default function ContribuableConformite({ idContribuable, stats, apercu, loading, error }) {
  const conformite = conformiteRecoupee(stats);
  const confronte = conformite.etat !== 'non_recoupe';
  const declarationsTotal = Number(apercu?.declarations?.total ?? 0);
  const recoupementsTotal = Number(apercu?.recoupements?.total ?? 0);
  const couverture = declarationsTotal > 0
    ? Math.round((conformite.declarationsConfrontees / declarationsTotal) * 100)
    : 0;

  const lienConfrontation = `/contribuables/${idContribuable}/confrontation`;
  const lienEcarts = `${lienConfrontation}?vue=liste${conformite.nbEcarts > 0 ? '&statut=ecart' : ''}`;

  return (
    <section className="contribuable-overview-panel contribuable-conformite" aria-labelledby="contribuable-conformite-title">
      <div className="contribuable-overview-heading">
        <div>
          <p className="eyebrow">Conformité recoupée</p>
          <h2 id="contribuable-conformite-title">Écart recoupement / déclaration</h2>
          <p>
            Le chiffre d’affaires déclaré par le contribuable, comparé aux montants
            recoupés auprès des tiers.
          </p>
        </div>
        <div className="contribuable-overview-status-wrap">
          <div className={`contribuable-overview-status ${conformite.niveau}`} role="status">
            <span className="contribuable-overview-status-mark" aria-hidden="true">{conformite.mark}</span>
            <span>
              <small>
                {confronte
                  ? `${conformite.total} rapprochement(s) · ${conformite.actifs} actif(s)`
                  : 'Aucune confrontation active'}
              </small>
              <strong>{conformite.label}</strong>
            </span>
          </div>
        </div>
      </div>

      {loading && <p className="status" role="status">Chargement de la confrontation…</p>}
      {!loading && error && <p className="status error" role="alert">{error}</p>}

      {!loading && confronte && (
        <>
          <div className={`result-card contribuable-conformite-ecart-focus ${conformite.ecartTotal === 0 ? 'success' : 'alert'}`}>
            <p className="eyebrow subtle">L’écart recoupement / déclaration</p>
            <div className="sum-field contribuable-conformite-ecart">
              <span>
                <AideTerme id="ecart_general">Écart général</AideTerme> · {ecartSens(conformite.ecartTotal)}
              </span>
              <strong>{formatEcart(conformite.ecartTotal)}</strong>
            </div>
            <p className="cf-lead">
              Chiffre d’affaires déclaré confronté moins montant recoupé toutes taxes comprises.
            </p>
          </div>

          <div className="cf-two-columns">
            <div className="sum-field">
              <span><AideTerme id="ca">CA déclaré confronté</AideTerme></span>
              <strong>{formatAriary(conformite.caDeclare)}</strong>
            </div>
            <div className="sum-field">
              <span><AideTerme id="recoupement">Montant recoupé (TTC)</AideTerme></span>
              <strong>{formatAriary(conformite.recoupe)}</strong>
            </div>
          </div>

          <div className="cf-kpis contribuable-conformite-kpis">
            <article className="cf-kpi">
              <span>Écarts à traiter</span>
              <strong>{conformite.nbEcarts}</strong>
            </article>
            <article className="cf-kpi">
              <span>Déclarations confrontées</span>
              <strong>{conformite.declarationsConfrontees}{declarationsTotal ? ` / ${declarationsTotal}` : ''}</strong>
            </article>
            <article className="cf-kpi">
              <span>Recoupements confrontés</span>
              <strong>{conformite.recoupementsConfrontes}</strong>
            </article>
            <article className="cf-kpi">
              <span><AideTerme id="couverture">Couverture</AideTerme></span>
              <strong>{couverture} %</strong>
            </article>
          </div>

          <div className="contribuable-conformite-actions">
            <Link className="primary" to={lienEcarts}>
              {conformite.nbEcarts > 0
                ? `Analyser les ${conformite.nbEcarts} écart(s)`
                : 'Voir les rapprochements'}
            </Link>
            <Link to={lienConfrontation}>Ouvrir la confrontation</Link>
          </div>
        </>
      )}

      {!loading && !confronte && (
        <>
          <p className="cf-lead">
            {declarationsTotal === 0
              ? 'Aucune déclaration enregistrée : la confrontation n’a pas encore de matière à comparer.'
              : recoupementsTotal === 0
                ? 'Les tiers n’ont encore rien recoupé sur ce dossier : aucun écart ne peut être calculé.'
                : 'Ce dossier n’a pas encore été confronté. Lancez la confrontation pour comparer le CA déclaré aux montants recoupés.'}
          </p>
          <div className="cf-three-columns">
            <div className="sum-field">
              <span><AideTerme id="ca">CA déclaré (total)</AideTerme></span>
              <strong>{formatAriary(apercu?.declarations?.ca_total)}</strong>
            </div>
            <div className="sum-field">
              <span>Recoupements disponibles</span>
              <strong>{recoupementsTotal}</strong>
            </div>
            <div className="sum-field">
              <span>Montant recoupé (total)</span>
              <strong>{formatAriary(apercu?.recoupements?.montant_total)}</strong>
            </div>
          </div>
          <div className="contribuable-conformite-actions">
            <Link className="primary" to={lienConfrontation}>Lancer la confrontation</Link>
          </div>
        </>
      )}

      <div className="rule-box">
        <strong>Ce que l’on compare</strong>
        <span>
          Le moteur compare le chiffre d’affaires déclaré au montant recoupé toutes taxes
          comprises. Un écart n’est pas automatiquement une fraude : il s’analyse avec les
          pièces justificatives. La TVA n’est affichée qu’à titre informatif.
        </span>
      </div>
    </section>
  );
}