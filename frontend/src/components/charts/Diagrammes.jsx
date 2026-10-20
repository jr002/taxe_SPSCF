import { formatAxisValue, formatCompact } from '../../utils/formatters';
import { getRegime, getRegimePercentage } from '../../utils/decisionnel.utils';

/**
 * Calcule les coordonnées SVG d'une polyligne à partir d'un tableau de valeurs
 */
const buildChartPoints = (values = [], max = 1, min = 0) => {
  const safeRange = Math.max(max - min, 1);
  return values
    .map((value, index) => {
      const x = values.length === 1 ? 50 : index * (100 / (values.length - 1));
      const y = 94 - ((value - min) / safeRange) * 84;
      return `${x},${y}`;
    })
    .join(' ');
};

/**
 * Mini-courbe SVG vectorielle (sparkline)
 */
export function MiniLine({ data = [], color = '#2563eb', max = 1 }) {
  const safeMax = Math.max(max, 1);
  const points = data
    .map((point, index) => {
      const x = index * (100 / Math.max(data.length - 1, 1));
      const y = 96 - (point.amount / safeMax) * 86;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      role="img"
      aria-label="Évolution annuelle"
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="3"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/**
 * Graphique en barres : Nombre de déclarations par régime (IS, IR, TVA) sur 5 ans
 * Utilisé dans le Tableau Décisionnel
 */
export function VolumeChart({ years = [] }) {
  const maxBars = Math.max(
    ...years.flatMap((year) => [year.is, year.ir, year.tva]),
    1
  );
  const yTicks = [maxBars, Math.round(maxBars * 0.66), Math.round(maxBars * 0.33), 0];

  return (
    <article className="panel wide">
      <h2>Contribuables par régime et TVA</h2>
      <div className="chart-axis-label">Nombre de dossiers</div>
      <div className="chart-layout">
        <div className="chart-y-axis">
          {yTicks.map((tick) => (
            <span key={tick}>{formatAxisValue(tick)}</span>
          ))}
        </div>
        <div className="bar-chart">
          <div className="chart-grid-lines">
            {yTicks.slice(0, -1).map((tick) => (
              <i key={tick} />
            ))}
          </div>
          {years.map((yearData) => (
            <div className="bar-group" key={yearData.year}>
              <div className="bars">
                <i
                  title={`IS: ${yearData.is}`}
                  style={{ height: `${(yearData.is / maxBars) * 100}%` }}
                />
                <i
                  title={`IR: ${yearData.ir}`}
                  style={{ height: `${(yearData.ir / maxBars) * 100}%` }}
                />
                <i
                  title={`TVA: ${yearData.tva}`}
                  style={{ height: `${(yearData.tva / maxBars) * 100}%` }}
                />
              </div>
              <small>{yearData.year}</small>
            </div>
          ))}
        </div>
      </div>
      <div className="chart-x-axis">Année</div>
      <p className="legend">
        <span className="is" /> IS <span className="ir" /> IR <span className="tva" /> Déclarations TVA
      </p>
    </article>
  );
}

/**
 * Graphique en Donut : Répartition des dossiers entre régime IS et régime IR
 * Utilisé dans le Tableau Décisionnel
 */
export function RegimeChart({ declarations = [] }) {
  const isCount = declarations.filter((d) => getRegime(d) === 'IS').length;
  const irCount = declarations.length - isCount;
  const isPercentage = declarations.length ? (isCount / declarations.length) * 100 : 0;

  return (
    <article className="panel">
      <h2>Répartition IS / IR</h2>
      <div className="donut" style={{ '--is': `${isPercentage}%` }}>
        <strong>{declarations.length}</strong>
        <small>dossiers</small>
      </div>
      <p className="split">
        IS {isCount} ({getRegimePercentage(isCount, declarations.length)} %) · IR {irCount} (
        {getRegimePercentage(irCount, declarations.length)} %)
      </p>
    </article>
  );
}

/**
 * Graphique en courbes : Comparaison TVA payée vs TVA théorique par régime (IS ou IR)
 * Utilisé dans le Tableau Décisionnel
 */
export function CurveChart({ curve }) {
  const max = Math.max(
    ...curve.expected.concat(curve.paid).map((point) => point.amount),
    1
  );
  const yTicks = [max, Math.round(max * 0.5), Math.round(max * 0.25), 0];

  return (
    <article className="panel">
      <h2>Écart {curve.regime} : payé / théorique</h2>
      <div className="chart-axis-label">Montant en Ar</div>
      <div className="chart-layout">
        <div className="chart-y-axis">
          {yTicks.map((tick) => (
            <span key={tick}>{formatAxisValue(tick)}</span>
          ))}
        </div>
        <div className="line-chart">
          <div className="chart-grid-lines">
            {yTicks.slice(0, -1).map((tick) => (
              <i key={tick} />
            ))}
          </div>
          <div className="line-svg-layer">
            <MiniLine data={curve.expected} color="#2563eb" max={max} />
            <MiniLine data={curve.paid} color="#f59e0b" max={max} />
          </div>
          <div className="line-x-labels">
            {curve.expected.map((point) => (
              <span key={point.year}>{point.year}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="chart-x-axis">Année</div>
      <p className="legend">
        <span className="expected" /> Théorique <span className="paid" /> Payé
      </p>
    </article>
  );
}

/**
 * Graphique en barres pour la fiche d'un contribuable spécifique
 * Utilisé dans ContribuableDetail
 */
export function ContribVolumeChart({ annualData = [], maxBars = 1, currentRegime = 'IS' }) {
  return (
    <article className="contrib-chart-panel">
      <div className="chart-panel-heading">
        <div>
          <p className="eyebrow">Volume annuel</p>
          <h2>TVA et régime {currentRegime} sur 5 ans</h2>
        </div>
        <span>Nombre de dossiers</span>
      </div>
      <div
        className="contrib-bars"
        aria-label={`Nombre de dossiers TVA et ${currentRegime} par année`}
      >
        {annualData.map((item) => (
          <div className="contrib-bar-group" key={item.year}>
            <div className="contrib-bars-columns">
              <i
                className="bar-tva"
                style={{ height: `${(item.tva / maxBars) * 100}%` }}
                title={`TVA : ${item.tva}`}
              />
              <i
                className={`bar-regime bar-${currentRegime.toLowerCase()}`}
                style={{ height: `${(item.regimeCount / maxBars) * 100}%` }}
                title={`${currentRegime} : ${item.regimeCount}`}
              />
            </div>
            <strong>{item.year}</strong>
          </div>
        ))}
      </div>
      <p className="legend">
        <span className="tva" /> TVA{' '}
        <span className={currentRegime === 'IS' ? 'is' : 'ir'} /> {currentRegime}
      </p>
    </article>
  );
}

/**
 * Graphique de comparaison TVA théorique vs TVA payée pour un contribuable
 * Utilisé dans ContribuableDetail
 */
export function ContribComparisonChart({ curveData = [], curveMax = 1, currentRegime = 'IS' }) {
  return (
    <article className="contrib-chart-panel">
      <div className="chart-panel-heading">
        <div>
          <p className="eyebrow">Comparaison récente</p>
          <h2>TVA {currentRegime} : payé / théorique</h2>
        </div>
        <span>Montant en Ar</span>
      </div>
      <div
        className="gap-chart"
        aria-label="Comparaison entre TVA effectivement payée et TVA théorique"
      >
        <div className="gap-axis">
          <span>{formatCompact(curveMax)}</span>
          <span>{formatCompact(curveMax / 2)}</span>
          <span>0</span>
        </div>
        <div className="gap-plot">
          <div className="chart-grid-lines">
            <i />
            <i />
            <i />
          </div>
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            role="img"
            aria-label="Courbes TVA payée et TVA théorique"
          >
            <polyline
              points={buildChartPoints(
                curveData.map((item) => item.theoretical),
                curveMax
              )}
              fill="none"
              stroke="#2563eb"
              strokeWidth="3"
              vectorEffect="non-scaling-stroke"
            />
            <polyline
              points={buildChartPoints(
                curveData.map((item) => item.paid),
                curveMax
              )}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="3"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <div className="gap-labels">
            {curveData.map((item) => (
              <span key={item.year}>{item.year}</span>
            ))}
          </div>
        </div>
      </div>
      <p className="legend">
        <span className="expected" /> TVA théorique{' '}
        <span className="paid" /> TVA payée
      </p>
    </article>
  );
}
