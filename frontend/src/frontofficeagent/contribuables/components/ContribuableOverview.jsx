import { ContribComparisonChart, ContribVolumeChart } from '@/components/charts';
import { AideTerme } from '@/frontofficeagent/aide';
import { formatAriary } from '@/utils';

export default function ContribuableOverview({ annualData, curveData, currentRegime, declarations, maxBars, curveMax, totalPaid }) {
  return <>
    <div className="declaration-summary">
      <div>
        <span><AideTerme id="tva_payee">TVA payée cumulée</AideTerme></span>
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
