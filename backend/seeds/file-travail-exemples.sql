-- =====================================================================
-- File de travail · jeux d'exemples pour la démonstration
-- =====================================================================
-- Ce script N'EST PAS une migration : il ne change aucune structure et peut
-- être réexécuté aussi souvent que nécessaire pour rafraîchir les exemples.
--
--   npx prisma db execute --schema prisma/schema.prisma --file seeds/file-travail-exemples.sql
--
-- Les dates sont calculées par rapport à CURRENT_DATE au moment de l'exécution.
-- La file de travail compare ses échéances à « aujourd'hui » : relancer ce
-- script la veille de la soutenance re-centre toutes les échéances.
--
-- Les trois dossiers portent la mention « EXEMPLE » dans leur raison sociale et
-- un NIF réservé (9500000001 à 9500000003, aucun dossier réel de cette base n'en
-- porte). Ils se retrouvent par la recherche « EXEMPLE » de la file de travail
-- et se retirent avec le bloc « PURGE » en bas de fichier.
--
-- Sept actes déclenchés, un par règle de `construireFile`, plus un contre-exemple :
--   1. primitive échue              → « Émettre la notification définitive » · en retard
--   2. primitive à trois jours      → idem · cette semaine
--   3. éclaircissement sans réponse → « Émettre la notification primitive » · en retard
--   4. second rappel échu           → « Relancer ou constater le silence » · en retard
--   5. mise en demeure récente      → idem · à suivre
--   6. trois écarts de rapprochement→ un seul acte agrégé · cette semaine
--   7. déclaration critique         → « Examiner un écart de TVA » · cette semaine
--   8. déclaration conforme         → AUCUNE ligne : la file ne signale que ce qui attend un acte
--
-- Le dossier 3 (NIF 9500000003) porte aussi trois recoupements de tiers datés
-- des mêmes périodes que ses rapprochements : sa page « Confrontation » est donc
-- présentable de bout en bout (aperçu, lancement, détail relié au recoupement)
-- et relancer la confrontation y crée 0 rapprochement, les paires existant déjà.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 1. Purge des exemples précédents, pour une ré-exécution sans doublon.
--    Les NIF sont cités en toutes lettres : aucun rapprochement par préfixe ne
--    peut donc emporter un dossier réel. L'ordre suit les clés étrangères :
--    rapprochements → relances → déclarations → contribuables.
-- ---------------------------------------------------------------------
WITH exemples AS (
  SELECT id_contribuable FROM public.contribuables
   WHERE nif IN ('9500000001', '9500000002', '9500000003')
)
DELETE FROM public.rapprochements
 WHERE id_declaration IN (
   SELECT id_declaration FROM public.declarations WHERE id_contribuable IN (SELECT id_contribuable FROM exemples)
 );

WITH exemples AS (
  SELECT id_contribuable FROM public.contribuables
   WHERE nif IN ('9500000001', '9500000002', '9500000003')
)
DELETE FROM public.recoupements
 WHERE id_contribuable IN (SELECT id_contribuable FROM exemples);

WITH exemples AS (
  SELECT id_contribuable FROM public.contribuables
   WHERE nif IN ('9500000001', '9500000002', '9500000003')
)
DELETE FROM public.relances
 WHERE id_contribuable IN (SELECT id_contribuable FROM exemples);

WITH exemples AS (
  SELECT id_contribuable FROM public.contribuables
   WHERE nif IN ('9500000001', '9500000002', '9500000003')
)
DELETE FROM public.declarations
 WHERE id_contribuable IN (SELECT id_contribuable FROM exemples);

DELETE FROM public.contribuables
 WHERE nif IN ('9500000001', '9500000002', '9500000003');

-- ---------------------------------------------------------------------
-- 2. Trois dossiers rattachés au CF1 Analakely (id_centre 16), le centre des
--    comptes de démonstration : visibles par un rôle centré (agent fiscal,
--    contrôleur, chef de centre) comme par un rôle national (administrateur,
--    inspecteur).
-- ---------------------------------------------------------------------
INSERT INTO public.contribuables
  (nif, raison_sociale, secteur_activite, adresse, telephone, email, regime_fiscal, id_centre, centre_fiscal_ref)
VALUES
  ('9500000001', 'EXEMPLE · SARL Fandrian-tanana',   'Négoce de matériaux',     'Lot II M 45 Analakely, Antananarivo', '+261 20 22 000 11', 'comptabilite@exemple-fandrian.mg',     'IS', 16, 'centres_fiscaux:CF1 Analakely'),
  ('9500000002', 'EXEMPLE · Établissements Ravalison','Transport de marchandises','Tamboho, Antananarivo',             '+261 20 22 000 12', 'service.fiscal@exemple-ravalison.mg',  'IS', 16, 'centres_fiscaux:CF1 Analakely'),
  ('9500000003', 'EXEMPLE · Transports Betsimisaraky','Services logistiques',   'Ampefiloha, Antananarivo',            '+261 20 22 000 13', 'contact@exemple-betsimisaraky.mg',     'IS', 16, 'centres_fiscaux:CF1 Analakely');

-- ---------------------------------------------------------------------
-- 3. Déclarations de TVA. Les montants sont une matière d'atelier : ils
--    alimentent les compteurs de la file, ils ne liquident rien.
-- ---------------------------------------------------------------------

-- 3.1 Dossier 1 · deux primitives ouvertes : une échée, une à trois jours.
INSERT INTO public.declarations
  (id_contribuable, annee, periode, type_declaration, ca, tva_collectee, tva_deductible,
   tva_payee, tva_theorique, statut, montant_net_a_payer,
   date_notification_primitive, date_limite_reponse, prorogation_jours, observations_agent)
SELECT c.id_contribuable, 2026, x.periode, 'TVA', x.ca, x.theorique, 0,
       x.payee, x.theorique, 'PRIMITIVE_ENVOYÉE', x.net,
       CURRENT_DATE + x.j_primitive, CURRENT_DATE + x.j_limite, 0, x.observation
  FROM public.contribuables c
  JOIN (VALUES
          ('9500000001', '2026-05', 45000000::numeric, 5850000::numeric, 3700000::numeric, 2150000::numeric, -20, -5,
           'Exemple : notification primitive du 20 octobre, réponse attendue avant le 15.'),
          ('9500000001', '2026-06', 38000000::numeric, 4940000::numeric, 3460000::numeric, 1480000::numeric, -10,  3,
           'Exemple : primitive récente, le délai de réponse court encore.')
       ) AS x(nif, periode, ca, theorique, payee, net, j_primitive, j_limite, observation)
    ON x.nif = c.nif;

-- 3.2 Dossier 2 · une déclaration critique (écart de TVA à examiner) et une
--     éclaircie sans primitive (l'éclaircissement appelle la notification).
INSERT INTO public.declarations
  (id_contribuable, annee, periode, type_declaration, ca, tva_collectee, tva_deductible,
   tva_payee, tva_theorique, statut, observations_agent)
SELECT c.id_contribuable, 2026, x.periode, 'TVA', x.ca, x.theorique, 0,
       x.payee, x.theorique, x.statut, x.observation
  FROM public.contribuables c
  JOIN (VALUES
          ('9500000002', '2026-07', 92000000::numeric, 12000000::numeric, 4500000::numeric, 'critique',
           'Exemple : la TVA versée reste très en deçà de la TVA théorique.'),
          ('9500000002', '2026-08', 61000000::numeric,  7930000::numeric, 6100000::numeric, 'non_conforme',
           'Exemple : éclaircissements demandés, aucune primitive enregistrée au dossier.')
       ) AS x(nif, periode, ca, theorique, payee, statut, observation)
    ON x.nif = c.nif;

-- 3.3 Dossier 3 · trois déclarations rapprochées de tiers (deux écarts
--     confirmés, une ligne à vérifier), une déclaration en arriéré supportant
--     les relances de recouvrement, et une déclaration conforme contre-exemple.
INSERT INTO public.declarations
  (id_contribuable, annee, periode, type_declaration, ca, tva_collectee, tva_deductible,
   tva_payee, tva_theorique, statut, observations_agent)
SELECT c.id_contribuable, 2026, x.periode, 'TVA', x.ca, x.theorique, 0,
       x.payee, x.theorique, x.statut, x.observation
  FROM public.contribuables c
  JOIN (VALUES
          ('9500000003', '2026-01', 24000000::numeric, 3120000::numeric, 3120000::numeric, 'conforme',
           'Exemple : déclaration conforme, mais le recoupement des tiers la conteste.'),
          ('9500000003', '2026-02', 26500000::numeric, 3445000::numeric, 3445000::numeric, 'conforme',
           'Exemple : déclaration conforme, écart de recoupement confirmé.'),
          ('9500000003', '2026-03', 28500000::numeric, 3705000::numeric, 3705000::numeric, 'conforme',
           'Exemple : déclaration conforme, rapprochement manuel en attente de vérification.'),
          ('9500000003', '2026-04', 30000000::numeric, 3900000::numeric,  700000::numeric, 'non_conforme',
           'Exemple : déclaration souscrite, la majeure partie de la TVA reste à verser.'),
          ('9500000003', '2026-09', 27000000::numeric, 3510000::numeric, 3510000::numeric, 'conforme',
           'Contre-exemple : conforme et sans acte attendu, elle ne doit pas apparaître dans la file.')
       ) AS x(nif, periode, ca, theorique, payee, statut, observation)
    ON x.nif = c.nif;

-- ---------------------------------------------------------------------
-- 4. Relances émises et sans réponse. Les délais sont ceux que la file applique
--    déjà : 8 jours pour un rappel, 5 pour une mise en demeure, 30 pour une
--    demande d'éclaircissements.
-- ---------------------------------------------------------------------
INSERT INTO public.relances
  (id_contribuable, id_declaration, type_relance, statut, annee, montant_du, jours_retard, date_emission, observations)
SELECT c.id_contribuable, d.id_declaration, x.type_relance, 'emise', 2026, x.montant, x.jours_retard,
       CURRENT_DATE + x.j_emission, x.observation
  FROM public.contribuables c
  JOIN (VALUES
          ('9500000002', '2026-08', 'demande_eclaircissement',    0::numeric,  0, -40,
           'Exemple : délai de réponse de 30 jours écoulé, la primitive reste à émettre.'),
          ('9500000003', '2026-04', 'rappel2',              1150000::numeric, 22, -30,
           'Exemple : second rappel à l''ordre émis il y a trente jours, sans réponse.'),
          ('9500000003', '2026-04', 'mise_en_demeure',      3200000::numeric,  0,  -2,
           'Exemple : mise en demeure récente, le délai de cinq jours court encore.')
       ) AS x(nif, periode, type_relance, montant, jours_retard, j_emission, observation)
    ON x.nif = c.nif
  JOIN public.declarations d
    ON d.id_contribuable = c.id_contribuable AND d.periode = x.periode;

-- ---------------------------------------------------------------------
-- 5. Recoupements des tiers du dossier 3, puis les rapprochements qui en
--    découlent. Sans recoupement, l'onglet « Confrontation » du dossier ne
--    peut rien comparer : le bouton « Lancer la confrontation » reste
--    désactivé et le détail d'un rapprochement affiche un recoupement vide.
--    Le montant comparé est `somme_recoupee` (TTC) ; le hors taxe et la TVA
--    sont calculés pour que HT + TVA = TTC exactement.
-- ---------------------------------------------------------------------
INSERT INTO public.recoupements
  (id_contribuable, source, periode, reference, type_operation, nif_tiers, date_operation,
   montant_declare, montant_tva, montant_ttc, somme_recoupee, date_creation)
SELECT c.id_contribuable, x.source, x.periode, x.reference, 'vente', x.nif_tiers,
       ((x.periode || '-01')::date + interval '1 month' - interval '1 day')::date,
       round(x.recoupe / 1.13), x.recoupe - round(x.recoupe / 1.13), x.recoupe, x.recoupe,
       CURRENT_DATE + x.j_recuperation
  FROM public.contribuables c
  JOIN (VALUES
          ('9500000003', 'banque',          '2026-01', 'BAN-2026-01-EXEMPLE', '6001112223', 18900000::numeric, -14),
          ('9500000003', 'tiers_declarant', '2026-02', 'TIER-2026-02-EXEMPLE', '7002223334', 31200000::numeric,  -8),
          ('9500000003', 'administration',  '2026-03', 'MP-2026-03-EXEMPLE',  '8003334445', 27300000::numeric,  -3)
       ) AS x(nif, source, periode, reference, nif_tiers, recoupe, j_recuperation)
    ON x.nif = c.nif;

-- ---------------------------------------------------------------------
-- 6. Rapprochements ouverts du dossier 3. écart = montant déclaré − montant
--    recoupé. Trois lignes pour un seul dossier : la file les agrège.
--    Chacun est rattaché au recoupement de la même période, de sorte qu'une
--    relance de la confrontation sur ce dossier retrouve les paires déjà
--    traitées et ne crée rien.
-- ---------------------------------------------------------------------
INSERT INTO public.rapprochements
  (id_declaration, id_recoupement, type_rapprochement, score, montant_declare, montant_recoupe, ecart, statut, motif, date_rapprochement)
SELECT d.id_declaration, rec.id_recoupement, x.type_rapprochement, x.score, x.declare, x.recoupe,
       x.declare - x.recoupe, x.statut, x.motif, CURRENT_DATE + x.j_rapprochement
  FROM public.declarations d
  JOIN public.contribuables c
    ON c.id_contribuable = d.id_contribuable AND c.nif = '9500000003'
  JOIN (VALUES
          ('2026-01', 'partiel', 18, 24000000::numeric, 18900000::numeric, 'ecart',
           'Exemple : le chiffre d''affaires déclaré dépasse le recoupement des tiers.', -12),
          ('2026-02', 'partiel',  9, 26500000::numeric, 31200000::numeric, 'ecart',
           'Exemple : le recoupement des tiers dépasse le déclaré, écart à expliquer.',   -6),
          ('2026-03', 'manuel',  62, 28500000::numeric, 27300000::numeric, 'a_verifier',
           'Exemple : rapprochement manuel enregistré, reste à confirmer par l''agent.',  -1)
       ) AS x(periode, type_rapprochement, score, declare, recoupe, statut, motif, j_rapprochement)
    ON x.periode = d.periode
  JOIN public.recoupements rec
    ON rec.id_contribuable = d.id_contribuable AND rec.periode = x.periode;

COMMIT;

-- ---------------------------------------------------------------------
-- 7. Contrôle : les pièces que la file de travail est censée lire aujourd'hui.
-- ---------------------------------------------------------------------
SELECT c.nif, c.raison_sociale, d.periode, d.statut,
       d.date_notification_primitive::date AS primitive,
       d.date_limite_reponse::date AS limite_reponse,
       (d.date_limite_reponse::date - CURRENT_DATE) AS jours_restants,
       r.type_relance, r.date_emission::date AS emission,
       rp.statut AS statut_rapprochement, rp.ecart,
       rec.reference AS recoupement, rec.somme_recoupee
  FROM public.contribuables c
  LEFT JOIN public.declarations d ON d.id_contribuable = c.id_contribuable
  LEFT JOIN public.relances r ON r.id_contribuable = c.id_contribuable
  LEFT JOIN public.rapprochements rp ON rp.id_declaration = d.id_declaration
  LEFT JOIN public.recoupements rec ON rec.id_recoupement = rp.id_recoupement
 WHERE c.nif IN ('9500000001', '9500000002', '9500000003')
 ORDER BY c.nif, d.periode, r.date_emission;

-- ---------------------------------------------------------------------
-- PURGE — exécuter seul ce bloc pour retirer les exemples de la base.
-- ---------------------------------------------------------------------
-- BEGIN;
-- DELETE FROM public.rapprochements
--  WHERE id_declaration IN (
--    SELECT id_declaration FROM public.declarations
--     WHERE id_contribuable IN (
--       SELECT id_contribuable FROM public.contribuables
--        WHERE nif IN ('9500000001', '9500000002', '9500000003')));
-- DELETE FROM public.recoupements
--  WHERE id_contribuable IN (
--    SELECT id_contribuable FROM public.contribuables
--     WHERE nif IN ('9500000001', '9500000002', '9500000003'));
-- DELETE FROM public.relances
--  WHERE id_contribuable IN (
--    SELECT id_contribuable FROM public.contribuables
--     WHERE nif IN ('9500000001', '9500000002', '9500000003'));
-- DELETE FROM public.declarations
--  WHERE id_contribuable IN (
--    SELECT id_contribuable FROM public.contribuables
--     WHERE nif IN ('9500000001', '9500000002', '9500000003'));
-- DELETE FROM public.contribuables
--  WHERE nif IN ('9500000001', '9500000002', '9500000003');
-- COMMIT;
