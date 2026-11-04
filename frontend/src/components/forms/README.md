# Composants de formulaires

Champs, blocs et fenêtres réutilisables pour la saisie fiscale, l'identification des contribuables, l'import de fichiers et l'affichage des résultats de contrôle. Tous les fichiers exportent un composant par défaut.

---

## [`AmountField.jsx`](AmountField.jsx)

Champ de saisie monétaire (`<input type="number">`) accompagné d'un libellé et du suffixe `Ar`.

| Prop | Type | Défaut | Rôle |
| --- | --- | --- | --- |
| `intitule` | `string` | — | Libellé affiché |
| `nomChamp` | `string` | — | Attribut `name` de l'input |
| `valeur` | `string \| number` | — | Valeur contrôlée |
| `surChangement` | `function` | — | Gestionnaire `onChange` |
| `requis` | `boolean` | `false` | Astérisque rouge au libellé **et** attribut `required` de l'input |
| `min` | `number` | `0` | Borne minimale de l'input |
| `max` | `number` | — | Borne maximale de l'input (utilisée par l'imputation du crédit d'impôt) |

## [`IdentityFields.jsx`](IdentityFields.jsx)

Bloc d'identification du contribuable, précédé d'un en-tête de section (« 01 — Identification du contribuable »). Les champs rendus sont : `nif` (`required`, `maxLength={20}`), `anneeFiscale` (`required`, nombre entre 2000 et 2100), `nomSociete`, `raisonSociale`, `adresse`, `contact` (téléphone) et `email`.

Le NIF et l'année sont obligatoires parce que le module Collecte s'en sert pour retrouver le contribuable dans le registre (`getContribuableByNif`) et pour dater la déclaration : sans l'un des deux, l'enregistrement échoue.

| Prop | Type | Rôle |
| --- | --- | --- |
| `donneesIdentification` | `object` | Source des valeurs, lue champ par champ avec repli sur `''` |
| `surChangement` | `function` | Gestionnaire `onChange` commun à tous les champs |

## [`ControlResult.jsx`](ControlResult.jsx)

Carte récapitulative d'un contrôle (`<aside className="result-card ...">`) avec pastille d'état. La classe est `alert` si `alert` est vrai, sinon `success`.

| Prop | Type | Défaut | Rôle |
| --- | --- | --- | --- |
| `title` | `string` | `'Résultat du contrôle'` | Titre de la carte |
| `message` | `string` | `''` | Message affiché sous le titre s'il est non vide |
| `alert` | `boolean` | `false` | Bascule l'état visuel |
| `rows` | `Array<[string, any]>` | `[]` | Lignes `[libellé, valeur]` ; toute valeur de type `number` est formatée par `formatAriary` |

Le formatage provient de [`../../utils/formatters.js`](../../utils/formatters.js).

## [`ExcelImportModal.jsx`](ExcelImportModal.jsx)

Modale d'import par lot, depuis un fichier `.xlsx`, `.xls` ou `.csv`, avec **deux
modes** selon une seule prop. Elle utilise la bibliothèque `xlsx` (`XLSX.read`,
`XLSX.utils.sheet_to_json`, `XLSX.utils.json_to_sheet`, `XLSX.writeFile`) et les
fonctions `createContribuable`, `createDeclaration`, `updateDeclaration`,
`getDeclarations` et `getErrorMessage` importées depuis le barrel [`@/api`](../../api/).

| Prop | Type | Rôle |
| --- | --- | --- |
| `isOpen` | `boolean` | Rend `null` si faux |
| `onClose` | `function` | Fermeture de la modale (arrière-plan, bouton ou touche Échap) |
| `onSuccess` | `function` | Rappel après import ; reçoit le bilan textuel |
| `contribuable` | `object \| null` | `null` (défaut) : mode **registre**. Un objet avec `id_contribuable` : mode **dossier** |

### Mode registre — alimente `contribuables` (et la déclaration jointe)

* **Mappage des colonnes** : les en-têtes sont normalisés (minuscules, accents supprimés, caractères non alphanumériques retirés) puis reconnus par listes de synonymes — `nif`/`numeronif`, `raisonsociale`/`nom`/`societe`/`entreprise`, `secteur`/`secteuractivite`/`secteurdactivite`/`activite`, `ca`/`chiffredaffaires`/`chiffreaffaire`/`revenue`, `benefice`/`beneficefiscal`, `regime`/`regimefiscal`/`naturedimpot`/`natureimpot`, `centregestionnaire`, `adresse`/`siege`/`localisation`, `telephone`/`tel`/`phone`/`contact`, `email`/`mail`/`courriel`, `annee`/`anneefiscale`/`exercice`/`periode`, `tvapayee`/`tvapaye`, `tvacollectee`/`tvacollecte`, `tvadeductible`, `tvatheorique`/`tvat`. La variante « Secteur d'Activité » (le `d` de l'élision survit à la normalisation, ce qui donne `secteurdactivite`) est reconnue : le modèle téléchargeable par cette même modale est donc réimportable. Le centre n'accepte que l'orthographe « Centre gestionnaire » : un ancien fichier « Centre de rattachement » n'est plus reconnu, et le champ reste vide.
* **Valeurs absentes — rien n'est suppléé** : une ligne sans adresse ni téléphone est envoyée sans ces clés (colonnes nullables en base) et l'aperçu affiche un avertissement « Adresse non fournie » / « Téléphone non fourni ». Une nature d'impôt absente ou hors `{ IS, IR }` n'est pas déduite du chiffre d'affaires : elle n'est pas envoyée et la ligne porte la mention « non reconnue (IS ou IR) — non envoyée ». Un centre absent de l'annuaire crée tout de même le contribuable, sans rattachement, et l'incident est listé.
* **Validation** : un NIF est exigé et doit comporter au moins 10 chiffres ; la raison sociale et le secteur d'activité sont obligatoires (ils le sont côté API). Les lignes invalides sont conservées dans l'aperçu mais exclues de l'import.
* **Modèle** : `handleDownloadTemplate` génère `Modele_Import_Contribuables_DGI.xlsx` avec une unique ligne d'exemple, sur les seules colonnes enregistrables : NIF, Raison Sociale, Secteur d'Activité, Adresse, Téléphone, Email, Centre gestionnaire, Nature d'impôt, Chiffre d'Affaires, Bénéfice, Année, TVA Payée, TVA Collectée, TVA Déductible, TVA Théorique. Les anciennes colonnes « Activité » et « Conformité » en ont été retirées : la table `contribuables` ne les enregistre pas et « Activité », synonyme du secteur, écrasait silencieusement « Secteur d'Activité » à la relecture du modèle.
* **Import** : les lignes valides sont traitées séquentiellement ; un contribuable est créé, puis une déclaration est créée si `id_contribuable`, un exercice lisible et au moins un montant sont présents. Une ligne sans montant fiscal crée le contribuable **sans** déclaration inventée. L'échec de la déclaration n'interrompt pas la boucle. Comme en mode dossier, une TVA théorique que le classeur ne portait pas est retirée de la déclaration créée (`PUT { tva_theorique: null, statut: null }`) pour que le dossier ne porte pas le calcul automatique du serveur. Une barre de progression reflète l'avancement et les erreurs sont listées en fin de traitement. En cas de succès complet, `onSuccess` et `onClose` sont appelés après 1,5 s.

### Mode dossier — alimente `declarations` du contribuable affiché

Aucune fiche n'est créée ni modifiée : le classeur ne porte que des **exercices de
déclaration TVA**. Avant toute écriture, la modale relit les déclarations déjà
enregistrées du dossier (`getDeclarations({ search: NIF, type_declaration: 'TVA' })`,
puis filtrage sur `id_contribuable`) pour annoncer, ligne par ligne, « mise à jour »
ou « création » ; si cette lecture échoue, l'import est interrompu plutôt que
d'écrire à l'aveugle.

* **Colonnes retenues** (`COLONNES_DECLARATION`) : NIF, Exercice, Chiffre d'affaires, Bénéfice, TVA collectée, TVA déductible, TVA payée, TVA théorique. Ce sont exactement les colonnes que la table `declarations` enregistre ; toute autre colonne du fichier est ignorée.
* **Exercice** : `2024` (annuel, ce que saisit le module Collecte) ou `2024-03` / `2024/3` (mensuel, ce que saisit le formulaire de déclaration). La clé retenue — `periode`, à défaut `annee` — est celle du rapprochement avec la base. Une cellule typée « date » par le tableur arrive comme objet `Date` : l'année et le mois affichés dans la cellule sont retenus, sinon la période serait lue comme un nombre de série (`45352,125`) et refusée à tort.
* **Refus** : un NIF différent de celui du dossier, un exercice illisible ou absent, aucun montant lisible, ou un exercice déjà porté par une ligne précédente du classeur (la base impose l'unicité `id_contribuable + periode + type_declaration`). La ligne reste visible dans l'aperçu, marquée « Non importée ».
* **Montant absent ≠ zéro** : une case vide se lit « Absente du fichier » à l'aperçu et n'est pas envoyée. Sur une mise à jour, la valeur déjà enregistrée reste en place (`PUT` partiel) ; sur une création, le dossier garde le montant non renseigné.
* **Statut** : le serveur ne recalcule jamais le statut d'une déclaration existante, et il en calcule un à la création. Le statut n'est donc poussé que lorsque la TVA théorique **et** la TVA payée sont lisibles (dans le fichier ou au dossier), via `statutSelonEcart` de [`../../utils/fiscal.utils.js`](../../utils/fiscal.utils.js) ; sinon il reste tel quel et l'incident est dit. Quand le classeur n'apportait pas la TVA théorique, le `POST` est suivi d'un `PUT { tva_theorique: null, statut: null }` pour retirer du dossier le calcul automatique du serveur : le dossier ne porte que les chiffres de l'agent.
* **Modèle** : `Modele_Import_Declarations_DGI.xlsx`, une feuille `Déclarations`, le NIF du dossier prérempli et une ligne neutre par colonne.
* **Bilan** : `N déclaration(s) créée(s) · M mise(s) à jour · K incident(s) pour <raison sociale>`, suivi de « Un montant absent du classeur n'est jamais compté à zéro. » Le rappel est renvoyé à `onSuccess`, ce qui permet à la page de recharger la fiche depuis la base.

### Lecture du fichier (commun aux deux modes)

Seul le premier onglet est lu. Un `.csv` est décodé en **UTF-8** et son BOM retiré
avant `XLSX.read(texte, { type: 'string', cellDates: true })` : `XLSX.read(uint8,
{ type: 'array' })` décode les octets en cp1252 et rend « TVA Collectée »
méconnaissable, donc tous les montants de la ligne étaient perdus. Les classeurs
`.xlsx` / `.xls` restent lus en `{ type: 'array', cellDates: true }`. Un fichier vide
ou illisible produit un message d'erreur.

Accessibilité : le conteneur interne (`.bg-white.rounded-2xl`) porte
`role="dialog"`, `aria-modal="true"`, `aria-label` et `tabIndex={-1}` — l'arrière
plan plein écran reste un simple fond cliquable. Le hook partagé
[`../../hooks/useModalA11y.js`](../../hooks/useModalA11y.js) gère Échap, l'entrée
du focus dans la boîte de dialogue et sa restitution au bouton déclencheur.

---

## Consommateurs

| Composant | Importé par |
| --- | --- |
| `AmountField`, `IdentityFields`, `ControlResult` | `src/frontofficeagent/collecte/components/` : `TheoreticalForm.jsx`, `ReconciliationForm.jsx`, `InsertionDeclaration.jsx`, `CollecterDeductible.jsx` |
| `ExcelImportModal` | mode registre : `src/frontofficeagent/contribuables/pages/Contribuables.jsx` (bouton « Importer des contribuables ») · mode dossier : `src/frontofficeagent/contribuables/pages/ContribuableDetail.jsx`, avec la prop `contribuable` (bouton « Importer Excel » de `ContribuableHeader`, visible sur les onglets Synthèse et Déclarations) |

Les classes de style de `AmountField` (`field`, `input-wrap`) et de `ControlResult` (`result-card`, `result-header`, `status-indicator`, `success-dot`, `alert-dot`, `result-rows`, `result-row`, `monetary-val`) sont définies dans [`../../App.css`](../../App.css). En revanche, `IdentityFields.jsx` emploie `identity-block` (absente de `App.css`, qui fournit `identity-grid`, `company-grid` et `financial-grid`) et `grid two` : `two` n'a aucune règle CSS et seule l'utilitaire Tailwind `grid` s'applique au conteneur, qui n'est donc pas mis en deux colonnes. `ExcelImportModal` s'appuie principalement sur des classes utilitaires Tailwind.
