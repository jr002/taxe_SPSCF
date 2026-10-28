import { formatAriary, toNumber } from '../../../utils/formatters';

function ContribuableRow({ contribuable, onOpenDetail }) {
  const latestDeclaration = contribuable.declarations[0];
  const totalPaid = contribuable.declarations.reduce(
    (total, declaration) => total + toNumber(declaration.tva_payee),
    0
  );

  const openDetail = () => onOpenDetail(contribuable);

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openDetail();
    }
  };

  return (
    <tr
      tabIndex="0"
      title="Afficher l'historique complet du contribuable"
      onClick={openDetail}
      onKeyDown={handleKeyDown}
    >
      <td>
        <strong>{contribuable.raison_sociale || 'Contribuable non renseigné'}</strong>
        <small>{contribuable.nif || 'NIF non renseigné'}</small>
      </td>
      <td>{latestDeclaration?.annee || 'N/A'}</td>
      <td>{contribuable.declarations.length} déclaration(s)</td>
      <td>{formatAriary(totalPaid)}</td>
      <td>
        <button
          className="table-action"
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            openDetail();
          }}
        >
          Voir la fiche →
        </button>
      </td>
    </tr>
  );
}

export default function ContribuablesTable({ allCount, contribuables, onOpenDetail }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Contribuable</th>
            <th>Dernière année</th>
            <th>Années suivies</th>
            <th>TVA payée cumulée</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {contribuables.map((contribuable) => (
            <ContribuableRow
              key={contribuable.key}
              contribuable={contribuable}
              onOpenDetail={onOpenDetail}
            />
          ))}
          {!contribuables.length && (
            <tr>
              <td colSpan="5" className="empty">
                {allCount
                  ? 'Aucun contribuable ne correspond à votre recherche.'
                  : 'Aucun contribuable enregistré.'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
