const { Client } = require('pg');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline/promises');

const backendDirectory = path.resolve(__dirname, '..');
const prismaCli = path.join(backendDirectory, 'node_modules', 'prisma', 'build', 'index.js');
const bootstrapSchema = 'spscf_meta';
const baselineMigrations = [
  '0_init',
  '20260922120000_add_relances',
  '20261013110000_add_json_fiscal_centre_ref',
  '20261122230000_add_previsions',
];

const constraintsSql = `
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'relances_type_relance_check' AND conrelid = 'public.relances'::regclass) THEN
    ALTER TABLE public.relances ADD CONSTRAINT relances_type_relance_check
      CHECK (type_relance IN ('rappel1', 'rappel2', 'mise_en_demeure', 'demande_eclaircissement'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'relances_statut_check' AND conrelid = 'public.relances'::regclass) THEN
    ALTER TABLE public.relances ADD CONSTRAINT relances_statut_check
      CHECK (statut IN ('emise', 'regularisee', 'annulee'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'relances_montant_du_check' AND conrelid = 'public.relances'::regclass) THEN
    ALTER TABLE public.relances ADD CONSTRAINT relances_montant_du_check CHECK (montant_du >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'relances_jours_retard_check' AND conrelid = 'public.relances'::regclass) THEN
    ALTER TABLE public.relances ADD CONSTRAINT relances_jours_retard_check CHECK (jours_retard >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_statut_activite' AND conrelid = 'public.etat_contribuable'::regclass) THEN
    ALTER TABLE public.etat_contribuable ADD CONSTRAINT check_statut_activite
      CHECK (statut_activite IN ('Actif', 'En sommeil', 'En cessation', 'Radié'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_statut_conformite' AND conrelid = 'public.etat_contribuable'::regclass) THEN
    ALTER TABLE public.etat_contribuable ADD CONSTRAINT check_statut_conformite
      CHECK (statut_conformite IN ('En règle', 'Défaillant', 'Sous contrôle', 'Bloqué'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_rapprochements_type' AND conrelid = 'public.rapprochements'::regclass) THEN
    ALTER TABLE public.rapprochements ADD CONSTRAINT chk_rapprochements_type
      CHECK (type_rapprochement IN ('exact', 'tolerance', 'partiel', 'manuel'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_rapprochements_statut' AND conrelid = 'public.rapprochements'::regclass) THEN
    ALTER TABLE public.rapprochements ADD CONSTRAINT chk_rapprochements_statut
      CHECK (statut IN ('rapproche', 'a_verifier', 'ecart', 'valide', 'rejete', 'annule'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_rapprochements_score' AND conrelid = 'public.rapprochements'::regclass) THEN
    ALTER TABLE public.rapprochements ADD CONSTRAINT chk_rapprochements_score
      CHECK (score IS NULL OR score BETWEEN 0 AND 100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_rapprochements_montant_declare' AND conrelid = 'public.rapprochements'::regclass) THEN
    ALTER TABLE public.rapprochements ADD CONSTRAINT chk_rapprochements_montant_declare
      CHECK (montant_declare IS NULL OR montant_declare >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_rapprochements_montant_recoupe' AND conrelid = 'public.rapprochements'::regclass) THEN
    ALTER TABLE public.rapprochements ADD CONSTRAINT chk_rapprochements_montant_recoupe
      CHECK (montant_recoupe IS NULL OR montant_recoupe >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'previsions_annee_check' AND conrelid = 'public.previsions'::regclass) THEN
    ALTER TABLE public.previsions ADD CONSTRAINT previsions_annee_check
      CHECK (annee BETWEEN 2000 AND 2100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'previsions_montant_prevu_check' AND conrelid = 'public.previsions'::regclass) THEN
    ALTER TABLE public.previsions ADD CONSTRAINT previsions_montant_prevu_check
      CHECK (montant_prevu > 0);
  END IF;
END $$;

INSERT INTO public.centres (nom_centre, type_centre, numero_centre)
VALUES ('SSIF', 'DGE', 'SSIF')
ON CONFLICT (numero_centre) DO NOTHING;
`;

const runPrisma = (args) => {
  const result = spawnSync(process.execPath, [prismaCli, ...args], {
    cwd: backendDirectory,
    env: process.env,
    stdio: 'inherit',
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`Prisma ${args.join(' ')} failed with exit code ${result.status}`);
  }
};

const isMigrationTablePresent = async (client) => {
  const result = await client.query("SELECT to_regclass('public._prisma_migrations') IS NOT NULL AS present");
  return result.rows[0].present;
};

const appliedMigrations = async (client) => {
  if (!(await isMigrationTablePresent(client))) return new Set();
  const result = await client.query('SELECT migration_name FROM public._prisma_migrations WHERE finished_at IS NOT NULL');
  return new Set(result.rows.map((row) => row.migration_name));
};

const confirmTargetDatabase = async () => {
  if (!process.stdin.isTTY) {
    throw new Error('Cette commande doit être lancée dans un terminal interactif.');
  }

  if (!process.env.DATABASE_URL) {
    throw new Error('Définissez DATABASE_URL avec la chaîne de connexion directe de Neon.');
  }

  let url;
  try {
    url = new URL(process.env.DATABASE_URL);
  } catch {
    throw new Error('DATABASE_URL n’est pas une URL PostgreSQL valide.');
  }

  const databaseName = decodeURIComponent(url.pathname.replace(/^\/+/, ''));
  if (url.protocol !== 'postgres:' && url.protocol !== 'postgresql:') {
    throw new Error('DATABASE_URL doit utiliser PostgreSQL.');
  }
  if (!url.hostname.endsWith('.neon.tech') || !databaseName) {
    throw new Error('Cette initialisation est réservée à une base Neon identifiée dans DATABASE_URL.');
  }
  if (!url.searchParams.get('sslmode')?.startsWith('require')) {
    throw new Error('L’URL Neon doit exiger TLS (sslmode=require).');
  }

  const terminal = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const confirmation = await terminal.question(
      `Cette commande initialise la base Neon "${databaseName}". ` +
      `Tape "${databaseName}" pour confirmer : `,
    );
    if (confirmation !== databaseName) {
      throw new Error('Confirmation incorrecte ; aucune modification effectuée.');
    }
  } finally {
    terminal.close();
  }
};

const bootstrap = async () => {
  await confirmTargetDatabase();

  for (const migration of baselineMigrations) {
    const migrationFile = path.join(backendDirectory, 'prisma', 'migrations', migration, 'migration.sql');
    if (!fs.existsSync(migrationFile)) {
      throw new Error(`Migration de baseline manquante : ${migration}.`);
    }
  }

  if (!fs.existsSync(prismaCli)) {
    throw new Error('Prisma CLI introuvable ; installez les dépendances avant le bootstrap.');
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    const tables = await client.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);
    const markerResult = await client.query(
      "SELECT to_regclass('spscf_meta.bootstrap_state') IS NOT NULL AS present",
    );
    const markerExists = markerResult.rows[0].present;
    const applicationTables = tables.rows;

    if (!markerExists && applicationTables.length > 0) {
      throw new Error(
        `La base n'est pas vide (${applicationTables.length} table(s) détectée(s)). ` +
        'Initialisation annulée pour protéger les données existantes.',
      );
    }

    if (!markerExists) {
      await client.query(`
        CREATE SCHEMA ${bootstrapSchema};
        CREATE TABLE ${bootstrapSchema}.bootstrap_state (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          started_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        INSERT INTO ${bootstrapSchema}.bootstrap_state (id) VALUES (1);
      `);
    } else {
      const state = await client.query(`SELECT id FROM ${bootstrapSchema}.bootstrap_state`);
      if (state.rows.length !== 1 || state.rows[0].id !== 1) {
        throw new Error('Marqueur de reprise invalide ; aucune modification effectuée.');
      }
    }

    runPrisma(['db', 'push', '--schema', 'prisma/schema.prisma']);
    await client.query(constraintsSql);

    let applied = await appliedMigrations(client);
    for (const migration of baselineMigrations) {
      if (!applied.has(migration)) {
        runPrisma(['migrate', 'resolve', '--applied', migration, '--schema', 'prisma/schema.prisma']);
        applied = await appliedMigrations(client);
      }
    }

    await client.query(`DROP SCHEMA ${bootstrapSchema} CASCADE`);
    console.log('Initialisation terminée : schéma Prisma, contraintes et historique de base prêts.');
  } finally {
    await client.end();
  }
};

bootstrap().catch((error) => {
  console.error(`Initialisation de la base impossible : ${error.message}`);
  process.exitCode = 1;
});
