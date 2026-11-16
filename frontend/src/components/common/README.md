# Composants communs

Composants transversaux de l'interface : la navigation principale, les documents
officiels de la procédure contradictoire (notification, demande d'éclaircissements),
la puce de référence légale qui les relie aux PDF de la DGI, et la pagination des
tableaux.

---

## [`Pagination.jsx`](Pagination.jsx)

Export par défaut `Pagination`. Barre de navigation entre les pages d'un tableau
déjà découpé côté client ; le composant est partagé par le registre des
contribuables (`/contribuables`) et les cinq pages du backoffice
administrateur.

* Renvoie `null` lorsque `totalPages <= 1` **et** que `showSinglePage` est faux :
  aucune barre n'apparaît tant que la liste tient dans une page.
* Les numéros affichés viennent de `getPageNumbers`, exporté par
  [`../../utils/pagination.utils.js`](../../utils/pagination.utils.js) : tous les
  numéros jusqu'à 7 pages, puis `1 … n-1` avec ellipses.
* « Précédent » est désactivé en page 1, « Suivant » en dernière page ; la page
  active se reconnaît à son fond `#1d4ed8`.
* Le conteneur porte la classe `pagination-controls` et une mise en place en
  flex centre ; aucun style nouveau n'est introduit pour les pages admin.

| Prop | Type | Rôle |
| --- | --- | --- |
| `currentPage` | `number` | Page affichée (doit déjà être bornée par l'appelant) |
| `onPageChange` | `(page: number) => void` | Changement de page |
| `totalPages` | `number` | Nombre de pages de la liste filtrée |
| `showSinglePage` | `boolean` | Défaut `false`. À `true`, la barre reste rendue quand `totalPages <= 1` (boutons « Précédent » et « Suivant » désactivés) — utilisé par les tables du backoffice, qui n'ont que quelques lignes |

* Sans `showSinglePage`, une liste qui tient sur une page ne montre aucun pager ;
  les trois pages qui l'activent le conditionnent à `Boolean(lignes.length)` pour
  ne pas afficher de pager sous une recherche sans résultat.

La découpe en page est fournie par [`../../hooks/useTablePagination.js`](../../hooks/useTablePagination.js)
côté administration, et par `useContribuablesList` (15 lignes) côté registre.

---

## [`Header.jsx`](Header.jsx)

Export par défaut `Header`. En-tête rendu par `App.jsx` pour toutes les routes protégées.

* La marque renvoie vers `/admin` pour un administrateur et `/accueil` pour les rôles opérationnels.
* **Backoffice inchangé** : les cinq entrées `ADMIN_LINKS` restent dans le `<nav>` du header. Le préfixe de route le plus long garde « Vérification NIF » actif sur `/admin/verification-nif/sql`, sans activer « Tableau de bord ».
* **Frontoffice agent** : le `<nav>` du header est vide pour ce rôle ; la navigation de modules est rendue par [`AgentSidebar.jsx`](AgentSidebar.jsx), à gauche du contenu sur grand écran et en bandeau au-dessus de lui à 1024 px et moins.
* Barre rendue **fixe** (`position: sticky; top: 0; z-index: 40` dans
  [`../../App.css`](../../App.css)) au-dessus de 1024 px ; en dessous elle passe
  en `position: relative` — elle défile avec la page, mais reste le repère du
  profil — quand la navigation revient à la ligne et occupe sa propre rangée.
* Logo `logodgi.jpg` importé depuis [`../../assets/logodgi.jpg`](../../assets/logodgi.jpg).
* Onglets de sous-modules affichés uniquement lorsque `pathname === '/collecte'` et que `modules.length > 0` ; chaque onglet appelle `onSelectModule?.(module.id)`.
* Bouton de bascule du thème et déconnexion tous deux déplacés dans le profil de
  l'agent connecté ([`UserProfile.jsx`](UserProfile.jsx)) : simple pastille ronde
  de 3 rem rendue **hors du `<nav>`**, en dernier enfant du `<header>`.
  `.user-profile` est positionné en absolu à droite de la barre et centré sur sa
  hauteur (`top: 50%` + `translateY(-50%)`, `right` calqué sur le rembourrage de
  `.topbar`) ; il reste donc collé là même quand les liens passent sur deux
  lignes, et son panneau se déroule juste dessous. Sous 1024 px, la barre passant
  sur deux lignes, le profil est réaligné sur celle du logo (`top: 0.9rem`).
* Les styles spécifiques à la barre agent utilisent `.agent-topbar`, sans modifier les surcharges responsive de l'administration.
* L'étanchéité de la navigation ne remplace pas les gardes de routes et d'API décrites dans [`EspaceOperateurs.jsx`](EspaceOperateurs.jsx) : le portefeuille contribuable reste fermé à l'administrateur et « Mon équipe » reste le seul écran d'administration accessible au chef de centre.

Props :

| Prop | Type | Rôle |
| --- | --- | --- |
| `modules` | `Array<{ id, label }>` | Onglets de sous-modules de collecte (défaut `[]`) |
| `currentModule` | `string` | Identifiant du module actif |
| `onSelectModule` | `function` | Sélection d'un module |
| `isDarkMode` | `boolean` | Thème courant, transmis au profil |
| `onToggleTheme` | `function` | Bascule clair / sombre, déclenchée depuis le profil |
| `onLogout` | `function` | Déconnexion, transmise au profil |
| `user` | `object \| null` | Agent renvoyé par `GET /api/auth/me` (défaut `null`) |
| `isAdmin` | `boolean` | Affiche les cinq liens du backoffice ; sans lui, la barre ne porte que le logo et le profil, la navigation de l'agent étant tenue par la sidebar |

---

## [`AgentSidebar.jsx`](AgentSidebar.jsx)

Export par défaut `AgentSidebar`, réservé au shell des rôles opérationnels dans `App.jsx`.

* Cinq espaces principaux : `/accueil`, `/contribuables` (« Dossiers »), `/collecte` (« Contrôle »), `/decisionnel` (« Statistiques ») et `/unites-operationnelles` (« Organisation »). Le chef de centre reçoit en plus « Mon équipe » (`/admin/utilisateurs` en mode restreint), soit six entrées. Tous ces éléments — chemin, nom, icône, groupe — viennent de [`../../data/navigationAgent.data.js`](../../data/navigationAgent.data.js) ; la barre n'en affiche que les entrées marquées `rail`.
* Le lien actif se résout sur **tout** le registre, pas seulement sur les entrées affichées : `/suivi`, `/relance`, `/file-de-travail` et `/entreprises/nouveau` allument « Dossiers » ; `/collecte` allume « Contrôle » ; les URL détaillées des unités allument « Organisation » ; `/contribuables/72/relances` reste dans l'espace « Dossiers ». Aucun écran atteint par l'application ne laisse la barre éteinte.
* Le `aria-label` et l'`title` précisent l'écran atteint quand son nom diffère de l'espace principal — par exemple « Dossiers — File de travail » — alors que le rail replié ne montre qu'une icône.
* Six icônes distinctes, toutes en traits de `1.8` dans une boîte `24×24` : les cinq espaces principaux et la carte d'agent pour « Mon équipe », afin qu'aucune ne se confonde avec une autre quand le rail est replié sur ses seules icônes.
* L'état actif ne dépend pas du libellé (masqué rail replié) : la pastille porte un anneau intérieur plein de `1.5px` — `#1769aa` en clair, `#7dd3fc` en sombre — mesuré à 5,8:1 et 9,6:1 contre le fond du rail, et 4,8:1 et 6,1:1 contre la pastille, au-dessus du seuil de 3:1 des indicateurs non textuels.
* Au-dessus de 1024 px, `.agent-layout` affiche une sidebar compacte à icônes ; au survol ou au focus clavier, elle s'élargit et révèle les libellés.
* À 1024 px et moins, la sidebar reste visible au-dessus du contenu avec ses icônes et libellés.
* L'administrateur ne monte ni la sidebar ni `.agent-layout` ; le portail contribuable n'utilise pas ce shell.
* Les styles desktop, mobile, sombres et d'impression sont regroupés en fin de [`../../App.css`](../../App.css).

| Prop | Type | Rôle |
| --- | --- | --- |
| `isChefCentre` | `boolean` | Ajoute l'entrée marquée `chefCentre` dans le registre, c'est-à-dire « Mon équipe » |

---

## [`UserProfile.jsx`](UserProfile.jsx)

Export par défaut `UserProfile`. Puce de profil de l'agent connecté, rendue par
[`Header.jsx`](Header.jsx) ; renvoie `null` si `user` est absent.

* Dans la barre, uniquement le **bouton rond** portant les deux initiales
  (premières lettres de `prenom` et `nom`, repli sur les deux premiers
  caractères de l'e-mail) : `.user-profile-toggle` est une disquette de `2.6rem`
  à `border-radius: 50%`, sans nom, sans badge de rôle et sans chevron. Son
  `aria-label` et son `title` continuent de dire « Profil de Prénom Nom,
  <rôle> » pour qu'un lecteur d'écran et la infobulle conservent l'identité.
* Le clic déroule une carte de `300px` en trois bandes : **en-tête** sur dégradé
  bleu clair (pastille d'initiales agrandie, nom complet, e-mail et bouton `✕`
  `.agent-profile-fermer`, la classe déjà utilisée par les fiches de la page
  Utilisateurs), **corps** `.user-profile-details` en lignes `dt`/`dd` — libellé
  à gauche, valeur alignée à droite, séparées par un filet — portant le **rôle**
  libellé par `roleDefinition` (importé de
  [`../../backofficeadmin/utils/roles.utils.js`](../../backofficeadmin/utils/roles.utils.js),
  badge `conforme`, `surveillance` ou `critique`), le **centre de rattachement**
  (`nom_centre`, sinon « Aucun centre affecté ») et le **périmètre** du rôle
  (`droits`) ; enfin **pied de carte** sur fond `#f7fafc` regroupant les trois
  commandes.
* Le bouton de thème n'est plus une simple pastille d'icône : `.theme-toggle`
  porte désormais l'icône **et** le mot « Mode clair » / « Mode sombre », pour
  que la commande se lise sans deviner le glyphe. Les variantes sombres de la
  carte (bande dégradé `#1c3350`, filet `#24313f`, pied `#131c28`) suivent le
  même `.dark-theme` que le reste de l'application.
* **Troisième commande : « 🔑 Changer mon mot de passe »** (`.user-profile-
  motdepasse`, entre le thème et la déconnexion, le pied de carte étant passé en
  `flex-wrap: wrap` pour que les trois boutons tiennent). Elle ouvre une
  [`ModaleConfirmation`](ModaleConfirmation.jsx) avec trois champs `.field` —
  actuel, nouveau, confirmation — chacun muni du bouton « Afficher / Masquer »
  `.login-password-toggle` repris de l'écran de connexion. Validation locale
  avant tout appel (trois champs remplis, confirmation identique, 4 caractères
  minimum, nouveau différent de l'actuel), puis
  `changeOwnPassword({ password_actuel, password_nouveau, password_confirmation })`
  → `POST /api/auth/change-password`. Erreur serveur et message de succès
  s'affichent dans la modale ; après succès, les champs disparaissent et le pied
  ne garde plus que « Fermer ». La limite du limiteur backend (6 tentatives par
  agent et par 15 min) remonte par le même canal.
* Ces trois commandes n'existent plus dans la barre elle-même : le `Header` les
  reçoit de `App.jsx` et les redescend ici. Le panneau reste ouvert après une
  bascule de thème **et** après l'ouverture de la modale de mot de passe :
  celle-ci est rendue dans le conteneur `.user-profile`, donc ses clics ne
  tombent pas « hors » du composant, et le gestionnaire `Échap` du panneau cède
  la priorité à la modale tant qu'elle est ouverte.
* Fermeture du panneau par le `✕` de l'en-tête, par clic hors du composant
  (`mousedown` sur `document`) ou par la touche `Échap` ; le bouton rond expose
  `aria-expanded`, `aria-controls` et un `aria-label` nommé.
* Styles dans [`../../App.css`](../../App.css) (bloc `.user-profile*` et leurs
  variantes `.dark-theme`) ; le panneau est ancré sur `.topbar nav`, et non sur
  la puce, pour rester dans l'écran quand la barre revient à la ligne.

| Prop | Type | Rôle |
| --- | --- | --- |
| `user` | `object \| null` | Agent connecté renvoyé par la session |
| `onLogout` | `function` | Déconnexion |
| `isDarkMode` | `boolean` | Thème courant, pour l'icône et le libellé du bouton |
| `onToggleTheme` | `function` | Bascule clair / sombre |

## [`ModaleConfirmation.jsx`](ModaleConfirmation.jsx)

Export par défaut `ModaleConfirmation`. Modale de confirmation générique chargée
de **dire avant de faire** : elle résume la ou les modifications, puis n'exécute
l'action que sur « Valider ». Deux consommateurs :
[`../../backofficeadmin/utilisateurs/pages/AdminUtilisateurs.jsx`](../../backofficeadmin/utilisateurs/pages/AdminUtilisateurs.jsx)
(cinq cas — enregistrement du brouillon, blocage / activation, mot de passe
temporaire, suppression, abandon d'un brouillon) et la modale de mot de passe de
[`UserProfile.jsx`](UserProfile.jsx).

* Rendue seulement si `ouvert` ; le contenu (`children`) est glissé entre
  l'introduction et le message d'erreur, ce qui permet un simple texte ou un
  formulaire complet.
* `modifications` est une liste de `{ label, avant, apres }` : chaque entrée
  devient une ligne `.modale-confirmation-liste li` « AVANT → APRÈS ». Une modale
  sans `onValider` ne propose que « Fermer » (utilisé après un succès, pour que
  l'utilisateur relise le message avant de le laisser disparaître).
* `variante="danger"` déplace la carte vers un liseré `#b42318`, une tête
  rougeâtre et un bouton de validation `.admin-danger-button` — employé pour le
  blocage, la suppression et l'abandon du brouillon.
* `messageErreur` / `messageSucces` s'affichent **dans** la modale : la bannière
  de la page serait cachée derrière l'obscurcissement, et une erreur serveur
  laisse la modale ouverte avec son brouillon pour correction.
* `enCours` désactive les deux boutons du pied et rebaptise « Valider » en
  « Enregistrement... ».
* Accessibilité : `role="dialog"`, `aria-modal="true"`, `aria-label` porté par le
  titre, `tabIndex={-1}` et [`../../hooks/useModalA11y.js`](../../hooks/useModalA11y.js)
  (focus volé à l'ouverture, `Échap` qui ferme, focus restitué à l'appelant) ; le
  message d'erreur est en `role="alert"` et le succès en `role="status"`.
* Styles dans [`../../App.css`](../../App.css), bloc `.modale-confirmation*`
  et ses variantes `.dark-theme`, posé sur l'arrière-plan `.rappel-modal-overlay`
  déjà utilisé par les autres modales.

| Prop | Type | Rôle |
| --- | --- | --- |
| `ouvert` | `boolean` | Contrôle l'affichage |
| `etiquette` | `string` | Texte du badge de tête (« 1 modification(s) », « Mot de passe », « Action irréversible ») ; défaut « À confirmer », ou « Action délicate » en variante `danger` |
| `titre` | `string` | Titre `h2` de la modale |
| `intro` | `string` | Phrase d'explication sous le titre |
| `modifications` | `Array<{ label, avant, apres }>` | Liste des changements comparés (défaut `[]`) |
| `messageErreur` | `string` | Affiche l'erreur et garde la modale ouverte |
| `messageSucces` | `string` | Affiche le succès ; passe le pied en « Fermer » si `onValider` est `null` |
| `variante` | `'normale' \| 'danger'` | Habillage d'avertissement (défaut `'normale'`) |
| `texteValider` | `string` | Libellé du bouton d'action (défaut `'Valider'`) |
| `enCours` | `boolean` | Demande d'action en vol : boutons désactivés, texte « Enregistrement... » |
| `onValider` | `function \| null` | Exécute l'action ; absent = modale en lecture seule |
| `onFermer` | `function` | Annuler, `✕`, clic sur l'arrière-plan et touche `Échap` |

## [`NotificationModal.jsx`](NotificationModal.jsx)

Export par défaut `NotificationModal`. Modale plein écran présentant un document fiscal officiel (en-tête République de Madagascar / DGI, décompte du redressement, cadre légal, signatures) et permettant son impression via `window.print()`.

* Renvoie `null` si `!isOpen` ou si `declaration` est absente.
* `type` vaut `'primitive'` (défaut) ou `'definitive'` : le titre, la référence légale (code des procédures fiscales, art. V-03 et V-04 pour la primitive, art. V-07 pour la définitive) et le bloc de délais changent en conséquence. Les puces de référence sont des [`RefLegal.jsx`](RefLegal.jsx) posées dans `.modal-tag-group`.
* Montants : le décompte n'imprime que ce qui est **enregistré au dossier** — `montant_redressement` (principal), `credit_impot`, `montant_impute`, `montant_net_a_payer`. La base ne contient aucune colonne d'amende, de pénalité ni d'intérêt : la ligne « Amendes, pénalités et intérêts de retard » porte donc « Non liquidé au dossier » et le total est libellé « TOTAL ENREGISTRÉ AU DOSSIER ». Les lignes d'imputation et de net à payer ne s'affichent que pour une notification définitive.
* `simulation` (défaut `false`) et `estimations` (`{ amende, penalites, total }`) : réservées au module de collecte, dont les chiffres sont calculés hors dossier. Elles ajoutent le bandeau `.notification-simulation` (« document de travail, non enregistré »), basculent les libellés en « estimé par le simulateur » et marquent chaque montant de son origine. Un acte réellement émis n'utilise pas ces props.
* Dates : `date_notification_primitive`, `date_notification_definitive` et `date_limite_reponse` sont lues telles quelles ; une date absente s'écrit « non enregistrée au dossier » — la date du jour n'est jamais substituée (`dateOuNull`).
* Boutons « Imprimer / Exporter PDF » et « Fermer » ; la barre d'outils porte la classe `no-print`, prévue pour être masquée à l'impression par [`../../App.css`](../../App.css).
* Accessibilité clavier : le conteneur `.notification-modal-card` porte `role="dialog"`, `aria-modal="true"`, un `aria-label` selon le type et `tabIndex={-1}` ; il est focalisé à l'ouverture et Échap appelle `onClose` (voir [`../../hooks/useModalA11y.js`](../../hooks/useModalA11y.js)).
* Les montants sont formatés par `formatAriary` et l'absence par `MONTANT_ABSENT` / `montantOuNull`, les dates par `dateOuNull` — tous importés depuis [`../../utils/formatters.js`](../../utils/formatters.js).
* Remarque : `printRef` est déclaré (`useRef`) et attaché au bloc `.notification-sheet`, mais n'est jamais lu.

Props :

| Prop | Type | Rôle |
| --- | --- | --- |
| `isOpen` | `boolean` | Contrôle l'affichage |
| `onClose` | `function` | Fermeture (clic sur l'arrière-plan, bouton ou touche Échap) |
| `type` | `'primitive' \| 'definitive'` | Nature de la notification (défaut `'primitive'`) |
| `declaration` | `object` | Déclaration / dossier concerné (obligatoire) |
| `simulation` | `boolean` | Le document est une simulation du module de collecte, pas un acte enregistré (défaut `false`) |
| `estimations` | `object \| null` | `{ amende, penalites, total }` calculés hors dossier, affichés comme estimations |

Utilisé par `src/frontofficeagent/suivi-fiscal/pages/DeclarationDetail.jsx` et `src/frontofficeagent/collecte/components/TheoreticalForm.jsx`.

## [`DemandeEclaircissementModal.jsx`](DemandeEclaircissementModal.jsx)

Export par défaut `DemandeEclaircissementModal`. Modale reprenant la mise en page
de [`NotificationModal.jsx`](NotificationModal.jsx) (mêmes classes
`.notification-sheet`, `.sheet-header`, `.legal-notice`, `.no-print`) pour le
document « Demande d'Éclaircissements et de Justifications » de la Section II du
Code des procédures fiscales (art. V-02, p. 87) — le premier acte contradictoire,
qui précède la proposition de rectification et la notification primitive.

* Renvoie `null` si `!isOpen` ou si `declaration` est absente.
* Trois sections : « CONTEXTE » (TVA payée et théorique telles qu'enregistrées ; une phrase explicative prend le relais si l'un des deux termes manque), « POINTS APPELANT VOS ÉCLAIRCISSEMENTS » (le texte libre de
  `questions`, affiché en `pre-line`, avec un message de repli s'il est vide) et
  « PROCÉDURE ET DÉLAI DE RÉPONSE ».
* Le délai n'est pas saisi : `delaiJours` vaut 30 par défaut et la date limite
  est calculée à partir de `dateEmission` — le document le dit (« date calculée à
  partir de la date d'émission enregistrée »). Sans date d'émission, la ligne
  s'écrit « non calculable — aucune date d'émission n'est enregistrée au dossier » ;
  la date du jour n'est jamais substituée.
* Aucune référence d'office n'est inventée : l'en-tête cite
  `Contribuable n° … · Déclaration n° … · Exercice …`, un champ vide porte
  « Non renseigné au dossier » (`ouAbsent`) et le texte énonce qu'aucun droit,
  amende, pénalité ou intérêt n'est arrêté à ce stade. Le pied de page reprend
  téléphone et courriel du centre gestionnaire lorsqu'ils sont enregistrés.
* Le document est relisible après émission : la fiche `/suivi/:id` le recharge
  depuis la table `relances` (`type_relance = 'demande_eclaircissement'`), où
  `observations` porte les points demandés et `date_emission` la date du document.
* Deux puces [`RefLegal.jsx`](RefLegal.jsx) dans `.modal-tag-group` : la référence
  de l'acte (`REFERENCES.eclaircissements`, `detail` — l'article V-02 fixe un
  **délai franc de 15 jours**, l'acte en accorde 30, et la remarque est imprimée
  dans la section « PROCÉDURE ET DÉLAI DE RÉPONSE ») et la sanction d'une absence
  de réponse (`REFERENCES.sanction_eclaircissements`, art. V-38 : imposition
  d'office). La phrase qui menaçait de « fixer d'office les bases par notification
  primitive » a été retirée : aucun article ne le dit.

Props :

| Prop | Type | Rôle |
| --- | --- | --- |
| `isOpen` | `boolean` | Contrôle l'affichage |
| `onClose` | `function` | Fermeture (clic sur l'arrière-plan, bouton ou touche Échap) |
| `declaration` | `object` | Déclaration / dossier concerné (obligatoire) |
| `questions` | `string` | Points appelant les éclaircissements du contribuable |
| `dateEmission` | `string \| Date \| null` | Date du document ; sert aussi de point de départ du délai |
| `delaiJours` | `number` | Délai de réponse, en jours (défaut `30`) |

Utilisé par `src/frontofficeagent/suivi-fiscal/pages/DeclarationDetail.jsx`.

---

## [`RefLegal.jsx`](RefLegal.jsx)

Export par défaut `RefLegal`, aussi sorti par le barrel [`index.js`](index.js).
La puce de référence légale : un seul composant, une seule forme, pour tous les
renvois aux textes officiels du portail, des actes imprimables et des écrans
d'instruction.

* Sa `source` est une entrée du registre neutre
  [`../../data/textesFiscaux.data.js`](../../data/textesFiscaux.data.js)
  (`REFERENCES.eclaircissements`, `REFERENCES.amende_40`, etc.), résolue par
  `referenceLegale()`. **Aucun écran n'écrit un article en dur** : un numéro ou
  une page qui change se corrige dans le registre, jamais dans les composants.
* `source` absent, ou `texte` / `article` manquant → le composant rend `null`.
  Une règle que l'application s'invente (tolérance de rapprochement, jours francs
  des relances, seuil d'écart de 50 %) n'affiche donc aucune puce vide : c'est le
  texte de l'écran qui doit le dire.
* Le lien ouvre le **PDF de l'éditeur** (`portal.impots.mg` pour les codes
  consolidés 2025, `mef.gov.mg` pour la loi de finances 2026) dans un onglet
  séparé, `target="_blank"` avec `rel="noopener noreferrer"` — les fichiers
  pèsent plusieurs mégaoctets et le dossier en cours ne doit pas être perdu.
  Il s'ouvre sur `referenceLegale().urlAncre`, c'est-à-dire la page **du fichier**
  où se lit le feuillet cité : `page` du registre est le numéro imprimé sur le
  feuillet, et chaque document porte son `decalagePage` (1 pour les deux codes,
  2 pour la loi de finances) qui convertit l'un en l'autre. Sans `page`, l'URL
  reste celle du document entier.
* Trois états rendus par le registre :
  * conforme → puce neutre, libellé `Code des procédures fiscales art. V-02 — p. 87` ;
  * `conforme: 'partiel'` → la valeur affichée ne se lit pas dans l'article. Le
    lien est **gardé** (c'est en ouvrant l'article que le lecteur constate
    l'écart), la puce prend `.ref-legale-prudent` et, avec `detail`, la phrase
    `ecart` s'affiche en `.ref-legale-ecart` ;
  * sans source → rien (point 2 ci-dessus).
* `<span className="sr-only">Ouvrir le texte officiel — </span>` précède le
  libellé, et la flèche `↗` (`.ref-legale-ouvert`) est `aria-hidden` et masquée à
  l'impression : l'article et sa page restent imprimés, seule l'invitation à
  ouvrir le PDF disparaît.
* Le `title` du lien porte le document et l'éditeur ; `referenceLegale()` expose
  aussi `citation` (le texte de l'article, repris mot pour mot dans le registre)
  pour les écrans qui l'affichent.

Props :

| Prop | Type | Rôle |
| --- | --- | --- |
| `source` | `object \| null` | Entrée du registre `REFERENCES` (déjà résolue, pas une clé) |
| `compact` | `boolean` | Défaut `false`. `true` = libellé sans la page (`Code des impôts art. 20.01.54`), pour les barres d'actes et les cellules étroites |
| `detail` | `boolean` | Défaut `false`. Affiche la phrase `ecart` sous le lien, pour une référence non conforme |
| `className` | `string` | Classe de mise en place ajoutée au conteneur (ex. `modal-tag-ref`) |

Utilisé par `accountcontribuable/components/RegleFiscale.jsx`,
`components/common/NotificationModal.jsx` et `DemandeEclaircissementModal.jsx`,
et par les écrans `frontofficeagent/suivi-fiscal/` (timeline et formulaires
d'acte) et `frontofficeagent/collecte/components/TheoreticalForm.jsx`.

---

## [`EspaceOperateurs.jsx`](EspaceOperateurs.jsx)

Export par défaut `EspaceOperateurs`. Garde d'affichage qui ferme le portefeuille
contribuable (`/contribuables` et ses dix sous-routes) au rôle `admin` : elle rend
[`AccesRefuse.jsx`](AccesRefuse.jsx) « Contribuables non accessible » à la place de
l'enfant, sinon elle rend `children`.

| Prop | Type | Rôle |
| --- | --- | --- |
| `currentUser` | `object \| null` | Agent connecté fourni par `App.jsx` ; seul `role === 'admin'` est écarté |
| `children` | `node` | L'écran du portefeuille, rendu pour tous les autres rôles |

* Placée dans [`../../App.jsx`](../../App.jsx) autour des onze routes
  `/contribuables…`, donc efficace même quand l'URL est tapée à la main.
* Volontairement **côté interface et non côté API** :
  `GET /api/contribuables` est aussi lu par l'administrateur pour son outil de
  vérification NIF (`AdminVerificationNIF.jsx` charge 100 lignes,
  `/admin/verification-nif/sql` fait des `SELECT` sur `contribuables`), et un
  `403` le casserait. Le périmètre réel reste décidé par `data-scope` serveur.
* Aucun rôle opérationnel n'est exclu, et les autres URL fiscales (`/suivi`,
  `/relance`, `/decisionnel`, `/unites-operationnelles`…) ne passent pas par ce garde.

---

## [`DossierFiscalNavigation.jsx`](DossierFiscalNavigation.jsx)

Export par défaut `DossierFiscalNavigation`. Onglets rendus en haut des pages
principales du groupe Dossiers afin de passer d'un écran métier à l'autre.

* Les chemins, les noms et le `aria-label` du groupe viennent du registre
  [`../../data/navigationAgent.data.js`](../../data/navigationAgent.data.js)
  (`ongletsDeSection`) : Registre, Suivi fiscal, File de travail, Relances et
  Nouveau contribuable sont rassemblés dans le même espace.
* Le groupe affiché est choisi par la prop `section`, `dossiers` par défaut.
* L'onglet actif est celui dont le chemin préfixe l'URL courante.

| Prop | Type | Rôle |
| --- | --- | --- |
| `section` | `string` | `id` d'une entrée de `SECTIONS_AGENT` (`dossiers`) |

---

## [`AccesRefuse.jsx`](AccesRefuse.jsx)

Export par défaut `AccesRefuse`, aussi repris par
[`EspaceOperateurs.jsx`](EspaceOperateurs.jsx). Écran unique de refus d'accès :
`eyebrow`, `h1`, raison, puis un `Link className="primary"` calculé par
`getLandingPath(currentUser)` — `/admin` pour un administrateur, `/accueil` pour
un rôle opérationnel — avec le libellé qui va avec.

* Utilisé par les six gardes du backoffice (`AdminDashboard`, `AdminHistorique`,
  `AdminRoles`, `AdminUtilisateurs`, `AdminVerificationNIF`,
  `VerificationNifLayout`) : auparavant chacune n'affichait qu'une phrase
  `<p className="error">`, sans titre ni moyen d'en sortir, quand un agent tapait
  l'URL.
* Le refus reste d'affichage : ce sont les `403` du serveur qui décident, et
  `getLandingPath` est le même chemin que la redirection après connexion, pour que
  les deux ne se contredisent pas.

| Prop | Type | Rôle |
| --- | --- | --- |
| `currentUser` | `object \| null` | Détermine le chemin et le libellé du lien de retour |
| `titre` | `string` | `h1` de l'écran, du type « Rôles non accessible » |
| `message` | `string` | Raison du refus, en une phrase |
| `eyebrow` | `string` | Mention au-dessus du titre (défaut `Backoffice Administration`) |
