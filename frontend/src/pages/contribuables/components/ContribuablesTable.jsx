import { formatAriary, toNumber } from '../../../utils/formatters';

export default function ContribuablesTable({ allCount, contribuables, onOpenDetail }) {
  return <div className="table-wrap">
    <table>
      <thead><tr><th>Contribuable</th><th>Dernière année</th><th>Années suivies</th><th>TVA payée cumulée</th><th>Action</th></tr></thead>
      <tbody>
        {contribuables.map((contribuable) => {
          const latest = contribuable.declarations[0];
          const totalPaid = contribuable.declarations.reduce((total, row) => total + toNumber(row.tva_payee), 0);
          return <tr key={contribuable.key} onClick={() => onOpenDetail(contribuable)} onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onOpenDetail(contribuable); }
          }} tabIndex="0" title="Afficher l'historique complet du contribuable">
            <td><strong>{contribuable.raison_sociale || 'Contribuable non renseigné'}</strong><small>{contribuable.nif || 'NIF non renseigné'}</small></td>
            <td>{latest?.annee || 'N/A'}</td><td>{contribuable.declarations.length} déclaration(s)</td><td>{formatAriary(totalPaid)}</td>
            <td><button className="table-action" type="button" onClick={(event) => { event.stopPropagation(); onOpenDetail(contribuable); }}>Voir la fiche →</button></td>
          </tr>;
        })}
        {!contribuables.length && <tr><td colSpan="5" className="empty">{allCount ? 'Aucun contribuable ne correspond à votre recherche.' : 'Aucun contribuable enregistré.'}</td></tr>}
      </tbody>
    </table>
  </div>;
}
