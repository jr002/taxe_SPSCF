# Composants communs

Composants transversaux de l'interface : la navigation principale et le document officiel de notification fiscale.

---

## [`Header.jsx`](Header.jsx)

Export par défaut `Header`. En-tête rendu par `App.jsx` pour toutes les routes protégées.

* Liens statiques déclarés dans `NAVIGATION_LINKS` : `/acceuil` (Accueil), `/collecte` (Collecte TVA), `/decisionnel` (Tableau décisionnel), `/suivi` (Suivi fiscal), `/contribuables` (Contribuables), `/relance` (Relance fiscale).
* État actif calculé avec `useLocation()` : correspondance exacte sur `pathname`, sauf `/contribuables` et `/relance` qui restent actifs sur tout sous-chemin (`startsWith`).
* Logo `logodgi.jpg` importé depuis [`../../assets/logodgi.jpg`](../../assets/logodgi.jpg).
* Onglets de sous-modules affichés uniquement lorsque `pathname === '/collecte'` et que `modules.length > 0` ; chaque onglet appelle `onSelectModule?.(module.id)`.
* Bouton de bascule du thème (`onToggleTheme`) avec libellé accessible selon `isDarkMode`, et bouton « Déconnexion » (`onLogout`).

Props :

| Prop | Type | Rôle |
| --- | --- | --- |
| `modules` | `Array<{ id, label }>` | Onglets de sous-modules de collecte (défaut `[]`) |
| `currentModule` | `string` | Identifiant du module actif |
| `onSelectModule` | `function` | Sélection d'un module |
| `isDarkMode` | `boolean` | Thème courant |
| `onToggleTheme` | `function` | Bascule clair / sombre |
| `onLogout` | `function` | Déconnexion |

## [`NotificationModal.jsx`](NotificationModal.jsx)

Export par défaut `NotificationModal`. Modale plein écran présentant un document fiscal officiel (en-tête République de Madagascar / DGI, décompte du redressement, cadre légal, signatures) et permettant son impression via `window.print()`.

* Renvoie `null` si `!isOpen` ou si `declaration` est absente.
* `type` vaut `'primitive'` (défaut) ou `'definitive'` : le titre, la référence légale (CPF art. V-19 / CGI 2026) et le bloc de délais changent en conséquence.
* Montants : `principal` (repli sur `declaration.montant_redressement`), `amende` (repli sur 40 % du principal), `penalite` (défaut `0`), `total` (repli sur la somme des trois), `montant_impute` et `montant_net_a_payer` lus sur la déclaration. Les lignes d'imputation et de net à payer ne sont affichées que pour une notification définitive.
* Dates formatées en `fr-FR` : date d'émission issue de `date_notification_primitive` ou `date_notification_definitive` (repli sur la date du jour) et date limite issue de `date_limite_reponse` (repli sur aujourd'hui + 30 jours).
* Boutons « Imprimer / Exporter PDF » et « Fermer » ; la barre d'outils porte la classe `no-print`, prévue pour être masquée à l'impression par [`../../App.css`](../../App.css).
* Les montants sont formatés par `formatAriary` importé depuis [`../../utils/formatters.jsx`](../../utils/formatters.jsx).
* Remarque : `printRef` est déclaré (`useRef`) et attaché au bloc `.notification-sheet`, mais n'est jamais lu.

Props :

| Prop | Type | Rôle |
| --- | --- | --- |
| `isOpen` | `boolean` | Contrôle l'affichage |
| `onClose` | `function` | Fermeture (clic sur l'arrière-plan ou bouton) |
| `type` | `'primitive' \| 'definitive'` | Nature de la notification (défaut `'primitive'`) |
| `declaration` | `object` | Déclaration / dossier concerné (obligatoire) |
| `redressementDetails` | `object` | Surcharge des montants `principal`, `amende`, `penalite`, `total` (défaut `{}`) |

Utilisé par `src/pages/suivi-fiscal/DeclarationDetail.jsx` et `src/pages/collecte/modules/TheoreticalForm.jsx`.
