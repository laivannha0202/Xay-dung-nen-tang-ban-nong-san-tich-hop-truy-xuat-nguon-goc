-- Codes reserved by the seed (`SS-2026-0001`, `LO-2026-0001`, …) were never added to
-- `code_sequences`, so the first Admin-created season/batch collided with the seed code and
-- returned 500 instead of a new number. Push every sequence up to the highest code in use.
-- Idempotent: it only ever raises `last_value`, and demo codes (`SS-DEMO-…`) never match.
INSERT INTO code_sequences (kind, year, last_value)
SELECT k.kind, k.year, MAX(k.val)
  FROM (
        SELECT 'season' AS kind, substring(code FROM 4 FOR 4)::int AS year, substring(code FROM 9)::int AS val
          FROM crop_seasons WHERE code ~ '^SS-[0-9]{4}-[0-9]+$'
        UNION ALL
        SELECT 'batch', substring(code FROM 4 FOR 4)::int, substring(code FROM 9)::int
          FROM batches WHERE code ~ '^LO-[0-9]{4}-[0-9]+$'
        UNION ALL
        SELECT 'order', substring(code FROM 5 FOR 4)::int, substring(code FROM 10)::int
          FROM orders WHERE code ~ '^AGM-[0-9]{4}-[0-9]+$'
        UNION ALL
        SELECT 'complaint', substring(code FROM 4 FOR 4)::int, substring(code FROM 9)::int
          FROM complaints WHERE code ~ '^KN-[0-9]{4}-[0-9]+$'
       ) k
 GROUP BY k.kind, k.year
ON CONFLICT (kind, year) DO UPDATE SET last_value = GREATEST(code_sequences.last_value, EXCLUDED.last_value);
