BEGIN;

-- Affectation du centre fiscal de rattachement d'un agent (périmètre de consultation).
ALTER TABLE agents
  ADD COLUMN IF NOT EXISTS id_centre INTEGER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'agents_id_centre_fkey'
  ) THEN
    ALTER TABLE agents
      ADD CONSTRAINT agents_id_centre_fkey
      FOREIGN KEY (id_centre) REFERENCES centres(id_centre)
      ON DELETE SET NULL ON UPDATE NO ACTION;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_agents_centre
  ON agents(id_centre);

-- Le rôle « client » est renommé « contribuable » dans le nouveau catalogue.
UPDATE agents SET role = 'contribuable' WHERE role = 'client';

COMMIT;
