import { useEffect } from 'react';

import RefLegal from '@/components/common/RefLegal';
import Infobulle from '@/accountcontribuable/components/Infobulle';
import LegendeStatuts from '@/accountcontribuable/components/LegendeStatuts';
import {
  CATEGORIES,
  LECTURE_DU_DOSSIER,
  MONTANTS_EXPLIQUES,
  NOTE_DELAIS_RELANCE,
  PENALITES,
  PROCEDURE_ETAPES,
  QUESTIONS,
  RELANCES,
  SECURITE_LIEN,
  SECTIONS_AIDE,
  SOURCES_AIDE,
} from '@/accountcontribuable/data/aide.data';
import { REGLES, regle } from '@/accountcontribuable/data/regles.data';
import {
  STATUT_DECLARATION,
  STATUT_DROIT,
  STATUT_RAPPROCHEMENT,
  STATUT_RELANCE,
  TYPE_RAPPROCHEMENT,
  TYPE_RELANCE,
} from '@/accountcontribuable/data/statuts.data';
import { TEXTES_CITES, VERIFICATION_TEXTES } from '@/data/textesFiscaux.data';
import { formatDateLongue } from '@/accountcontribuable/utils/portail.utils';

/**
 * Page d'aide du portail contribuable : les clés de lecture de l'écran et les
 * repères légaux réellement appliqués par l'application. Aucune valeur n'est
 * calculée ici : le contenu vient de `data/aide.data.js`, et chaque référence
 * d'article vient du registre `data/regles.data.js`, où elle a été confrontée au
 * PDF officiel de l'éditeur.
 *
 * Le renvoi au texte est un lien, plus une puce de texte libre. Une rubrique
 * marquée d'une `regleId` ouvre donc le PDF à l'article cité — et quand l'article
 * ne dit pas ce que l'application affiche, la puce prend l'aspect d'un
 * avertissement et la phrase d'écart s'affiche à côté : le lien est gardé, parce
 * que c'est en ouvrant l'article que le lecteur vérifie lui-même. Une règle sans
 * source du registre (écart, tolérance, délais de relance, sécurité du lien)
 * n'affiche aucun lien et le dit.
 */

/** Titre d'une rubrique du sommaire, réutilisé par les renvois internes. */
const titreSection = (id) => SECTIONS_AIDE.find((item) => item.id === id)?.titre || id;

/** Un terme de la page, expliqué au survol par la forme courte du registre. */
function Terme({ id, children }) {
  const entree = regle(id);
  if (!entree) return <>{children}</>;
  return <Infobulle texte={entree.regle}>{children}</Infobulle>;
}

/** Renvoi vers la rubrique qui développe la règle citée dans une réponse. */
function RenvoiRegle({ id }) {
  const entree = regle(id);
  if (!entree) return null;
  return (
    <a className="portail-aide-renvoi" href={`#${entree.section}`}>
      {`Voir « ${titreSection(entree.section)} »`}
    </a>
  );
}

/**
 * La puce de référence d'une règle du registre : le lien ouvre le texte officiel,
 * `detail` laisse la phrase d'écart visible quand l'article ne couvre pas la
 * valeur affichée. Une règle interne au système rend `null` — jamais de puce vide.
 */
function SourceRegle({ id, detail = false }) {
  return (
    <RefLegal
      source={regle(id)?.source}
      detail={detail}
      className="portail-aide-puce portail-aide-ref"
    />
  );
}

/**
 * Les puces d'une cellule du tableau des catégories : la ligne énonce une
 * obligation de texte, la puce ouvre ce texte. `sources` accepte une entrée du
 * registre ou plusieurs (le taux de 5 % et son taux de 3 % pour les nouveaux
 * adhérents d'un CGA) ; une colonne sans source reste une précision du système.
 */
function PucesSource({ source }) {
  const sources = [].concat(source ?? []).filter(Boolean);
  if (!sources.length) return null;
  return (
    <span className="portail-aide-textes">
      {sources.map((entree) => (
        <RefLegal key={entree.article} source={entree} compact />
      ))}
    </span>
  );
}

/**
 * Pied d'une réponse d'aide : la puce du texte officiel, puis le renvoi à la
 * rubrique qui développe la règle. Rien ne s'affiche quand la question
 * n'est rattachée à aucune règle du registre.
 */
function PiedReponse({ regleId, aussiId }) {
  const ids = [...new Set([regleId, aussiId].filter(Boolean).filter((id) => regle(id)))];
  if (ids.length === 0) return null;
  const sourcées = ids.filter((id) => regle(id)?.source);
  return (
    <>
      {sourcées.length > 0 && (
        <p className="portail-aide-textes">
          {sourcées.map((id) => (
            <SourceRegle key={id} id={id} />
          ))}
        </p>
      )}
      <div className="portail-aide-renvois">
        {ids.map((id) => (
          <RenvoiRegle key={id} id={id} />
        ))}
      </div>
    </>
  );
}

/**
 * Les puces de référence d'une étape de la procédure, dans l'ordre : la règle de
 * l'étape puis celle demandée par `aussiId`, sans jamais répéter la même. Une
 * règle sans source officielle n'a pas de lien à proposer ; si aucune des deux
 * n'est sourcée, le bloc ne rend tout simplement pas de paragraphe.
 */
function SourcesEtape({ etape }) {
  const ids = [...new Set([etape.regleId, etape.aussiId].filter(Boolean))].filter(
    (id) => regle(id)?.source,
  );
  if (ids.length === 0) return null;
  return (
    <p className="portail-aide-textes">
      {ids.map((id) => (
        <SourceRegle key={id} id={id} detail />
      ))}
    </p>
  );
}

/**
 * Rubriques liées, déduites du registre : dès qu'une règle rattachée à la
 * rubrique en cours renvoie ailleurs, le lien est proposé en pied de rubrique.
 */
function RenvoisSection({ id }) {
  const autres = [...new Set(Object.values(REGLES)
    .filter((entree) => entree.section === id && entree.aussi)
    .map((entree) => entree.aussi))];
  if (autres.length === 0) return null;
  return (
    <nav className="portail-aide-renvois" aria-label="Rubriques liées">
      <span>Aussi dans l’aide</span>
      {autres.map((autre) => (
        <a key={autre} href={`#${autre}`}>{titreSection(autre)}</a>
      ))}
    </nav>
  );
}

export default function AideContribuable({
  section,
  onRetour,
  expiration,
  libelleRetour = 'Retour à mon dossier',
}) {
  useEffect(() => {
    if (section) {
      // Ouverture demandée depuis une section du dossier : on arrive sur la rubrique visée.
      const element = document.getElementById(section);
      if (!element) return;
      element.scrollIntoView({ block: 'start', behavior: 'smooth' });
      element.querySelector('h2')?.focus({ preventScroll: true });
      return;
    }
    // Ouverture générale : on reste en haut, sommaire visible, et le focus
    // entre dans le titre de la page plutôt que de rester sur le bouton appelant.
    window.scrollTo({ top: 0 });
    document.querySelector('.portail-aide-titre')?.focus({ preventScroll: true });
  }, [section]);

  return (
    <>
      <section className="page-heading portail-heading">
        <div className="portail-heading-top">
          <div>
            <p className="eyebrow">Aide · Lecture seule</p>
            <h1 className="portail-aide-titre" tabIndex={-1}>Comprendre votre dossier fiscal</h1>
            <p>
              Les mots de cette page, les délais et les textes qui s'appliquent à votre dossier,
              tels que la DGI les applique dans ce système.
            </p>
          </div>
          <div className="portail-actions">
            <button type="button" className="secondary" onClick={() => window.print()}>
              Imprimer / enregistrer en PDF
            </button>
            <button type="button" className="primary" onClick={onRetour}>
              {libelleRetour}
            </button>
          </div>
        </div>

        <nav className="portail-aide-sommaire" aria-label="Sommaire de l'aide">
          {SECTIONS_AIDE.map((item) => (
            <a key={item.id} href={`#${item.id}`}>{item.titre}</a>
          ))}
        </nav>
      </section>

      <section className="panel portail-section portail-aide" id="lire">
        <h2 tabIndex={-1}>Comment lire cette page</h2>
        <p className="portail-section-intro">
          Cet espace est une restitution de votre dossier fiscal, telle que la DGI l'a enregistrée.
          Vous ne pouvez rien y modifier : une correction se demande à votre centre gestionnaire.
          Dans l'ordre des panneaux que vous parcourez :
        </p>
        <dl className="portail-aide-dl">
          {LECTURE_DU_DOSSIER.map((bloc) => (
            <div key={bloc.titre}>
              <dt>{bloc.titre}</dt>
              <dd>{bloc.texte}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="panel portail-section portail-aide" id="montants">
        <h2 tabIndex={-1}>Les montants et l’écart</h2>
        <p className="portail-section-intro">
          La comparaison qui occupe la page se lit ainsi. La formule de l’écart est celle du système :
          la TVA théorique moins la TVA payée, quand le résultat est positif.
        </p>
        <div className="table-wrap">
          <table aria-label="Définition des montants affichés">
            <thead><tr><th>Montant</th><th>Ce qu’il signifie</th></tr></thead>
            <tbody>
              {MONTANTS_EXPLIQUES.map((ligne) => (
                <tr key={ligne.terme}>
                  <th scope="row"><Terme id={ligne.regleId}>{ligne.terme}</Terme></th>
                  <td>
                    {ligne.definition}
                    <SourceRegle id={ligne.regleId} detail />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="rule-box">
          <strong>Un écart n’est pas une dette.</strong>
          <span> Il signale une différence à expliquer. Ce qui devient exigible est le montant arrêté
            par une notification définitive, après que vous avez pu répondre.</span>
        </div>
        <RenvoisSection id="montants" />
      </section>

      <section className="panel portail-section portail-aide" id="confrontation">
        <h2 tabIndex={-1}>Recoupements et confrontation</h2>
        <p className="portail-section-intro">
          La confrontation compare deux familles de chiffres : ceux que vous avez déclarés et les{' '}
          <Terme id="recoupement">montants obtenus légalement auprès de tiers</Terme> — banques,
          fournisseurs, clients, administrations — dans le cadre des droits de communication. Chaque ligne{' '}
          <Terme id="rapprochement">rapprochée</Terme> reçoit un type (l’écart admis par la règle de
          rapprochement est qualifié de « <Terme id="tolerance">tolérance</Terme> ») et un statut.
        </p>
        <h3>Statuts de rapprochement</h3>
        <LegendeStatuts entrees={Object.values(STATUT_RAPPROCHEMENT)} ariaLabel="Statuts de rapprochement" />
        <h3>Types de rapprochement</h3>
        <LegendeStatuts entrees={Object.values(TYPE_RAPPROCHEMENT)} ariaLabel="Types de rapprochement" />
        <h3>Droits de communication</h3>
        <p className="portail-section-intro">
          <Terme id="droit_communication">
            Une demande adressée à un tiers pour obtenir des documents ou des informations
          </Terme>
          . Son statut dit où en est la réponse du tiers, pas l’état de votre imposition.
        </p>
        <LegendeStatuts entrees={Object.values(STATUT_DROIT)} ariaLabel="Statuts des droits de communication" />
        <p className="portail-aide-textes">
          <SourceRegle id="droit_communication" detail />
        </p>
        <RenvoisSection id="confrontation" />
      </section>

      <section className="panel portail-section portail-aide" id="procedure">
        <h2 tabIndex={-1}>La procédure contradictoire, étape par étape</h2>
        <p className="portail-section-intro">
          Aucun redressement ne devient définitif sans que vous ayez été informé et mis en mesure de
          répondre. Les actes se succèdent dans cet ordre, et chacun porte le lien de l’article qui
          l’organise : le PDF officiel s’ouvre, à l’éditeur et à la page cités.
        </p>
        <ol className="portail-aide-etapes">
          {PROCEDURE_ETAPES.map((etape) => (
            <li key={etape.numero}>
              <span className="portail-aide-numero" aria-hidden="true">{etape.numero}</span>
              <h3><Terme id={etape.regleId}>{etape.titre}</Terme></h3>
              <p className="portail-aide-refs">
                <span className="portail-aide-puce"><Terme id={etape.regleId}>{etape.delai}</Terme></span>
              </p>
              <p>{etape.texte}</p>
              <SourcesEtape etape={etape} />
            </li>
          ))}
        </ol>
        <div className="rule-box">
          <strong>Le point qui compte.</strong>
          <span> Tant que vous êtes à l’étape 1 ou 2, vous pouvez encore faire bouger le montant en
            produisant vos pièces. À l’étape 3, la dette est liquidée et </span>
          <Terme id="amende">l’amende de 40 % du principal</Terme>
          <span> devient exigible.</span>
        </div>
        <RenvoisSection id="procedure" />
      </section>

      <section className="panel portail-section portail-aide" id="delais">
        <h2 tabIndex={-1}>Délais, relances et pénalités</h2>
        <p className="portail-section-intro">
          Une somme restée impayée après notification définitive suit la chaîne de recouvrement
          suivante. Les délais s’expriment en <Terme id="jours_francs">jours francs</Terme> : le jour
          d’envoi d’un acte n’est pas décompté.
        </p>
        <div className="portail-aide-delais">
          {RELANCES.map((relance) => (
            <article className="portail-aide-delai" key={relance.titre}>
              <strong><Terme id={relance.regleId}>{relance.titre}</Terme></strong>
              <span className="portail-aide-puce"><Terme id={relance.delaiId}>{relance.delai}</Terme></span>
              <p>{relance.texte}</p>
              <SourceRegle id={relance.regleId} />
            </article>
          ))}
        </div>
        <p className="portail-note">{NOTE_DELAIS_RELANCE}</p>
        <h3>Ce qui est dû, ce qui ne l’est pas encore</h3>
        <dl className="portail-aide-dl">
          {PENALITES.map((penalite) => (
            <div key={penalite.situation}>
              <dt><Terme id={penalite.regleId}>{penalite.situation}</Terme></dt>
              <dd>
                {penalite.regle}
                <SourceRegle id={penalite.regleId} detail />
              </dd>
            </div>
          ))}
        </dl>
        <RenvoisSection id="delais" />
      </section>

      <section className="panel portail-section portail-aide" id="categories">
        <h2 tabIndex={-1}>Catégories de contribuables et obligations</h2>
        <p className="portail-section-intro">
          <Terme id="categorie">La catégorie d’un dossier</Terme> se déduit du dernier chiffre
          d’affaires déclaré. Elle commande le régime d’imposition, la tenue de comptabilité et les
          obligations de conservation qui s’appliquent à vous.
        </p>
        <div className="table-wrap">
          <table aria-label="Catégories de contribuables et obligations">
            <thead><tr><th>Catégorie</th><th>Chiffre d’affaires</th><th>Impôts</th><th>Comptabilité</th></tr></thead>
            <tbody>
              {CATEGORIES.map((categorie) => (
                <tr key={categorie.label}>
                  <th scope="row">{categorie.label}</th>
                  <td>
                    {categorie.seuil}
                    <PucesSource source={categorie.sources?.seuil} />
                  </td>
                  <td>
                    {categorie.impots}
                    <PucesSource source={categorie.sources?.impots} />
                  </td>
                  <td>
                    {categorie.comptabilite}
                    <PucesSource source={categorie.sources?.comptabilite} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="portail-note">
          {' Le centre gestionnaire reste seul à décider du régime applicable à votre dossier ; ce '}
          tableau rappelle les seuils d’application généraux. Le{' '}
          <Terme id="tva_theorique">montant de TVA attendu</Terme>
          {' en découle.'}
        </p>
        <p className="portail-aide-textes">
          <SourceRegle id="categorie" detail />
        </p>
        <RenvoisSection id="categories" />
      </section>

      <section className="panel portail-section portail-aide" id="statuts">
        <h2 tabIndex={-1}>Glossaire des statuts de votre dossier</h2>
        <p className="portail-section-intro">
          Les mêmes mots que dans les tableaux, expliqués une fois pour toutes. La couleur d’un
          pastillage renforce le mot, elle ne le remplace pas.
        </p>
        <h3>Statut d’une déclaration</h3>
        <LegendeStatuts entrees={Object.values(STATUT_DECLARATION)} ariaLabel="Statuts de déclaration" />
        <h3>Statut d’une relance</h3>
        <LegendeStatuts entrees={Object.values(STATUT_RELANCE)} ariaLabel="Statuts de relance" />
        <h3>Type de relance</h3>
        <LegendeStatuts entrees={Object.values(TYPE_RELANCE)} ariaLabel="Types de relance" />
      </section>

      <section className="panel portail-section portail-aide" id="securite">
        <h2 tabIndex={-1}>Sécurité de votre lien d’accès</h2>
        <ul className="portail-aide-liste">
          {SECURITE_LIEN.map((item) => (
            <li key={item.texte}><Terme id={item.regleId}>{item.texte}</Terme></li>
          ))}
        </ul>
        <p className="portail-note">
          {expiration
            ? `Ce lien est valable jusqu’au ${formatDateLongue(expiration)}.`
            : 'Chaque lien porte sa propre date de fin de validité, rappelée en pied de page.'}
        </p>
        <RenvoisSection id="securite" />
      </section>

      <section className="panel portail-section portail-aide" id="questions">
        <h2 tabIndex={-1}>Questions fréquentes</h2>
        <div className="portail-aide-faq">
          {QUESTIONS.map((question) => (
            <details key={question.question}>
              <summary>{question.question}</summary>
              <p>{question.reponse}</p>
              <PiedReponse regleId={question.regleId} aussiId={question.aussiId} />
            </details>
          ))}
        </div>
        <h3>D’où viennent ces repères</h3>
        <ul className="portail-aide-liste">
          {SOURCES_AIDE.map((source) => <li key={source}>{source}</li>)}
        </ul>
        <ul className="portail-aide-textes-liste">
          {TEXTES_CITES.map((texte) => (
            <li key={texte.sigle}>
              <a
                className="ref-legale-lien"
                href={texte.url}
                target="_blank"
                rel="noopener noreferrer"
                title={`${texte.editeur} — ouvrir le PDF officiel`}
              >
                <span className="sr-only">Ouvrir le texte officiel — </span>
                {texte.titre}
                <span className="ref-legale-ouvert" aria-hidden="true">{' ↗'}</span>
              </a>
              <span className="portail-aide-texte-editeur">{texte.editeur}</span>
              {texte.observation && <span className="ref-legale-ecart">{texte.observation}</span>}
            </li>
          ))}
        </ul>
        <p className="portail-note">
          {`Vérification faite le ${VERIFICATION_TEXTES.date} — ${VERIFICATION_TEXTES.methode} `}
          <a href={VERIFICATION_TEXTES.annuaire} target="_blank" rel="noopener noreferrer">
            {`${VERIFICATION_TEXTES.annuaireLibelle} ↗`}
          </a>
        </p>
        <RenvoisSection id="questions" />
      </section>

      <footer className="portail-footer">
        Repères légaux : code des impôts et code des procédures fiscales, éditions consolidées 2025
        publiées par la Direction Générale des Impôts, tels que modifiés par la loi de finances
        n° 2025-021 pour 2026. Les articles cités sur cette page y ont été relus ; une puce marquée
        d’un avertissement signale que le texte n’énonce pas le chiffre affiché. Cette page éclaire la
        lecture de votre dossier ; elle ne vaut pas avis individuel — pour toute question sur une
        ligne, adressez-vous à votre centre gestionnaire.
      </footer>
    </>
  );
}
