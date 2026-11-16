import { AideTerme } from '@/frontofficeagent/aide';
import { formatAriary, toNumber } from '@/utils';

const STATUTS_DECLARATION = {
  conforme: { label: 'En règle selon le dernier contrôle', niveau: 'conforme' },
  alerte: { label: 'À surveiller', niveau: 'alerte' },
  critique: { label: 'À régulariser', niveau: 'critique' },
  non_conforme: { label: 'Non conforme', niveau: 'critique' },
  primitive_envoyée: { label: 'Notification primitive envoyée', niveau: 'procedure' },
  primitive_envoyee: { label: 'Notification primitive envoyée', niveau: 'procedure' },
  définitive_envoyée: { label: 'Notification définitive émise', niveau: 'procedure' },
  definitive_envoyee: { label: 'Notification définitive émise', niveau: 'procedure' },
};

function getStatutDeclaration(declaration) {
  const statut = String(declaration?.statut || '').trim().toLocaleLowerCase('fr');
  return STATUTS_DECLARATION[statut] || {
    label: 'Statut non renseigné',
    niveau: 'inconnu',
  };
}

function montantRenseigne(value) {
  return value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value));
}

export default function ContribuableSituation({ declarations, fiche, relances, reference }) {
  const derniereDeclaration = declarations[0];
  const statut = getStatutDeclaration(derniereDeclaration);
  const declarationsAvecTvaPayee = declarations.filter((declaration) =>
    montantRenseigne(declaration.tva_payee),
  );
  const declarationsAvecTvaTheorique = declarations.filter((declaration) =>
    montantRenseigne(declaration.tva_theorique),
  );
  const declarationsComparables = declarations.filter((declaration) =>
    montantRenseigne(declaration.tva_theorique) && montantRenseigne(declaration.tva_payee),
  );
  const totalPaid = declarationsAvecTvaPayee.reduce(
    (total, declaration) => total + toNumber(declaration.tva_payee),
    0,
  );
  const totalTheorique = declarationsAvecTvaTheorique.reduce(
    (total, declaration) => total + toNumber(declaration.tva_theorique),
    0,
  );
  const ecartAExaminer = declarationsComparables.reduce(
    (total, declaration) =>
      total + Math.max(0, toNumber(declaration.tva_theorique) - toNumber(declaration.tva_payee)),
    0,
  );
  const relancesEmises = relances.filter((relance) => relance.statut === 'emise');
  const relancesAvecMontant = relancesEmises.filter((relance) => montantRenseigne(relance.montant_du));
  const montantRelancesEmises = relancesAvecMontant.reduce(
    (total, relance) => total + toNumber(relance.montant_du),
    0,
  );

  return (
    <section className="contribuable-overview-panel" aria-labelledby="contribuable-overview-title">
      <div className="contribuable-overview-heading">
        <div>
          <p className="eyebrow">Situation du dossier</p>
          <h2 id="contribuable-overview-title">La situation fiscale</h2>
          <p>Les indicateurs ci-dessous reprennent les informations enregistrées dans le dossier.</p>
        </div>
        <div className="contribuable-overview-status-wrap">
          <div className={`contribuable-overview-status ${statut.niveau}`} role="status">
            <span className="contribuable-overview-status-mark" aria-hidden="true">
              {statut.niveau === 'conforme' ? '✓' : statut.niveau === 'inconnu' ? '—' : '!'}
            </span>
            <span>
              <small>Dernier contrôle · {derniereDeclaration?.annee || 'aucun exercice'}</small>
              <strong>{statut.label}</strong>
            </span>
          </div>
        </div>
      </div>

      <div className="contribuable-overview-metrics">
        <article className="contribuable-overview-metric tva">
          <span><AideTerme id="tva_payee">TVA payée cumulée</AideTerme></span>
          <strong>{declarationsAvecTvaPayee.length ? formatAriary(totalPaid) : 'Non renseignée'}</strong>
          <small>
            TVA théorique : {declarationsAvecTvaTheorique.length
              ? formatAriary(totalTheorique)
              : 'non renseignée'}
          </small>
        </article>
        <article className="contribuable-overview-metric ecart">
          <span>Écart de TVA à examiner</span>
          <strong>{declarationsComparables.length ? formatAriary(ecartAExaminer) : 'Non calculable'}</strong>
          <small>
            {declarationsComparables.length
              ? `Sur ${declarationsComparables.length} déclaration(s) avec les deux montants renseignés ; ce n’est pas une dette liquidée.`
              : 'TVA payée et TVA théorique à renseigner pour calculer cet indicateur.'}
          </small>
        </article>
        <article className="contribuable-overview-metric relances">
          <span>Relances encore émises</span>
          <strong>{relancesEmises.length}</strong>
          <small>
            {relancesAvecMontant.length
              ? `Montant porté aux relances : ${formatAriary(montantRelancesEmises)}`
              : relancesEmises.length
                ? 'Montant non renseigné au dossier'
                : 'Aucune relance émise en cours'}
          </small>
        </article>
      </div>

      <div className="contribuable-overview-penalties">
        <div>
          <p className="eyebrow">
            {reference?.annee ? `Repère fiscal · ${fiche.label}` : 'Repère fiscal'}
          </p>
          <h3><AideTerme id="penalite_retard">Pénalités de retard</AideTerme></h3>
          {reference?.annee ? (
            <>
              <ul>
                {fiche.penaliteRetard.map((penalite) => <li key={penalite}>{penalite}</li>)}
              </ul>
              <p className="contribuable-overview-disclaimer">
                Barème indicatif de la catégorie : le montant des pénalités n’est pas calculé
                ni liquidé sur cet écran.
              </p>
            </>
          ) : (
            <p className="contribuable-overview-disclaimer">
              Catégorie non déterminée faute de déclaration : le barème ne peut pas être
              établi pour ce dossier.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
