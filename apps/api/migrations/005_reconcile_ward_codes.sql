-- Reconcile the five commune codes that QD 19/2025 (Phụ lục II) submits to the Ministry.
-- 004_service_area.sql now inserts the canonical codes directly and contains no rename,
-- so this migration only repairs databases that applied the earlier 004 (legacy code in use),
-- were fixed by hand (canonical code), or ended up with both rows.
-- The canonical row is created first, addresses are repointed, enable/disable state is merged
-- (a disabled legacy unit stays disabled), then the legacy row is dropped.
-- Order snapshots (orders.address_snapshot) are historical text: never rewritten.

DO $$
DECLARE
  pair text[];
  legacy text;
  canonical text;
BEGIN
  FOREACH pair SLICE 1 IN ARRAY ARRAY[
    ['12004','11986'],  -- Xã Như Quỳnh
    ['12073','12052'],  -- Xã Yên Mỹ
    ['12223','12220'],  -- Xã Triệu Việt Vương
    ['12583','12478'],  -- Xã Tân Tiến
    ['12916','12841']   -- Xã Bắc Thái Ninh
  ] LOOP
    legacy := pair[1];
    canonical := pair[2];

    INSERT INTO wards (code, province_code, name, type, search_text, dataset_version, source,
                       source_checked_at, in_service_area, disabled_at, disabled_by, updated_at)
    SELECT canonical, province_code, name, type, search_text, dataset_version, source,
           source_checked_at, in_service_area, disabled_at, disabled_by, now()
      FROM wards WHERE code = legacy
    ON CONFLICT (code) DO NOTHING;

    -- Repoint saved customer addresses before the legacy row disappears.
    UPDATE addresses SET ward_code = canonical WHERE ward_code = legacy;

    IF EXISTS (SELECT 1 FROM wards WHERE code = legacy) THEN
      UPDATE wards w
         SET in_service_area = w.in_service_area AND old.in_service_area,
             disabled_at = COALESCE(w.disabled_at, old.disabled_at),
             disabled_by = COALESCE(w.disabled_by, old.disabled_by),
             updated_at = now()
        FROM wards old
       WHERE w.code = canonical AND old.code = legacy;
      DELETE FROM wards WHERE code = legacy;
    END IF;
  END LOOP;
END
$$;

-- Any address still pointing at an obsolete code is unreachable at checkout: flag it.
UPDATE addresses a SET needs_confirmation = true
 WHERE a.ward_code IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM wards w WHERE w.code = a.ward_code);
