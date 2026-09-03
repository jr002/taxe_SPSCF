-- Création des tables

-- Table agents
CREATE TABLE IF NOT EXISTS agents (
    id_agent SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    mot_de_passe VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'agent',
    statut VARCHAR(20) DEFAULT 'actif',
    date_creation TIMESTAMP DEFAULT NOW(),
    date_modification TIMESTAMP
);

-- Table entreprises
CREATE TABLE IF NOT EXISTS entreprises (
    id_entreprise SERIAL PRIMARY KEY,
    nif VARCHAR(50) UNIQUE NOT NULL,
    raison_sociale VARCHAR(255) NOT NULL,
    secteur_activite VARCHAR(100) NOT NULL,
    adresse TEXT,
    telephone VARCHAR(20),
    email VARCHAR(100),
    regime_fiscal VARCHAR(10),
    date_creation TIMESTAMP DEFAULT NOW(),
    date_modification TIMESTAMP
);

-- Table declarations
CREATE TABLE IF NOT EXISTS declarations (
    id_declaration SERIAL PRIMARY KEY,
    id_entreprise INTEGER REFERENCES entreprises(id_entreprise) ON DELETE CASCADE,
    annee INTEGER NOT NULL,
    ca NUMERIC(15,2) DEFAULT 0,
    benefice NUMERIC(15,2) DEFAULT 0,
    tva_collectee NUMERIC(15,2) DEFAULT 0,
    tva_deductible NUMERIC(15,2) DEFAULT 0,
    tva_payee NUMERIC(15,2) DEFAULT 0,
    tva_theorique NUMERIC(15,2) DEFAULT 0,
    statut VARCHAR(20) DEFAULT 'conforme',
    date_creation TIMESTAMP DEFAULT NOW(),
    date_modification TIMESTAMP,
    UNIQUE(id_entreprise, annee)
);

-- Table recoupements
CREATE TABLE IF NOT EXISTS recoupements (
    id_recoupement SERIAL PRIMARY KEY,
    id_entreprise INTEGER REFERENCES entreprises(id_entreprise) ON DELETE CASCADE,
    source VARCHAR(50) NOT NULL,
    merchandise_sold NUMERIC(15,2) DEFAULT 0,
    goods_purchased NUMERIC(15,2) DEFAULT 0,
    services_purchased NUMERIC(15,2) DEFAULT 0,
    third_party_payments NUMERIC(15,2) DEFAULT 0,
    local_products NUMERIC(15,2) DEFAULT 0,
    import_expenses NUMERIC(15,2) DEFAULT 0,
    somme_recoupee NUMERIC(15,2) DEFAULT 0,
    date_creation TIMESTAMP DEFAULT NOW()
);

-- Table controles
CREATE TABLE IF NOT EXISTS controles (
    id_controle SERIAL PRIMARY KEY,
    id_declaration INTEGER REFERENCES declarations(id_declaration) ON DELETE CASCADE,
    id_agent INTEGER REFERENCES agents(id_agent) ON DELETE SET NULL,
    type VARCHAR(20) NOT NULL,
    resultat VARCHAR(20) NOT NULL,
    ecart NUMERIC(15,2) DEFAULT 0,
    pourcentage_ecart NUMERIC(8,2) DEFAULT 0,
    commentaire TEXT,
    date_controle TIMESTAMP DEFAULT NOW()
);

-- Indexes pour performance
CREATE INDEX idx_declarations_entreprise ON declarations(id_entreprise);
CREATE INDEX idx_declarations_annee ON declarations(annee);
CREATE INDEX idx_declarations_statut ON declarations(statut);
CREATE INDEX idx_recoupements_entreprise ON recoupements(id_entreprise);
CREATE INDEX idx_controles_declaration ON controles(id_declaration);
CREATE INDEX idx_entreprises_nif ON entreprises(nif);
CREATE INDEX idx_agents_email ON agents(email);

-- Vues
CREATE VIEW vue_statistiques_globales AS
SELECT 
    (SELECT COUNT(*) FROM entreprises) as total_entreprises,
    (SELECT COUNT(*) FROM declarations) as total_declarations,
    (SELECT COUNT(*) FROM controles) as total_controles,
    (SELECT COUNT(*) FROM agents WHERE role = 'admin') as admins,
    (SELECT COUNT(*) FROM agents WHERE role = 'agent') as agents,
    (SELECT SUM(tva_payee) FROM declarations) as tva_totale,
    (SELECT SUM(tva_theorique) FROM declarations) as tva_theorique_totale;