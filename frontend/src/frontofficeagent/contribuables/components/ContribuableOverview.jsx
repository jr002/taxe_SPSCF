import { ContribComparisonChart, ContribVolumeChart } from '@/components/charts/Diagrammes';
import { formatAriary } from '@/utils/formatters';

export default function ContribuableOverview({ annualData, curveData, currentRegime, declarations, maxBars, curveMax, totalPaid }) {
  return <>
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
    
    <div className="contrib-chart-grid">
      <ContribVolumeChart annualData={annualData} maxBars={maxBars} currentRegime={currentRegime} />
      <ContribComparisonChart curveData={curveData} curveMax={curveMax} currentRegime={currentRegime} />
    </div>
  </>;
}
