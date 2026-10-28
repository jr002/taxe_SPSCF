FICHIER DE CONTEXTE : MODULE DE CONFRONTATION TVA
==================================================

OBJECTIF DU DOCUMENT
--------------------
Ce document explique le contexte métier, la structure exacte de la base de
données PostgreSQL, les règles métier et l’objectif du module de CONFRONTATION
entre les DÉCLARATIONS et les RECOUPEMENTS.

Il doit être lu par une IA locale avant de générer ou de modifier le code
du module dans une application React JS existante.

L’IA ne doit pas créer une nouvelle application.
Elle doit intégrer le module dans l’application React existante,
en respectant sa structure, son routeur, son client API, son design
et ses composants déjà présents.


1. CONTEXTE MÉTIER
------------------
Le système sert au contrôle fiscal de contribuables à Madagascar.

Un contribuable déclare son chiffre d’affaires, sa TVA collectée,
sa TVA déductible, sa TVA à payer et d’autres éléments fiscaux.

L’administration peut obtenir des informations complémentaires appelées
« recoupements ». Ces recoupements proviennent de sources externes ou internes :
clients, fournisseurs, banques, douane, autres administrations, marchés publics,
assurances, transporteurs, etc.

La confrontation consiste à comparer :
- ce que le contribuable a déclaré ;
- ce que les recoupements révèlent.

L’objectif est de détecter les écarts, les omissions, les doublons,
les différences de période et les anomalies à vérifier.

IMPORTANT :
Un écart n’est pas automatiquement une fraude.
Il doit être analysé avec les pièces justificatives avant toute conclusion.


2. DÉFINITIONS
--------------
DÉCLARATION :
Information transmise par le contribuable.
Exemple : « J’ai réalisé 10 000 000 Ar de ventes en octobre 2026. »

RECOUPEMENT :
Information provenant d’une autre source.
Exemple : « Le client X déclare une facture de 3 000 000 Ar auprès du contribuable. »

RAPPROCHEMENT :
Résultat de la comparaison entre une déclaration et un recoupement.

ÉCART :
Différence entre le montant recoupé et le montant déclaré.

Formule principale :

ecart = montant_recoupe - montant_declare

Exemples :

- Déclaration : 10 000 000 Ar
- Recoupement : 10 000 000 Ar
- Écart : 0 Ar
- Résultat : rapprochement exact

- Déclaration : 10 000 000 Ar
- Recoupement : 12 000 000 Ar
- Écart : +2 000 000 Ar
- Résultat : possible sous-déclaration, à vérifier

- Déclaration : 10 000 000 Ar
- Recoupement : 8 000 000 Ar
- Écart : -2 000 000 Ar
- Résultat : différence à expliquer, à vérifier

4. RÈGLES DE RAPPROCHEMENT
--------------------------
Le moteur doit appliquer les règles dans cet ordre :

RÈGLE 1 : CORRESPONDANCE EXACTE
- même id_contribuable
- même periode
- même reference si disponible
- même montant
- score = 100
- statut = rapproche
- type_rapprochement = exact

RÈGLE 2 : CORRESPONDANCE AVEC TOLÉRANCE
- même id_contribuable
- même periode
- différence de montant inférieure ou égale à la tolérance configurée
- tolérance par défaut : 1 000 Ar
- score = 90
- statut = a_verifier
- type_rapprochement = tolerance

RÈGLE 3 : CORRESPONDANCE PARTIELLE
- même id_contribuable
- même periode
- différence de montant supérieure à la tolérance
- mais inférieure ou égale à 5% du montant déclaré
- score = 70
- statut = a_verifier
- type_rapprochement = partiel

RÈGLE 4 : ÉCART
- recoupement non rapproché
- score = 0
- statut = ecart
- type_rapprochement = partiel
- motif = « Recoupement non retrouvé dans les déclarations »

RÈGLE 5 : DÉCLARATION SANS RECOUPEMENT
- déclaration non rapprochée
- score = 0
- statut = a_verifier
- motif = « Aucun recoupement trouvé pour cette déclaration »


5. RÈGLES ANTI-DOUBLON
----------------------
- Un même recoupement ne doit pas être rapproché deux fois.
- Une même déclaration ne doit pas être rapprochée deux fois avec le même recoupement.
- Le moteur doit pouvoir être relancé sans créer de doublons.
- Avant insertion, vérifier l’existence du couple id_declaration + id_recoupement
  dans la table rapprochements.


6. INTERFACE REACT À INTÉGRER
-----------------------------
L’application React existe déjà.

L’IA doit :
- analyser la structure du projet ;
- réutiliser le routeur existant ;
- réutiliser le client API/Axios existant ;
- réutiliser les composants et le design existants ;
- ajouter uniquement les fichiers nécessaires ;
- ne pas casser les fonctionnalités existantes ;
- ne pas recréer l’authentification, le routeur ou Axios.

Pages à intégrer :

PAGE 1 : CONFRONTATION TVA
- Sélection du contribuable
- Sélection de la période
- Sélection du type de déclaration
- Bouton « Lancer la confrontation »
- Indicateur de chargement
- Message de succès ou d’erreur

PAGE 2 : TABLEAU DE BORD
- Nombre de déclarations analysées
- Nombre de recoupements analysés
- Nombre de rapprochements exacts
- Nombre de rapprochements avec tolérance
- Nombre de rapprochements partiels
- Nombre d’écarts
- Montant total déclaré
- Montant total recoupé
- Montant total des écarts

PAGE 3 : LISTE DES RAPPROCHEMENTS
- Tableau des résultats
- Recherche par référence, NIF ou raison sociale
- Filtres par période, statut et type de rapprochement
- Pagination
- Tri
- Badge coloré selon le statut
- Bouton « Détail »
- Export Excel et PDF

PAGE 4 : DÉTAIL D’UN RAPPROCHEMENT
- Comparaison côte à côte entre déclaration et recoupement
- Affichage du montant déclaré
- Affichage du montant recoupé
- Affichage de l’écart
- Affichage du score
- Affichage du motif
- Actions : valider, rejeter, marquer à vérifier, annuler
- Modal de confirmation
- Commentaire obligatoire pour rejet ou annulation

PAGE 5 : STATISTIQUES
- Filtre par contribuable et période
- Répartition des statuts
- Écarts par période
- Totaux TVA collectée et TVA déductible
- Export Excel et PDF


7. RÈGLES D’AFFICHAGE
---------------------
- Interface entièrement en français.
- Montants en ariary avec séparateurs de milliers.
- Dates au format JJ/MM/AAAA.
- Score affiché en pourcentage.
- Vert : rapproche.
- Orange : à vérifier.
- Rouge : écart.
- Bleu : validé.
- Gris : rejeté ou annulé.
- Afficher « Aucun rapprochement trouvé » si la liste est vide.
- Afficher « Aucune donnée disponible pour cette période » si les statistiques sont vides.
- Désactiver le bouton « Lancer la confrontation » si le contribuable
  ou la période n’est pas sélectionné.
- Gérer les états : chargement, erreur, succès et données vides.

8. MÉTHODE DE TRAVAIL DEMANDÉE À L’IA
--------------------------------------
L’IA doit procéder dans cet ordre :

ÉTAPE 1 :
Analyser la structure du projet React existant.

ÉTAPE 2 :
Identifier :
- le routeur ;
- le client API ;
- le dossier des pages ;
- le dossier des composants ;
- le système de design ;
- les conventions du projet.

ÉTAPE 3 :
Proposer un plan d’intégration avant de générer le code.

ÉTAPE 4 :
Attendre la validation de l’utilisateur.

ÉTAPE 5 :
Générer les fichiers un par un :
1. service API rapprochements.js
2. page ConfrontationTVA.jsx
3. tableau de bord de confrontation
4. liste des rapprochements
5. détail d’un rapprochement
6. statistiques
7. export Excel/PDF

ÉTAPE 6 :
Après chaque fichier, indiquer :
- où le placer ;
- quelles modifications faire dans les fichiers existants ;
- comment tester la fonctionnalité.


9. INTERDICTIONS
-----------------
L’IA ne doit pas :
- recréer le routeur ;
- recréer Axios ;
- recréer l’authentification ;
- supprimer des fichiers existants ;
- modifier la base de données sans demande explicite ;
- installer une dépendance sans demander l’accord ;
- générer tout le code en une seule fois sans plan ;
- modifier les migrations Prisma sans demande explicite ;
- conclure automatiquement qu’un écart est une fraude.


10. RÉSULTAT ATTENDU
--------------------
À la fin, l’application doit permettre à un agent de :

1. Choisir un contribuable et une période.
2. Lancer la confrontation.
3. Voir les rapprochements et les écarts.
4. Analyser chaque écart.
5. Valider ou rejeter un rapprochement.
6. Conserver une trace des décisions.
7. Exporter un rapport de confrontation.

Le module doit être simple, fiable, traçable et facile à maintenir.


11. INSTRUCTIONS IMMÉDIATES POUR L’IA
-------------------------------------
Après avoir lu ce fichier :

1. Confirme que tu as compris le contexte.
2. Ne génère pas encore de code.
3. Demande la structure du projet React existant :
   - structure du dossier src ;
   - fichier de routes ;
   - client API/Axios ;
   - exemple de page existante.
4. Propose ensuite un plan d’intégration.
5. Attends la validation avant de générer le code.
