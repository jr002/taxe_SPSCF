import { useCallback, useState } from 'react';

/** Sélection multiple pour les tables à actions en lot. */
export default function useSelectionLot() {
  const [selection, setSelection] = useState(() => new Set());

  const basculer = useCallback((id) => {
    setSelection((courante) => {
      const suivante = new Set(courante);
      if (suivante.has(id)) suivante.delete(id);
      else suivante.add(id);
      return suivante;
    });
  }, []);

  const basculerPage = useCallback((ids) => {
    setSelection((courante) => {
      const suivante = new Set(courante);
      const tousCoches = ids.length > 0 && ids.every((id) => suivante.has(id));
      ids.forEach((id) => (tousCoches ? suivante.delete(id) : suivante.add(id)));
      return suivante;
    });
  }, []);

  const remplacer = useCallback((ids) => setSelection(new Set(ids)), []);
  const vider = useCallback(() => setSelection(new Set()), []);

  return { selection, basculer, basculerPage, remplacer, vider };
}
