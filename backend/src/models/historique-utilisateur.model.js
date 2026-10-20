const prisma = require('../config/prisma');

class HistoriqueUtilisateurModel {
  /**
   * Enregistrer une trace d'action dans le journal d'audit
   */
  static async enregistrerAction({
    id_agent_auteur = null,
    nom_auteur = 'Système',
    id_agent_cible = null,
    cible_nom = 'Inconnu',
    cible_email = '',
    type_action,
    description,
    anciennes_valeurs = null,
    nouvelles_valeurs = null,
  }) {
    try {
      const query = `
        INSERT INTO public.historique_utilisateurs 
        (id_agent_auteur, nom_auteur, id_agent_cible, cible_nom, cible_email, type_action, description, anciennes_valeurs, nouvelles_valeurs, date_action)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb, NOW())
        RETURNING *;
      `;

      const rows = await prisma.$queryRawUnsafe(
        query,
        id_agent_auteur ? parseInt(id_agent_auteur, 10) : null,
        nom_auteur,
        id_agent_cible ? parseInt(id_agent_cible, 10) : null,
        cible_nom,
        cible_email,
        type_action,
        description,
        anciennes_valeurs ? JSON.stringify(anciennes_valeurs) : null,
        nouvelles_valeurs ? JSON.stringify(nouvelles_valeurs) : null
      );

      return rows && rows[0] ? rows[0] : null;
    } catch (error) {
      console.error('Erreur enregistrement audit utilisateur:', error);
      return null;
    }
  }

  /**
   * Récupérer l'historique avec filtres et limite
   */
  static async findAll({ type_action = '', search = '', limit = 100 } = {}) {
    try {
      let query = `
        SELECT 
          id_historique,
          id_agent_auteur,
          nom_auteur,
          id_agent_cible,
          cible_nom,
          cible_email,
          type_action,
          description,
          anciennes_valeurs,
          nouvelles_valeurs,
          date_action
        FROM public.historique_utilisateurs
        WHERE 1=1
      `;
      const params = [];

      if (type_action && type_action !== 'TOUS') {
        params.push(type_action);
        query += ` AND type_action = $${params.length}`;
      }

      if (search && search.trim()) {
        params.push(`%${search.trim()}%`);
        const idx = params.length;
        query += ` AND (
          nom_auteur ILIKE $${idx} OR 
          cible_nom ILIKE $${idx} OR 
          cible_email ILIKE $${idx} OR 
          description ILIKE $${idx}
        )`;
      }

      params.push(Math.min(parseInt(limit, 10) || 100, 200));
      query += ` ORDER BY date_action DESC LIMIT $${params.length};`;

      return await prisma.$queryRawUnsafe(query, ...params);
    } catch (error) {
      console.error('Erreur récupération audit utilisateurs:', error);
      return [];
    }
  }

  /**
   * Récupérer l'historique d'un agent spécifique
   */
  static async findByAgent(id_agent) {
    try {
      const numericId = parseInt(id_agent, 10);
      if (Number.isNaN(numericId)) return [];

      const query = `
        SELECT *
        FROM public.historique_utilisateurs
        WHERE id_agent_cible = $1
        ORDER BY date_action DESC;
      `;
      return await prisma.$queryRawUnsafe(query, numericId);
    } catch (error) {
      console.error('Erreur récupération audit par agent:', error);
      return [];
    }
  }
}

module.exports = HistoriqueUtilisateurModel;
