import { Link } from 'react-router-dom';
import { AccesRefuse } from '@/components/common';

const OUTILS = [
  {
    to: '/admin/utilisateurs',
    titre: 'Gestion des utilisateurs',
    description: 'Consultez les comptes, activez les demandes d’accès et bloquez les comptes si nécessaire.',
    action: 'Gérer les comptes',
  },
  {
    to: '/admin/roles',
    titre: 'Rôles et centres',
    description: 'Attribuez à chaque utilisateur un rôle et, lorsque ce rôle le nécessite, un centre de rattachement.',
    action: 'Organiser les accès',
  },
  {
    to: '/admin/verification-nif',
    titre: 'Vérification NIF',
    description: 'Consultez le référentiel et les outils SQL, Excel ou JSON. Le résultat dépend de la source utilisée.',
    action: 'Ouvrir la vérification',
  },
  {
    to: '/admin/historique',
    titre: 'Historique des modifications',
    description: 'Retrouvez les actions enregistrées sur les comptes pour suivre les modifications et leurs auteurs.',
    action: 'Consulter le journal',
  },
];

export default function AdminAccueil({ currentUser }) {
  if (currentUser?.role !== 'admin') {
    return (
      <AccesRefuse
        currentUser={currentUser}
        titre="Accueil réservé à l’administration"
        message="Cet espace présente les outils de gestion des comptes et des accès. Retrouvez vos activités dans l’espace agent."
      />
    );
  }

  const nom = currentUser.prenom || currentUser.nom;

  return (
    <section className="page admin-accueil">
      <div className="page-heading">
        <p className="eyebrow">Accueil administrateur</p>
        <h1>Bienvenue{nom ? `, ${nom}` : ' dans l’administration'}</h1>
        <p>
          Votre espace pour gérer les utilisateurs de SPSCF, organiser leurs accès
          et suivre les modifications. Choisissez un outil selon votre besoin.
        </p>
      </div>

      <section className="panel admin-accueil-depart" aria-labelledby="admin-depart-titre">
        <div>
          <h2 id="admin-depart-titre">Par où commencer ?</h2>
          <p>
            Pour un nouvel utilisateur, examinez sa demande d’accès, puis vérifiez
            son rôle et son centre dans « Rôles et centres ».
          </p>
        </div>
        <Link className="primary" to="/admin/utilisateurs" state={{ statut: 'en_attente' }}>
          Examiner les demandes
        </Link>
      </section>

      <section aria-labelledby="admin-outils-titre">
        <h2 id="admin-outils-titre" className="admin-accueil-titre">Vos outils d’administration</h2>
        <div className="dashboard-grid">
          {OUTILS.map((outil) => (
            <Link className="panel admin-accueil-outil" key={outil.to} to={outil.to}>
              <h3>{outil.titre}</h3>
              <p>{outil.description}</p>
              <span className="admin-accueil-lien">
                {outil.action}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                  <path d="M5 12h14m-6-6 6 6-6 6" />
                </svg>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="panel admin-accueil-synthese" aria-labelledby="admin-synthese-titre">
        <div>
          <h2 id="admin-synthese-titre">Besoin d’une vue d’ensemble ?</h2>
          <p>Le tableau de bord rassemble les indicateurs, la répartition des utilisateurs et les 6 derniers comptes créés.</p>
        </div>
        <Link className="admin-secondary-button" to="/admin/tableau-de-bord">Ouvrir le tableau de bord</Link>
      </section>

      <p className="admin-accueil-perimetre">
        <strong>Votre périmètre :</strong> l’administration des comptes et des accès.
        Le suivi des dossiers fiscaux se fait dans l’espace agent, distinct de cet espace.
      </p>
    </section>
  );
}
