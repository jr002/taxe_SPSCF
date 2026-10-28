import { useMemo } from 'react';
import { Camembert, Histogramme } from '../../../components/charts/Diagrammes';
import { formatAriary, formatNumber } from '../../../utils/formatters';
import { PROCEDURES, buildStatistiques } from '../utils/statistiques.utils';

const series = PROCEDURES.map((procedure) => ({
  key: procedure.key,
  label: procedure.short,
  couleur: procedure.couleur,
}));

export default function ContribuablesStatistiques({ contribuables = [] }) {
  const stats = useMemo(() => buildStatistiques(contribuables), [contribuables]);

  const groupsAnnee = stats.parAnnee.map((item) => ({
    label: item.label,
    valeurs: { VSP: item.VSP, CSP: item.CSP },
  }));
  const groupsCategorie = stats.parCategorie.map((item) => ({
    label: item.label,
    valeurs: { VSP: item.VSP, CSP: item.CSP },
  }));

  return (
    <>
      <div className="kpis">
        <article>
          <span>Déclarations suivies</span>
          <strong>{formatNumber(stats.totalDossiers)}</strong>
        </article>
        <article>
          <span>Dossiers en VSP</span>
          <strong>{formatNumber(stats.parProcedure[0]?.dossiers || 0)}</strong>
        </article>
        <article>
          <span>Dossiers en CSP</span>
          <strong>{formatNumber(stats.parProcedure[1]?.dossiers || 0)}</strong>
        </article>
        <article>
          <span>Redressements cumulés</span>
          <strong>{formatAriary(stats.totalRedresse)}</strong>
        </article>
      </div>

      <p className="split">
        Procédure déduite des données existantes : une déclaration notifiée ou portant un
        redressement est suivie en VSP (vérification sur place), les autres en CSP (contrôle sur
        pièces). {formatNumber(stats.dossiersRedresses)} déclaration(s) portent un redressement.
      </p>

      <div className="contrib-chart-grid">
        <Camembert
          title="Déclarations : redressements VSP / CSP"
          hint="Montant notifié en Ariary"
          slices={stats.parProcedure}
          formatValue={formatAriary}
          centerLabel="Ar redressés"
        />
        <Histogramme
          title="Déclarations VSP / CSP par année"
          hint="Nombre de dossiers"
          xLabel="Année"
          groups={groupsAnnee}
          series={series}
        />
      </div>

      <div className="contrib-chart-grid">
        <Camembert
          title="Redressements par nature d’impôt et procédure"
          hint="Montant notifié en Ariary · IS / IR / TVA × VSP / CSP"
          slices={stats.ventilation}
          formatValue={formatAriary}
          centerLabel="Ar redressés"
        />
        <Histogramme
          title="Dossiers par nature d’impôt et procédure"
          hint="Nombre de dossiers"
          xLabel="Nature d’impôt"
          groups={groupsCategorie}
          series={series}
        />
      </div>
    </>
  );
}
