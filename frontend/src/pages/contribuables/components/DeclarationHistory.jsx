import { formatAriary, toNumber } from '../../../utils/formatters';

function declarationCategory(ca) {
  const amount = toNumber(ca);
  if (amount >= 400_000_000) return ['Grand', 'badge critique'];
  if (amount >= 100_000_000) return ['Moyen', 'badge surveillance'];
  return ['Petit', 'badge conforme'];
}

export default function DeclarationHistory({ declarations, onOpenDeclaration }) {
  return <>
    <div className="history-heading"><h2>Historique des déclarations</h2><span>{declarations.length} déclaration(s)</span></div>
    <div className="table-wrap"><table><thead><tr><th>Année</th><th>Chiffre d'affaires</th><th>Catégorie</th><th>TVA collectée</th><th>TVA déductible</th><th>TVA payée</th><th>TVA théorique</th><th>Statut</th></tr></thead>
      <tbody>{declarations.map((declaration) => { const [category, badge] = declarationCategory(declaration.ca); return <tr key={declaration.id_declaration} className="clickable-row" title="Voir le détail de cette déclaration" onClick={() => onOpenDeclaration(declaration)}><td><strong>{declaration.annee}</strong></td><td>{formatAriary(declaration.ca)}</td><td><span className={badge}>{category}</span></td><td>{formatAriary(declaration.tva_collectee)}</td><td>{formatAriary(declaration.tva_deductible)}</td><td><strong>{formatAriary(declaration.tva_payee)}</strong></td><td>{formatAriary(declaration.tva_theorique)}</td><td>{declaration.statut || 'Conforme'}</td></tr>; })}</tbody>
    </table></div>
  </>;
}
