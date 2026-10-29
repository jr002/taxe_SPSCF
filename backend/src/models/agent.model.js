const prisma = require('../config/prisma');
const { applyScope } = require('../utils/data-scope');

/** Statuts acceptés pour un compte agent. */
const AGENT_STATUTS = ['actif', 'en_attente', 'inactif'];

/**
 * Rôles acceptés et leur périmètre (voir `src/utils/data-scope.js`) :
 * `admin` (back-office et tous les centres, en écriture comprise), `inspecteur`
 * (tous les centres en consultation seule, aucune écriture métier), `chef_centre`,
 * `controleur` et `agent` (uniquement le centre de rattachement, avec la saisie),
 * `contribuable` (son propre dossier — non encore implémenté, donc aucun accès
 * API métier) et `autre` (aucun périmètre). La gestion des comptes reste
 * administratrice, à deux exceptions près pour le `chef_centre` : il liste les
 * comptes de son centre et peut les bloquer ou les activer
 * (voir `src/routes/agent.routes.js`).
 */
const AGENT_ROLES = [
  'admin',
  'chef_centre',
  'inspecteur',
  'controleur',
  'agent',
  'contribuable',
  'autre',
];

/**
 * Centre d'affiliation automatique des administrateurs, créé par la migration
 * `008-centre-ssif-administrateurs.sql`. Le rôle `admin` voyant tous les
 * centres, cette affectation est informative : elle n'ajoute ni ne retire aucun
 * dossier.
 */
const CENTRE_ADMINISTRATEURS = 'SSIF';

/**
 * Champs renvoyés par l'API : `mot_de_passe` n'en fait jamais partie.
 */
const AGENT_SELECT = {
  id_agent: true,
  nom: true,
  prenom: true,
  email: true,
  role: true,
  statut: true,
  id_centre: true,
  date_creation: true,
  date_modification: true,
};

const toNumericId = (id) => {
  const numericId = parseInt(id, 10);
  return Number.isNaN(numericId) ? null : numericId;
};

/**
 * Aplatit la relation `centres` chargée par Prisma en un simple `nom_centre`,
 * pour que l'API n'expose pas d'objet imbriqué.
 */
const withCentreName = (rows) =>
  rows.map(({ centres, ...agent }) => ({
    ...agent,
    nom_centre: centres?.nom_centre ?? null,
  }));

class AgentModel {
  /**
   * Liste des comptes. `scope` (voir `src/utils/data-scope.js`) borne la lecture :
   * un rôle centré — le chef de centre qui consulte son équipe — ne voit que les
   * comptes rattachés à son centre ; un périmètre `all` ne filtre rien. Sans
   * `scope`, appel interne au serveur, la liste est nationale.
   */
  static async findAll({ search, statut, role, scope } = {}) {
    const where = applyScope({}, scope);

    if (statut && AGENT_STATUTS.includes(statut)) where.statut = statut;
    if (role && AGENT_ROLES.includes(role)) where.role = role;

    if (search) {
      where.OR = [
        { nom: { contains: search, mode: 'insensitive' } },
        { prenom: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    return prisma.agents.findMany({
      where,
      select: { ...AGENT_SELECT, centres: { select: { nom_centre: true } } },
      orderBy: [{ statut: 'asc' }, { date_creation: 'desc' }],
    }).then(withCentreName);
  }

  /**
   * Lecture d'un compte : le rôle, le statut et le centre de rattachement dont
   * dépend le périmètre de données de l'agent (`authenticate` comme l'audit du
   * back-office lisent ces trois champs).
   */
  static async findById(id) {
    const numericId = toNumericId(id);
    if (numericId === null) return null;

    const row = await prisma.agents.findUnique({
      where: { id_agent: numericId },
      select: { ...AGENT_SELECT, centres: { select: { nom_centre: true } } },
    });

    return row ? withCentreName([row])[0] : null;
  }

  /** Nombre d'administrateurs actifs, en excluant éventuellement un compte. */
  static async countActiveAdmins({ excludeId } = {}) {
    const exclude = toNumericId(excludeId);

    return prisma.agents.count({
      where: {
        role: 'admin',
        statut: 'actif',
        ...(exclude === null ? {} : { NOT: { id_agent: exclude } }),
      },
    });
  }

  static async updateStatut(id, statut) {
    const numericId = toNumericId(id);
    if (numericId === null) return null;

    try {
      return await prisma.agents.update({
        where: { id_agent: numericId },
        data: { statut, date_modification: new Date() },
        select: AGENT_SELECT,
      });
    } catch (error) {
      if (error.code === 'P2025') return null;
      throw error;
    }
  }

  /** Identifiant du centre d'affiliation des administrateurs, `null` s'il manque. */
  static async findIdCentreAdministrateurs() {
    const centre = await prisma.centres.findFirst({
      where: { nom_centre: CENTRE_ADMINISTRATEURS, type_centre: 'DGE' },
      select: { id_centre: true },
      orderBy: { id_centre: 'asc' },
    });

    return centre?.id_centre ?? null;
  }

  /**
   * Le centre est passé en troisième argument uniquement quand le rôle impose un
   * rattachement (administrateur affilié à SSIF, sortie du rôle qui libère le
   * centre) ; `undefined` laisse l'affectation existante intacte.
   */
  static async updateRole(id, role, id_centre) {
    const numericId = toNumericId(id);
    if (numericId === null) return null;

    try {
      const row = await prisma.agents.update({
        where: { id_agent: numericId },
        data: {
          role,
          ...(id_centre === undefined ? {} : { id_centre }),
          date_modification: new Date(),
        },
        select: { ...AGENT_SELECT, centres: { select: { nom_centre: true } } },
      });
      return withCentreName([row])[0];
    } catch (error) {
      if (error.code === 'P2025') return null;
      throw error;
    }
  }

  /**
   * Affecte (ou retire, avec `null`) le centre fiscal de rattachement qui
   * détermine le périmètre de consultation de l'agent.
   */
  static async updateCentre(id, id_centre) {
    const numericId = toNumericId(id);
    if (numericId === null) return null;

    try {
      const row = await prisma.agents.update({
        where: { id_agent: numericId },
        data: { id_centre, date_modification: new Date() },
        select: { ...AGENT_SELECT, centres: { select: { nom_centre: true } } },
      });
      return withCentreName([row])[0];
    } catch (error) {
      if (error.code === 'P2025') return null;
      throw error;
    }
  }

  /**
   * Identité civile et adresse de connexion d'un compte. L'e-mail porte une
   * contrainte d'unicité : un doublon remonte en `P2002` pour que le contrôleur
   * réponde 409 plutôt que 500.
   */
  static async updateIdentite(id, { nom, prenom, email }) {
    const numericId = toNumericId(id);
    if (numericId === null) return null;

    try {
      const row = await prisma.agents.update({
        where: { id_agent: numericId },
        data: { nom, prenom, email, date_modification: new Date() },
        select: { ...AGENT_SELECT, centres: { select: { nom_centre: true } } },
      });
      return withCentreName([row])[0];
    } catch (error) {
      if (error.code === 'P2025') return null;
      throw error;
    }
  }

  static async updatePassword(id, hashedPassword) {
    const numericId = toNumericId(id);
    if (numericId === null) return null;

    try {
      return await prisma.agents.update({
        where: { id_agent: numericId },
        data: { mot_de_passe: hashedPassword, date_modification: new Date() },
        select: AGENT_SELECT,
      });
    } catch (error) {
      if (error.code === 'P2025') return null;
      throw error;
    }
  }

  static async delete(id) {
    const numericId = toNumericId(id);
    if (numericId === null) return null;

    try {
      return await prisma.agents.delete({
        where: { id_agent: numericId },
        select: AGENT_SELECT,
      });
    } catch (error) {
      if (error.code === 'P2025') return null;
      throw error;
    }
  }
}

module.exports = { AgentModel, AGENT_STATUTS, AGENT_ROLES, AGENT_SELECT, CENTRE_ADMINISTRATEURS };
