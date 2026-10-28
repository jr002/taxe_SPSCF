BEGIN;

-- Rattachement fiscal textuel des contribuables.
--
-- `contribuables.id_centre` (table `centres`) et `contribuables.centre_fiscal_ref`
-- (référentiel `unitefiscal.json`, format `cle:nom`) décrivent le même
-- rattachement : la première porte le périmètre des agents, la seconde alimente
-- les pages « unité fiscale ». Jusqu'ici aucune écriture ne renseignait la
-- seconde, si bien qu'un dossier rattaché à un centre restait invisible dans le
-- référentiel. L'application les dérive désormais l'une de l'autre à chaque
-- écriture (`src/models/contribuable.model.js`) ; ce script rattrape l'existant.

-- 1. Orthographe : `centre_fiscal_ref` n'accepte que les noms exacts du
--    référentiel (`isValidCentreFiscalRef`). Quatre centres enregistrés en base
--    s'en écartaient et n'auraient donc jamais pu être dérivés.
UPDATE public.centres SET nom_centre = 'CF Fénérive-Est'
 WHERE type_centre = 'Centre Fiscal' AND nom_centre = 'CF Fenerive-Est';
UPDATE public.centres SET nom_centre = 'CF Belon''i Tsiribihina'
 WHERE type_centre = 'Centre Fiscal' AND nom_centre = 'CF Belo Tsiribihina';
UPDATE public.centres SET nom_centre = 'CF Vohémar'
 WHERE type_centre = 'Centre Fiscal' AND nom_centre = 'CF Vohemar';
UPDATE public.centres SET nom_centre = 'CF Port-Bergé'
 WHERE type_centre = 'Centre Fiscal' AND nom_centre = 'CF Port-Berge';

-- 2. Dérivation pour les dossiers déjà rattachés à un centre. Les types
--    `Centre Fiscal` et `SRE` sont les seuls dont chaque `nom_centre` existe
--    dans le référentiel ; le centre `SSIF` (type `DGE`) est l'affiliation
--    administrative des comptes et n'a pas d'unité fiscale équivalente.
UPDATE public.contribuables c
   SET centre_fiscal_ref = u.cle || ':' || ct.nom_centre
  FROM public.centres ct
  JOIN (VALUES
          ('Centre Fiscal', 'centres_fiscaux'),
          ('SRE', 'sre')
       ) AS u(type_centre, cle) ON u.type_centre = ct.type_centre
 WHERE c.id_centre = ct.id_centre
   AND (c.centre_fiscal_ref IS NULL OR c.centre_fiscal_ref = '');

COMMIT;
