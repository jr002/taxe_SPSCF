const { createHash } = require('node:crypto');
const fiscalData = require('../../unitefiscal.json');

const referenceKey = (centre) => `${centre.type_centre}\u0000${centre.nom_centre}`;

const referenceNumber = (type, name) => {
  const digest = createHash('sha256')
    .update(`${type}\u0000${name}`, 'utf8')
    .digest('hex')
    .slice(0, 20)
    .toUpperCase();

  return `REF-${digest}`;
};

function buildCentreRecords(data) {
  const units = data?.unites_operationnelles;
  const dge = units?.direction_des_grandes_entreprises;

  if (!dge || typeof dge.nom_complet !== 'string' || typeof dge.sigle !== 'string') {
    throw new Error('Le référentiel doit contenir l’unité de la DGE.');
  }

  const records = [
    { type_centre: 'DGE', nom_centre: `${dge.nom_complet} (${dge.sigle})` },
  ];

  for (const [key, type] of [['sre', 'SRE'], ['centres_fiscaux', 'Centre Fiscal']]) {
    if (!Array.isArray(units[key])) {
      throw new Error(`Le référentiel doit contenir une liste ${key}.`);
    }

    for (const unit of units[key]) {
      if (typeof unit?.nom !== 'string' || !unit.nom.trim()) {
        throw new Error(`Une unité de la liste ${key} n’a pas de nom valide.`);
      }

      records.push({ type_centre: type, nom_centre: unit.nom.trim() });
    }
  }

  const seen = new Set();
  for (const centre of records) {
    const key = referenceKey(centre);
    if (seen.has(key)) {
      throw new Error(`Le référentiel contient un doublon : ${centre.nom_centre}.`);
    }
    seen.add(key);
    centre.numero_centre = referenceNumber(centre.type_centre, centre.nom_centre);
  }

  return records;
}

async function synchronizeCentres(prisma, data = fiscalData) {
  const records = buildCentreRecords(data);
  const existingCentres = await prisma.centres.findMany({
    select: { nom_centre: true, type_centre: true },
  });
  const existingKeys = new Set(existingCentres.map(referenceKey));
  const missingRecords = records.filter((centre) => !existingKeys.has(referenceKey(centre)));

  const created = missingRecords.length
    ? await prisma.centres.createMany({ data: missingRecords, skipDuplicates: true })
    : { count: 0 };

  const savedCentres = await prisma.centres.findMany({
    select: { nom_centre: true, type_centre: true },
  });
  const savedKeys = new Set(savedCentres.map(referenceKey));
  const missingAfterSeed = records.filter((centre) => !savedKeys.has(referenceKey(centre)));

  if (missingAfterSeed.length) {
    throw new Error(
      `Le registre reste incomplet après l’initialisation (${missingAfterSeed.length} unité(s) manquante(s)).`,
    );
  }

  return { created: created.count, total: records.length };
}

async function seedCentres() {
  const prisma = require('../src/config/prisma');

  try {
    const result = await synchronizeCentres(prisma);
    console.log(
      `Registre des unités fiscales synchronisé : ${result.created} ajoutée(s), ` +
      `${result.total - result.created} déjà présente(s).`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  seedCentres().catch((error) => {
    console.error(`Échec de l’initialisation du registre des centres : ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = { buildCentreRecords, synchronizeCentres };
