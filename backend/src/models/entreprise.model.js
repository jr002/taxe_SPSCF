const db = require('../config/database');

class EntrepriseModel {
  // Créer une entreprise
  static async create(data) {
    const { nif, raison_sociale, secteur_activite, adresse, telephone, email, regime_fiscal } = data;
    
    const query = `
      INSERT INTO entreprises (nif, raison_sociale, secteur_activite, adresse, telephone, email, regime_fiscal, date_creation)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING id_entreprise, nif, raison_sociale, secteur_activite, adresse, telephone, email, regime_fiscal, date_creation
    `;
    
    const values = [nif, raison_sociale, secteur_activite, adresse, telephone, email, regime_fiscal];
    const result = await db.query(query, values);
    return result.rows[0];
  }

  // Trouver par NIF
  static async findByNif(nif) {
    const query = 'SELECT * FROM entreprises WHERE nif = $1';
    const result = await db.query(query, [nif]);
    return result.rows[0];
  }

  // Trouver par ID
  static async findById(id) {
    const query = `
      SELECT e.*, 
        COUNT(d.id_declaration) as nb_declarations,
        AVG(d.ca) as ca_moyen
      FROM entreprises e
      LEFT JOIN declarations d ON e.id_entreprise = d.id_entreprise
      WHERE e.id_entreprise = $1
      GROUP BY e.id_entreprise
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  // Liste des entreprises
  static async findAll({ page = 1, limit = 20, search = '' } = {}) {
    const offset = (page - 1) * limit;
    let query = `
      SELECT e.*, 
        COUNT(d.id_declaration) as nb_declarations
      FROM entreprises e
      LEFT JOIN declarations d ON e.id_entreprise = d.id_entreprise
    `;
    
    const values = [];
    if (search) {
      query += ` WHERE e.nif ILIKE $1 OR e.raison_sociale ILIKE $1`;
      values.push(`%${search}%`);
    }
    
    query += ` GROUP BY e.id_entreprise ORDER BY e.date_creation DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
    values.push(limit, offset);
    
    const result = await db.query(query, values);
    
    // Total
    let countQuery = 'SELECT COUNT(*) FROM entreprises';
    if (search) {
      countQuery += ` WHERE nif ILIKE $1 OR raison_sociale ILIKE $1`;
    }
    const countResult = await db.query(countQuery, search ? [`%${search}%`] : []);
    
    return {
      data: result.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].count),
        pages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
      }
    };
  }

  // Mettre à jour
  static async update(id, data) {
    const fields = [];
    const values = [];
    let index = 1;

    const allowedFields = ['raison_sociale', 'secteur_activite', 'adresse', 'telephone', 'email', 'regime_fiscal'];
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = $${index++}`);
        values.push(data[field]);
      }
    }

    values.push(id);
    const query = `
      UPDATE entreprises 
      SET ${fields.join(', ')}, date_modification = NOW()
      WHERE id_entreprise = $${index}
      RETURNING *
    `;
    
    const result = await db.query(query, values);
    return result.rows[0];
  }
}

module.exports = EntrepriseModel;