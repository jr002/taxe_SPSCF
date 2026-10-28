BEGIN;

CREATE TABLE IF NOT EXISTS droits_communication (
  id_droit SERIAL PRIMARY KEY,
  id_contribuable INTEGER NOT NULL,
  id_agent INTEGER NULL,
  tier VARCHAR(255) NOT NULL,
  type_tier VARCHAR(30) DEFAULT 'autre',
  nif_tier VARCHAR(50),
  objet TEXT NOT NULL,
  pieces_demandees TEXT,
  date_demande DATE NOT NULL,
  date_reponse DATE,
  statut VARCHAR(20) NOT NULL DEFAULT 'demande',
  documents_recus TEXT,
  observations TEXT,
  date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  date_modification TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_droits_communication_contribuable
  ON droits_communication(id_contribuable);
CREATE INDEX IF NOT EXISTS idx_droits_communication_statut
  ON droits_communication(statut);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'droits_communication_id_contribuable_fkey'
  ) THEN
    ALTER TABLE droits_communication
      ADD CONSTRAINT droits_communication_id_contribuable_fkey
      FOREIGN KEY (id_contribuable) REFERENCES contribuables(id_contribuable)
      ON DELETE CASCADE ON UPDATE NO ACTION;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'droits_communication_id_agent_fkey'
  ) THEN
    ALTER TABLE droits_communication
      ADD CONSTRAINT droits_communication_id_agent_fkey
      FOREIGN KEY (id_agent) REFERENCES agents(id_agent)
      ON DELETE SET NULL ON UPDATE NO ACTION;
  END IF;
END $$;

COMMIT;
