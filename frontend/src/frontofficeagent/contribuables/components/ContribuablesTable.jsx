import { AideTerme } from '@/frontofficeagent/aide';
import { formatEcart } from '@/frontofficeagent/confrontation/utils/confrontation.utils.js';
import { conformiteRecoupee } from '@/frontofficeagent/confrontation/utils/conformiteRecoupee.utils.js';
import { formatAriary, toNumber } from '@/utils';

function ContribuableRow({ contribuable, conformite, onOpenDetail }) {
  const latestDeclaration = contribuable.declarations[0];
  const totalPaid = contribuable.declarations.reduce(
    (total, declaration) => total + toNumber(declaration.tva_payee),
    0
  );
  const confronte = conformite.etat !== 'non_recoupe';

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
      <td>
        <span className={conformite.badge}>{conformite.label}</span>
      </td>
      <td className="contribuable-ecart-cell">
        {confronte ? (
          <strong style={{ color: conformite.ecartTotal > 0 ? '#b42318' : '#237a43' }}>
            {formatEcart(conformite.ecartTotal)}
          </strong>
        ) : (
          <span className="ecart-absent" title="Aucune confrontation active sur ce dossier">—</span>
        )}
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

export default function ContribuablesTable({ allCount, contribuables, confrontationParContribuable, onOpenDetail }) {
  return (
    <div className="table-wrap">
      <table aria-label="Contribuables">
        <thead>
          <tr>
            <th>Contribuable</th>
            <th><AideTerme id="conformite_recoupee">Conformité recoupée</AideTerme></th>
            <th><AideTerme id="ecart_general">Écart général</AideTerme></th>
            <th><AideTerme id="derniere_annee">Dernière année</AideTerme></th>
            <th><AideTerme id="annees_suivies">Années suivies</AideTerme></th>
            <th><AideTerme id="tva_payee">TVA payée cumulée</AideTerme></th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {contribuables.map((contribuable) => (
            <ContribuableRow
              key={contribuable.key}
              contribuable={contribuable}
              conformite={conformiteRecoupee(confrontationParContribuable?.get(contribuable.key))}
              onOpenDetail={onOpenDetail}
            />
          ))}
          {!contribuables.length && (
            <tr>
              <td colSpan="7" className="empty">
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