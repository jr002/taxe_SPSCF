/**
 * Renvoi vers une rubrique de la page d'aide du portail. Rendant `null` sans
 * callback, un écran peut poser des renvois même là où l'aide n'est pas
 * accessible (aucun dans ce portail : les deux vues se répondent toujours).
 */
export default function LienAide({ section, onOuvrirAide, children }) {
  if (!onOuvrirAide) return null;
  return (
    <button type="button" className="portail-aide-lien" onClick={() => onOuvrirAide(section)}>
      {children}
    </button>
  );
}
