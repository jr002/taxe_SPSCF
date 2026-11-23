const { test } = require('node:test');
const assert = require('node:assert/strict');
const fiscalData = require('../../unitefiscal.json');
const { buildCentreRecords, synchronizeCentres } = require('../scripts/seed-centres');

test('builds unique database records for every unit in the fiscal reference', () => {
  const records = buildCentreRecords(fiscalData);
  const units = fiscalData.unites_operationnelles;

  assert.equal(
    records.length,
    units.centres_fiscaux.length + units.sre.length + 1,
  );
  assert.equal(records.filter((centre) => centre.type_centre === 'Centre Fiscal').length, units.centres_fiscaux.length);
  assert.equal(records.filter((centre) => centre.type_centre === 'SRE').length, units.sre.length);
  assert.ok(records.some(
    (centre) => centre.type_centre === 'DGE'
      && centre.nom_centre === `${units.direction_des_grandes_entreprises.nom_complet} (${units.direction_des_grandes_entreprises.sigle})`,
  ));
  assert.equal(new Set(records.map((centre) => centre.numero_centre)).size, records.length);
  assert.ok(records.every((centre) => centre.numero_centre.startsWith('REF-')));
});

test('rejects incomplete or duplicate fiscal references before writing to the database', () => {
  assert.throws(
    () => buildCentreRecords({ unites_operationnelles: {} }),
    /DGE/,
  );

  const duplicatedReference = {
    unites_operationnelles: {
      direction_des_grandes_entreprises: { nom_complet: 'DGE', sigle: 'DGE' },
      sre: [{ nom: 'Même unité' }],
      centres_fiscaux: [{ nom: 'Même unité' }],
    },
  };

  assert.doesNotThrow(() => buildCentreRecords(duplicatedReference));
  duplicatedReference.unites_operationnelles.sre.push({ nom: 'Même unité' });
  assert.throws(() => buildCentreRecords(duplicatedReference), /doublon/i);
});

test('synchronizes missing units without duplicating them on later deploys', async () => {
  const centres = [];
  const prisma = {
    centres: {
      findMany: async () => centres.map(({ nom_centre, type_centre }) => ({ nom_centre, type_centre })),
      createMany: async ({ data }) => {
        const existingCodes = new Set(centres.map((centre) => centre.numero_centre));
        const newCentres = data.filter((centre) => !existingCodes.has(centre.numero_centre));
        centres.push(...newCentres);
        return { count: newCentres.length };
      },
    },
  };

  const firstRun = await synchronizeCentres(prisma);
  const secondRun = await synchronizeCentres(prisma);

  assert.equal(firstRun.created, firstRun.total);
  assert.equal(secondRun.created, 0);
  assert.equal(centres.length, firstRun.total);
});
