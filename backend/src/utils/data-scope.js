/**
 * Périmètre de données d'un agent : ce que son rôle et son centre de
 * rattachement autorisent à lire ou à écrire. Source unique pour les
 * contrôleurs et les modèles — l'application ne repose plus sur le seul
 * affichage côté navigateur.
 *
 * Trois kinds :
 * - `all`    : tous les centres (administrateur, inspecteur) ;
 * - `centre` : uniquement les dossiers du centre auquel l'agent est rattaché
 *              (chef de centre, contrôleur, agent fiscal) ;
 * - `none`   : aucun dossier fiscal (contribuable, rôle « autre », ou rôle
 *              centré sans rattachement enregistré en base).
 *
 * Un scope porte aussi `canWrite` : la consultation et la modification sont
 * deux droits distincts. L'inspecteur lit le territoire entier mais ne touche
 * aucun dossier, d'où le refus centralisé des écritures dans
 * `../middlewares/data-scope.middleware.js`.
 */

const ROLE_LABELS = {
  admin: 'Administrateur',
  chef_centre: 'Chef de centre',
  inspecteur: 'Inspecteur',
  controleur: 'Contrôleur',
  agent: 'Agent Fiscal',
  contribuable: 'Contribuable',
  autre: 'Autre',
};

/** Rôles voyant tous les centres. */
const ALL_CENTRE_ROLES = ['admin', 'inspecteur'];

/** Rôles restreints au centre de rattachement de l'agent. */
const CENTRE_ROLES = ['chef_centre', 'controleur', 'agent'];

/** Rôles nationaux qui consultent l'ensemble du territoire sans jamais écrire. */
const READ_ONLY_ROLES = ['inspecteur'];

/**
 * Calcule le périmètre depuis un utilisateur authentifié (`req.user`).
 * Un rôle centré sans `id_centre` est traité comme `none` : sans rattachement
 * connu, aucune donnée ne peut être autorisée.
 */
const resolveScope = (user) => {
  const role = user?.role || 'agent';
  const id_centre = user?.id_centre ?? null;

  if (ALL_CENTRE_ROLES.includes(role)) {
    return { kind: 'all', role, id_centre, canWrite: !READ_ONLY_ROLES.includes(role) };
  }

  if (CENTRE_ROLES.includes(role)) {
    return id_centre === null
      ? { kind: 'none', role, id_centre: null, reason: 'no_centre', canWrite: false }
      : { kind: 'centre', role, id_centre, canWrite: true };
  }

  return { kind: 'none', role, id_centre: null, reason: 'role', canWrite: false };
};

const roleLabel = (role) => ROLE_LABELS[role] || ROLE_LABELS.agent;

/** Message de refus lisible, dépendant de la cause du périmètre vide. */
const scopeDeniedMessage = (scope) =>
  scope.reason === 'no_centre'
    ? `Aucun centre fiscal n'est rattaché à votre compte (${roleLabel(scope.role)}). Demandez l'affectation de votre centre à un administrateur.`
    : `Le rôle ${roleLabel(scope.role)} ne donne accès à aucun dossier fiscal.`;

/** Message de refus pour une écriture tentée par un rôle national en lecture seule. */
const writeDeniedMessage = (scope) =>
  `Le rôle ${roleLabel(scope.role)} consulte les dossiers de tous les centres mais ne peut ni en créer ni en modifier.`;

/** Enveloppe `leaf` dans une chaîne de clés Prisma, de l'extérieur vers l'intérieur. */
const nestRelation = (path, leaf) => path.reduceRight((acc, key) => ({ [key]: acc }), leaf);

const pushFragment = (where, fragment) => {
  where.AND = [...(where.AND || []), fragment];
  return where;
};

/**
 * Applique le périmètre à un objet `where` Prisma.
 *
 * - table portant directement `id_centre` (`contribuables`, `centres`) :
 *   `applyScope(where, scope)` ;
 * - table reliée à `contribuables` (déclarations, états, relances...) :
 *   `applyScope(where, scope, { relation: 'contribuables' })`.
 *
 * Le filtre est empilé dans `AND` pour n'écraser aucun filtre déjà posé (les
 * modèles utilisent souvent la même relation pour la recherche textuelle).
 * Sans `scope` — appel interne au serveur — aucun filtre n'est ajouté.
 */
const applyScope = (where, scope, { relation } = {}) => {
  if (scope?.kind !== 'centre') return where;

  const leaf = { id_centre: scope.id_centre };
  return pushFragment(where, relation ? { [relation]: leaf } : leaf);
};

/**
 * Idem pour les tables qui n'atteignent le contribuable que par plusieurs
 * chemins (`rapprochements` passe par `declarations` OU `recoupements`) :
 * chaque chemin est filtré et les alternatives réunies par un `OR`.
 */
const applyScopeViaRelations = (where, scope, paths) => {
  if (scope?.kind !== 'centre') return where;

  const leaf = { id_centre: scope.id_centre };
  const branches = paths.map((path) => nestRelation(path, leaf));

  return pushFragment(where, branches.length === 1 ? branches[0] : { OR: branches });
};

/** Contrôle d'accès d'un contribuable (ou de sa ligne `id_centre`) au périmètre. */
const contribuableIsReadable = (scope, contribuable) => {
  if (scope?.kind === 'all') return true;
  if (scope?.kind !== 'centre') return false;
  return Number(contribuable?.id_centre) === Number(scope.id_centre);
};

/**
 * verrouille le centre d'une écriture : un agent centré ne peut ni créer un
 * dossier dans un autre centre ni déplacer un contribuable existant. Les rôles
 * voyant tous les centres gardent la valeur envoyée par le client — il ne reste
 * que l'administrateur depuis que l'inspecteur est bloqué en écriture par
 * `enforceDataScope`.
 */
const forceCentreOnWrite = (scope, data) =>
  scope?.kind === 'centre' ? { ...data, id_centre: scope.id_centre } : data;

module.exports = {
  ALL_CENTRE_ROLES,
  CENTRE_ROLES,
  READ_ONLY_ROLES,
  ROLE_LABELS,
  applyScope,
  applyScopeViaRelations,
  contribuableIsReadable,
  forceCentreOnWrite,
  resolveScope,
  roleLabel,
  scopeDeniedMessage,
  writeDeniedMessage,
};
