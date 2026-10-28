/**
 * Anti force-brute maison : fenêtre glissante en mémoire, sans dépendance npm.
 * Les compteurs vivent dans le processus, donc ils se réinitialisent au
 * redémarrage du serveur (et sont par compteurs si l'API tourne sur plusieurs
 * instances — dans ce cas, déplacer l'état vers Redis ou la base).
 */

/** Clé de bucket => tri timestamps des tentatives acceptées. */
const attempts = new Map();
let lastSweepAt = Date.now();

const SWEEP_INTERVAL_MS = 5 * 60 * 1000;

const sweep = (now) => {
  if (now - lastSweepAt < SWEEP_INTERVAL_MS) return;
  lastSweepAt = now;
  for (const [key, timestamps] of attempts) {
    const firstTimestamp = timestamps[0];
    if (firstTimestamp === undefined || now - firstTimestamp >= SWEEP_INTERVAL_MS * 3) {
      attempts.delete(key);
    }
  }
};

const getClientId = (req) => req.ip || req.socket?.remoteAddress || 'unknown';

/**
 * Limiteur d'échelle.
 *
 * @param {object} options
 * @param {string} options.scope préfixe isolant les compteurs d'un usage
 * @param {number} options.windowMs durée de la fenêtre glissante
 * @param {number} options.max nombre de tentatives autorisées dans la fenêtre
 * @param {(req) => string} options.identity complémentaire d'identité (ex. l'e-mail)
 * @param {(retryAfterSeconds: number) => string} options.message message renvoyé en 429
 */
const rateLimit = ({ scope, windowMs = 15 * 60 * 1000, max = 10, identity, message }) => {
  const middleware = (req, res, next) => {
    const now = Date.now();
    sweep(now);

    const suffix = identity ? identity(req) : '';
    const bucketKey = `${scope}|${getClientId(req)}|${suffix}`.toLowerCase();
    const timestamps = (attempts.get(bucketKey) ?? []).filter((stamp) => now - stamp < windowMs);

    if (timestamps.length >= max) {
      const retryAfterSeconds = Math.max(1, Math.ceil((windowMs - (now - timestamps[0])) / 1000));
      res.set('Retry-After', String(retryAfterSeconds));
      return res.status(429).json({
        success: false,
        message: message(retryAfterSeconds),
        retryAfterSeconds,
      });
    }

    timestamps.push(now);
    attempts.set(bucketKey, timestamps);

    const previous = req.rateLimit;
    const remaining = Math.max(0, max - timestamps.length);

    req.rateLimit = {
      /** Tentatives restantes dans la fenêtre, tous compteurs confondus. */
      remaining: previous?.remaining === undefined ? remaining : Math.min(remaining, previous.remaining),
      /** À appeler après un succès : vide le compteur courant et les précédents. */
      reset: () => {
        attempts.delete(bucketKey);
        previous?.reset?.();
      },
    };

    return next();
  };

  return middleware;
};

module.exports = { rateLimit };
