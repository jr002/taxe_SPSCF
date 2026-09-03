-- Donnee de reference : entreprise imposee a l'IS
-- Compatible PostgreSQL et rejouable sans doublon.

BEGIN;

WITH entreprise AS (
    INSERT INTO entreprises (
        nif,
        raison_sociale,
        secteur_activite,
        adresse,
        telephone,
        email,
        regime_fiscal
    ) VALUES (
        '1000000001',
        'Rado',
        'Development de logiciels',
        'Antananarivo, Madagascar',
        '+261 34 00 000 01',
        'contact@rado-is.mg',
        'IS'
    )
    ON CONFLICT (nif) DO UPDATE SET
        raison_sociale = EXCLUDED.raison_sociale,
        secteur_activite = EXCLUDED.secteur_activite,
        adresse = EXCLUDED.adresse,
        telephone = EXCLUDED.telephone,
        email = EXCLUDED.email,
        regime_fiscal = EXCLUDED.regime_fiscal,
        date_modification = NOW()
    RETURNING id_entreprise
)
INSERT INTO declarations (
    id_entreprise,
    annee,
    ca,
    benefice,
    tva_collectee,
    tva_deductible,
    tva_payee,
    tva_theorique,
    statut
)
SELECT
    id_entreprise,
    2026,
    250000000.00,
    50000000.00,
    50000000.00,
    10000000.00,
    40000000.00,
    45000000.00,
    'conforme'
FROM entreprise
ON CONFLICT (id_entreprise, annee) DO UPDATE SET
    ca = EXCLUDED.ca,
    benefice = EXCLUDED.benefice,
    tva_collectee = EXCLUDED.tva_collectee,
    tva_deductible = EXCLUDED.tva_deductible,
    tva_payee = EXCLUDED.tva_payee,
    tva_theorique = EXCLUDED.tva_theorique,
    statut = EXCLUDED.statut,
    date_modification = NOW();

COMMIT;

-- Verification : cette declaration doit apparaitre dans la categorie IS.
SELECT
    e.nif,
    e.raison_sociale,
    e.regime_fiscal,
    d.annee,
    d.ca
FROM entreprises e
JOIN declarations d ON d.id_entreprise = e.id_entreprise
WHERE e.nif = '1000000001';
