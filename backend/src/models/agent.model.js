const prisma = require('../config/prisma');

/** Statuts acceptés pour un compte agent. */
const AGENT_STATUTS = ['actif', 'en_attente', 'inactif'];

/** Rôles acceptés. Seul `admin` accède à la gestion des utilisateurs. */
const AGENT_ROLES = ['agent', 'admin'];

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
  date_creation: true,
  date_modification: true,
};

const toNumericId = (id) => {
  const numericId = parseInt(id, 10);
  return Number.isNaN(numericId) ? null : numericId;
};

class AgentModel {
  static async findAll({ search, statut, role } = {}) {
    const where = {};

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
      select: AGENT_SELECT,
      orderBy: [{ statut: 'asc' }, { date_creation: 'desc' }],
    });
  }

  static async findById(id) {
    const numericId = toNumericId(id);
    if (numericId === null) return null;

    return prisma.agents.findUnique({
      where: { id_agent: numericId },
      select: AGENT_SELECT,
    });
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

  static async updateRole(id, role) {
    const numericId = toNumericId(id);
    if (numericId === null) return null;

    try {
      return await prisma.agents.update({
        where: { id_agent: numericId },
        data: { role, date_modification: new Date() },
        select: AGENT_SELECT,
      });
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

module.exports = { AgentModel, AGENT_STATUTS, AGENT_ROLES, AGENT_SELECT };
