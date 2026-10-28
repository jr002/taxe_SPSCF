BEGIN;

-- Liens d'accès au portail du contribuable.
--
-- Un agent émet un lien pour un dossier précis ; le contribuable ouvre ce lien
-- puis confirme son identité avec son NIF et l'adresse e-mail enregistrée. Le
-- jeton n'est jamais stocké en clair : seule son empreinte SHA-256 est
-- conservée, ce qui rend la table inexploitable en cas de fuite de la base.
-- La ligne sert aussi de journal minimal (dernier accès, nombre d'ouvertures
-- et d'échecs de vérification).

CREATE TABLE IF NOT EXISTS public.acces_contribuable (
  id_acces           serial       PRIMARY KEY,
  id_contribuable    integer      NOT NULL,
  id_agent           integer,
  token_hash         varchar(64)  NOT NULL,
  date_creation      timestamp(6) DEFAULT now() NOT NULL,
  date_expiration    timestamp(6) NOT NULL,
  date_revocation    timestamp(6),
  date_dernier_acces timestamp(6),
  nb_acces           integer      DEFAULT 0 NOT NULL,
  nb_echecs          integer      DEFAULT 0 NOT NULL,
  CONSTRAINT acces_contribuable_id_contribuable_fkey
    FOREIGN KEY (id_contribuable) REFERENCES public.contribuables(id_contribuable)
    ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT acces_contribuable_id_agent_fkey
    FOREIGN KEY (id_agent) REFERENCES public.agents(id_agent)
    ON DELETE SET NULL ON UPDATE NO ACTION
);

CREATE UNIQUE INDEX IF NOT EXISTS acces_contribuable_token_hash_key
  ON public.acces_contribuable(token_hash);
CREATE INDEX IF NOT EXISTS idx_acces_contribuable
  ON public.acces_contribuable(id_contribuable);

COMMIT;
