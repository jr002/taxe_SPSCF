const db = require('../config/database');

class ControleModel {
  // Créer un contrôle
  static async create(data) {
    const { 
      id_declaration, id_agent, type, resultat, 
      ecart, pourcentage_ecart, commentaire 
    } = data;
    
    const query = `
      INSERT INTO controles (
        id_declaration, id_agent, type, resultat,
        ecart, pourcentage_ecart, commentaire, date_controle
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING *
    `;
    
    const values = [id_declaration, id_agent, type, resultat, ecart, pourcentage_ecart, commentaire];
    const result = await db.query(query, values);
    return result.rows[0];
  }

  // Trouver par ID
  static async findById(id) {
    const query = `
      SELECT c.*, d.annee, e.nif, e.raison_sociale,
        a.nom as agent_nom, a.prenom as agent_prenom
      FROM controles c
      JOIN declarations d ON c.id_declaration = d.id_declaration
      JOIN entreprises e ON d.id_entreprise = e.id_entreprise
      JOIN agents a ON c.id_agent = a.id_agent
      WHERE c.id_controle = $1
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  // Contrôles d'une déclaration
  static async findByDeclaration(id_declaration) {
    const query = `
      SELECT c.*, a.nom as agent_nom, a.prenom as agent_prenom
      FROM controles c
      JOIN agents a ON c.id_agent = a.id_agent
      WHERE c.id_declaration = $1
      ORDER BY c.date_controle DESC
    `;
    const result = await db.query(query, [id_declaration]);
    return result.rows;
  }

  // Statistiques de contrôle
  static async getStats() {
    const query = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN resultat = 'conforme' THEN 1 END) as conformes,
        COUNT(CASE WHEN resultat = 'alerte' THEN 1 END) as alertes,
        COUNT(CASE WHEN resultat = 'critique' THEN 1 END) as critiques,
        AVG(ecart) as ecart_moyen,
        MAX(ecart) as ecart_max
      FROM controles
    `;
    const result = await db.query(query);
    return result.rows[0];
  }

  // Contrôles par type
  static async getByType() {
    const query = `
      SELECT type, COUNT(*) as total, AVG(pourcentage_ecart) as ecart_moyen
      FROM controles
      GROUP BY type
    `;
    const result = await db.query(query);
    return result.rows;
  }
}

module.exports = ControleModel;