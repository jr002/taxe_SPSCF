import { useMemo, useState } from 'react';

import { formatAriary, toNumber } from '@/utils';

const STATUT_DECLARATION = {
  conforme: { label: 'Conforme', badge: 'conforme' },
  alerte: { label: 'À surveiller', badge: 'surveillance' },
  critique: { label: 'Point critique', badge: 'critique' },
  non_conforme: { label: 'Écart constaté', badge: 'surveillance' },
  'primitive_envoyée': { label: 'Notification primitive', badge: 'primitive' },
  'primitive_envoyee': { label: 'Notification primitive', badge: 'primitive' },
  'définitive_envoyée': { label: 'Notification définitive', badge: 'definitive' },
  'definitive_envoyee': { label: 'Notification définitive', badge: 'definitive' },
};

const STATUT_DROIT = {
  demande: { label: 'Demande en cours', badge: 'surveillance' },
  reponse: { label: 'Réponse reçue', badge: 'conforme' },
  partiel: { label: 'Réponse partielle', badge: 'surveillance' },
  relance: { label: 'Relance émise', badge: 'critique' },
  sans_suite: { label: 'Sans suite', badge: 'critique' },
};

const STATUT_RAPPROCHEMENT = {
  rapproche: { label: 'Rapproché', badge: 'conforme' },
  valide: { label: 'Validé', badge: 'conforme' },
  a_verifier: { label: 'À vérifier', badge: 'surveillance' },
  ecart: { label: 'Écart', badge: 'critique' },
  rejete: { label: 'Rejeté', badge: 'critique' },
  annule: { label: 'Annulé', badge: 'surveillance' },
};

const TYPE_TIER_LABELS = {
  banque: 'Banque',
  assurance: 'Assurance',
  administration: 'Administration',
  notaire: 'Notaire',
  fournisseur: 'Fournisseur',
  client: 'Client',
  autre: 'Autre',
};

const SOURCE_LABELS = {
  tiers_declarant: 'Tiers déclarant',
  banque: 'Banque',
  fournisseur: 'Fournisseur',
  client: 'Client',
  administration: 'Administration',
  assurance: 'Assurance',
  notaire: 'Notaire',
  autre: 'Autre',
};

const OPERATION_LABELS = {
  vente: 'Vente',
  achat: 'Achat',
  service: 'Service',
  autre: 'Autre',
};

const TYPE_RAPPROCHEMENT_LABELS = {
  exact: 'Exact',
  tolerance: 'Tolérance',
  partiel: 'Partiel',
  manuel: 'Manuel',
};

const TYPE_RELANCE_LABELS = {
  rappel1: 'Premier rappel',
  rappel2: 'Deuxième rappel',
  mise_en_demeure: 'Mise en demeure',
  demande_eclaircissement: "Demande d'éclaircissements",
};

const formatDate = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('fr-FR');
};

const formatDateLongue = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('fr-FR', { dateStyle: 'long' });
};

const libelleBrut = (value) => String(value || '—').replaceAll('_', ' ');
const statutDeclaration = (value) =>
  STATUT_DECLARATION[String(value || '').toLocaleLowerCase('fr')]
  || { label: libelleBrut(value), badge: '' };
const statutDroit = (value) => STATUT_DROIT[String(value || '')] || { label: libelleBrut(value), badge: '' };
const statutRapprochement = (value) =>
  STATUT_RAPPROCHEMENT[String(value || '')] || { label: libelleBrut(value), badge: '' };
const typeRapprochement = (value) =>
  TYPE_RAPPROCHEMENT_LABELS[String(value || '')] || libelleBrut(value);

const ecartDeclaration = (declaration) =>
  Math.max(0, toNumber(declaration.tva_theorique) - toNumber(declaration.tva_payee));

const hauteurBarre = (valeur, maximum) => {
  if (valeur <= 0) return 0;
  return Math.max(2, Math.round((valeur / maximum) * 100));
};

export default function SituationFiscale({ dossier, expiration, onFermer }) {
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

  const conseils = [];
  if (declarations.length === 0) {
    conseils.push("Aucune déclaration TVA n'est encore enregistrée. Contactez votre centre gestionnaire si vous avez déjà déposé une déclaration.");
  } else if (synthese.ecartTotal > 0) {
    conseils.push(`Un écart cumulé de ${formatAriary(synthese.ecartTotal)} est enregistré entre la TVA théorique et la TVA payée. Vérifiez vos déclarations et préparez vos justificatifs de paiement.`);
  } else {
    conseils.push('Vos paiements couvrent la TVA théorique enregistrée. Conservez vos déclarations et justificatifs de paiement.');
  }
  if (prochaineEcheance) {
    conseils.push(`Une réponse à la notification primitive de l'exercice ${prochaineEcheance.annee} est attendue avant le ${formatDateLongue(prochaineEcheance.date_limite_reponse)}. Transmettez vos observations et pièces justificatives à votre centre gestionnaire.`);
  }
  if (netDefinitif > 0) {
    conseils.push(`Le montant net restant à payer au titre des notifications définitives s'élève à ${formatAriary(netDefinitif)}. Rapprochez-vous de votre centre pour les modalités de règlement.`);
  }
  if (relancesEnCours.length > 0) {
    conseils.push(`${relancesEnCours.length} relance(s) sont en cours. Une régularisation ou un justificatif transmis au centre permet de clore le suivi.`);
  }
  if (rapprochementsAVerifier.length > 0) {
    conseils.push(`${rapprochementsAVerifier.length} rapprochement(s) restent à vérifier. Préparez les factures et documents correspondant aux montants indiqués.`);
  }

  const statutConformite = String(situation?.statut_conformite || '').toLocaleLowerCase('fr');
  const badgeConformite = statutConformite.includes('règle') && !statutConformite.includes('non')
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
          <div><dt>Centre gestionnaire</dt><dd>{contribuable.centres?.nom_centre || 'Non renseigné'}</dd></div>
          <div><dt>Situation d'activité</dt><dd><span className="badge conforme">{situation?.statut_activite || 'Actif'}</span></dd></div>
          <div><dt>Conformité enregistrée</dt><dd><span className={`badge ${badgeConformite}`}>{situation?.statut_conformite || 'En règle'}</span></dd></div>
        </dl>
      </section>

      <p className="dossier-lecture">
        <strong>Comment lire cette page.</strong> Elle présente vos données fiscales telles
        qu'elles sont enregistrées par la DGI. Aucune modification n'est possible ici : pour
        corriger une information ou transmettre une pièce, contactez votre centre gestionnaire.
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
          <small>Montant calculé d'après les déclarations</small>
        </article>
        <article>
          <span>Écart constaté</span>
          <strong>{formatAriary(synthese.ecartTotal)}</strong>
          <small>Cumul des écarts positifs</small>
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
        <h2>Pénalités, échéances et conseils</h2>
        <ul className="portail-conseils">
          {conseils.map((conseil) => <li key={conseil}>{conseil}</li>)}
        </ul>
        <div className="rule-box">
          <strong>À retenir sur les pénalités.</strong>
          <span> L'amende de 40 % liée à un redressement ne devient exigible qu'après la notification définitive. Une notification primitive ouvre d'abord un délai pour répondre et fournir vos justificatifs.</span>
        </div>

        <h3>Vos notifications</h3>
        {notifications.length > 0 ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Exercice</th><th>Acte</th><th>Date</th><th>Réponse avant le</th><th>Montant net</th></tr>
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
              <table>
                <thead><tr><th>Date</th><th>Type</th><th>Exercice</th><th>Montant concerné</th><th>Situation</th></tr></thead>
                <tbody>
                  {relances.map((row) => (
                    <tr key={row.id_relance}>
                      <td>{formatDate(row.date_emission)}</td>
                      <td>{TYPE_RELANCE_LABELS[row.type_relance] || libelleBrut(row.type_relance)}</td>
                      <td>{row.annee}</td>
                      <td>{formatAriary(row.montant_du)}</td>
                      <td>{row.statut === 'emise' ? 'En cours' : row.statut === 'regularisee' ? 'Régularisée' : libelleBrut(row.statut)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        )}
      </section>

      <section className="panel portail-section">
        <h2>Historique de vos déclarations TVA</h2>
        {declarations.length > 0 ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Exercice</th><th>Période</th><th>TVA collectée</th><th>TVA déductible</th><th>TVA payée</th><th>TVA théorique</th><th>Écart</th><th>Situation</th></tr>
              </thead>
              <tbody>
                {declarations.map((row) => {
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
                      <td className={ecart > 0 ? 'ecart-cell' : ''}>{formatAriary(ecart)}</td>
                      <td><span className={`badge ${statut.badge}`}>{statut.label}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty">Aucune déclaration TVA enregistrée pour ce dossier.</p>
        )}
      </section>

      <section className="panel portail-section">
        <h2>Droits de communication</h2>
        <p className="portail-section-intro">Demandes de documents ou d'informations adressées aux tiers dans le cadre de votre dossier.</p>
        {droits.length > 0 ? (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Date de demande</th><th>Tiers</th><th>Type de tiers</th><th>Objet</th><th>Statut</th><th>Réponse</th></tr></thead>
              <tbody>
                {droits.map((row) => {
                  const statut = statutDroit(row.statut);
                  return (
                    <tr key={row.id_droit}>
                      <td>{formatDate(row.date_demande)}</td>
                      <td><strong>{row.tier}</strong></td>
                      <td>{TYPE_TIER_LABELS[row.type_tier] || libelleBrut(row.type_tier)}</td>
                      <td>{row.objet}</td>
                      <td><span className={`badge ${statut.badge}`}>{statut.label}</span></td>
                      <td>{formatDate(row.date_reponse)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty">Aucun droit de communication enregistré sur votre dossier.</p>
        )}
      </section>

      <section className="panel portail-section">
        <h2>Recoupements</h2>
        <p className="portail-section-intro">Montants issus de sources externes et comparés aux éléments de votre dossier.</p>
        {recoupements.length > 0 ? (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Période</th><th>Source</th><th>Opération</th><th>Montant déclaré</th><th>Montant TVA</th><th>Somme recoupée</th></tr></thead>
              <tbody>
                {recoupements.map((row) => (
                  <tr key={row.id_recoupement}>
                    <td><strong>{row.periode || formatDate(row.date_operation)}</strong></td>
                    <td>{SOURCE_LABELS[row.source] || libelleBrut(row.source)}</td>
                    <td>{OPERATION_LABELS[row.type_operation] || libelleBrut(row.type_operation)}</td>
                    <td>{formatAriary(row.montant_declare)}</td>
                    <td>{formatAriary(row.montant_tva)}</td>
                    <td><strong>{formatAriary(row.somme_recoupee)}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty">Aucun recoupement enregistré sur votre dossier.</p>
        )}
      </section>

      <section className="panel portail-section">
        <h2>Rapprochement et confrontation</h2>
        <p className="portail-section-intro">Ces lignes comparent vos montants déclarés aux montants recoupés. Un écart à vérifier n'est pas, à lui seul, une notification de redressement.</p>
        {rapprochements.length > 0 ? (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Date</th><th>Référence</th><th>Type</th><th>Montant déclaré</th><th>Montant recoupé</th><th>Écart</th><th>Statut</th></tr></thead>
              <tbody>
                {rapprochements.map((row) => {
                  const statut = statutRapprochement(row.statut);
                  const reference = row.declarations
                    ? `Déclaration ${row.declarations.periode || row.declarations.annee || ''}`
                    : `Recoupement ${row.recoupements?.periode || ''}`;
                  return (
                    <tr key={row.id_rapprochement}>
                      <td>{formatDate(row.date_rapprochement)}</td>
                      <td>{reference.trim()}</td>
                      <td>{typeRapprochement(row.type_rapprochement)}</td>
                      <td>{formatAriary(row.montant_declare)}</td>
                      <td>{formatAriary(row.montant_recoupe)}</td>
                      <td className={toNumber(row.ecart) !== 0 ? 'ecart-cell' : ''}>{formatAriary(row.ecart)}</td>
                      <td><span className={`badge ${statut.badge}`}>{statut.label}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty">Aucun rapprochement enregistré sur votre dossier.</p>
        )}
        <div className="rule-box portail-que-faire">
          <strong>Que faire en cas d'écart ?</strong>
          <span> Repérez la période et les montants concernés, réunissez factures, relevés et preuves de paiement, puis transmettez-les à votre centre gestionnaire. Ne créez pas de nouveau compte et ne communiquez pas vos pièces à un tiers inconnu.</span>
        </div>
      </section>

      <footer className="portail-footer">
        Consultation en lecture seule · Lien valable jusqu'au {formatDateLongue(expiration)}.
        Les montants et statuts affichés sont ceux enregistrés dans votre dossier fiscal.
      </footer>
    </>
  );
}
