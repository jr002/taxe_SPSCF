import AdminNav from '@/backofficeadmin/components/AdminNav';
import HistoriqueUtilisateurs from '@/backofficeadmin/historique/components/HistoriqueUtilisateurs.jsx';
import { AccesRefuse } from '@/components/common';

export default function AdminHistorique({ currentUser }) {
  const isAdmin = currentUser?.role === 'admin';

  if (!isAdmin) {
    return (
      <AccesRefuse
        currentUser={currentUser}
        titre="Journal d'audit non accessible"
        message="L'historique des opérations touche aux comptes et aux rôles : seul un administrateur le consulte. Vos propres actions se lisent dans le dossier du contribuable concerné."
      />
    );
  }

  return (
    <section className="page">
      <AdminNav />

      <div className="page-heading">
        <p className="eyebrow">Backoffice Administration</p>
        <h1>Historique des Modifications & Journal d'Audit</h1>
        <p>
          Consultez et filtrez la traçabilité complète de toutes les modifications effectuées sur les comptes utilisateurs (activations, blocages, rôles, mots de passe, suppressions).
        </p>
      </div>

      <HistoriqueUtilisateurs />
    </section>
  );
}
