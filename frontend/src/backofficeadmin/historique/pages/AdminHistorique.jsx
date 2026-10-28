import AdminNav from '@/backofficeadmin/components/AdminNav';
import HistoriqueUtilisateurs from '@/backofficeadmin/historique/components/HistoriqueUtilisateurs.jsx';

export default function AdminHistorique({ currentUser }) {
  const isAdmin = currentUser?.role === 'admin';

  if (!isAdmin) {
    return (
      <section className="page">
        <p className="error">Cette page est réservée aux administrateurs.</p>
      </section>
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
