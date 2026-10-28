import { Link } from 'react-router-dom';

import { buildPeriodOptions, formatAriary, formatDateTime, sourceLabel } from './utils';

const STEPS = [
  ['1', 'Vérifier la période', 'Contrôlez les exercices déclarés et les mois couverts par les sources externes.'],
  ['2', 'Lancer la comparaison', 'Le moteur rapproche chaque déclaration des recoupements de la même période.'],
  ['3', 'Analyser les écarts', 'Chaque écart est une différence à expliquer avec les pièces justificatives.'],
];

const centreGestionnaire = (contribuable) => {
  const reference = contribuable.centre_fiscal_ref?.trim();
  if (reference) {
    const index = reference.indexOf(':');
    return index >= 0 ? reference.slice(index + 1).trim() : reference;
  }
  return contribuable.centres?.nom_centre || 'Non renseigné';
};

export default function ConfrontationLaunch({
  contribuable,
  periode,
  onPeriodeChange,
  loading,
  result,
  error,
  onLaunch,
  onShowList,
  apercu = null,
  apercuLoading = false,
  readOnly = false,
}) {
  const declarations = Number(apercu?.declarations?.total ?? 0);
  const recoupements = Number(apercu?.recoupements?.total ?? 0);
  const annees = apercu?.declarations?.annees ?? [];
  const sources = apercu?.recoupements?.sources ?? [];
  const periodes = apercu?.recoupements?.periodes ?? [];
  const sansPeriode = Number(apercu?.recoupements?.sans_periode ?? 0);
  const missingDeclarations = Boolean(apercu) && declarations === 0;
  const missingRecoupements = Boolean(apercu) && recoupements === 0;
  const isAnnee = /^\d{4}$/.test(String(periode || ''));
  const { annees: optionsAnnees, mois: optionsMois } = buildPeriodOptions(apercu);

  const recoupementsParAnnee = new Map(
    (apercu?.recoupements?.annees ?? []).map((entree) => [String(entree.annee), entree.total]),
  );
  const anneeCible = periode ? String(periode).slice(0, 4) : '';
  const declarationsCiblees = periode
    ? annees
      .filter((entree) => String(entree.annee) === anneeCible)
      .reduce((cumul, entree) => cumul + entree.total, 0)
    : declarations;
  const recoupementsCibles = periode
    ? isAnnee
      ? (recoupementsParAnnee.get(periode) || 0)
      : (periodes.find((entree) => entree.periode === periode)?.total ?? 0)
    : recoupements;

  const comparaisons = periode
    ? declarationsCiblees * recoupementsCibles
    : annees.reduce(
      (cumul, entree) => cumul + entree.total * (recoupementsParAnnee.get(String(entree.annee)) || 0),
      0,
    );

  const canLaunch = !readOnly
    && !apercuLoading
    && (!apercu || (!missingDeclarations && !missingRecoupements && comparaisons > 0));

  const created = Number(result?.created ?? result?.count ?? 0);
  const existing = Number(result?.existing ?? 0);
  const ignored = Number(result?.ignored ?? 0);
  const total = Number(result?.count ?? created + existing);

  const results = Array.isArray(result?.rapprochements) ? result.rapprochements : [];
  const typeCount = (type) => results.filter((row) => row.type_rapprochement === type).length;
  const statusCount = (statut) => results.filter((row) => row.statut === statut).length;
  const aTraiter = statusCount('a_verifier') + statusCount('ecart');
  const statutCible = statusCount('a_verifier') > 0 ? 'a_verifier' : 'ecart';

  const anneesTexte = annees.length ? annees.map((entree) => entree.annee).join(' · ') : '—';
  const sourcesTexte = sources.length
    ? sources.map((entree) => `${sourceLabel(entree.source)} (${entree.total})`).join(' · ')
    : '—';

  const contexte = missingDeclarations
    ? 'Aucune déclaration n’est encore enregistrée pour ce contribuable.'
    : missingRecoupements
      ? 'Les sources externes n’ont encore signalé aucune opération pour ce contribuable.'
      : `Le contribuable a déclaré ${declarations} exercice(s). Les sources externes ont signalé ${recoupements} opération(s). La confrontation compare les deux.`;

  return (
    <div>
      <div className="cf-ccard">
        <p className="eyebrow">Contribuable sélectionné</p>
        <h2>{contribuable.raison_sociale}</h2>
        <div className="cf-contrib-info">
          <span>NIF : <strong>{contribuable.nif}</strong></span>
          <span>Centre gestionnaire : <strong>{centreGestionnaire(contribuable)}</strong></span>
          <span>Nature d’impôt : <strong>{contribuable.regime_fiscal || '—'}</strong></span>
        </div>
      </div>

      <div className="cf-form">
        <div className="section-heading">
          <span className="section-number">1</span>
          <div>
            <h2>Ce que la confrontation va comparer</h2>
            <p>Vérifiez les données disponibles, puis choisissez la période à confronter.</p>
          </div>
        </div>

        {readOnly && (
          <div className="rule-box">
            <strong>Consultation seule</strong>
            <span>Le rôle Inspecteur consulte les dossiers de tous les centres, mais ne peut pas lancer de confrontation ni modifier un rapprochement.</span>
          </div>
        )}

        {apercuLoading && <p className="status">Vérification des données disponibles…</p>}

        {!apercuLoading && !apercu && (
          <p className="status">L’aperçu des données est indisponible. La confrontation reste possible sans période.</p>
        )}

        {apercu && (
          <>
            <p className="cf-lead">{contexte}</p>

            <div className="cf-two-columns">
              <article className="comparison-panel">
                <div className="comparison-header">
                  <h2>Ce que le contribuable a déclaré</h2>
                  <span>{declarations} déclaration(s)</span>
                </div>
                <ul className="comparison-list">
                  <li className="comparison-item">
                    <span>Exercices déclarés</span>
                    <strong>{anneesTexte}</strong>
                  </li>
                  <li className="comparison-item">
                    <span>Chiffre d’affaires déclaré</span>
                    <strong>{formatAriary(apercu.declarations.ca_total)}</strong>
                  </li>
                </ul>
              </article>

              <article className="comparison-panel">
                <div className="comparison-header">
                  <h2>Ce que les autres sources disent</h2>
                  <span>{recoupements} recoupement(s)</span>
                </div>
                <ul className="comparison-list">
                  <li className="comparison-item">
                    <span>Sources signalées</span>
                    <strong>{sourcesTexte}</strong>
                  </li>
                  <li className="comparison-item">
                    <span>Montant total recoupé</span>
                    <strong>{formatAriary(apercu.recoupements.montant_total)}</strong>
                  </li>
                </ul>
              </article>
            </div>

            <p className="status">
              {apercu.rapprochements.total > 0
                ? `Dernière confrontation : ${formatDateTime(apercu.rapprochements.derniere_date)} · ${apercu.rapprochements.total} rapprochement(s) enregistré(s).`
                : 'Aucune confrontation lancée pour ce contribuable.'}
            </p>
          </>
        )}

        {missingDeclarations && (
          <div className="result-card alert">
            <h3>Aucune déclaration pour ce contribuable</h3>
            <p>La confrontation a besoin d’au moins une déclaration et un recoupement.</p>
            <Link className="primary" to={`/contribuables/${contribuable.id_contribuable}/declarations/nouveau`}>
              Enregistrer une déclaration
            </Link>
          </div>
        )}

        {!readOnly && missingRecoupements && (
          <div className="result-card alert">
            <h3>Aucun recoupement pour ce contribuable</h3>
            <p>Ajoutez d’abord une information de recoupement, puis relancez la confrontation.</p>
            <Link className="primary" to={`/contribuables/${contribuable.id_contribuable}/recoupements/nouveau`}>
              Enregistrer un recoupement
            </Link>
          </div>
        )}

        {apercu && !missingDeclarations && !missingRecoupements && (
          <>
            <div className="cf-two-columns">
              <label className="field" htmlFor="cf-periode">
                Période à confronter
                <select
                  id="cf-periode"
                  value={periode}
                  onChange={(event) => onPeriodeChange(event.target.value)}
                  disabled={readOnly || (optionsAnnees.length === 0 && optionsMois.length === 0)}
                >
                  <option value="">
                    Toutes les périodes ({recoupements - sansPeriode} recoupement(s) rattachable(s))
                  </option>
                  {optionsAnnees.length > 0 && (
                    <optgroup label="Exercices déclarés">
                      {optionsAnnees.map((entree) => (
                        <option key={entree.value} value={entree.value}>{entree.label}</option>
                      ))}
                    </optgroup>
                  )}
                  {optionsMois.length > 0 && (
                    <optgroup label="Mois recoupés">
                      {optionsMois.map((entree) => (
                        <option key={entree.value} value={entree.value}>{entree.label}</option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </label>
              <div className="sum-field">
                <span>Comparaisons prévues</span>
                <strong>{comparaisons}</strong>
              </div>
            </div>

            {sansPeriode > 0 && (
              <p className="status">
                {sansPeriode} recoupement(s) sans période ni date d’opération ne peuvent être rattachés à un
                exercice et restent hors comparaison.
              </p>
            )}

            {periode && recoupementsCibles === 0 && (
              <div className="result-card alert">
                <h3>Aucun recoupement pour cette période</h3>
                <p>
                  Choisissez un autre exercice ou un autre mois, ou « Toutes les périodes » pour
                  comparer l’ensemble des données.
                </p>
              </div>
            )}

            {!periode && comparaisons === 0 && (
              <div className="result-card alert">
                <h3>Aucune comparaison possible</h3>
                <p>
                  Aucun recoupement ne porte sur une année déclarée. Enregistrez un recoupement daté d’un
                  exercice déclaré, puis relancez.
                </p>
              </div>
            )}
          </>
        )}

        <div className="rule-box">
          <strong>Comment fonctionne la confrontation ?</strong>
          <span>
            Le moteur compare le chiffre d’affaires déclaré au montant recoupé (TTC). Un écart nul
            donne un rapprochement exact ; jusqu’à 1 000 Ar, il relève de la tolérance ; jusqu’à
            5 % du chiffre d’affaires déclaré, le rapprochement est partiel ; au-delà, l’écart est
            significatif. Un recoupement n’est jamais comparé à la déclaration d’une autre année.
          </span>
        </div>

        <div className="cf-steps">
          {STEPS.map(([numero, titre, texte]) => (
            <div className="cf-step" key={numero}>
              <span>{numero}</span>
              <strong>{titre}</strong>
              <p>{texte}</p>
            </div>
          ))}
        </div>

        <div className="form-actions">
          <button className="primary" type="button" onClick={onLaunch} disabled={loading || !canLaunch}>
            {loading
              ? 'Analyse en cours…'
              : apercu && !missingDeclarations && !missingRecoupements
                ? `Comparer ${declarationsCiblees} déclaration(s) à ${recoupementsCibles} recoupement(s)`
                : 'Lancer la confrontation'}
          </button>
        </div>
      </div>

      {error && <p className="form-submit-message error" role="alert">{error}</p>}

      {result && (
        <div className={`result-card ${total > 0 ? 'success' : 'alert'}`} role="status">
          <div>
            <p className="eyebrow subtle">Résultat de la confrontation</p>
            <h3>{total > 0 ? 'Comparaison terminée' : 'Aucun rapprochement trouvé'}</h3>
            {result.at && <p className="status">{formatDateTime(result.at)}</p>}
          </div>

          {total > 0 ? (
            <>
              <p>
                Nouveaux rapprochements créés : <strong>{created}</strong> · Déjà existants :{' '}
                <strong>{existing}</strong>
              </p>
              <p className="status">
                Types — Exact {typeCount('exact')} · Tolérance {typeCount('tolerance')} · Partiel{' '}
                {typeCount('partiel')} · Manuel {typeCount('manuel')}
              </p>
              <p className="status">
                Statuts — Rapproché {statusCount('rapproche')} · À vérifier {statusCount('a_verifier')} ·
                Écart {statusCount('ecart')} · Validé {statusCount('valide')}
              </p>
            </>
          ) : (
            <p>
              Aucun recoupement ne correspond à cette période. Vérifiez qu’un recoupement existe
              pour la période choisie, ou relancez l’analyse sans période.
            </p>
          )}

          {ignored > 0 && (
            <p>
              <strong>{ignored}</strong> recoupement(s) sans période exploitable ou rattaché(s) à un
              exercice absent n’ont pas pu être confrontés.
            </p>
          )}

          {total > 0 && (
            <div className="cf-actions">
              {aTraiter > 0 && (
                <button type="button" className="primary" onClick={() => onShowList({ statut: statutCible, periode })}>
                  Analyser les {aTraiter} rapprochement(s) à traiter
                </button>
              )}
              <button type="button" onClick={() => onShowList({ statut: '', periode })}>
                Voir tous les rapprochements
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
