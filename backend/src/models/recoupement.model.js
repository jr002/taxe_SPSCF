const db = require('../config/database');

class RecoupementModel {
  // Créer un recoupement avec source par défaut
  static async create(data) {
    const { 
      id_entreprise, 
      source = 'tiers_declarant', // Valeur par défaut
      merchandise_sold, 
      goods_purchased,
      services_purchased, 
      third_party_payments, 
      local_products,
      import_expenses, 
      somme_recoupee,
      reference_periode,
      ca_declare
    } = data;
    
    const query = `
      INSERT INTO recoupements (
        id_entreprise, source, merchandise_sold, goods_purchased,
        services_purchased, third_party_payments, local_products,
        import_expenses, somme_recoupee, reference_periode, ca_declare, date_creation
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
      RETURNING *
    `;
    
    const values = [
      id_entreprise, 
      source, 
      merchandise_sold || 0, 
      goods_purchased || 0,
      services_purchased || 0, 
      third_party_payments || 0, 
      local_products || 0,
      import_expenses || 0, 
      somme_recoupee || 0,
      reference_periode || null,
      ca_declare || 0
    ];
    
    const result = await db.query(query, values);
    return result.rows[0];
  }

  // Trouver par ID
  static async findById(id) {
    const query = `
      SELECT r.*, e.nif, e.raison_sociale
      FROM recoupements r
      JOIN entreprises e ON r.id_entreprise = e.id_entreprise
      WHERE r.id_recoupement = $1
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  // Recoupements d'une entreprise
  static async findByEntreprise(id_entreprise) {
    const query = `
      SELECT * FROM recoupements 
      WHERE id_entreprise = $1 
      ORDER BY date_creation DESC
    `;
    const result = await db.query(query, [id_entreprise]);
    return result.rows;
  }

  // Dernier recoupement
  static async findLastByEntreprise(id_entreprise) {
    const query = `
      SELECT * FROM recoupements 
      WHERE id_entreprise = $1 
      ORDER BY date_creation DESC 
      LIMIT 1
    `;
    const result = await db.query(query, [id_entreprise]);
    return result.rows[0];
  }

  // Mettre à jour
  static async update(id, data) {
    const fields = [];
    const values = [];
    let index = 1;

    const allowedFields = [
      'source', 'merchandise_sold', 'goods_purchased', 
      'services_purchased', 'third_party_payments', 
      'local_products', 'import_expenses', 'somme_recoupee',
      'reference_periode', 'ca_declare'
    ];
    
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = $${index++}`);
        values.push(data[field]);
      }
    }

    values.push(id);
    const query = `
      UPDATE recoupements 
      SET ${fields.join(', ')}, date_modification = NOW()
      WHERE id_recoupement = $${index}
      RETURNING *
    `;
    
    const result = await db.query(query, values);
    return result.rows[0];
  }

  // Statistiques des sources
  static async getSourceStats() {
    const query = `
      SELECT 
        source,
        COUNT(*) as total,
        AVG(somme_recoupee) as moyenne_recoupee
      FROM recoupements
      GROUP BY source
      ORDER BY total DESC
    `;
    const result = await db.query(query);
    return result.rows;
  }
}

module.exports = RecoupementModel;