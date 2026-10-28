/**
 * Chemin d'arrivée selon le rôle renvoyé par l'authentification : un
 * administrateur ouvre directement son backoffice, les autres le tableau de bord
 * agent. Utilisé par `App.jsx` (route `/`) et par l'écran de connexion pour que
 * les deux redirections ne se contredisent jamais.
 */
export const getLandingPath = (user) => (user?.role === 'admin' ? '/admin' : '/acceuil');

/**
 * Initiales affichées par la pastille de profil : première lettre du prénom et
 * première lettre du nom, avec repli sur les deux premiers caractères de l'e-mail
 * quand le compte n'a pas de nom renseigné.
 */
export const initialsOf = (user) => {
  if (!user) return '??';
  const letters = `${user.prenom ?? ''} ${user.nom ?? ''}`.trim().split(/\s+/);
  if (letters.length >= 2 && letters[0]) {
    return `${letters[0][0]}${letters[letters.length - 1][0]}`.toUpperCase();
  }
  return (user.email ?? '??').slice(0, 2).toUpperCase();
};
