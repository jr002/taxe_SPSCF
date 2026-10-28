BEGIN;

-- La demande d'éclaircissements et de justifications (CPF Art. V-17) est un acte
-- émis envers le contribuable au même titre qu'un rappel : elle est stockée dans
-- `relances` et son type doit être accepté par la contrainte de domaine.
ALTER TABLE relances
  DROP CONSTRAINT IF EXISTS relances_type_relance_check;

ALTER TABLE relances
  ADD CONSTRAINT relances_type_relance_check
  CHECK (type_relance IN ('rappel1', 'rappel2', 'mise_en_demeure', 'demande_eclaircissement'));

COMMIT;
