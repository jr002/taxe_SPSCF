import { formatAriary, toNumber } from '../../../utils/formatters';

const DECLARATION_STATUS_LABELS = {
  conforme: 'Conforme',
  alerte: 'Alerte',
  critique: 'Critique',
  non_conforme: 'Non conforme',
  primitive_envoyée: 'Notification primitive envoyée',
  définitive_envoyée: 'Notification définitive envoyée',
  primitive_envoyee: 'Notification primitive envoyée',
  definitive_envoyee: 'Notification définitive envoyée',
};

function declarationStatusLabel(statut) {
  if (!statut) return 'Conforme';
  return DECLARATION_STATUS_LABELS[String(statut).toLocaleLowerCase('fr')] || statut;
}

function getDeclarationCategory(revenue) {
  const amount = toNumber(revenue);

  if (amount >= 400_000_000) return ['Grand', 'badge critique'];
  if (amount >= 100_000_000) return ['Moyen', 'badge surveillance'];

  return ['Petit', 'badge conforme'];
}

function DeclarationRow({ declaration, onOpenDeclaration }) {
  const [category, badgeClass] = getDeclarationCategory(declaration.ca);

  return (
    <tr
      className="clickable-row"
      title="Voir le détail de cette déclaration"
      onClick={() => onOpenDeclaration(declaration)}
    >
      <td><strong>{declaration.annee}</strong></td>
      <td>{formatAriary(declaration.ca)}</td>
      <td><span className={badgeClass}>{category}</span></td>
      <td>{formatAriary(declaration.tva_collectee)}</td>
      <td>{formatAriary(declaration.tva_deductible)}</td>
      <td><strong>{formatAriary(declaration.tva_payee)}</strong></td>
      <td>{formatAriary(declaration.tva_theorique)}</td>
      <td>{declarationStatusLabel(declaration.statut)}</td>
    </tr>
  );
}

export default function DeclarationHistory({ declarations, onOpenDeclaration }) {
  return (
    <>
      <div className="history-heading">
        <h2>Historique des déclarations</h2>
        <span>{declarations.length} déclaration(s)</span>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Année</th>
              <th>Chiffre d'affaires</th>
              <th>Catégorie</th>
              <th>TVA collectée</th>
              <th>TVA déductible</th>
              <th>TVA payée</th>
              <th>TVA théorique</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {declarations.map((declaration) => (
              <DeclarationRow
                key={declaration.id_declaration}
                declaration={declaration}
                onOpenDeclaration={onOpenDeclaration}
              />
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
