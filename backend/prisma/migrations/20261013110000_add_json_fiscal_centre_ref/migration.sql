ALTER TABLE "contribuables"
ADD COLUMN "centre_fiscal_ref" VARCHAR(255);

CREATE INDEX "idx_contribuables_centre_fiscal_ref"
ON "contribuables"("centre_fiscal_ref");
