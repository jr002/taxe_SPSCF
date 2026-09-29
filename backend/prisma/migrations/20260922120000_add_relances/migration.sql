-- CreateTable
CREATE TABLE "relances" (
    "id_relance" SERIAL NOT NULL,
    "id_contribuable" INTEGER NOT NULL,
    "id_declaration" INTEGER,
    "id_agent" INTEGER,
    "type_relance" VARCHAR(30) NOT NULL,
    "statut" VARCHAR(20) NOT NULL DEFAULT 'emise',
    "annee" INTEGER NOT NULL,
    "montant_du" DECIMAL(15,2) NOT NULL,
    "jours_retard" INTEGER NOT NULL DEFAULT 0,
    "date_emission" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_regularisation" TIMESTAMP(6),
    "document_url" TEXT,
    "observations" TEXT,
    "date_creation" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_modification" TIMESTAMP(6),

    CONSTRAINT "relances_pkey" PRIMARY KEY ("id_relance"),
    CONSTRAINT "relances_type_relance_check" CHECK ("type_relance" IN ('rappel1', 'rappel2', 'mise_en_demeure')),
    CONSTRAINT "relances_statut_check" CHECK ("statut" IN ('emise', 'regularisee', 'annulee')),
    CONSTRAINT "relances_montant_du_check" CHECK ("montant_du" >= 0),
    CONSTRAINT "relances_jours_retard_check" CHECK ("jours_retard" >= 0)
);

-- CreateIndex
CREATE INDEX "idx_relances_contribuable_date" ON "relances"("id_contribuable", "date_emission" DESC);
CREATE INDEX "idx_relances_statut" ON "relances"("statut");
CREATE INDEX "idx_relances_declaration" ON "relances"("id_declaration");

-- AddForeignKey
ALTER TABLE "relances" ADD CONSTRAINT "relances_id_contribuable_fkey"
  FOREIGN KEY ("id_contribuable") REFERENCES "contribuables"("id_contribuable")
  ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "relances" ADD CONSTRAINT "relances_id_declaration_fkey"
  FOREIGN KEY ("id_declaration") REFERENCES "declarations"("id_declaration")
  ON DELETE SET NULL ON UPDATE NO ACTION;

ALTER TABLE "relances" ADD CONSTRAINT "relances_id_agent_fkey"
  FOREIGN KEY ("id_agent") REFERENCES "agents"("id_agent")
  ON DELETE SET NULL ON UPDATE NO ACTION;
