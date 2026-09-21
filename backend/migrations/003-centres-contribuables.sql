BEGIN;

CREATE TABLE IF NOT EXISTS centres (
  id_centre SERIAL PRIMARY KEY,
  nom_centre VARCHAR(255) NOT NULL,
  type_centre VARCHAR(30) NOT NULL,
  numero_centre VARCHAR(50) NOT NULL UNIQUE,
  email_centre VARCHAR(255),
  telephone_centre VARCHAR(30),
  date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  date_modification TIMESTAMP
);

ALTER TABLE centres
  ADD COLUMN IF NOT EXISTS telephone_centre VARCHAR(30);

ALTER TABLE contribuables
  ADD COLUMN IF NOT EXISTS id_centre INTEGER NULL;

CREATE INDEX IF NOT EXISTS idx_centres_type ON centres(type_centre);
CREATE INDEX IF NOT EXISTS idx_contribuables_centre ON contribuables(id_centre);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'contribuables_id_centre_fkey'
  ) THEN
    ALTER TABLE contribuables
      ADD CONSTRAINT contribuables_id_centre_fkey
      FOREIGN KEY (id_centre) REFERENCES centres(id_centre)
      ON DELETE SET NULL ON UPDATE NO ACTION;
  END IF;
END $$;

COMMIT;
