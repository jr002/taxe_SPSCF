import { ContribComparisonChart, ContribVolumeChart } from '@/components/charts';
import { formatAriary, toNumber } from '@/utils';

export default function ContribuableOverview({
  annualData,
  curveData,
  currentRegime,
  declarations,
  maxBars,
  curveMax,
}) {
  const declarationsAvecMontant = declarations.filter(
    (declaration) => declaration.tva_payee !== null
      && declaration.tva_payee !== undefined
      && declaration.tva_payee !== '',
  );
  const totalPaid = declarationsAvecMontant.reduce(
    (total, declaration) => total + toNumber(declaration.tva_payee),
    0,
  );

  return (
    <>
      <div className="declaration-summary">
        <div>
          <span>TVA payée cumulée enregistrée</span>
          <strong>{declarationsAvecMontant.length ? formatAriary(totalPaid) : 'Non renseignée'}</strong>
        </div>
        <div>
          <span>Dernière déclaration · exercices suivis</span>
          <strong>{declarations[0]?.annee || 'N/A'} · {declarations.length}</strong>
        </div>
      </div>

      <div className="contrib-chart-grid">
        <ContribVolumeChart annualData={annualData} maxBars={maxBars} currentRegime={currentRegime} />
        <ContribComparisonChart curveData={curveData} curveMax={curveMax} currentRegime={currentRegime} />
      </div>
    </>
  );
}
