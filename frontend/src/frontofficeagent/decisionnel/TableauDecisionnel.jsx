import { useMemo } from 'react';
import { VolumeChart, RegimeChart, CurveChart } from '@/components/charts/Diagrammes';
import useDecisionnelData from '@/hooks/useDecisionnelData';
import { buildYears, buildCurves } from '@/utils/decisionnel.utils';
import { formatCompact, formatNumber, toNumber } from '@/utils/formatters';

/**
 * Tableau de bord décisionnel : Synthèse statistique, KPIs et graphiques de pilotage
 */
export default function TableauDecisionnel() {
  const { stats, declarations, error, loading } = useDecisionnelData();

  const years = useMemo(() => buildYears(declarations), [declarations]);
  const curves = useMemo(() => buildCurves(years, declarations), [years, declarations]);

  if (loading) {
    return <p className="page status">Chargement du tableau décisionnel...</p>;
  }

  if (error) {
    return (
      <section className="page error">
        <h1>Tableau décisionnel indisponible</h1>
        <p>{error}</p>
        <p>Vérifiez que le serveur backend et la base de données PostgreSQL sont bien en ligne.</p>
      </section>
    );
  }

  const totalDeclarations = toNumber(stats?.total);
  const alertesEtCritiques = toNumber(stats?.alertes) + toNumber(stats?.critiques);
  const ecartTotal = toNumber(stats?.ecart_total);
  const tvaTheoriqueTotale = toNumber(stats?.tva_theorique_totale);

  return (
    <section className="page">
      <div className="page-heading">
        <p className="eyebrow">Pilotage stratégique</p>
        <h1>Tableau décisionnel</h1>
        <p>Vue consolidée sur 5 ans de l'activité fiscale et des écarts de TVA constatés.</p>
      </div>

      {/* Cartes KPI */}
      <div className="kpis">
        <article>
          <span>Déclarations traitées</span>
          <strong>{formatNumber(totalDeclarations)}</strong>
        </article>
        <article>
          <span>Dossiers à risque (Alertes & Critiques)</span>
          <strong className={alertesEtCritiques > 0 ? 'text-amber-600' : ''}>
            {formatNumber(alertesEtCritiques)}
          </strong>
        </article>
        <article>
          <span>Écart total constaté</span>
          <strong>{formatCompact(ecartTotal)} Ar</strong>
        </article>
        <article>
          <span>TVA théorique totale</span>
          <strong>{formatCompact(tvaTheoriqueTotale)} Ar</strong>
        </article>
      </div>

      {/* Grille des graphiques */}
      <div className="dashboard-grid">
        <VolumeChart years={years} />
        <RegimeChart declarations={declarations} />
        {curves.map((curve) => (
          <CurveChart curve={curve} key={curve.regime} />
        ))}
      </div>
    </section>
  );
}
