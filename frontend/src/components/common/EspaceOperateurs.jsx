import AccesRefuse from '@/components/common/AccesRefuse';

/**
 * Garde d'accès de l'espace opérationnel pour le portefeuille contribuable.
 *
 * Un administrateur n'a pas accès aux dossiers fiscaux : la barre de navigation
 * (`Header`, `ADMIN_LINKS`) ne lui propose déjà aucun module fiscal, mais taper
 * `/contribuables` dans l'URL ouvrait quand même le registre et la fiche. Cette
 * garde ferme le chemin côté interface, sur toutes les routes du portefeuille,
 * et renvoie l'agent vers son propre espace plutôt que sur une page vide.
 *
 * Le rôle `admin` est le seul écarté : les autres rôles (agent fiscal,
 * contrôleur, chef de centre, inspecteur) gardent l'accueil du registre, et le
 * périmètre — national ou limité au centre — reste décidé par `data-scope` côté
 * serveur. La consultation « Vérification NIF » de l'admin n'est pas touchée :
 * elle reste sous `/admin/verification-nif` et appelle `GET /api/contribuables`
 * pour construire son référentiel — d'où une garde d'affichage, et non un refus
 * de l'API.
 */
export default function EspaceOperateurs({ currentUser = null, children }) {
  if (currentUser?.role === 'admin') {
    return (
      <AccesRefuse
        currentUser={currentUser}
        titre="Contribuables non accessible"
        message="Le registre des contribuables et ses fiches fiscales relèvent de l'espace des rôles opérationnels (agent fiscal, contrôleur, chef de centre, inspecteur). Un administrateur administre les comptes, les rôles et la vérification des NIF, mais ne consulte pas les dossiers fiscaux."
      />
    );
  }

  return children;
}
