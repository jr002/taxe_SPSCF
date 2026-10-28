/**
 * Porte d'entrée des visualisations. Les huit graphiques sortent du même module :
 * le barrel est une façade, le module reste importable par son chemin.
 */
export {
  Camembert,
  Histogramme,
  MiniLine,
  VolumeChart,
  RegimeChart,
  CurveChart,
  ContribVolumeChart,
  ContribComparisonChart,
} from '@/components/charts/Diagrammes';
