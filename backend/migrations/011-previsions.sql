-- Prévisions de recette du centre, portées par le chef de centre.
-- Une seule prévision par centre et par année civile : le doublon est un
-- conflit métier (409), pas une panne serveur.
CREATE TABLE IF NOT EXISTS previsions (
  id_prevision      SERIAL PRIMARY KEY,
  id_centre         INTEGER NOT NULL REFERENCES centres (id_centre) ON DELETE CASCADE,
  id_agent          INTEGER REFERENCES agents (id_agent) ON DELETE SET NULL,
  annee             INTEGER NOT NULL CHECK (annee BETWEEN 2000 AND 2100),
  montant_prevu     NUMERIC(15, 2) NOT NULL CHECK (montant_prevu > 0),
  observation       VARCHAR(255),
  date_creation     TIMESTAMP(6) NOT NULL DEFAULT NOW(),
  date_modification TIMESTAMP(6),
  CONSTRAINT previsions_centre_annee_key UNIQUE (id_centre, annee)
);

CREATE INDEX IF NOT EXISTS idx_previsions_centre ON previsions (id_centre);