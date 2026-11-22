BEGIN;

CREATE TABLE IF NOT EXISTS "previsions" (
    "id_prevision" SERIAL NOT NULL,
    "id_centre" INTEGER NOT NULL,
    "id_agent" INTEGER,
    "annee" INTEGER NOT NULL,
    "montant_prevu" DECIMAL(15,2) NOT NULL,
    "observation" VARCHAR(255),
    "date_creation" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "date_modification" TIMESTAMP(6),

    CONSTRAINT "previsions_pkey" PRIMARY KEY ("id_prevision"),
    CONSTRAINT "previsions_annee_check" CHECK ("annee" BETWEEN 2000 AND 2100),
    CONSTRAINT "previsions_montant_prevu_check" CHECK ("montant_prevu" > 0),
    CONSTRAINT "previsions_centre_annee_key" UNIQUE ("id_centre", "annee")
);

CREATE INDEX IF NOT EXISTS "idx_previsions_centre" ON "previsions"("id_centre");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'previsions_annee_check'
          AND conrelid = '"previsions"'::regclass
    ) THEN
        ALTER TABLE "previsions"
            ADD CONSTRAINT "previsions_annee_check"
            CHECK ("annee" BETWEEN 2000 AND 2100);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'previsions_montant_prevu_check'
          AND conrelid = '"previsions"'::regclass
    ) THEN
        ALTER TABLE "previsions"
            ADD CONSTRAINT "previsions_montant_prevu_check"
            CHECK ("montant_prevu" > 0);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'previsions_id_centre_fkey'
          AND conrelid = '"previsions"'::regclass
    ) THEN
        ALTER TABLE "previsions"
            ADD CONSTRAINT "previsions_id_centre_fkey"
            FOREIGN KEY ("id_centre") REFERENCES "centres"("id_centre")
            ON DELETE CASCADE ON UPDATE NO ACTION;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'previsions_id_agent_fkey'
          AND conrelid = '"previsions"'::regclass
    ) THEN
        ALTER TABLE "previsions"
            ADD CONSTRAINT "previsions_id_agent_fkey"
            FOREIGN KEY ("id_agent") REFERENCES "agents"("id_agent")
            ON DELETE SET NULL ON UPDATE NO ACTION;
    END IF;
END $$;

COMMIT;
