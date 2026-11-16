import { useMemo, useState } from 'react';
import { VolumeChart, RegimeChart, CurveChart } from '@/components/charts';
import { AideLectureModal, AideTerme, BoutonAide } from '@/frontofficeagent/aide';
import useDecisionnelData from '@/frontofficeagent/decisionnel/hooks/useDecisionnelData.jsx';
import { buildYears, buildCurves } from '@/frontofficeagent/decisionnel/utils/decisionnel.utils.js';
import { formatCompact, formatNumber, toNumber } from '@/utils';

/**
 * Tableau de bord décisionnel : agrégats de déclarations et séries de pilotage.
 *
 * Deux horloges coexistent et le registre d'aide le dit : les cartes additionnent
 * toutes les lignes enregistrées dans le périmètre, les graphiques ne regardent
 * que les cinq exercices courants (`buildYears`). Un chiffre peut donc manquer d'un
 * bloc à l'autre sans que ce soit une contradiction.
 */
export default function TableauDecisionnel() {
  const { stats, declarations, error, loading } = useDecisionnelData();
  const [aideOuverte, setAideOuverte] = useState(false);

  const years = useMemo(() => buildYears(declarations), [declarations]);
  const curves = useMemo(() => buildCurves(years, declarations), [years, declarations]);

  const courbes = useMemo(
    () => curves.filter((c) => c.paid.some((p) => p.amount) || c.expected.some((p) => p.amount)),
    [curves]
  );

  // Les exercices réellement saisis, hors fenêtre des graphiques : c'est ce que
  // les cartes agrègent.
  const exercices = useMemo(() => {
    const ensemble = new Set();
    declarations.forEach((d) => {
      const annee = Number(d.annee);
      if (Number.isFinite(annee)) ensemble.add(annee);
    });
    return [...ensemble].sort((a, b) => a - b);
  }, [declarations]);

  if (loading) {
    return <p className="page status" role="status">Chargement des statistiques...</p>;
  }

  if (error) {
    return (
      <section className="page error">
        <h1>Statistiques indisponibles</h1>
        <p>{error}</p>
        <p>Vérifiez que le serveur backend et la base de données PostgreSQL sont bien en ligne.</p>
      </section>
    );
  }

  const total = toNumber(stats?.total);
  const conformes = toNumber(stats?.conformes);
  const alertes = toNumber(stats?.alertes);
  const critiques = toNumber(stats?.critiques);
  const tvaPayeeTotale = toNumber(stats?.tva_totale);
  const tvaTheoriqueTotale = toNumber(stats?.tva_theorique_totale);
  const caMoyen = toNumber(stats?.ca_moyen);
  const ecartTotal = toNumber(stats?.ecart_total);
  // Le serveur ne compte que trois statuts ; le reste des lignes (non conforme,
  // notifications) est soustrait plutôt qu'oublié.
  const autresStatuts = Math.max(
    0,
    total - conformes - alertes - critiques
  );
  // Absent du payload hors chef de centre : le serveur ne calcule le total
  // national que pour ce rôle.
  const tvaTheoriqueDgi = stats?.tva_theorique_dgi ? toNumber(stats.tva_theorique_dgi) : 0;
  const partNationale = tvaTheoriqueDgi
    ? Math.round((tvaTheoriqueTotale / tvaTheoriqueDgi) * 100)
    : null;

  return (
    <section className="page">
      <div className="page-heading">
        <p className="eyebrow">Pilotage stratégique</p>
        <h1>Statistiques</h1>
        <p>
          Les cartes agrègent les {formatNumber(total)} déclarations de TVA enregistrées dans{' '}
          <AideTerme id="perimetre_statistiques">votre périmètre</AideTerme>, toutes années
          confondues. Les graphiques ne portent que les{' '}
          <AideTerme id="fenetre_exercices">cinq derniers exercices</AideTerme>.
        </p>
        <div className="page-heading-aide">
          <BoutonAide ecran="statistiques" onOuvrir={() => setAideOuverte(true)} />
        </div>
      </div>

      {/* Cartes KPI : le `small` reprend les champs déjà renvoyés par le serveur
          que l'écran taisait, pour que chaque chiffre se lise avec sa composition. */}
      <div className="kpis decisionnel-kpis">
        <article>
          <span>
            <AideTerme id="declaration_enregistree">Déclarations enregistrées</AideTerme>
          </span>
          <strong>{formatNumber(total)}</strong>
          <small>
            {exercices.length
              ? `Exercices saisis : ${exercices[0]} à ${exercices[exercices.length - 1]} (${exercices.length})`
              : 'Aucun exercice saisi dans votre périmètre'}
          </small>
        </article>
        <article>
          <span>
              <AideTerme id="tva_payee">TVA déclarée (enregistrée)</AideTerme>
          </span>
          <strong>{formatCompact(tvaPayeeTotale)} Ar</strong>
          <small>Total des montants déclarés et enregistrés comme TVA payée.</small>
        </article>
        <article>
          <span>
            <AideTerme id="lignes_a_examiner">Lignes à examiner</AideTerme>
          </span>
          <strong>{formatNumber(alertes + critiques)}</strong>
          <small>
            {formatNumber(alertes)} alertes · {formatNumber(critiques)} critiques ·{' '}
            {formatNumber(conformes)} conformes · {formatNumber(autresStatuts)} autres statuts
          </small>
        </article>
        <article>
          <span>
            <AideTerme id="ecart_total">Écart de TVA</AideTerme>
          </span>
          <strong>{formatCompact(ecartTotal)} Ar</strong>
          <small>
            TVA théorique − TVA déclarée ·{' '}
            {ecartTotal > 0
              ? 'le versé reste en deçà de la référence'
              : ecartTotal < 0
                ? 'le versé dépasse la référence'
                : 'le versé égale la référence'}
          </small>
        </article>
        <article>
          <span>
            <AideTerme id="tva_theorique">TVA théorique attendue</AideTerme>
          </span>
          <strong>{formatCompact(tvaTheoriqueTotale)} Ar</strong>
          <small>
            <AideTerme id="ca_moyen">Chiffre d’affaires moyen</AideTerme> :{' '}
            {formatCompact(caMoyen)} Ar
          </small>
          {partNationale !== null && (
            <small>
              <AideTerme id="part_theorique_nationale">Part du théorique national</AideTerme> :{' '}
              {partNationale} %
            </small>
          )}
        </article>
      </div>

      {/* Grille des graphiques */}
      {declarations.length === 0 ? (
        <div className="panel">
          <p className="empty">
            Aucune déclaration enregistrée dans votre périmètre : les agrégats restent à zéro et
            aucun graphique n’a de matière. La saisie se mène depuis un dossier, dans l’onglet
            « Déclarations ».
          </p>
        </div>
      ) : (
        <div className="dashboard-grid">
          <VolumeChart years={years} />
          <RegimeChart declarations={declarations} />
          {courbes.map((curve) => (
            <CurveChart curve={curve} key={curve.regime} />
          ))}
        </div>
      )}

      <AideLectureModal
        ouvert={aideOuverte}
        ecran="statistiques"
        onFermer={() => setAideOuverte(false)}
      />
    </section>
  );
}
