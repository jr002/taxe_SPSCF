import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { getDeclarations, getErrorMessage } from '../api/api';
import { getContribuables } from '../utils/contribuables.utils';
import { getRegime } from '../utils/decisionnel.utils';
import { formatAriary, toNumber } from '../utils/formatters';
import {
  ContribVolumeChart,
  ContribComparisonChart,
} from '../components/charts/Diagrammes';

/**
 * Fiche détaillée d'un contribuable : historique des paiements et analyse graphique sur 5 ans
 */
export default function ContribuableDetail() {
  const { id } = useParams();
  const location = useLocation();
  const [declarations, setDeclarations] = useState(
    location.state?.contribuable?.declarations || []
  );
  const [loading, setLoading] = useState(!declarations.length);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
      try {
        const result = await getDeclarations({ limit: 10000 });
        const list = result.data || result;
        const found = getContribuables(list).find((item) => item.key === id);
        setDeclarations(found?.declarations || []);

        if (!found) {
          setError('Ce contribuable est introuvable.');
        }
      } catch (requestError) {
        setError(getErrorMessage(requestError));
      } finally {
        setLoading(false);
      }
    };

    if (!location.state?.contribuable?.declarations?.length) {
      loadHistory();
    }
  }, [id, location.state]);

  const contribuable = useMemo(() => declarations[0], [declarations]);
  const currentRegime = contribuable ? getRegime(contribuable) : 'IS';
  const totalPaid = declarations.reduce(
    (total, row) => total + toNumber(row.tva_payee),
    0
  );

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
        <h1>{contribuable.raison_sociale || 'Contribuable'}</h1>
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
              <th>TVA collectée</th>
              <th>TVA déductible</th>
              <th>TVA payée</th>
              <th>TVA théorique</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {declarations.map((declaration) => (
              <tr key={declaration.id_declaration}>
                <td>
                  <strong>{declaration.annee}</strong>
                </td>
                <td>{formatAriary(declaration.ca)}</td>
                <td>{formatAriary(declaration.tva_collectee)}</td>
                <td>{formatAriary(declaration.tva_deductible)}</td>
                <td>
                  <strong>{formatAriary(declaration.tva_payee)}</strong>
                </td>
                <td>{formatAriary(declaration.tva_theorique)}</td>
                <td>{declaration.statut || 'Conforme'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
