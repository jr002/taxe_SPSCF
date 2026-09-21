-- CreateTable
CREATE TABLE "agents" (
    "id_agent" SERIAL NOT NULL,
    "nom" VARCHAR(100) NOT NULL,
    "prenom" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "mot_de_passe" VARCHAR(255) NOT NULL,
    "role" VARCHAR(50) DEFAULT 'agent',
    "statut" VARCHAR(20) DEFAULT 'actif',
    "date_creation" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "date_modification" TIMESTAMP(6),

    CONSTRAINT "agents_pkey" PRIMARY KEY ("id_agent")
);

-- CreateTable
CREATE TABLE "controles" (
    "id_controle" SERIAL NOT NULL,
    "id_declaration" INTEGER,
    "id_agent" INTEGER,
    "type" VARCHAR(20) NOT NULL,
    "resultat" VARCHAR(20) NOT NULL,
    "ecart" DECIMAL(15,2) DEFAULT 0,
    "pourcentage_ecart" DECIMAL(8,2) DEFAULT 0,
    "commentaire" TEXT,
    "date_controle" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "controles_pkey" PRIMARY KEY ("id_controle")
);

-- CreateTable
CREATE TABLE "declarations" (
    "id_declaration" SERIAL NOT NULL,
    "id_contribuable" INTEGER,
    "annee" INTEGER NOT NULL,
    "ca" DECIMAL(15,2) DEFAULT 0,
    "benefice" DECIMAL(15,2) DEFAULT 0,
    "tva_collectee" DECIMAL(15,2) DEFAULT 0,
    "tva_deductible" DECIMAL(15,2) DEFAULT 0,
    "tva_payee" DECIMAL(15,2) DEFAULT 0,
    "tva_theorique" DECIMAL(15,2) DEFAULT 0,
    "statut" VARCHAR(40) DEFAULT 'conforme',
    "date_notification_primitive" TIMESTAMP(6),
    "date_limite_reponse" TIMESTAMP(6),
    "prorogation_jours" INTEGER DEFAULT 0,
    "date_notification_definitive" TIMESTAMP(6),
    "montant_redressement" DECIMAL(15,2) DEFAULT 0,
    "credit_impot" DECIMAL(15,2) DEFAULT 0,
    "montant_impute" DECIMAL(15,2) DEFAULT 0,
    "montant_net_a_payer" DECIMAL(15,2) DEFAULT 0,
    "observations_agent" TEXT,
    "date_creation" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "date_modification" TIMESTAMP(6),

    CONSTRAINT "declarations_pkey" PRIMARY KEY ("id_declaration")
);

-- CreateTable
CREATE TABLE "recoupements" (
    "id_recoupement" SERIAL NOT NULL,
    "id_contribuable" INTEGER,
    "source" VARCHAR(50) NOT NULL,
    "merchandise_sold" DECIMAL(15,2) DEFAULT 0,
    "goods_purchased" DECIMAL(15,2) DEFAULT 0,
    "services_purchased" DECIMAL(15,2) DEFAULT 0,
    "third_party_payments" DECIMAL(15,2) DEFAULT 0,
    "local_products" DECIMAL(15,2) DEFAULT 0,
    "import_expenses" DECIMAL(15,2) DEFAULT 0,
    "somme_recoupee" DECIMAL(15,2) DEFAULT 0,
    "date_creation" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recoupements_pkey" PRIMARY KEY ("id_recoupement")
);

-- CreateTable
CREATE TABLE "contribuables" (
    "id_contribuable" SERIAL NOT NULL,
    "id_centre" INTEGER,
    "nif" VARCHAR(50) NOT NULL,
    "raison_sociale" VARCHAR(255) NOT NULL,
    "secteur_activite" VARCHAR(100) NOT NULL,
    "adresse" TEXT,
    "telephone" VARCHAR(20),
    "email" VARCHAR(100),
    "regime_fiscal" VARCHAR(10),
    "date_creation" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "date_modification" TIMESTAMP(6),

    CONSTRAINT "entreprises_pkey" PRIMARY KEY ("id_contribuable")
);

-- CreateTable
CREATE TABLE "centres" (
    "id_centre" SERIAL NOT NULL,
    "nom_centre" VARCHAR(255) NOT NULL,
    "type_centre" VARCHAR(30) NOT NULL,
    "numero_centre" VARCHAR(50) NOT NULL,
    "email_centre" VARCHAR(255),
    "date_creation" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "date_modification" TIMESTAMP(6),

    CONSTRAINT "centres_pkey" PRIMARY KEY ("id_centre")
);

-- CreateIndex
CREATE UNIQUE INDEX "agents_email_key" ON "agents"("email");

-- CreateIndex
CREATE INDEX "idx_agents_email" ON "agents"("email");

-- CreateIndex
CREATE INDEX "idx_controles_declaration" ON "controles"("id_declaration");

-- CreateIndex
CREATE INDEX "idx_declarations_annee" ON "declarations"("annee");

-- CreateIndex
CREATE INDEX "idx_declarations_entreprise" ON "declarations"("id_contribuable");

-- CreateIndex
CREATE INDEX "idx_declarations_statut" ON "declarations"("statut");

-- CreateIndex
CREATE UNIQUE INDEX "declarations_id_entreprise_annee_key" ON "declarations"("id_contribuable", "annee");

-- CreateIndex
CREATE INDEX "idx_recoupements_entreprise" ON "recoupements"("id_contribuable");

-- CreateIndex
CREATE UNIQUE INDEX "entreprises_nif_key" ON "contribuables"("nif");

-- CreateIndex
CREATE INDEX "idx_entreprises_nif" ON "contribuables"("nif");

-- CreateIndex
CREATE INDEX "idx_contribuables_centre" ON "contribuables"("id_centre");

-- CreateIndex
CREATE UNIQUE INDEX "centres_numero_centre_key" ON "centres"("numero_centre");

-- CreateIndex
CREATE INDEX "idx_centres_type" ON "centres"("type_centre");

-- AddForeignKey
ALTER TABLE "controles" ADD CONSTRAINT "controles_id_agent_fkey" FOREIGN KEY ("id_agent") REFERENCES "agents"("id_agent") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "controles" ADD CONSTRAINT "controles_id_declaration_fkey" FOREIGN KEY ("id_declaration") REFERENCES "declarations"("id_declaration") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "declarations" ADD CONSTRAINT "declarations_id_entreprise_fkey" FOREIGN KEY ("id_contribuable") REFERENCES "contribuables"("id_contribuable") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "recoupements" ADD CONSTRAINT "recoupements_id_entreprise_fkey" FOREIGN KEY ("id_contribuable") REFERENCES "contribuables"("id_contribuable") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "contribuables" ADD CONSTRAINT "contribuables_id_centre_fkey" FOREIGN KEY ("id_centre") REFERENCES "centres"("id_centre") ON DELETE SET NULL ON UPDATE NO ACTION;
