import { useMemo, useState } from 'react';

import LegendeStatuts from '@/accountcontribuable/components/LegendeStatuts';
import LienAide from '@/accountcontribuable/components/LienAide';
import RegleFiscale from '@/accountcontribuable/components/RegleFiscale';
import {
  OPERATION_RECOUPEMENT,
  SOURCE_RECOUPEMENT,
  TYPE_TIER,
  libelleBrut,
  statutDeclaration,
  statutDroit,
  statutRapprochement,
  statutRelance,
  typeRapprochement,
  typeRelance,
} from '@/accountcontribuable/data/statuts.data';
import { formatDate, formatDateLongue } from '@/accountcontribuable/utils/portail.utils';
import { formatAriary, ouAbsent, toNumber, VALEUR_ABSENTE } from '@/utils';

/**
 * Les libellés et les sens des statuts viennent de
 * [`../data/statuts.data.js`](../data/statuts.data.js) : la fiche et la page
 * d'aide partagent une seule traduction, un écart de libellé entre les deux
 * écrans n'est plus possible.
 */

const ecartDeclaration = (declaration) =>
  Math.max(0, toNumber(declaration.tva_theorique) - toNumber(declaration.tva_payee));

const hauteurBarre = (valeur, maximum) => {
  if (valeur <= 0) return 0;
  return Math.max(2, Math.round((valeur / maximum) * 100));
};

/** Somme des écarts d'une famille de rapprochements, négatifs compris. */
const sommeEcarts = (lignes) => lignes.reduce((total, ligne) => total + toNumber(ligne.ecart), 0);

/**
 * Légende réduite aux statuts réellement présents dans le tableau : sous la
 * ligne, le contribuable ne lit que les mots qu'il vient de rencontrer.
 */
function legendePour(rows, selection) {
  const vus = new Map();
  (rows || []).forEach((row) => {
    const entree = selection(row);
    if (entree?.label && entree.sens && !vus.has(entree.label)) vus.set(entree.label, entree);
  });
  return [...vus.values()];
}

/** Ce à quoi la ligne est rattachée : une déclaration ou un recoupement. */
const referenceRapprochement = (row) => (row.declarations
  ? `Déclaration ${row.declarations.periode || row.declarations.annee || ''}`
  : `Recoupement ${row.recoupements?.periode || ''}`).trim();

/** Phrase de lecture d'une ligne de confrontation, écrite avec ses montants. */
function lectureRapprochement(row) {
  const declare = toNumber(row.montant_declare);
  const recoupe = toNumber(row.montant_recoupe);
  const ecart = toNumber(row.ecart);
  const reference = referenceRapprochement(row).toLocaleLowerCase('fr');

  if (ecart === 0) {
    return `Les ${formatAriary(declare)} déclarés concordent avec les ${formatAriary(recoupe)} recoupés sur ${reference}.`;
  }
  return `Vous avez déclaré ${formatAriary(declare)} ; le montant recoupé sur ${reference} est de ${formatAriary(recoupe)}, soit un écart de ${formatAriary(Math.abs(ecart))}.`;
}

/**
 * Un contribuable ne lit pas quarante lignes d'un coup : les listes ne montrent
 * que les lignes les plus récentes (le serveur les trie en sens inverse) et le
 * reste reste consultable, replié sous le même tableau.
 */
const LIGNES_VISIBLES = 10;

function ListeRepliable({ rows, Table, libelleSuite }) {
  const tete = rows.slice(0, LIGNES_VISIBLES);
  const reste = rows.slice(LIGNES_VISIBLES);
  return (
    <>
      <Table rows={tete} />
      {reste.length > 0 && (
        <details className="procedure-more">
          <summary>{libelleSuite(reste.length)}</summary>
          <Table rows={reste} replie />
        </details>
      )}
    </>
  );
}

/** Une ligne par déclaration : l'écart n'est écrit que s'il reste à couvrir. */
function TableauDeclarations({ rows, replie = false }) {
  return (
    <div className="table-wrap">
      <table aria-label={`Historique de vos déclarations TVA${replie ? ' (suite)' : ''}`}>
        <thead>
          <tr><th>Exercice</th><th>Période</th><th>TVA collectée</th><th>TVA déductible</th><th>TVA payée</th><th>TVA théorique</th><th>Écart</th><th>Situation</th></tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const ecart = ecartDeclaration(row);
            const statut = statutDeclaration(row.statut);
            return (
              <tr key={row.id_declaration}>
                <td><strong>{row.annee}</strong></td>
                <td>{row.periode || 'Année complète'}</td>
                <td>{formatAriary(row.tva_collectee)}</td>
                <td>{formatAriary(row.tva_deductible)}</td>
                <td><strong>{formatAriary(row.tva_payee)}</strong></td>
                <td>{formatAriary(row.tva_theorique)}</td>
                <td className={ecart > 0 ? 'ecart-cell' : ''}>
                  {formatAriary(ecart)}
                  {ecart > 0 && <span className="portail-ligne-note">TVA attendue non couverte</span>}
                </td>
                <td><span className={`badge ${statut.badge}`}>{statut.label}</span></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Les données externes qui servent de base à la confrontation. */
function TableauRecoupements({ rows, replie = false }) {
  return (
    <div className="table-wrap">
      <table aria-label={`Recoupements${replie ? ' (suite)' : ''}`}>
        <thead><tr><th>Période</th><th>Source</th><th>Opération</th><th>Montant déclaré</th><th>Montant TVA</th><th>Somme recoupée</th></tr></thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id_recoupement}>
              <td><strong>{row.periode || formatDate(row.date_operation)}</strong></td>
              <td>{SOURCE_RECOUPEMENT[row.source] || libelleBrut(row.source)}</td>
              <td>{OPERATION_RECOUPEMENT[row.type_operation] || libelleBrut(row.type_operation)}</td>
              <td>{formatAriary(row.montant_declare)}</td>
              <td>{formatAriary(row.montant_tva)}</td>
              <td><strong>{formatAriary(row.somme_recoupee)}</strong></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Lignes de confrontation attendant une explication, avec leur lecture en clair. */
function TableauRapprochements({ rows, replie = false }) {
  return (
    <div className="table-wrap">
      <table aria-label={`Rapprochements qui attendent une explication${replie ? ' (suite)' : ''}`}>
        <thead><tr><th>Date</th><th>Référence</th><th>Type</th><th>Montant déclaré</th><th>Montant recoupé</th><th>Écart</th><th>Statut</th></tr></thead>
        <tbody>
          {rows.map((row) => {
            const statut = statutRapprochement(row.statut);
            const ecart = toNumber(row.ecart);
            return (
              <tr key={row.id_rapprochement}>
                <td>{formatDate(row.date_rapprochement)}</td>
                <td>{referenceRapprochement(row)}</td>
                <td>
                  {typeRapprochement(row.type_rapprochement).label}
                  <span className="portail-ligne-note">{typeRapprochement(row.type_rapprochement).sens}</span>
                </td>
                <td>{formatAriary(row.montant_declare)}</td>
                <td>{formatAriary(row.montant_recoupe)}</td>
                <td className={ecart !== 0 ? 'ecart-cell' : ''}>
                  {formatAriary(row.ecart)}
                  <span className="portail-ligne-note">
                    {ecart > 0
                      ? 'Vous avez déclaré plus que le montant recoupé.'
                      : 'Vous avez déclaré moins que le montant recoupé.'}
                  </span>
                </td>
                <td>
                  <span className={`badge ${statut.badge}`}>{statut.label}</span>
                  <span className="portail-ligne-note">{statut.sens}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function SituationFiscale({ dossier, expiration, onFermer, onOuvrirAide }) {
  const [maintenant] = useState(() => Date.now());
  const { contribuable, situation } = dossier;
  const declarations = useMemo(() => dossier.declarations || [], [dossier.declarations]);
  const droits = dossier.droits_communication || [];
  const recoupements = dossier.recoupements || [];
  const rapprochements = dossier.rapprochements || [];
  const relances = dossier.relances || [];

  const synthese = useMemo(() => {
    const totalPayee = declarations.reduce((total, row) => total + toNumber(row.tva_payee), 0);
    const totalTheorique = declarations.reduce((total, row) => total + toNumber(row.tva_theorique), 0);
    const ecartTotal = declarations.reduce((total, row) => total + ecartDeclaration(row), 0);
    const sansEcart = declarations.filter((row) => ecartDeclaration(row) === 0).length;

    const parAnnee = new Map();
    declarations.forEach((row) => {
      const annee = Number(row.annee);
      if (!annee) return;
      const courant = parAnnee.get(annee) || { annee, payee: 0, theorique: 0 };
      courant.payee += toNumber(row.tva_payee);
      courant.theorique += toNumber(row.tva_theorique);
      parAnnee.set(annee, courant);
    });
    const exercices = [...parAnnee.values()].sort((a, b) => a.annee - b.annee).slice(-6);
    const maximum = Math.max(1, ...exercices.flatMap((row) => [row.payee, row.theorique]));

    return { totalPayee, totalTheorique, ecartTotal, sansEcart, exercices, maximum };
  }, [declarations]);

  const notifications = declarations.filter((row) =>
    row.date_notification_primitive || row.date_notification_definitive
    || ['PRIMITIVE_ENVOYÉE', 'DÉFINITIVE_ENVOYÉE'].includes(String(row.statut || '').toUpperCase())
  );
  const relancesEnCours = relances.filter((row) => row.statut === 'emise');
  const rapprochementsAVerifier = rapprochements.filter((row) =>
    ['a_verifier', 'ecart'].includes(row.statut)
  );
  const prochaineEcheance = declarations
    .filter((row) => row.date_limite_reponse && !row.date_notification_definitive)
    .filter((row) => new Date(row.date_limite_reponse).getTime() > maintenant)
    .sort((a, b) => new Date(a.date_limite_reponse) - new Date(b.date_limite_reponse))[0];
  const netDefinitif = declarations
    .filter((row) => row.date_notification_definitive)
    .reduce((total, row) => total + toNumber(row.montant_net_a_payer), 0);

  // Une ligne de confrontation mérite d'être lue quand la règle de rapprochement
  // n'a pas conclu : statut « à vérifier » ou « écart », ou montant qui ne
  // correspond pas. Les autres lignes concordantes sont repliées sous le tableau.
  const lignesALire = rapprochements.filter((row) =>
    ['a_verifier', 'ecart'].includes(row.statut) || toNumber(row.ecart) !== 0);
  const idsALire = new Set(lignesALire.map((row) => row.id_rapprochement));
  const lignesConcordantes = rapprochements.filter((row) => !idsALire.has(row.id_rapprochement));
  const ecartRapprochements = sommeEcarts(rapprochements);
  const lignePrioritaire = [...lignesALire].sort(
    (a, b) => Math.abs(toNumber(b.ecart)) - Math.abs(toNumber(a.ecart)),
  )[0];

  // Chaque conseil porte la règle dont il découle : le terme s'explique au survol
  // et le renvoi ouvre la page d'aide sur la rubrique qui la développe.
  const conseils = [];
  if (declarations.length === 0) {
    conseils.push({ texte: "Aucune déclaration TVA n'est encore enregistrée. Contactez votre centre gestionnaire si vous avez déjà déposé une déclaration." });
  } else if (synthese.ecartTotal > 0) {
    conseils.push({
      texte: `Un écart cumulé de ${formatAriary(synthese.ecartTotal)} est enregistré entre la TVA théorique et la TVA payée. Vérifiez vos déclarations et préparez vos justificatifs de paiement.`,
      regleId: 'ecart',
      terme: 'Comment l’écart est calculé',
    });
  } else {
    conseils.push({
      texte: 'Vos paiements couvrent la TVA théorique enregistrée. Conservez vos déclarations et justificatifs de paiement.',
      regleId: 'tva_theorique',
      terme: 'Comment la TVA attendue est calculée',
    });
  }
  if (prochaineEcheance) {
    conseils.push({
      texte: `Une réponse à la notification primitive de l'exercice ${prochaineEcheance.annee} est attendue avant le ${formatDateLongue(prochaineEcheance.date_limite_reponse)}. Transmettez vos observations et pièces justificatives à votre centre gestionnaire.`,
      regleId: 'delai_primitive',
      terme: 'Le délai de réponse',
    });
  }
  if (netDefinitif > 0) {
    conseils.push({
      texte: `Le montant net restant à payer au titre des notifications définitives s'élève à ${formatAriary(netDefinitif)}. Rapprochez-vous de votre centre pour les modalités de règlement.`,
      regleId: 'imputation',
      terme: 'Ce qui est devenu exigible',
    });
  }
  if (relancesEnCours.length > 0) {
    conseils.push({
      texte: `${relancesEnCours.length} relance(s) sont en cours. Une régularisation ou un justificatif transmis au centre permet de clore le suivi.`,
      regleId: 'relance_delais',
      terme: 'Le rythme des relances',
    });
  }
  if (rapprochementsAVerifier.length > 0) {
    conseils.push({
      texte: `${rapprochementsAVerifier.length} rapprochement(s) restent à vérifier. Préparez les factures et documents correspondant aux montants indiqués.`,
      regleId: 'tolerance',
      terme: 'La tolérance de rapprochement',
    });
  }

  // Un état non enregistré n'est pas un état « En règle » : le portail doit pouvoir
  // le dire. La classe neutrice `absent` remplace la couleur verte de conformité.
  const statutConformite = String(situation?.statut_conformite || '').toLocaleLowerCase('fr');
  const statutActivite = String(situation?.statut_activite || '').toLocaleLowerCase('fr');
  const badgeConformite = !situation?.statut_conformite
    ? 'absent'
    : statutConformite.includes('règle') && !statutConformite.includes('non')
      ? 'conforme'
      : 'surveillance';
  const badgeActivite = !situation?.statut_activite
    ? 'absent'
    : statutActivite === 'actif'
      ? 'conforme'
      : 'surveillance';

  return (
    <>
      <section className="page-heading portail-heading">
        <div className="portail-heading-top">
          <div>
            <p className="eyebrow">Ma situation fiscale · Lecture seule</p>
            <h1>{contribuable.raison_sociale}</h1>
            <p>{contribuable.secteur_activite || 'Secteur non renseigné'}</p>
          </div>
          <div className="portail-actions">
            <button type="button" className="primary" onClick={() => onOuvrirAide?.('')}>
              Aide &amp; repères légaux
            </button>
            <button type="button" className="secondary" onClick={() => window.print()}>
              Imprimer / enregistrer en PDF
            </button>
            <button type="button" className="secondary" onClick={onFermer}>
              Fermer le dossier
            </button>
          </div>
        </div>

        <dl className="declaration-detail-grid portail-identite">
          <div><dt>NIF</dt><dd>{contribuable.nif}</dd></div>
          <div><dt>Centre gestionnaire</dt><dd>{contribuable.centres?.nom_centre || VALEUR_ABSENTE}</dd></div>
          <div>
            <dt>Situation d'activité</dt>
            <dd>
              <span className={`badge ${badgeActivite}`}>
                {ouAbsent(situation?.statut_activite, 'Aucun statut enregistré')}
              </span>
            </dd>
          </div>
          <div>
            <dt>Conformité enregistrée</dt>
            <dd>
              <span className={`badge ${badgeConformite}`}>
                {ouAbsent(situation?.statut_conformite, 'Aucun statut enregistré')}
              </span>
            </dd>
          </div>
        </dl>
      </section>

      <p className="dossier-lecture">
        <strong>Comment lire cette page.</strong> Elle présente vos données fiscales telles
        qu'elles sont enregistrées par la DGI. Aucune modification n'est possible ici : pour
        corriger une information ou transmettre une pièce, contactez votre centre gestionnaire.
        <LienAide section="" onOuvrirAide={onOuvrirAide}>
          Ouvrir l’aide et les repères légaux
        </LienAide>
      </p>

      <section className="kpis" aria-label="Synthèse des taxes">
        <article>
          <span>TVA payée cumulée</span>
          <strong>{formatAriary(synthese.totalPayee)}</strong>
          <small>Toutes déclarations confondues</small>
        </article>
        <article>
          <span>TVA théorique attendue</span>
          <strong>{formatAriary(synthese.totalTheorique)}</strong>
          <small>
            <RegleFiscale id="tva_theorique" onOuvrirAide={onOuvrirAide} compact>
              Montant calculé d’après les déclarations
            </RegleFiscale>
          </small>
        </article>
        <article>
          <span>Écart constaté</span>
          <strong>{formatAriary(synthese.ecartTotal)}</strong>
          <small>
            <RegleFiscale id="ecart" onOuvrirAide={onOuvrirAide} compact>
              Cumul des écarts positifs
            </RegleFiscale>
          </small>
        </article>
        <article>
          <span>Déclarations sans écart</span>
          <strong>{synthese.sansEcart} / {declarations.length}</strong>
          <small>Déclarations TVA enregistrées</small>
        </article>
      </section>

      <section className="panel portail-section">
        <h2>Vos taxes par exercice</h2>
        {synthese.exercices.length > 0 ? (
          <>
            <div className="bar-chart" role="img" aria-label="Comparaison de la TVA payée et de la TVA théorique par exercice">
              {synthese.exercices.map((exercice) => (
                <div className="bar-group" key={exercice.annee}>
                  <div className="bars">
                    <i
                      style={{ height: `${hauteurBarre(exercice.payee, synthese.maximum)}%` }}
                      title={`TVA payée : ${formatAriary(exercice.payee)}`}
                    />
                    <i
                      style={{ height: `${hauteurBarre(exercice.theorique, synthese.maximum)}%` }}
                      title={`TVA théorique : ${formatAriary(exercice.theorique)}`}
                    />
                  </div>
                  <span>{exercice.annee}</span>
                </div>
              ))}
            </div>
            <p className="legend">
              <span aria-hidden="true" /> TVA payée
              <span className="paid" aria-hidden="true" /> TVA théorique
            </p>
          </>
        ) : (
          <p className="empty">Aucun exercice à comparer pour le moment.</p>
        )}
      </section>

      <section className="panel portail-section">
        <div className="portail-section-titre">
          <h2>Pénalités, échéances et conseils</h2>
          <LienAide section="procedure" onOuvrirAide={onOuvrirAide}>Comprendre la procédure</LienAide>
        </div>
        <p className="portail-section-intro">
          Les points ci-dessous sont calculés sur vos propres montants. Ils signalent ce qui appelle
          une action de votre côté ; ils ne remplacent pas un avis écrit du centre gestionnaire.
        </p>
        <ul className="portail-conseils">
          {conseils.map((conseil) => (
            <li key={conseil.texte}>
              {conseil.texte}
              {conseil.regleId && (
                <RegleFiscale
                  id={conseil.regleId}
                  onOuvrirAide={onOuvrirAide}
                  compact
                >
                  {conseil.terme}
                </RegleFiscale>
              )}
            </li>
          ))}
        </ul>
        <div className="rule-box">
          <strong>À retenir sur les pénalités.</strong>
          <span>
            {' L’'}
            <RegleFiscale id="amende" onOuvrirAide={onOuvrirAide} compact>
              amende de 40 %
            </RegleFiscale>
            {' liée à un redressement ne devient exigible qu’après la notification définitive. Une notification primitive ouvre d’abord un délai pour répondre et fournir vos justificatifs.'}
          </span>
        </div>

        <h3>Vos notifications</h3>
        {notifications.length > 0 ? (
          <div className="table-wrap">
            <table aria-label="Procédures contradictoires notifiées">
              <thead>
                <tr>
                  <th>Exercice</th>
                  <th>Acte</th>
                  <th>Date</th>
                  <th>
                    <RegleFiscale id="delai_primitive" onOuvrirAide={onOuvrirAide} compact>
                      Réponse avant le
                    </RegleFiscale>
                  </th>
                  <th>
                    <RegleFiscale id="imputation" onOuvrirAide={onOuvrirAide} compact>
                      Montant net
                    </RegleFiscale>
                  </th>
                </tr>
              </thead>
              <tbody>
                {notifications.map((row) => {
                  const statut = statutDeclaration(row.statut);
                  return (
                    <tr key={row.id_declaration}>
                      <td><strong>{row.annee}</strong><small>{row.periode || 'Année complète'}</small></td>
                      <td><span className={`badge ${statut.badge}`}>{statut.label}</span></td>
                      <td>{formatDate(row.date_notification_definitive || row.date_notification_primitive)}</td>
                      <td>{formatDate(row.date_limite_reponse)}</td>
                      <td><strong>{formatAriary(row.montant_net_a_payer || row.montant_redressement)}</strong></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty">Aucune procédure contradictoire enregistrée sur votre dossier.</p>
        )}

        {relances.length > 0 && (
          <details className="procedure-more">
            <summary>Relances enregistrées ({relances.length})</summary>
            <div className="table-wrap">
              <table aria-label="Relances enregistrées">
                <thead><tr><th>Date</th><th>Type</th><th>Exercice</th><th><RegleFiscale id="penalite_rappel" onOuvrirAide={onOuvrirAide} compact>Montant concerné</RegleFiscale></th><th>Situation</th></tr></thead>
                <tbody>
                  {relances.map((row) => (
                    <tr key={row.id_relance}>
                      <td>{formatDate(row.date_emission)}</td>
                      <td>
                        {typeRelance(row.type_relance).label}
                        <span className="portail-ligne-note">{typeRelance(row.type_relance).sens}</span>
                      </td>
                      <td>{row.annee}</td>
                      <td>{formatAriary(row.montant_du)}</td>
                      <td>
                        {statutRelance(row.statut).label}
                        <span className="portail-ligne-note">{statutRelance(row.statut).sens}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        )}
      </section>

      <section className="panel portail-section">
        <div className="portail-section-titre">
          <h2>Historique de vos déclarations TVA</h2>
          <LienAide section="montants" onOuvrirAide={onOuvrirAide}>Que signifie chaque montant ?</LienAide>
        </div>
        <p className="portail-section-intro">
          {' Une ligne par déclaration enregistrée. L’écart compare la TVA que la déclaration rend attendue (théorique) à celle que vous avez versée (payée) : il s’écrit uniquement quand la seconde est inférieure à la première. Le montant attendu dépend de la '}
          <RegleFiscale id="categorie" onOuvrirAide={onOuvrirAide} compact>
            catégorie de votre dossier
          </RegleFiscale>
          {', qui fixe le régime d’imposition applicable.'}
        </p>
        {declarations.length > 0 ? (
          <>
            <ListeRepliable
              rows={declarations}
              Table={TableauDeclarations}
              libelleSuite={(nombre) => `Afficher les déclarations les plus anciennes (${nombre})`}
            />
            <LegendeStatuts
              entrees={legendePour(declarations, (row) => statutDeclaration(row.statut))}
              ariaLabel="Statuts rencontrés dans vos déclarations"
            />
          </>
        ) : (
          <p className="empty">Aucune déclaration TVA enregistrée pour ce dossier.</p>
        )}
      </section>

      <section className="panel portail-section">
        <div className="portail-section-titre">
          <h2>Droits de communication</h2>
          <LienAide section="confrontation" onOuvrirAide={onOuvrirAide}>À quoi ça sert ?</LienAide>
        </div>
        <p className="portail-section-intro">
          <RegleFiscale id="droit_communication" onOuvrirAide={onOuvrirAide} compact>
            Demandes de documents ou d’informations adressées par la DGI à des tiers
          </RegleFiscale>
          {' — banque, fournisseur, administration — dans le cadre de votre dossier. Le statut dit où en est la '}
          réponse du tiers ; il ne préjuge pas de votre imposition.
        </p>
        {droits.length > 0 ? (
          <>
            <div className="table-wrap">
              <table aria-label="Droits de communication">
                <thead><tr><th>Date de demande</th><th>Tiers</th><th>Type de tiers</th><th>Objet</th><th>Statut</th><th>Réponse</th></tr></thead>
                <tbody>
                  {droits.map((row) => {
                    const statut = statutDroit(row.statut);
                    return (
                      <tr key={row.id_droit}>
                        <td>{formatDate(row.date_demande)}</td>
                        <td><strong>{row.tier}</strong></td>
                        <td>{TYPE_TIER[row.type_tier] || libelleBrut(row.type_tier)}</td>
                        <td>{row.objet}</td>
                        <td>
                          <span className={`badge ${statut.badge}`}>{statut.label}</span>
                          {statut.sens && <span className="portail-ligne-note">{statut.sens}</span>}
                        </td>
                        <td>{formatDate(row.date_reponse)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <LegendeStatuts
              entrees={legendePour(droits, (row) => statutDroit(row.statut))}
              ariaLabel="Statuts rencontrés dans les droits de communication"
            />
          </>
        ) : (
          <p className="empty">Aucun droit de communication enregistré sur votre dossier.</p>
        )}
      </section>

      <section className="panel portail-section">
        <div className="portail-section-titre">
          <h2>Recoupements</h2>
          <LienAide section="confrontation" onOuvrirAide={onOuvrirAide}>Comment lire ces montants ?</LienAide>
        </div>
        <p className="portail-section-intro">
          <RegleFiscale id="recoupement" onOuvrirAide={onOuvrirAide} compact>
            Montants issus de sources externes
          </RegleFiscale>
          {' — tiers déclarants, banques, fournisseurs — que la DGI rapproche des éléments de votre '}
          dossier. Ce sont les données de départ de la confrontation, présentée juste après.
        </p>
        {recoupements.length > 0 ? (
          <ListeRepliable
            rows={recoupements}
            Table={TableauRecoupements}
            libelleSuite={(nombre) => `Afficher les recoupements les plus anciens (${nombre})`}
          />
        ) : (
          <p className="empty">Aucun recoupement enregistré sur votre dossier.</p>
        )}
      </section>

      <section className="panel portail-section portail-confrontation">
        <div className="portail-section-titre">
          <h2>Rapprochement et confrontation</h2>
          <LienAide section="confrontation" onOuvrirAide={onOuvrirAide}>Comprendre la confrontation</LienAide>
        </div>
        <p className="portail-section-intro">
          <RegleFiscale id="rapprochement" onOuvrirAide={onOuvrirAide} compact>
            Chaque ligne met face à face un montant que vous avez déclaré et un montant obtenu auprès
            d’un tiers
          </RegleFiscale>
          {'. Trois issues : les deux chiffres concordent, ils diffèrent dans la '}
          <RegleFiscale id="tolerance" onOuvrirAide={onOuvrirAide} compact>
            tolérance admise par la règle de rapprochement
          </RegleFiscale>
          {', ou l’écart attend une explication de votre part. '}
          <strong>Un écart à vérifier n’est pas une notification de redressement.</strong>
        </p>

        {rapprochements.length > 0 && (
          <div className="portail-confront-kpis" role="group" aria-label="Synthèse de la confrontation">
            <article>
              <span>Lignes rapprochées</span>
              <strong>{rapprochements.length}</strong>
              <small>Comparaisons enregistrées</small>
            </article>
            <article>
              <span>À vous expliquer</span>
              <strong>{lignesALire.length}</strong>
              <small>
                <RegleFiscale id="seuil_redressement" onOuvrirAide={onOuvrirAide} compact>
                  Écart retenu ou reste à vérifier
                </RegleFiscale>
              </small>
            </article>
            <article>
              <span>Concordantes</span>
              <strong>{lignesConcordantes.length}</strong>
              <small>Aucune suite de votre côté</small>
            </article>
            <article>
              <span>Somme des écarts</span>
              <strong>{formatAriary(ecartRapprochements)}</strong>
              <small>Les écarts négatifs viennent en déduction</small>
            </article>
          </div>
        )}

        {lignePrioritaire && (
          <div className="portail-confront-focus">
            <p className="eyebrow">La ligne qui demande votre attention</p>
            <p>{lectureRapprochement(lignePrioritaire)}</p>
            <p className="portail-confront-focus-statut">
              <span className={`badge ${statutRapprochement(lignePrioritaire.statut).badge}`}>
                {statutRapprochement(lignePrioritaire.statut).label}
              </span>
              <span>{statutRapprochement(lignePrioritaire.statut).sens}</span>
            </p>
          </div>
        )}

        {lignesALire.length > 0 && (
          <ListeRepliable
            rows={lignesALire}
            Table={TableauRapprochements}
            libelleSuite={(nombre) => `Afficher les autres lignes à expliquer (${nombre})`}
          />
        )}

        {lignesConcordantes.length > 0 && (
          <details className="procedure-more">
            <summary>{lignesConcordantes.length} ligne(s) concordante(s) — aucun écart retenu</summary>
            <div className="table-wrap">
              <table aria-label="Rapprochements concordants">
                <thead><tr><th>Date</th><th>Référence</th><th>Type</th><th>Montant déclaré</th><th>Montant recoupé</th><th>Statut</th></tr></thead>
                <tbody>
                  {lignesConcordantes.map((row) => {
                    const statut = statutRapprochement(row.statut);
                    return (
                      <tr key={row.id_rapprochement}>
                        <td>{formatDate(row.date_rapprochement)}</td>
                        <td>{referenceRapprochement(row)}</td>
                        <td>{typeRapprochement(row.type_rapprochement).label}</td>
                        <td>{formatAriary(row.montant_declare)}</td>
                        <td>{formatAriary(row.montant_recoupe)}</td>
                        <td><span className={`badge ${statut.badge}`}>{statut.label}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </details>
        )}

        {rapprochements.length > 0
          ? <LegendeStatuts entrees={legendePour(rapprochements, (row) => statutRapprochement(row.statut))} ariaLabel="Statuts rencontrés dans la confrontation" />
          : (
            <p className="empty">
              Aucun rapprochement enregistré sur votre dossier : la DGI n’a encore comparé aucune de
              vos déclarations à des données venues de l’extérieur. Absence de rapprochement ne vaut
              ni contrôle achevé, ni conformité attestée.
            </p>
          )}

        <div className="rule-box portail-que-faire">
          <strong>Que faire en cas d'écart ?</strong>
          {lignesALire.length === 0 && (
            <p className="portail-que-faire-note">
              {rapprochements.length === 0
                ? 'Aucune comparaison n’a encore été faite sur votre dossier. La marche à suivre ci-dessous est celle qui s’appliquera si un écart est retenu plus tard.'
                : 'Toutes vos lignes concordent : rien n’attend une explication de votre part. La marche à suivre ci-dessous ne vous concernerait que si un écart était retenu.'}
            </p>
          )}
          <ol className="portail-que-faire-etapes">
            <li>
              {lignesALire.length > 0
                ? 'Repérez la période et les deux montants de la ligne, dans le tableau ci-dessus.'
                : 'Repérez, le cas échéant, la période et les deux montants de la ligne concernée.'}
            </li>
            <li>Réunissez les pièces qui expliquent la différence : factures, relevés bancaires, preuves de paiement.</li>
            <li>Transmettez-les à votre centre gestionnaire, indiqué sous votre NIF, en citant le NIF et l’exercice concerné.</li>
          </ol>
          <span className="portail-que-faire-note">
            Ne créez pas de nouveau compte et ne communiquez vos pièces à un tiers inconnu : la DGI
            ne demande de paiement que par les voies officielles de votre centre.
          </span>
          <LienAide section="procedure" onOuvrirAide={onOuvrirAide}>
            Quels sont vos droits pendant la procédure ?
          </LienAide>
        </div>
      </section>

      <footer className="portail-footer">
        Consultation en lecture seule · Lien valable jusqu'au {formatDateLongue(expiration)}.
        Les montants et statuts affichés sont ceux enregistrés dans votre dossier fiscal.
      </footer>
    </>
  );
}
