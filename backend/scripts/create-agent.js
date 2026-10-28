const bcrypt = require('bcryptjs');
const prisma = require('../src/config/prisma');
const { AgentModel } = require('../src/models/agent.model');

const createAgent = async () => {
  const { AGENT_EMAIL, AGENT_PASSWORD, AGENT_FIRST_NAME, AGENT_LAST_NAME } = process.env;
  if (!AGENT_EMAIL || !AGENT_PASSWORD || !AGENT_FIRST_NAME || !AGENT_LAST_NAME) {
    throw new Error('Définissez AGENT_EMAIL, AGENT_PASSWORD, AGENT_FIRST_NAME et AGENT_LAST_NAME');
  }
  if (AGENT_PASSWORD.length < 12) {
    throw new Error('Le mot de passe doit contenir au moins 12 caractères');
  }

  const email = AGENT_EMAIL.trim().toLowerCase();
  const existingAgent = await prisma.agents.findUnique({ where: { email } });
  if (existingAgent) {
    throw new Error('Un agent possède déjà cette adresse e-mail');
  }

  const hashedPassword = await bcrypt.hash(AGENT_PASSWORD, 12);
  // Un administrateur est affilié d'office au centre SSIF (migration 008) ; son
  // périmètre reste national, l'affectation est seulement informative.
  const idCentreAdministrateurs = await AgentModel.findIdCentreAdministrateurs();
  await prisma.agents.create({
    data: {
      email,
      mot_de_passe: hashedPassword,
      prenom: AGENT_FIRST_NAME.trim(),
      nom: AGENT_LAST_NAME.trim(),
      role: 'admin',
      statut: 'actif',
      id_centre: idCentreAdministrateurs,
    },
  });
  console.log(`Compte agent créé : ${email}`);
  if (idCentreAdministrateurs === null) {
    console.log("Avertissement : le centre SSIF est absent, la migration 008 est à appliquer.");
  }
};

createAgent()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });