import { Link } from 'react-router-dom';

import { formatAriary } from '@/utils';

/** Codes de nature d'impôt tels que saisis au dossier, en clair. */
const REGIME_LIBELLES = {
  IS: 'IS — Impôt Synthétique',
  IR: 'IR — Impôt sur le revenu',
};

/** Une carte « libellé / valeur » du bloc nature d'impôt. */
function Fait({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default function ClassificationPanel({ fiche, idContribuable, regimeDeclare, reference }) {
  const { ca, annee } = reference || { ca: 0, annee: null };

  return (
    <div className="classification-panel" style={{ borderLeftColor: fiche.couleur }}>
      <div className="classification-panel-header">
        <span
          className="classification-panel-badge"
          style={{ background: fiche.background, color: fiche.couleur }}
        >
          {fiche.label}
        </span>
        <span className="classification-panel-seuil">
          {annee
            ? `Catégorie calculée sur le chiffre d’affaires ${annee} : ${formatAriary(ca)} — ${fiche.seuil}`
            : `Aucune déclaration enregistrée : fiche affichée par défaut — ${fiche.seuil}`}
        </span>
      </div>

      {!annee && (
        <div className="classification-panel-section">
          <p>
            Ce dossier ne comporte aucune déclaration : la catégorie ne peut pas être
            déduite d’un chiffre d’affaires. La fiche ci-dessous est celle du{' '}
            <strong>petit contribuable</strong>, retenue par défaut.{' '}
            <Link className="detail-back-link" to={`/contribuables/${idContribuable}/declarations`}>
              Enregistrer une déclaration
            </Link>
          </p>
        </div>
      )}

      <div className="classification-panel-section">
        <h3>
          💰 Ce que paie ce contribuable <small>({fiche.refArticle})</small>
        </h3>
        <div className="declaration-summary">
          <Fait
            label="Nature d’impôt portée au dossier"
            value={REGIME_LIBELLES[regimeDeclare] || 'Non renseignée'}
          />
          <Fait label="Impôt dû selon la catégorie" value={fiche.impots} />
          <Fait label="Régime" value={fiche.regimeDetaille} />
          <Fait label="TVA" value={fiche.tva} />
          <Fait label="Comptabilité" value={fiche.comptabilite} />
          <Fait
            label="Conservation des pièces"
            value={fiche.conservation && `${fiche.conservation} après la clôture`}
          />
        </div>
        <p>{fiche.enPratique}</p>
        {regimeDeclare && fiche.codeImpot && regimeDeclare !== fiche.codeImpot && (
          <p>
            Attention : le dossier porte{' '}
            <strong>{REGIME_LIBELLES[regimeDeclare] || regimeDeclare}</strong> alors que la
            catégorie retient <strong>{fiche.impots}</strong>. À confirmer lors du contrôle.
          </p>
        )}
      </div>

      <div className="classification-panel-section">
        <h3>⏱️ Pénalités de retard de paiement</h3>
        <ul>
          {fiche.penaliteRetard.map((penalite) => (
            <li key={penalite}>{penalite}</li>
          ))}
        </ul>
      </div>

      <div className="classification-panel-section">
        <h3>⚠️ Amendes administratives</h3>
        <div className="amendes-grid">
          {fiche.amendes.map((amende) => (
            <div key={amende.motif} className="amende-card">
              <span className="amende-motif">{amende.motif}</span>
              <strong className="amende-montant">{formatAriary(amende.montant)}</strong>
              {amende.unite && <small className="amende-unite">{amende.unite}</small>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
