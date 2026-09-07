const prisma = require('../config/prisma');

class ControleModel {
  // Créer un contrôle
  static async create(data) {
    const { 
      id_declaration, id_agent, type, resultat, 
      ecart, pourcentage_ecart, commentaire 
    } = data;
    
    return await prisma.controles.create({
      data: {
        id_declaration: id_declaration ? parseInt(id_declaration, 10) : null,
        id_agent: id_agent ? parseInt(id_agent, 10) : null,
        type,
        resultat,
        ecart: ecart !== undefined ? ecart : 0,
        pourcentage_ecart: pourcentage_ecart !== undefined ? pourcentage_ecart : 0,
        commentaire: commentaire || null,
        date_controle: new Date(),
      },
    });
  }

  // Trouver par ID
  static async findById(id) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) return null;

    const controle = await prisma.controles.findUnique({
      where: { id_controle: numericId },
      include: {
        declarations: {
          include: {
            contribuables: {
              select: {
                nif: true,
                raison_sociale: true,
              },
            },
          },
        },
        agents: {
          select: {
            nom: true,
            prenom: true,
          },
        },
      },
    });

    if (!controle) return null;

    const { declarations, agents, ...fields } = controle;
    return {
      ...fields,
      annee: declarations?.annee || null,
      nif: declarations?.contribuables?.nif || null,
      raison_sociale: declarations?.contribuables?.raison_sociale || null,
      agent_nom: agents?.nom || null,
      agent_prenom: agents?.prenom || null,
    };
  }

  // Contrôles d'une déclaration
  static async findByDeclaration(id_declaration) {
    const numericId = parseInt(id_declaration, 10);
    if (isNaN(numericId)) return [];

    const controles = await prisma.controles.findMany({
      where: { id_declaration: numericId },
      include: {
        agents: {
          select: {
            nom: true,
            prenom: true,
          },
        },
      },
      orderBy: { date_controle: 'desc' },
    });

    return controles.map((c) => {
      const { agents, ...fields } = c;
      return {
        ...fields,
        agent_nom: agents?.nom || null,
        agent_prenom: agents?.prenom || null,
      };
    });
  }

  // Statistiques de contrôle
  static async getStats() {
    const [total, conformes, alertes, critiques, aggregations] = await Promise.all([
      prisma.controles.count(),
      prisma.controles.count({ where: { resultat: 'conforme' } }),
      prisma.controles.count({ where: { resultat: 'alerte' } }),
      prisma.controles.count({ where: { resultat: 'critique' } }),
      prisma.controles.aggregate({
        _avg: { ecart: true },
        _max: { ecart: true },
      }),
    ]);

    return {
      total: String(total),
      conformes: String(conformes),
      alertes: String(alertes),
      critiques: String(critiques),
      ecart_moyen: aggregations._avg.ecart ? Number(aggregations._avg.ecart) : 0,
      ecart_max: aggregations._max.ecart ? Number(aggregations._max.ecart) : 0,
    };
  }

  // Contrôles par type
  static async getByType() {
    const grouped = await prisma.controles.groupBy({
      by: ['type'],
      _count: { _all: true },
      _avg: { pourcentage_ecart: true },
    });

    return grouped.map((g) => ({
      type: g.type,
      total: String(g._count._all),
      ecart_moyen: g._avg.pourcentage_ecart ? Number(g._avg.pourcentage_ecart) : 0,
    }));
  }
}

module.exports = ControleModel;