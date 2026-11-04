import { Link } from 'react-router-dom';
import { getLandingPath } from '@/utils';

/**
 * Écran de refus d'accès, commun aux trois espaces.
 *
 * Taper l'URL d'une page qui n'est pas du rôle connecté doit rester compréhensible
 * et réversible : un titre, la raison, et un lien qui ramène le compte chez lui —
 * `getLandingPath`, le même chemin que la redirection après connexion. Sans ce
 * lien, un agent tombé sur `/admin/roles` ne voyait qu'une phrase rouge.
 */
export default function AccesRefuse({
  currentUser = null,
  eyebrow = 'Backoffice Administration',
  titre,
  message,
}) {
  const estAdmin = currentUser?.role === 'admin';
  const libelleRetour = estAdmin
    ? 'Retour au tableau de bord administration'
    : 'Retour à mon espace de travail';

  return (
    <section className="page">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{titre}</h1>
      <p>{message}</p>
      <p>
        <Link className="primary" to={getLandingPath(currentUser)}>{libelleRetour}</Link>
      </p>
    </section>
  );
}
