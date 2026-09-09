-- Migration 002: Ajout des colonnes de gestion de la procédure contradictoire (CGI LFI 2026)
BEGIN;

-- Élargir le champ statut si nécessaire
ALTER TABLE IF EXISTS declarations 
  ALTER COLUMN statut TYPE VARCHAR(40);

-- Date d'émission de la notification primitive et date limite de réponse (30 jours)
ALTER TABLE IF EXISTS declarations 
  ADD COLUMN IF NOT EXISTS date_notification_primitive TIMESTAMP NULL;

ALTER TABLE IF EXISTS declarations 
  ADD COLUMN IF NOT EXISTS date_limite_reponse TIMESTAMP NULL;

ALTER TABLE IF EXISTS declarations 
  ADD COLUMN IF NOT EXISTS prorogation_jours INT DEFAULT 0;

-- Date de notification définitive
ALTER TABLE IF EXISTS declarations 
  ADD COLUMN IF NOT EXISTS date_notification_definitive TIMESTAMP NULL;

-- Montants financiers associés au redressement et compensation de crédits
ALTER TABLE IF EXISTS declarations 
  ADD COLUMN IF NOT EXISTS montant_redressement DECIMAL(15, 2) DEFAULT 0;

ALTER TABLE IF EXISTS declarations 
  ADD COLUMN IF NOT EXISTS credit_impot DECIMAL(15, 2) DEFAULT 0;

ALTER TABLE IF EXISTS declarations 
  ADD COLUMN IF NOT EXISTS montant_impute DECIMAL(15, 2) DEFAULT 0;

ALTER TABLE IF EXISTS declarations 
  ADD COLUMN IF NOT EXISTS montant_net_a_payer DECIMAL(15, 2) DEFAULT 0;

ALTER TABLE IF EXISTS declarations 
  ADD COLUMN IF NOT EXISTS observations_agent TEXT NULL;

COMMIT;
