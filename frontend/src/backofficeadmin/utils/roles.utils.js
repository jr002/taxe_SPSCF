/**
 * Référentiel des rôles utilisateur — source unique partagée par la page
 * Utilisateurs, la page Rôles et le camembert de répartition.
 * `role` est la valeur stockée en base (VarChar `agents.role`) ; les autres
 * champs servent à l'affichage et au pilotage du formulaire d'affectation.
 *
 * `perimetre` reprend le calcul côté serveur (`backend/src/utils/data-scope.js`) :
 * - `backoffice`  : tous les centres + le back-office administrateur ;
 * - `tous_lecture`: tous les centres en consultation, aucune écriture ;
 * - `centre`      : uniquement le centre de rattachement de l'agent ;
 * - `aucun`       : aucun dossier fiscal.
 */
export const ROLES_AGENTS = [
  {
    role: 'admin',
    label: 'Administrateur',
    badge: 'conforme',
    couleur: '#4338ca',
    perimetre: 'backoffice',
    description: 'Back-office complet : gestion des comptes, des rôles et des centres, avec l’accès à tous les dossiers fiscaux du territoire. Le compte est affilié d’office au centre SSIF.',
    droits: 'Tous les centres · Back-office',
  },
  {
    role: 'inspecteur',
    label: 'Inspecteur',
    badge: 'surveillance',
    couleur: '#0284c7',
    perimetre: 'tous_lecture',
    description: 'Contrôle national : consulte les dossiers, déclarations et recoupements de tous les centres fiscaux, sans pouvoir en créer ni en modifier. Le back-office et les comptes agents lui restent fermés.',
    droits: 'Tous les centres · Consultation seule',
  },
  {
    role: 'chef_centre',
    label: 'Chef de centre',
    badge: 'conforme',
    couleur: '#7c3aed',
    perimetre: 'centre',
    description: 'Pilote le centre fiscal auquel il est rattaché : consultation et saisie de tous les dossiers de ce centre, sans accès au back-office d’administration.',
    droits: 'Centre de rattachement · Gestion du centre',
  },
  {
    role: 'controleur',
    label: 'Contrôleur',
    badge: 'surveillance',
    couleur: '#0891b2',
    perimetre: 'centre',
    description: 'Vérifie les dossiers et les déclarations des contribuables rattachés à son centre fiscal.',
    droits: 'Centre de rattachement · Vérification',
  },
  {
    role: 'agent',
    label: 'Agent Fiscal',
    badge: 'conforme',
    couleur: '#10b981',
    perimetre: 'centre',
    description: 'Consultation et saisie des déclarations et relances des contribuables rattachés à son centre.',
    droits: 'Centre de rattachement · Saisie & Consultation',
  },
  {
    role: 'contribuable',
    label: 'Contribuable',
    badge: 'surveillance',
    couleur: '#d97706',
    perimetre: 'aucun',
    description: 'Espace contribuable : consultation de son propre dossier. Le rattachement du compte à un NIF n’est pas encore implémenté, ce rôle ne voit donc aucun dossier pour l’instant.',
    droits: 'Son propre NIF (à venir)',
  },
  {
    role: 'autre',
    label: 'Autre',
    badge: 'critique',
    couleur: '#64748b',
    perimetre: 'aucun',
    description: 'Compte sans affectation fonctionnelle : l’accès aux dossiers fiscaux reste fermé jusqu’à classification.',
    droits: 'Aucun périmètre',
  },
];

/** Rôle appliqué quand la base porte une valeur inconnue. */
const DEFAULT_ROLE = 'agent';

/**
 * Ce que voit un compte dont le rôle n'est pas restreint à un centre :
 * libellé, icône et couleur de la colonne « Centre » des pages admin.
 */
export const CENTRE_TEXTES = {
  backoffice: { icon: '🌐', couleur: '#4338ca', texte: 'Tous les centres (National)' },
  tous_lecture: { icon: '👁', couleur: '#0284c7', texte: 'Tous les centres (consultation seule)' },
  aucun: { icon: '🔒', couleur: '#d97706', texte: 'Aucun centre de rattachement' },
};

export const roleDefinition = (role) =>
  ROLES_AGENTS.find((definition) => definition.role === (role || DEFAULT_ROLE)) ||
  ROLES_AGENTS.find((definition) => definition.role === DEFAULT_ROLE);

/**
 * Libellé « Centre » d'un compte dont le rôle n'est pas centré : le texte de son
 * périmètre, enrichi du centre d'affiliation quand il en porte un. Les
 * administrateurs sont affiliés d'office au centre SSIF côté serveur, sans effet
 * sur leur périmètre : ils voient tous les centres.
 */
export const centreResume = (role, nomCentre) => {
  const horsCentre = CENTRE_TEXTES[roleDefinition(role).perimetre];
  if (!horsCentre || !nomCentre) return horsCentre;
  return { ...horsCentre, texte: `${horsCentre.texte} · affilié à ${nomCentre}` };
};

/** Rôles dont le périmètre dépend d'un centre de rattachement. */
export const isCentreScoped = (role) => roleDefinition(role).perimetre === 'centre';

export const getRoleLabel = (role) => roleDefinition(role).label;
