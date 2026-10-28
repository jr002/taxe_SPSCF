BEGIN;

-- Centre d'affiliation automatique des administrateurs.
-- « SSIF » est la structure porteuse de la plateforme : un compte administrateur
-- y est rattaché d'office, sans que cela borne son périmètre (le rôle `admin`
-- voit tous les centres, voir `src/utils/data-scope.js`).
INSERT INTO public.centres (nom_centre, type_centre, numero_centre, email_centre)
SELECT 'SSIF', 'DGE', 'SSIF', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.centres WHERE nom_centre = 'SSIF' AND type_centre = 'DGE'
);

-- Rattache les administrateurs existants (et rétablit l'affiliation si elle a
-- été perdue, par exemple après la suppression du centre).
UPDATE public.agents
   SET id_centre = (SELECT id_centre FROM public.centres
                     WHERE nom_centre = 'SSIF' AND type_centre = 'DGE'
                     ORDER BY id_centre LIMIT 1)
 WHERE role = 'admin'
   AND id_centre IS DISTINCT FROM (SELECT id_centre FROM public.centres
                                    WHERE nom_centre = 'SSIF' AND type_centre = 'DGE'
                                    ORDER BY id_centre LIMIT 1);

COMMIT;
