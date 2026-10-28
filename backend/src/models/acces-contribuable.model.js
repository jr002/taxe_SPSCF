const crypto = require('crypto');
const prisma = require('../config/prisma');

const DUREE_PAR_DEFAUT_JOURS = 7;
const DUREE_MAX_JOURS = 30;

const JOUR_MS = 86_400_000;

/** Le jeton ne quitte jamais la base en clair : seule son empreinte est relue. */
const hashToken = (token) => crypto.createHash('sha256').update(String(token)).digest('hex');

const normaliser = (value) => String(value ?? '').trim();
const normaliserNif = (value) => normaliser(value).toUpperCase();
const normaliserEmail = (value) => normaliser(value).toLowerCase();

const estActif = (row, now = new Date()) =>
  Boolean(row)
  && row.date_revocation === null
  && new Date(row.date_expiration).getTime() > now.getTime();

/** Confirmation visuelle sans divulguer l'identité complète avant vérification. */
const masquerNom = (value) => {
  const texte = normaliser(value);
  if (!texte) return 'Dossier fiscal';
  return texte.length <= 4 ? `${texte[0]}***` : `${texte.slice(0, 4)}…`;
};

const masquerEmail = (value) => {
  const email = normaliserEmail(value);
  const [local, domaine] = email.split('@');
  if (!local || !domaine) return '';
  return `${local.slice(0, 2)}***@${domaine}`;
};

class AccesContribuableModel {
  /**
   * Émet un nouveau jeton. Un dossier ne conserve qu'un lien actif : les
   * précédents sont révoqués dans la même transaction, ce qui évite qu'un lien
   * transmis par erreur reste valable après la réémission.
   */
  static async creer({ id_contribuable, id_agent = null, duree_jours }) {
    const jours = Math.min(
      DUREE_MAX_JOURS,
      Math.max(1, parseInt(duree_jours, 10) || DUREE_PAR_DEFAUT_JOURS),
    );
    const maintenant = new Date();
    const date_expiration = new Date(maintenant.getTime() + jours * JOUR_MS);
    const token = crypto.randomBytes(32).toString('base64url');

    const [, created] = await prisma.$transaction([
      prisma.acces_contribuable.updateMany({
        where: {
          id_contribuable,
          date_revocation: null,
          date_expiration: { gt: maintenant },
        },
        data: { date_revocation: maintenant },
      }),
      prisma.acces_contribuable.create({
        data: {
          id_contribuable,
          id_agent,
          token_hash: hashToken(token),
          date_creation: maintenant,
          date_expiration,
        },
      }),
    ]);

    return {
      id_acces: created.id_acces,
      token,
      date_expiration,
      duree_jours: jours,
    };
  }

  static async trouverParToken(token) {
    if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{20,120}$/.test(token)) return null;

    return prisma.acces_contribuable.findUnique({
      where: { token_hash: hashToken(token) },
      include: {
        contribuables: {
          select: {
            id_contribuable: true,
            nif: true,
            raison_sociale: true,
            email: true,
            centres: { select: { nom_centre: true } },
          },
        },
      },
    });
  }

  static async enregistrerEchec(id_acces) {
    await prisma.acces_contribuable.update({
      where: { id_acces },
      data: { nb_echecs: { increment: 1 } },
    });
  }

  static async enregistrerAcces(id_acces) {
    await prisma.acces_contribuable.update({
      where: { id_acces },
      data: { nb_acces: { increment: 1 }, date_dernier_acces: new Date() },
    });
  }

  /**
   * Dossier complet du contribuable, en lecture seule.
   *
   * Les notes internes de l'agent (`observations_agent`), le score et le motif
   * des rapprochements ainsi que les identifiants des agents restent hors du
   * payload : le portail expose les faits fiscaux du dossier, pas le travail
   * d'instruction.
   */
  static async construireDossier(id_contribuable) {
    const id = Number(id_contribuable);
    if (Number.isNaN(id)) return null;

    const [contribuable, declarations, droits, recoupements, rapprochements, relances] =
      await Promise.all([
        prisma.contribuables.findUnique({
          where: { id_contribuable: id },
          select: {
            nif: true,
            raison_sociale: true,
            secteur_activite: true,
            adresse: true,
            telephone: true,
            email: true,
            regime_fiscal: true,
            centres: { select: { nom_centre: true } },
            etat_contribuable: {
              orderBy: { date_modification: 'desc' },
              take: 1,
              select: {
                statut_activite: true,
                statut_conformite: true,
                date_modification: true,
              },
            },
          },
        }),
        prisma.declarations.findMany({
          where: { id_contribuable: id },
          orderBy: [{ annee: 'desc' }, { periode: 'desc' }, { date_creation: 'desc' }],
          select: {
            id_declaration: true,
            annee: true,
            periode: true,
            type_declaration: true,
            tva_collectee: true,
            tva_deductible: true,
            tva_payee: true,
            tva_theorique: true,
            statut: true,
            date_creation: true,
            date_notification_primitive: true,
            date_limite_reponse: true,
            date_notification_definitive: true,
            montant_redressement: true,
            credit_impot: true,
            montant_impute: true,
            montant_net_a_payer: true,
          },
        }),
        prisma.droits_communication.findMany({
          where: { id_contribuable: id },
          orderBy: [{ date_demande: 'desc' }],
          select: {
            id_droit: true,
            tier: true,
            type_tier: true,
            objet: true,
            date_demande: true,
            date_reponse: true,
            statut: true,
          },
        }),
        prisma.recoupements.findMany({
          where: { id_contribuable: id },
          orderBy: [{ date_operation: 'desc' }, { date_creation: 'desc' }],
          select: {
            id_recoupement: true,
            source: true,
            type_operation: true,
            periode: true,
            reference: true,
            montant_declare: true,
            montant_tva: true,
            somme_recoupee: true,
            date_operation: true,
          },
        }),
        prisma.rapprochements.findMany({
          where: {
            OR: [
              { declarations: { id_contribuable: id } },
              { recoupements: { id_contribuable: id } },
            ],
          },
          orderBy: { date_rapprochement: 'desc' },
          select: {
            id_rapprochement: true,
            type_rapprochement: true,
            montant_declare: true,
            montant_recoupe: true,
            ecart: true,
            statut: true,
            date_rapprochement: true,
            declarations: { select: { annee: true, periode: true } },
            recoupements: { select: { periode: true, source: true } },
          },
        }),
        prisma.relances.findMany({
          where: { id_contribuable: id },
          orderBy: { date_emission: 'desc' },
          select: {
            id_relance: true,
            type_relance: true,
            statut: true,
            annee: true,
            montant_du: true,
            jours_retard: true,
            date_emission: true,
            date_regularisation: true,
          },
        }),
      ]);

    if (!contribuable) return null;

    const { etat_contribuable, ...identite } = contribuable;

    return {
      contribuable: identite,
      situation: etat_contribuable?.[0] || {
        statut_activite: 'Actif',
        statut_conformite: 'En règle',
        date_modification: null,
      },
      declarations,
      droits_communication: droits,
      recoupements,
      rapprochements,
      relances,
    };
  }
}

module.exports = {
  AccesContribuableModel,
  DUREE_MAX_JOURS,
  DUREE_PAR_DEFAUT_JOURS,
  estActif,
  hashToken,
  masquerEmail,
  masquerNom,
  normaliserEmail,
  normaliserNif,
};
