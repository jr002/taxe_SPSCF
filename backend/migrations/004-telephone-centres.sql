BEGIN;

ALTER TABLE centres
  ADD COLUMN IF NOT EXISTS telephone_centre VARCHAR(30);

UPDATE centres
SET telephone_centre = CASE numero_centre
  WHEN 'CF-ANT-001' THEN '+261 20 22 123 45'
  WHEN 'SRE-ANT-001' THEN '+261 20 22 234 56'
  WHEN 'DGE-ANT-001' THEN '+261 20 22 345 67'
  WHEN 'CF-TMM-001' THEN '+261 20 53 456 78'
  ELSE telephone_centre
END
WHERE numero_centre IN ('CF-ANT-001', 'SRE-ANT-001', 'DGE-ANT-001', 'CF-TMM-001')
  AND telephone_centre IS NULL;

COMMIT;