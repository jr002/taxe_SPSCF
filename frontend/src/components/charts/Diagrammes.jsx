import { Fragment } from 'react';
import { formatAxisValue, formatCompact } from '@/utils/formatters';
import { getRegime, getRegimePercentage } from '@/utils/decisionnel.utils';

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
 * Calcul du chemin SVG d'un segment en anneau (camembert)
 */
function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function describeArc(centerX, centerY, innerRadius, outerRadius, startAngle, endAngle) {
  const adjustedEnd = endAngle - startAngle >= 360 ? startAngle + 359.999 : endAngle;
  const startOuter = polarToCartesian(centerX, centerY, outerRadius, adjustedEnd);
  const endOuter = polarToCartesian(centerX, centerY, outerRadius, startAngle);
  const startInner = polarToCartesian(centerX, centerY, innerRadius, startAngle);
  const endInner = polarToCartesian(centerX, centerY, innerRadius, adjustedEnd);
  const largeArcFlag = adjustedEnd - startAngle <= 180 ? '0' : '1';

  return [
    'M', startOuter.x, startOuter.y,
    'A', outerRadius, outerRadius, 0, largeArcFlag, 0, endOuter.x, endOuter.y,
    'L', startInner.x, startInner.y,
    'A', innerRadius, innerRadius, 0, largeArcFlag, 1, endInner.x, endInner.y,
    'Z',
  ].join(' ');
}

const formatPercentage = (value) =>
  value.toLocaleString('fr-FR', { maximumFractionDigits: 1 });

/**
 * Camembert générique : un anneau SVG découpé selon des tranches { label, valeur, couleur }
 */
export function Camembert({
  title,
  hint,
  slices = [],
  formatValue = (value) => formatAxisValue(value),
  centerValue,
  centerLabel = 'total',
}) {
  const exploitable = slices.filter((slice) => Number(slice.valeur) > 0);
  const total = exploitable.reduce((acc, slice) => acc + Number(slice.valeur), 0);
  const displayTotal = Number(centerValue ?? total);

  const segments = exploitable
    .reduce(
      (acc, slice) => {
        const startAngle = (acc.end / total) * 360;
        const end = acc.end + Number(slice.valeur);
        return {
          end,
          items: [
            ...acc.items,
            { ...slice, path: describeArc(100, 100, 52, 92, startAngle, (end / total) * 360) },
          ],
        };
      },
      { end: 0, items: [] }
    )
    .items;
  const legende = slices.map((slice) => ({
    ...slice,
    part: total ? (Number(slice.valeur) / total) * 100 : 0,
  }));

  return (
    <article className="panel">
      <h2>{title}</h2>
      {hint && <div className="chart-axis-label">{hint}</div>}
      {total > 0 && (
        <svg
          viewBox="0 0 200 200"
          width="100%"
          height="190"
          role="img"
          aria-label={title}
          style={{ display: 'block', margin: '0.5rem auto', maxWidth: 240 }}
        >
          {segments.map((segment) => (
            <path key={segment.id || segment.label} d={segment.path} fill={segment.couleur}>
              <title>{`${segment.label} : ${formatValue(segment.valeur)}`}</title>
            </path>
          ))}
          <text
            x="100"
            y="96"
            fill="currentColor"
            fontSize="21"
            fontWeight="700"
            textAnchor="middle"
          >
            {formatAxisValue(displayTotal)}
          </text>
          <text x="100" y="116" fill="#657083" fontSize="11" fontWeight="700" textAnchor="middle">
            {centerLabel}
          </text>
        </svg>
      )}
      <p className="legend">
        {legende.map((slice) => (
          <Fragment key={slice.id || slice.label}>
            <span style={{ background: slice.couleur }} />
            {' '}
            {`${slice.label} ${formatValue(slice.valeur)} (${formatPercentage(slice.part)} %)`}
            {'  '}
          </Fragment>
        ))}
      </p>
      {total === 0 && <p className="empty">Aucune donnée à représenter.</p>}
    </article>
  );
}

/**
 * Histogramme générique : groupes de barres (réutilise la charte des panneaux existants)
 * groups : [{ label, valeurs: { cle: nombre } }] · series : [{ key, label, couleur }]
 */
export function Histogramme({
  title,
  hint,
  xLabel,
  groups = [],
  series = [],
  formatTick = (value) => formatAxisValue(value),
}) {
  const max = Math.max(
    ...groups.flatMap((group) => series.map((serie) => Number(group.valeurs?.[serie.key]) || 0)),
    1
  );
  const yTicks = [max, Math.round(max * 0.66), Math.round(max * 0.33), 0];

  return (
    <article className="panel">
      <h2>{title}</h2>
      <div className="chart-axis-label">{hint}</div>
      <div className="chart-layout">
        <div className="chart-y-axis">
          {yTicks.map((tick) => (
            <span key={tick}>{formatTick(tick)}</span>
          ))}
        </div>
        <div className="bar-chart">
          <div className="chart-grid-lines">
            {yTicks.slice(0, -1).map((tick) => (
              <i key={tick} />
            ))}
          </div>
          {groups.map((group) => (
            <div className="bar-group" key={group.label}>
              <div className="bars">
                {series.map((serie) => {
                  const value = Number(group.valeurs?.[serie.key]) || 0;
                  return (
                    <i
                      key={serie.key}
                      title={`${group.label} · ${serie.label} : ${value}`}
                      style={{
                        height: `${(value / max) * 100}%`,
                        background: serie.couleur,
                      }}
                    />
                  );
                })}
              </div>
              <small>{group.label}</small>
            </div>
          ))}
        </div>
      </div>
      <div className="chart-x-axis">{xLabel}</div>
      <p className="legend">
        {series.map((serie) => (
          <Fragment key={serie.key}>
            <span style={{ background: serie.couleur }} /> {serie.label}
          </Fragment>
        ))}
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
