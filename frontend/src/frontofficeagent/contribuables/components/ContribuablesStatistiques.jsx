import { useMemo } from 'react';
import { Camembert, Histogramme } from '@/components/charts';
import { AideTerme } from '@/frontofficeagent/aide';
import { formatEcart } from '@/frontofficeagent/confrontation/utils/confrontation.utils.js';
import { syntheseConformitePortefeuille } from '@/frontofficeagent/confrontation/utils/conformiteRecoupee.utils.js';
import { PROCEDURES, buildStatistiques } from '@/frontofficeagent/contribuables/utils/statistiques.utils';
import { formatAriary, formatNumber } from '@/utils';

const series = PROCEDURES.map((procedure) => ({
  key: procedure.key,
  label: procedure.short,
  couleur: procedure.couleur,
}));

// Mêmes couleurs que les badges de conformité recoupée et les écarts du dossier :
// vert conforme, ambre à vérifier, rouge en écart, gris non recoupé.
const ETATS_REPARTITION = [
  { id: 'conforme', label: 'Conforme (recoupé)', couleur: '#237a43' },
  { id: 'a_verifier', label: 'À vérifier', couleur: '#f2b84b' },
  { id: 'en_ecart', label: 'En écart', couleur: '#b42318' },
  { id: 'non_recoupe', label: 'Non recoupé', couleur: '#98a2b3' },
];

const seriesConfrontation = [
  { key: 'declare', label: 'CA déclaré', couleur: '#1769aa' },
  { key: 'recoupe', label: 'Recoupé TTC', couleur: '#138b79' },
];

export default function ContribuablesStatistiques({ contribuables = [], confrontationParContribuable }) {
  const stats = useMemo(() => buildStatistiques(contribuables), [contribuables]);
  const conformite = useMemo(
    () => syntheseConformitePortefeuille(contribuables, confrontationParContribuable),
    [contribuables, confrontationParContribuable]
  );

  const slicesConformite = ETATS_REPARTITION.map((etat) => ({
    ...etat,
    valeur: conformite.repartition[etat.id],
  }));
  const groupsConfrontation = [{
    label: 'Portefeuille confronté',
    valeurs: { declare: conformite.caDeclare, recoupe: conformite.recoupe },
  }];

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
      <div className="section-heading">
        <div>
          <h2><AideTerme id="conformite_recoupee">Conformité recoupée</AideTerme> du portefeuille</h2>
          <p>
            L’écart général compare le chiffre d’affaires déclaré aux montants recoupés
            auprès des tiers, sur les dossiers déjà confrontés. Un dossier sans
            confrontation active reste « non recoupé » : il n’est pas présumé conforme.
          </p>
        </div>
      </div>

      <div className="kpis">
        <article>
          <span>Dossiers confrontés</span>
          <strong>{formatNumber(conformite.confrontes)} / {formatNumber(conformite.total)}</strong>
        </article>
        <article>
          <span><AideTerme id="ecart_general">Écart général cumulé</AideTerme></span>
          <strong style={{ color: conformite.ecartTotal > 0 ? '#b42318' : '#237a43' }}>
            {conformite.confrontes ? formatEcart(conformite.ecartTotal) : '—'}
          </strong>
        </article>
        <article>
          <span><AideTerme id="ca">CA déclaré confronté</AideTerme></span>
          <strong>{conformite.confrontes ? formatAriary(conformite.caDeclare) : '—'}</strong>
        </article>
        <article>
          <span><AideTerme id="recoupement">Montant recoupé TTC</AideTerme></span>
          <strong>{conformite.confrontes ? formatAriary(conformite.recoupe) : '—'}</strong>
        </article>
      </div>

      <p className="split">
        Écart = CA déclaré − montant recoupé : positif, le déclaré dépasse le recoupé
        (« déclaré plus ») ; négatif, le recoupé dépasse le déclaré. Seuls les
        rapprochements actifs (hors rejetés et annulés) entrent dans ces totaux.
      </p>

      <div className="contrib-chart-grid">
        <Camembert
          title="Dossiers par conformité recoupée"
          hint="Nombre de dossiers du périmètre"
          slices={slicesConformite}
          formatValue={formatNumber}
          centerLabel="dossiers"
        />
        {conformite.confrontes > 0 ? (
          <Histogramme
            title="CA déclaré contre montant recoupé"
            hint="Ariary · dossiers confrontés"
            xLabel="Portefeuille"
            groups={groupsConfrontation}
            series={seriesConfrontation}
          />
        ) : (
          <article className="panel">
            <h2>CA déclaré contre montant recoupé</h2>
            <div className="chart-axis-label">Ariary · dossiers confrontés</div>
            <p className="empty">
              Aucun dossier confronté pour l’instant. Lancez la confrontation depuis un
              dossier pour comparer le déclaré au recoupé.
            </p>
          </article>
        )}
      </div>

      <div className="section-heading">
        <div>
          <h2>Procédures et redressements déclarés</h2>
          <p>
            Partition VSP / CSP déduite des déclarations enregistrées. Elle lit le
            déclaratif saisi au fichier, sans lien avec la conformité recoupée ci-dessus.
          </p>
        </div>
      </div>

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