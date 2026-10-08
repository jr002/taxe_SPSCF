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
| `requis` | `boolean` | `false` | Ajoute un astérisque rouge au libellé |
| `min` | `number` | `0` | Borne minimale de l'input |

## [`IdentityFields.jsx`](IdentityFields.jsx)

Bloc d'identification du contribuable, précédé d'un en-tête de section (« 01 — Identification du contribuable »). Les champs rendus sont : `nif` (`maxLength={20}`), `anneeFiscale` (nombre entre 2000 et 2100), `nomSociete`, `raisonSociale`, `adresse`, `contact` (téléphone) et `email`.

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

Le formatage provient de [`../../utils/formatters.jsx`](../../utils/formatters.jsx).

## [`ExcelImportModal.jsx`](ExcelImportModal.jsx)

Modale d'import par lot de contribuables et de déclarations depuis un fichier `.xlsx`, `.xls` ou `.csv`. Elle utilise la bibliothèque `xlsx` (`XLSX.read`, `XLSX.utils.sheet_to_json`, `XLSX.utils.json_to_sheet`, `XLSX.writeFile`) et les fonctions `createContribuable`, `createDeclaration` et `getErrorMessage` de [`../../api/api.js`](../../api/api.js).

| Prop | Type | Rôle |
| --- | --- | --- |
| `isOpen` | `boolean` | Rend `null` si faux |
| `onClose` | `function` | Fermeture de la modale |
| `onSuccess` | `function` | Rappel après import (succès complet ou import partiel) |

Fonctionnement :

* **Lecture** : seul le premier onglet du classeur est lu ; un fichier vide ou illisible produit un message d'erreur.
* **Mappage des colonnes** : les en-têtes sont normalisés (minuscules, accents supprimés, caractères non alphanumériques retirés) puis reconnus par listes de synonymes (`nif`/`numeronif`, `raisonsociale`/`nom`/`societe`/`entreprise`, `ca`/`chiffredaffaires`/`chiffreaffaire`/`revenue`, `tvapayee`/`tvapaye`, etc.).
* **Valeurs par défaut** : secteur « Activités commerciales générales », adresse « Antananarivo, Madagascar », téléphone `+261 34 00 000 00`. Le régime fiscal est forcé dans `{ IS, IR }` s'il est absent ou invalide.
* **Validation** : un NIF est exigé et doit comporter au moins 10 chiffres ; la raison sociale est obligatoire. Les lignes invalides sont conservées dans l'aperçu mais exclues de l'import.
* **Modèle** : `handleDownloadTemplate` génère `Modele_Import_Contribuables_DGI.xlsx` avec deux lignes d'exemple.
* **Import** : les lignes valides sont traitées séquentiellement ; un contribuable est créé, puis une déclaration est créée si `id_contribuable`, `annee` et `ca` sont présents (l'échec de la déclaration n'interrompt pas la boucle et n'est signalé que par `console.warn`). Une barre de progression reflète l'avancement et les erreurs sont listées en fin de traitement. En cas de succès complet, `onSuccess` et `onClose` sont appelés après 1,5 s.

Utilisé par `src/pages/contribuables/Contribuables.jsx`.

---

## Consommateurs

| Composant | Importé par |
| --- | --- |
| `AmountField`, `IdentityFields`, `ControlResult` | `src/pages/collecte/modules/` : `TheoreticalForm.jsx`, `ReconciliationForm.jsx`, `InsertionDeclaration.jsx`, `CollecterDeductible.jsx` |
| `ExcelImportModal` | `src/pages/contribuables/Contribuables.jsx` |

Les classes de style de `AmountField` (`field`, `input-wrap`) et de `ControlResult` (`result-card`, `result-header`, `status-indicator`, `success-dot`, `alert-dot`, `result-rows`, `result-row`, `monetary-val`) sont définies dans [`../../App.css`](../../App.css). En revanche, `IdentityFields.jsx` emploie `identity-block` (absente de `App.css`, qui fournit `identity-grid`, `company-grid` et `financial-grid`) et `grid two` : `two` n'a aucune règle CSS et seule l'utilitaire Tailwind `grid` s'applique au conteneur, qui n'est donc pas mis en deux colonnes. `ExcelImportModal` s'appuie principalement sur des classes utilitaires Tailwind.
