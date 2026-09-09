  BEGIN;

ALTER TABLE IF EXISTS entreprises RENAME TO contribuables;

ALTER TABLE IF EXISTS contribuables
  RENAME COLUMN id_entreprise TO id_contribuable;

ALTER TABLE IF EXISTS declarations
  RENAME COLUMN id_entreprise TO id_contribuable;

ALTER TABLE IF EXISTS recoupements
  RENAME COLUMN id_entreprise TO id_contribuable;

COMMIT;
