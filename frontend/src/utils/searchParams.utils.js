/**
 * Applique des changements à une `URLSearchParams` sans perdre les clés déjà présentes
 * (vue, centre…) et en retirant les valeurs vides, pour garder une URL courte et partageable.
 */
export const updateSearchParams = (current, changes) => {
  const next = new URLSearchParams(current);

  Object.entries(changes).forEach(([key, value]) => {
    if (value === '' || value === null || value === undefined) {
      next.delete(key);
      return;
    }
    next.set(key, String(value));
  });

  return next;
};

/**
 * Lit une clé de requête en retombant sur une valeur par défaut si elle est absente ou vide.
 */
export const readSearchParam = (searchParams, key, fallback) => {
  const value = searchParams.get(key);
  return value === null || value === '' ? fallback : value;
};
