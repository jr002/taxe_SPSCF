# Rapport d’évaluation UI, UX, IHM et convivialité

**Application :** SPS/CF — Système de suivi et de contrôle fiscal  
**Institution :** Direction Générale des Impôts — Madagascar  
**Date de l’analyse :** 2 novembre 2026  
**Périmètre :** dossier fiscal, procédure contradictoire, formulaires d’action et portail d’aide contribuable  
**Nature de l’évaluation :** revue experte d’interface et de parcours, à partir des écrans effectivement contrôlés

---

## 1. Synthèse exécutive

L’application présente une base solide : identité institutionnelle cohérente, structuration claire du dossier fiscal, procédure contradictoire ordonnée et effort notable de transparence juridique. Les références au Code des impôts et au Code des procédures fiscales constituent notamment un élément différenciant : elles permettent à l’utilisateur de vérifier la règle affichée dans le texte officiel.

La principale difficulté ne réside pas dans l’absence de fonctionnalités, mais dans la **quantité d’informations présentée simultanément**. Les montants, statuts, explications juridiques, références et actions peuvent entrer en concurrence dans une même vue. Cette densité augmente la charge cognitive, notamment pour un contribuable ou un agent qui découvre le dossier.

### Note globale : 7,2/10

| Dimension évaluée | Note | Synthèse |
|---|---:|---|
| UI — interface visuelle | **7,5/10** | Présentation professionnelle et cohérente, mais densité et largeur de certains tableaux à corriger. |
| UX — expérience utilisateur | **7/10** | Parcours métier logique et rassurant, encore trop exigeant en connaissances fiscales préalables. |
| IHM — interactions homme-machine | **7/10** | Interactions globalement structurées et accessibles, avec des actions ou explications parfois insuffisamment visibles. |
| Convivialité | **7/10** | Aide contextuelle appréciable, mais vocabulaire, chiffres et références peuvent saturer la lecture. |

### Orientation recommandée

Conserver l’identité graphique et l’architecture fonctionnelle existantes. Les gains les plus importants viendront de trois améliorations ciblées :

1. rendre les tableaux réellement responsives ;
2. faire ressortir une seule prochaine action par état du dossier ;
3. réduire la densité visuelle par une divulgation progressive des détails.

---

## 2. Méthode et limites de l’évaluation

### 2.1 Écrans et parcours examinés

L’analyse s’appuie principalement sur les éléments suivants :

- page de détail d’un dossier fiscal `/suivi/:id` ;
- cartes de synthèse : statut, écart de TVA, chiffre d’affaires, bénéfice et montants de TVA ;
- chronologie de la procédure contradictoire ;
- formulaires de demande d’éclaircissements, de notification primitive et de notification définitive, ouverts sans être soumis ;
- panneau des autres actions du dossier ;
- page d’aide du portail contribuable ;
- tableau des catégories fiscales et références associées ;
- liens ouvrant les PDF officiels à la page de l’article cité.

### 2.2 Grille d’analyse

Chaque dimension a été examinée selon des critères distincts :

- **UI :** hiérarchie visuelle, cohérence, lisibilité, espacement, densité et adaptation à la largeur disponible ;
- **UX :** compréhension du parcours, continuité des étapes, capacité à identifier la prochaine action et réduction de l’incertitude ;
- **IHM :** visibilité des actions, prévisibilité, retours d’interaction, navigation clavier, comportement des formulaires et des liens ;
- **convivialité :** facilité d’apprentissage, clarté du langage, aide contextuelle et effort demandé à l’utilisateur.

### 2.3 Limites

Il s’agit d’une **revue experte**, et non d’un test utilisateur statistique ni d’une certification d’accessibilité.

Les points suivants restent à valider séparément :

- tests avec des agents, inspecteurs, chefs de centre et contribuables réels ;
- navigation complète avec lecteur d’écran ;
- contrôle systématique des contrastes selon WCAG ;
- parcours exhaustifs sur téléphone et tablette ;
- mesure du temps de réalisation et du taux d’erreur sur des tâches représentatives.

La réussite d’ESLint et du build confirme la qualité technique de compilation, mais ne démontre pas à elle seule la qualité d’usage.

---

## 3. Analyse détaillée de l’interface visuelle — UI

### 3.1 Points forts

#### Identité institutionnelle cohérente

L’en-tête, le logo, les intitulés et la palette générale donnent à l’application une apparence professionnelle adaptée à un outil administratif. L’interface ne cherche pas à produire un effet décoratif inutile : elle reste orientée vers la consultation et le traitement des dossiers.

#### Cartes de synthèse utiles

Les principales informations du dossier sont regroupées dans des cartes identifiables : statut, écart, chiffre d’affaires, bénéfice et TVA. Ce découpage facilite le balayage visuel et évite une liste de données non structurée.

#### Statuts visuellement différenciés

Les badges permettent de distinguer rapidement l’état du dossier. Ils constituent un bon point d’entrée avant la lecture des explications détaillées.

#### Cohérence des actes et formulaires

Les formulaires de procédure reprennent une structure commune : titre, explication, références, champs puis actions. Cette répétition réduit l’apprentissage nécessaire d’un acte à l’autre.

### 3.2 Difficultés constatées

#### Densité d’informations élevée

Sur un même écran, l’utilisateur peut rencontrer :

- plusieurs indicateurs chiffrés ;
- une explication de l’écart ;
- une chronologie juridique ;
- une estimation d’amende ;
- une ou plusieurs références légales ;
- la prochaine action ;
- des actions secondaires.

Chaque bloc est pertinent isolément, mais leur accumulation réduit la capacité à déterminer ce qui doit être lu ou fait en premier.

**Impact :** lecture plus lente, risque de survol des avertissements et difficulté à distinguer l’information principale de l’information de référence.

#### Tableau des catégories trop large

Une mesure ponctuelle à 1440 px a montré un tableau d’environ **2330 px dans un conteneur d’environ 1080 px**. Le masquage des puces légales ne modifiait pas ces dimensions : le débordement est donc préexistant à leur ajout.

**Impact :** défilement horizontal, perte du lien entre les cellules d’une même ligne et dégradation importante sur les écrans plus étroits.

#### Références légales parfois trop présentes

Les références longues incluant le document, l’article, la page et l’ouverture externe peuvent occuper une place importante, surtout lorsqu’une même ligne comporte plusieurs sources.

**Impact :** concurrence avec le contenu métier et réduction de la lisibilité des cellules ou paragraphes.

### 3.3 Recommandations UI

- Conserver les cartes et les styles existants, mais renforcer la hiérarchie entre indicateurs principaux et secondaires.
- Limiter la première vue aux informations nécessaires à la décision immédiate.
- Transformer le tableau des catégories en cartes sur petit écran ; sur grand écran, simplifier les cellules et placer les références sur une ligne secondaire.
- Employer une forme courte des références : `CPF V-02 ↗`, `CDI 20.01.54 ↗`.
- Prévoir un espace vertical régulier entre les blocs et éviter que les explications juridiques longues soient toutes déployées simultanément.

---

## 4. Analyse détaillée de l’expérience utilisateur — UX

### 4.1 Points forts

#### Procédure métier logique

La procédure suit un ordre explicite : contrôle et écart, éclaircissements, notification primitive, notification définitive puis imputation du crédit d’impôt. L’utilisateur dispose ainsi d’un modèle mental cohérent du traitement.

#### Prochaine étape identifiable

Le panneau « Prochaine étape » indique la conduite à tenir selon l’état du dossier. C’est un élément central de l’expérience : il transforme un ensemble de données en une aide à la décision.

#### Transparence juridique

La possibilité d’ouvrir directement le texte officiel réduit l’incertitude. Lorsque l’application applique une règle différente ou plus favorable, l’écart est explicité au lieu d’être présenté comme une citation exacte.

#### Préservation du contexte

Les références s’ouvrent dans un onglet séparé. L’utilisateur peut consulter un PDF puis revenir au dossier sans perdre son parcours.

### 4.2 Difficultés constatées

#### Charge cognitive avant l’action

Pour agir, l’utilisateur doit parfois lire le statut, comprendre l’écart, parcourir la procédure, distinguer une estimation d’un montant enregistré et ouvrir le formulaire approprié.

**Impact :** un utilisateur expérimenté retrouve efficacement ses repères, mais un nouvel utilisateur peut hésiter sur la signification des informations et sur le niveau d’engagement d’une action.

#### Actions secondaires peu visibles

Le regroupement dans « Autres actions du dossier » réduit l’encombrement, mais peut aussi masquer une action recherchée. L’utilisateur doit connaître la structure de la procédure pour anticiper ce qui se trouve dans le panneau.

#### Vocabulaire techniquement nécessaire mais parfois dense

Les intitulés juridiques et fiscaux sont pertinents dans les actes. En revanche, leur répétition dans les explications courantes peut rendre la lecture difficile pour un contribuable non spécialiste.

#### Multiplicité des niveaux d’information

Le dossier mélange des valeurs enregistrées, des estimations et des explications normatives. Les textes actuels précisent ces distinctions, mais l’utilisateur doit les lire attentivement pour éviter toute confusion.

### 4.3 Recommandations UX

Organiser chaque dossier selon trois questions successives :

1. **Que se passe-t-il ?** — statut et explication courte ;
2. **Quel est le problème ou le montant à examiner ?** — écart et principales valeurs ;
3. **Que dois-je faire maintenant ?** — une action principale et ses conséquences.

Les autres informations restent accessibles, mais dans des blocs secondaires :

- détail des calculs ;
- chronologie complète ;
- références juridiques ;
- historique ;
- autres actions.

Pour chaque action indisponible, afficher directement la condition de déblocage, par exemple : « Disponible après l’enregistrement de la notification définitive ».

---

## 5. Analyse détaillée des interactions homme-machine — IHM

### 5.1 Points forts

- Formulaires déclenchés depuis des boutons aux libellés explicites.
- Actions principales et secondaires différenciées.
- Présence d’un mécanisme d’annulation permettant de quitter un formulaire sans enregistrer.
- Modales dotées d’une base d’accessibilité clavier.
- Liens externes utilisant `target="_blank"` avec `rel="noopener noreferrer"`.
- Explications associées aux champs sensibles, notamment pour les délais et la prorogation.
- Interdiction de soumettre certaines étapes tant que la situation du dossier ne les autorise pas.

### 5.2 Difficultés constatées

#### Visibilité inégale des actions

Une action peut être présente dans la zone principale, dans les autres actions ou dans un formulaire dépliable. Cette organisation est fonctionnelle, mais demande une exploration préalable.

#### Retours d’interaction à harmoniser

Les différents écrans doivent traiter de manière homogène :

- chargement des données ;
- enregistrement réussi ;
- erreur de validation ;
- erreur serveur ;
- absence de données ;
- action interdite ou indisponible.

Une interface riche ne doit pas laisser l’utilisateur se demander si son clic a produit un effet.

#### Risque de surcharge dans les formulaires

L’explication juridique, les références, les montants et les champs peuvent être tous visibles avant l’action. Les informations indispensables à la saisie doivent rester prioritaires.

### 5.3 Recommandations IHM

- Présenter une seule action principale par état du dossier.
- Conserver les actions secondaires dans un groupe clairement nommé, avec leur état de disponibilité.
- Placer les erreurs au niveau du champ concerné et fournir un résumé accessible en tête de formulaire si nécessaire.
- Annoncer les résultats d’enregistrement dans une zone `aria-live` lorsque le contenu change sans rechargement.
- Maintenir visibles les boutons « Annuler » et « Confirmer » sans imposer un défilement inutile dans les petits formulaires.
- Conserver les explications essentielles près du champ ; déplacer les précisions juridiques longues vers une aide dépliable.
- Vérifier que le focus revient sur le bouton d’origine après la fermeture d’une modale.

---

## 6. Analyse détaillée de la convivialité

### 6.1 Points forts

#### Présence d’une aide intégrée

Le portail ne se limite pas à afficher des valeurs : il propose des repères, des définitions et des explications de procédure. Cette aide favorise l’autonomie du contribuable.

#### Explication des écarts avec les textes

Lorsque la règle appliquée par l’application ne correspond pas exactement à l’article cité, l’écart est affiché. Cette prudence améliore la confiance et évite une fausse impression d’officialisation.

#### Libellés de statut orientés lecture

Les libellés humains sont préférables aux codes techniques et permettent une compréhension plus rapide de l’état du dossier.

### 6.2 Difficultés constatées

#### Effort d’apprentissage initial

La richesse de l’aide peut elle-même devenir intimidante si tous les repères sont présentés avec le même niveau de visibilité.

#### Vocabulaire spécialisé

Les notions de notification primitive, notification définitive, prorogation, imputation ou crédit d’impôt nécessitent des exemples concrets et des conséquences pratiques, pas seulement des définitions.

#### Lecture des montants

La multiplication des montants rend difficile l’identification de ceux qui sont :

- déclarés ;
- calculés ;
- estimés ;
- enregistrés ;
- effectivement dus.

### 6.3 Recommandations de convivialité

- Associer à chaque notion importante une phrase de conséquence pratique : « Vous pouvez maintenant répondre », « Aucun montant n’est encore exigible à cette étape », « Cette valeur est une estimation ».
- Utiliser des exemples courts dans l’aide, sans inventer de données dans les actes ou les dossiers.
- Maintenir une distinction visuelle stable entre valeur enregistrée, calcul provisoire et information juridique.
- Faire ressortir la recherche NIF existante comme point d’entrée rapide pour les agents.
- Proposer un niveau de lecture synthétique avant la documentation détaillée.

---

## 7. Recommandations prioritaires

| Priorité | Chantier | Problème traité | Résultat attendu |
|---|---|---|---|
| **P1** | Tableaux responsives | Débordement horizontal et lecture difficile | Aucun débordement de page aux largeurs usuelles ; chaque catégorie reste compréhensible sur mobile. |
| **P1** | Prochaine action unique | Hésitation devant plusieurs blocs et boutons | L’utilisateur identifie immédiatement l’action recommandée et sa conséquence. |
| **P1** | Hiérarchie des montants | Confusion possible entre enregistré, calculé et estimé | Chaque montant est accompagné d’un statut explicite et stable. |
| **P1** | Références légales compactes | Surcharge des cellules et paragraphes | Le texte métier reste dominant ; le PDF reste accessible en un clic. |
| **P2** | Divulgation progressive | Trop d’informations déployées simultanément | La première vue reste synthétique, sans perte d’accès au détail. |
| **P2** | Retours d’interaction homogènes | Incertitude après une action | Chargement, succès, erreur et indisponibilité suivent les mêmes conventions. |
| **P2** | Langage orienté conséquence | Compréhension difficile pour les non-spécialistes | L’utilisateur comprend ce que l’étape change pour lui. |
| **P3** | Audit d’accessibilité complet | Conformité seulement partiellement vérifiée | Clavier, contraste, zoom, tactile et lecteur d’écran sont contrôlés systématiquement. |
| **P3** | Tests utilisateurs | Absence de mesures d’usage réel | Les décisions d’amélioration sont validées par des tâches observées. |

---

## 8. Propositions par écran

### 8.1 Dossier fiscal `/suivi/:id`

**À conserver :**

- identité du contribuable et numéro de déclaration ;
- statut du dossier ;
- synthèse de l’écart ;
- procédure chronologique ;
- prochaine étape.

**À améliorer :**

- regrouper en tête uniquement le statut, l’écart et l’action recommandée ;
- placer les autres indicateurs dans une zone « Détail de la déclaration » ;
- faire ressortir la différence entre principal proposé, amende estimée et montant enregistré ;
- réduire la longueur des références sans supprimer leur destination ;
- conserver les autres actions repliées, mais afficher leur nombre ou leur disponibilité.

### 8.2 Formulaires de procédure

**À conserver :**

- titre de l’acte ;
- explication de son objet ;
- références légales ;
- boutons d’annulation et de confirmation.

**À améliorer :**

- afficher en premier les champs et leurs conséquences immédiates ;
- replier la doctrine ou les précisions juridiques longues ;
- expliquer les contraintes avant la saisie plutôt qu’après l’erreur ;
- conserver les valeurs saisies en cas d’erreur serveur ;
- proposer une confirmation uniquement pour les actions engageantes ou irréversibles.

### 8.3 Aide du portail contribuable

**À conserver :**

- sommaire par rubriques ;
- explications des règles ;
- liens vers les textes officiels ;
- avertissements lorsque l’application applique une règle distincte.

**À améliorer :**

- transformer le tableau des catégories en cartes sur petit écran ;
- présenter chaque catégorie avec trois informations principales : seuil, impôt, obligations ;
- regrouper les références sous un intitulé court « Sources » ;
- maintenir une explication synthétique avant les détails juridiques ;
- vérifier la lisibilité à 200 % de zoom sans défilement horizontal de la page.

---

## 9. Critères de réussite mesurables

Les améliorations pourront être considérées comme validées lorsque les conditions suivantes seront remplies.

### Responsive et mise en page

- Aucun débordement horizontal de la page à 320, 768, 1024 et 1440 px.
- Les tableaux transformés conservent l’association entre chaque libellé et sa valeur.
- Les références restent utilisables au clavier et au tactile.

### Compréhension et parcours

- L’utilisateur identifie la prochaine action sans ouvrir les autres blocs.
- Les valeurs estimées ne peuvent pas être confondues avec des montants enregistrés.
- Une action indisponible affiche toujours sa condition de déblocage.
- Le retour depuis un PDF officiel ne fait perdre ni le dossier ni la position de travail.

### Interaction

- Chaque soumission produit un état visible : chargement, succès ou erreur.
- Les erreurs de champ sont localisées et formulées avec la correction attendue.
- Les modales restent utilisables au clavier et restituent le focus à leur fermeture.
- Aucun changement de données n’est provoqué par la seule consultation d’une explication ou d’une référence.

### Accessibilité

- Contraste conforme à WCAG AA pour le texte et les états essentiels.
- Focus visible sur tous les éléments interactifs.
- Cibles tactiles suffisamment grandes et espacées.
- Lecture cohérente des titres, libellés, erreurs et changements de statut par un lecteur d’écran.

---

## 10. Protocole de tests utilisateurs recommandé

### Profils à inclure

- agent fiscal chargé du traitement courant ;
- inspecteur consultant des dossiers sur un périmètre national ;
- chef de centre suivant l’activité de son équipe ;
- contribuable découvrant sa situation et la procédure.

### Tâches représentatives

1. Trouver un dossier à partir d’un NIF.
2. Expliquer le statut du dossier avec ses propres mots.
3. Identifier la prochaine action recommandée.
4. Distinguer un montant enregistré d’une estimation.
5. Vérifier l’article associé à une règle puis revenir au dossier.
6. Ouvrir un acte, lire ses valeurs et quitter sans enregistrer.
7. Comprendre pourquoi l’imputation n’est pas encore disponible.
8. Retrouver, dans l’aide, la catégorie fiscale correspondant à un chiffre d’affaires donné.
9. Réaliser les mêmes consultations sur un écran de téléphone.

### Mesures à recueillir

- réussite de la tâche sans assistance ;
- nombre d’erreurs et de retours en arrière ;
- temps nécessaire pour identifier la prochaine action ;
- nombre de clics avant l’écran attendu ;
- difficulté ressentie et commentaire de l’utilisateur ;
- incompréhensions sur les statuts, montants ou références.

Les résultats doivent être analysés par profil : une simplification utile au contribuable ne doit pas supprimer les informations nécessaires à l’agent expérimenté.

---

## 11. Séquencement proposé

### Vague 1 — Lisibilité et responsive

- corriger le tableau des catégories ;
- compacter les références légales ;
- renforcer la hiérarchie des montants ;
- vérifier les largeurs, le zoom et les états prudents.

### Vague 2 — Décision et interactions

- simplifier la zone de prochaine action ;
- harmoniser la disponibilité des actions ;
- uniformiser les états de chargement, succès et erreur ;
- appliquer la divulgation progressive aux informations secondaires.

### Vague 3 — Validation d’usage

- conduire les tests par profil ;
- effectuer l’audit clavier, contraste, tactile et lecteur d’écran ;
- corriger les difficultés observées ;
- conserver les indicateurs de réussite pour les évolutions suivantes.

Ce séquencement privilégie des améliorations ciblées et réversibles, sans refonte graphique globale ni modification inutile des parcours métier déjà cohérents.

---

## 12. Conclusion

SPS/CF dispose d’une interface crédible, structurée et fonctionnellement riche. La cohérence visuelle, la procédure guidée et la transparence des références légales forment une base de qualité supérieure à celle d’un simple back-office administratif.

La note de **7,2/10** traduit surtout un besoin de simplification perceptive : l’application doit mieux choisir ce qu’elle met en avant à chaque étape. L’objectif n’est pas de réduire la richesse fonctionnelle, mais de la rendre accessible progressivement, au moment où elle devient utile.

La priorité doit donc être donnée à la lisibilité responsive, à la hiérarchie des informations et à la clarté de la prochaine action. Ces améliorations peuvent être réalisées en conservant les styles et l’identité existants, tout en produisant un gain immédiat de compréhension et de confort d’utilisation.
