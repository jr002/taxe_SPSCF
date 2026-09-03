const db = require('../config/database');

class DeclarationModel {
  // Créer une déclaration
  static async create(data) {
    const { 
      id_entreprise, annee, ca, benefice, 
      tva_collectee, tva_deductible, tva_payee,
      tva_theorique, statut 
    } = data;
    
    const query = `
      INSERT INTO declarations (
        id_entreprise, annee, ca, benefice, 
        tva_collectee, tva_deductible, tva_payee,
        tva_theorique, statut, date_creation
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      RETURNING *
    `;
    
    const values = [id_entreprise, annee, ca, benefice, tva_collectee, tva_deductible, tva_payee, tva_theorique, statut];
    const result = await db.query(query, values);
    return result.rows[0];
  }

  // Trouver par ID
  static async findById(id) {
    const query = `
      SELECT d.*, e.nif, e.raison_sociale, e.secteur_activite
      FROM declarations d
      JOIN entreprises e ON d.id_entreprise = e.id_entreprise
      WHERE d.id_declaration = $1
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  // Déclarations d'une entreprise
  static async findByEntreprise(id_entreprise) {
    const query = `
      SELECT * FROM declarations 
      WHERE id_entreprise = $1 
      ORDER BY annee DESC
    `;
    const result = await db.query(query, [id_entreprise]);
    return result.rows;
  }

  // Liste avec filtres
  static async findAll({ page = 1, limit = 20, search = '', statut = '', annee = '' } = {}) {
    const offset = (page - 1) * limit;
    let query = `
      SELECT d.*, e.nif, e.raison_sociale, e.secteur_activite
      FROM declarations d
      JOIN entreprises e ON d.id_entreprise = e.id_entreprise
      WHERE 1=1
    `;
    
    const values = [];
    let paramIndex = 1;

    if (search) {
      query += ` AND (e.nif ILIKE $${paramIndex} OR e.raison_sociale ILIKE $${paramIndex})`;
      values.push(`%${search}%`);
      paramIndex++;
    }
    
    if (statut) {
      query += ` AND d.statut = $${paramIndex}`;
      values.push(statut);
      paramIndex++;
    }
    
    if (annee) {
      query += ` AND d.annee = $${paramIndex}`;
      values.push(parseInt(annee));
      paramIndex++;
    }
    
    query += ` ORDER BY d.date_creation DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    values.push(limit, offset);
    
    const result = await db.query(query, values);
    
    // Total
    let countQuery = `
      SELECT COUNT(*) 
      FROM declarations d
      JOIN entreprises e ON d.id_entreprise = e.id_entreprise
      WHERE 1=1
    `;
    const countValues = [];
    let countIndex = 1;
    
    if (search) {
      countQuery += ` AND (e.nif ILIKE $${countIndex} OR e.raison_sociale ILIKE $${countIndex})`;
      countValues.push(`%${search}%`);
      countIndex++;
    }
    if (statut) {
      countQuery += ` AND d.statut = $${countIndex}`;
      countValues.push(statut);
      countIndex++;
    }
    if (annee) {
      countQuery += ` AND d.annee = $${countIndex}`;
      countValues.push(parseInt(annee));
    }
    
    const countResult = await db.query(countQuery, countValues);
    
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

    const allowedFields = ['ca', 'benefice', 'tva_collectee', 'tva_deductible', 'tva_payee', 'tva_theorique', 'statut'];
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = $${index++}`);
        values.push(data[field]);
      }
    }

    values.push(id);
    const query = `
      UPDATE declarations 
      SET ${fields.join(', ')}, date_modification = NOW()
      WHERE id_declaration = $${index}
      RETURNING *
    `;
    
    const result = await db.query(query, values);
    return result.rows[0];
  }

  // Statistiques
  static async getStats() {
    const query = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN statut = 'conforme' THEN 1 END) as conformes,
        COUNT(CASE WHEN statut = 'alerte' THEN 1 END) as alertes,
        COUNT(CASE WHEN statut = 'critique' THEN 1 END) as critiques,
        AVG(ca) as ca_moyen,
        SUM(tva_payee) as tva_totale,
        SUM(tva_theorique) as tva_theorique_totale,
        SUM(tva_theorique - tva_payee) as ecart_total
      FROM declarations
    `;
    const result = await db.query(query);
    return result.rows[0];
  }
}

module.exports = DeclarationModel;