const prisma = require('../config/prisma');
const {
  contribuableIsReadable,
  resolveScope,
  scopeDeniedMessage,
  writeDeniedMessage,
} = require('../utils/data-scope');

/**
 * Préfixes qui servent des dossiers fiscaux. `/api/agents` et `/api/auth` en
 * sont absents : ce ne sont pas des dossiers fiscaux. La gestion des comptes est
 * bornée route par route (`authorize` dans `../routes/agent.routes.js`) — les
 * comptes d'un centre sont tout de même filtrés par `req.dataScope` appliqué
 * dans le contrôleur — et l'écran de connexion doit rester accessible.
 */
const BUSINESS_PREFIXES = [
  '/api/contribuables',
  '/api/declarations',
  '/api/controles',
  '/api/recoupements',
  '/api/droits-communication',
  '/api/centres',
  '/api/rapprochements',
  '/api/etat-contribuable',
  '/api/relances',
];

const isBusinessRoute = (req) => {
  const path = (req.originalUrl || req.url).split('?')[0];
  return BUSINESS_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
};

/** Méthodes qui modifient une donnée métier — fermées aux scopes en lecture seule. */
const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Émettre un lien de consultation ne change aucune donnée fiscale : cette seule
 * route reste donc accessible à l'inspecteur, dont le périmètre est en lecture
 * seule. Le contrôle du contribuable et de son centre reste appliqué ensuite.
 */
const isShareRoute = (req) =>
  req.method === 'POST'
  && /^\/api\/contribuables\/\d+\/acces-contribuable\/?$/.test((req.originalUrl || req.url).split('?')[0]);

/**
 * Porte d'entrée du périmètre de données : un rôle sans centre (`contribuable`,
 * `autre`, ou rôle centré sans rattachement) ne reçoit aucune donnée métier, et
 * un rôle national en lecture seule (`inspecteur`) ne peut rien écrire. Le
 * filtrage par centre lui-même est porté par les modèles via `req.dataScope`.
 * À monter après `authenticate`.
 *
 * `/api/auth` étant hors `BUSINESS_PREFIXES`, un inspecteur change quand même
 * son propre mot de passe.
 */
const enforceDataScope = (req, res, next) => {
  if (!isBusinessRoute(req)) return next();

  const scope = req.dataScope || resolveScope(req.user);
  if (scope.kind === 'none') {
    return res.status(403).json({ success: false, message: scopeDeniedMessage(scope) });
  }

  if (scope.canWrite === false && WRITE_METHODS.has(req.method) && !isShareRoute(req)) {
    return res.status(403).json({ success: false, message: writeDeniedMessage(scope) });
  }

  return next();
};

/**
 * Garniture de route pour les URL qui ciblent un contribuable (`/contribuables/:id`,
 * `/relances/contribuable/:id_contribuable`, ou un corps/requête portant
 * `id_contribuable`) : hors périmètre, la ressource devient inaccessible même
 * si son identifiant est connu. Une cible optionnelle en query est ignorée
 * quand elle est absente (le filtre du périmètre suffit alors).
 */
const readTarget = (req, source, paramName) => {
  if (source === 'body') return req.body?.[paramName];
  if (source === 'query') return req.query?.[paramName];
  return req.params[paramName];
};

const requireContribuableAccess = (paramName = 'id', { source = 'params' } = {}) => async (req, res, next) => {
  const scope = req.dataScope || resolveScope(req.user);
  if (scope.kind === 'all') return next();

  const raw = readTarget(req, source, paramName);
  if (source === 'query' && (raw === undefined || raw === '')) return next();

  const numericId = parseInt(raw, 10);
  if (Number.isNaN(numericId)) {
    return res.status(404).json({ success: false, message: 'Contribuable non trouvé' });
  }

  try {
    const contribuable = await prisma.contribuables.findUnique({
      where: { id_contribuable: numericId },
      select: { id_contribuable: true, id_centre: true },
    });

    if (!contribuable) {
      return res.status(404).json({ success: false, message: 'Contribuable non trouvé' });
    }
    if (!contribuableIsReadable(scope, contribuable)) {
      return res.status(403).json({
        success: false,
        message: 'Ce contribuable dépend d\'un autre centre fiscal que le vôtre.',
      });
    }

    return next();
  } catch (error) {
    return next(error);
  }
};

/**
 * Idem pour une ligne d'une table qui porte `id_contribuable`
 * (`relances`, `recoupements`, `etat_contribuable`, `droits_communication`) :
 * le centre est lu sur son contribuable.
 */
const requireRowContribuableAccess = ({ delegate, primaryKey, paramName = 'id' }) => async (req, res, next) => {
  const scope = req.dataScope || resolveScope(req.user);
  if (scope.kind === 'all') return next();

  const numericId = parseInt(req.params[paramName], 10);
  if (Number.isNaN(numericId)) {
    return res.status(404).json({ success: false, message: 'Enregistrement non trouvé' });
  }

  try {
    const row = await prisma[delegate].findUnique({
      where: { [primaryKey]: numericId },
      select: { id_contribuable: true },
    });

    if (!row) {
      return res.status(404).json({ success: false, message: 'Enregistrement non trouvé' });
    }
    // Une ligne sans contribuable (recoupement rattaché à personne) n'est
    // attribuable à aucun centre : elle reste hors du périmètre d'un agent centré.
    if (row.id_contribuable === null || row.id_contribuable === undefined) {
      return res.status(403).json({
        success: false,
        message: 'Cet enregistrement n\'est rattaché à aucun centre fiscal.',
      });
    }

    const contribuable = await prisma.contribuables.findUnique({
      where: { id_contribuable: row.id_contribuable },
      select: { id_contribuable: true, id_centre: true },
    });

    if (!contribuableIsReadable(scope, contribuable)) {
      return res.status(403).json({
        success: false,
        message: 'Cet enregistrement dépend d\'un autre centre fiscal que le vôtre.',
      });
    }

    return next();
  } catch (error) {
    return next(error);
  }
};

/**
 * Idem pour les URL qui ciblent une déclaration : le contrôle passe par le
 * contribuable de la déclaration.
 */
const requireDeclarationAccess = (paramName = 'id') => async (req, res, next) => {
  const scope = req.dataScope || resolveScope(req.user);
  if (scope.kind === 'all') return next();

  const numericId = parseInt(req.params[paramName], 10);
  if (Number.isNaN(numericId)) {
    return res.status(404).json({ success: false, message: 'Déclaration non trouvée' });
  }

  try {
    const declaration = await prisma.declarations.findUnique({
      where: { id_declaration: numericId },
      select: { id_declaration: true, contribuables: { select: { id_centre: true } } },
    });

    if (!declaration) {
      return res.status(404).json({ success: false, message: 'Déclaration non trouvée' });
    }
    if (!contribuableIsReadable(scope, declaration.contribuables)) {
      return res.status(403).json({
        success: false,
        message: 'Cette déclaration dépend d\'un autre centre fiscal que le vôtre.',
      });
    }

    return next();
  } catch (error) {
    return next(error);
  }
};

/**
 * Le centre d'une ligne de `declarations` ou de `recoupements` se lit sur son
 * contribuable ; les deux tables portent la même relation.
 */
const CENTRE_LINKS = {
  id_declaration: { delegate: 'declarations', primaryKey: 'id_declaration' },
  id_recoupement: { delegate: 'recoupements', primaryKey: 'id_recoupement' },
};

const centreOfLink = async (link, numericId) => {
  const row = await prisma[link.delegate].findUnique({
    where: { [link.primaryKey]: numericId },
    select: { contribuables: { select: { id_centre: true } } },
  });
  return row?.contribuables?.id_centre ?? null;
};

/**
 * Réponse de refus commune : `null` quand l'accès est accordé. Une ligne sans
 * centre connu reste hors du périmètre d'un agent centré, même si un identifiant
 * circule dans l'URL.
 */
const refuse = (res, centres, scope, label) => {
  if (centres.some((centre) => Number(centre) === Number(scope.id_centre))) return null;
  if (centres.length === 0) {
    return res.status(403).json({ success: false, message: `${label} n'est rattaché à aucun centre fiscal.` });
  }
  return res.status(403).json({ success: false, message: `${label} dépend d'un autre centre fiscal que le vôtre.` });
};

/**
 * Un rapprochement n'atteint un contribuable que par sa déclaration OU son
 * recoupement : la ligne est accessible dès qu'un des deux chemins mène au
 * centre de l'agent.
 */
const requireRapprochementAccess = (paramName = 'id') => async (req, res, next) => {
  const scope = req.dataScope || resolveScope(req.user);
  if (scope.kind === 'all') return next();

  const numericId = parseInt(req.params[paramName], 10);
  if (Number.isNaN(numericId)) {
    return res.status(404).json({ success: false, message: 'Rapprochement introuvable' });
  }

  try {
    const row = await prisma.rapprochements.findUnique({
      where: { id_rapprochement: numericId },
      select: { id_declaration: true, id_recoupement: true },
    });
    if (!row) return res.status(404).json({ success: false, message: 'Rapprochement introuvable' });

    const linked = Object.entries(CENTRE_LINKS).filter(([field]) => row[field] !== null);
    const centres = (await Promise.all(
      linked.map(([field, link]) => centreOfLink(link, row[field]))
    )).filter((centre) => centre !== null);

    return refuse(res, centres, scope, 'Cet enregistrement') || next();
  } catch (error) {
    return next(error);
  }
};

/**
 * Écriture d'un rapprochement : chaque lien transmis dans le corps doit déjà
 * appartenir au périmètre de l'agent.
 */
const requireRapprochementLinks = () => async (req, res, next) => {
  const scope = req.dataScope || resolveScope(req.user);
  if (scope.kind === 'all') return next();

  try {
    for (const [field, link] of Object.entries(CENTRE_LINKS)) {
      const raw = req.body?.[field];
      if (raw === undefined || raw === null || raw === '') continue;

      const numericId = parseInt(raw, 10);
      if (Number.isNaN(numericId)) {
        return res.status(400).json({ success: false, message: `${field} invalide` });
      }

      const centre = await centreOfLink(link, numericId);
      const denied = refuse(res, centre === null ? [] : [centre], scope, 'Le dossier lié');
      if (denied) return denied;
    }

    return next();
  } catch (error) {
    return next(error);
  }
};

/**
 * Un agent centré ne consulte que le centre auquel il est rattaché ; la liste
 * déjà filtrée par le modèle, cette garniture couvre la consultation par id.
 */
const requireCentreAccess = (paramName = 'id') => (req, res, next) => {
  const scope = req.dataScope || resolveScope(req.user);
  if (scope.kind === 'all') return next();

  const numericId = parseInt(req.params[paramName], 10);
  if (numericId === Number(scope.id_centre)) return next();

  return res.status(403).json({
    success: false,
    message: "Vous n'avez accès qu'au centre fiscal auquel vous êtes rattaché.",
  });
};

module.exports = {
  BUSINESS_PREFIXES,
  enforceDataScope,
  requireCentreAccess,
  requireContribuableAccess,
  requireDeclarationAccess,
  requireRapprochementAccess,
  requireRapprochementLinks,
  requireRowContribuableAccess,
};
