import { formatAriary } from '@/utils/formatters';

/**
 * Cartes de synthèse financière et détails déclaratifs d'une déclaration
 */
export default function DeclarationSummaryCards({
  declaration,
  ecart,
  statut,
  tauxEcart,
}) {
  const ecartLabel = tauxEcart === null
    ? 'TVA théorique non renseignée'
    : ecart > 0
      ? `${Number(tauxEcart).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} % de la TVA théorique`
      : 'Aucun écart à signaler';

  return (
    <>
      {/* Synthèse générale */}
      <div className="declaration-summary">
        <div>
          <span>Statut du dossier</span>
          <div className="summary-status">
            <span className={`badge ${statut.className}`}>{statut.label}</span>
          </div>
          {statut.hint && <small className="summary-hint">{statut.hint}</small>}
        </div>
        <div>
          <span>Écart de TVA</span>
          <strong style={{ color: ecart > 0 ? '#b91c1c' : '#15803d' }}>
            {formatAriary(ecart)}
          </strong>
          <small className="summary-hint">{ecartLabel}</small>
        </div>
      </div>

      {/* Détails déclaratifs */}
      <div className="declaration-detail-grid">
        <div>
          <dt>Chiffre d'affaires</dt>
          <dd>{formatAriary(declaration.ca)}</dd>
        </div>
        <div>
          <dt>Bénéfice déclaré</dt>
          <dd>{formatAriary(declaration.benefice)}</dd>
        </div>
        <div>
          <dt>TVA collectée</dt>
          <dd>{formatAriary(declaration.tva_collectee)}</dd>
        </div>
        <div>
          <dt>TVA déductible</dt>
          <dd>{formatAriary(declaration.tva_deductible)}</dd>
        </div>
        <div>
          <dt>TVA effectivement payée</dt>
          <dd>{formatAriary(declaration.tva_payee)}</dd>
        </div>
        <div>
          <dt>TVA théorique calculée</dt>
          <dd>{formatAriary(declaration.tva_theorique)}</dd>
        </div>
        <div>
          <dt>N° Enregistrement</dt>
          <dd>#{declaration.id_declaration}</dd>
        </div>
        <div>
          <dt>Dernière mise à jour</dt>
          <dd>
            {new Date(
              declaration.date_modification || declaration.date_creation
            ).toLocaleDateString('fr-FR')}
          </dd>
        </div>
      </div>
    </>
  );
}
