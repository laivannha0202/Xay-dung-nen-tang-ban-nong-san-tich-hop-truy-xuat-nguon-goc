-- Demo catalogue had wholesale-style prices (Gạo ST25 150.000₫/kg, nếp 95.000₫/kg) and sold
-- liquids by the litre while every retail reference sells a 500 ml bottle. Prices below come from
-- the 2026-11-19 survey recorded in docs/final-acceptance/financial-data/PRODUCT_PRICE_RESEARCH.md.
-- Historical order lines keep their own unit_price_vnd snapshot, so no past bill changes.
-- Gạo ST25 (Sóc Trăng) and mật ong rừng (Cà Mau) sat on the Đà Lạt greenhouse farm, so their
-- passports named Lâm Đồng as the origin. Create the real origin farms, then move the seasons.
-- These farms are illustrative: `is_demo` says so, and no invented manager name/phone is written.
-- `supplier_id` is NOT NULL, so the insert is skipped on a database with no supplier at all
-- (fresh install — there are no seasons to repoint either).
INSERT INTO farms (supplier_id, name, province, district, commune, address_detail, latitude, longitude, area_ha, crops, manager_name, manager_phone, is_demo)
SELECT (SELECT id FROM suppliers ORDER BY code LIMIT 1), 'Ruộng lúa Sóc Trăng','Sóc Trăng','Mỹ Xuyên','Xã Đại Tâm','Ấp Đại Tâm',9.5667,105.9833,12,'Lúa ST25','','',true
 WHERE EXISTS (SELECT 1 FROM suppliers) AND NOT EXISTS (SELECT 1 FROM farms WHERE name = 'Ruộng lúa Sóc Trăng');
INSERT INTO farms (supplier_id, name, province, district, commune, address_detail, latitude, longitude, area_ha, crops, manager_name, manager_phone, is_demo)
SELECT (SELECT id FROM suppliers ORDER BY code LIMIT 1), 'Rừng tràm U Minh Hạ','Cà Mau','U Minh','Xã Khánh Thuận','Ấp Vàm Đình',9.35,104.95,5,'Mật ong rừng tràm','','',true
 WHERE EXISTS (SELECT 1 FROM suppliers) AND NOT EXISTS (SELECT 1 FROM farms WHERE name = 'Rừng tràm U Minh Hạ');

-- The demo seeder had already created both farms with a fabricated manager ("Trương Văn Lộc",
-- "Trần Văn Sáu") and a made-up phone. Clear that pair only when it still matches exactly what the
-- seeder wrote, so a manager an operator has since corrected is never overwritten.
UPDATE farms SET manager_name='', manager_phone='', is_demo=true
 WHERE (name='Ruộng lúa Sóc Trăng' AND manager_name='Trương Văn Lộc' AND manager_phone='0913666777')
    OR (name='Rừng tràm U Minh Hạ' AND manager_name='Trần Văn Sáu' AND manager_phone='0913888999');

-- Guarded so a missing farm can never blank `farm_id` (NOT NULL): the season keeps its lot history.
UPDATE crop_seasons s SET farm_id = (SELECT id FROM farms WHERE name = 'Ruộng lúa Sóc Trăng')
 WHERE s.code = 'SS-2026-0005' AND EXISTS (SELECT 1 FROM farms WHERE name = 'Ruộng lúa Sóc Trăng');
UPDATE crop_seasons s SET farm_id = (SELECT id FROM farms WHERE name = 'Rừng tràm U Minh Hạ')
 WHERE s.code = 'SS-2026-0006' AND EXISTS (SELECT 1 FROM farms WHERE name = 'Rừng tràm U Minh Hạ');

-- "SP-DUAHẠU" mixed a precomposed Ạ into an SKU that is otherwise plain ASCII.
UPDATE products SET sku = 'SP-DUABO' WHERE sku = 'SP-DUAHẠU';
-- Season and lot codes are derived from the SKU, so they move with it; a duplicate lot created by
-- re-running the seeder under the new SKU is left for the operator to reconcile (no order rows).
UPDATE crop_seasons SET code = 'SS-DEMO-DUABO' WHERE code = 'SS-DEMO-DUAHẠU';
UPDATE batches SET code = 'LO-DEMO-DUABO' WHERE code = 'LO-DEMO-DUAHẠU';
UPDATE products SET base_price_vnd = 38000
 WHERE sku = 'SP-GAOST25';
UPDATE products SET base_price_vnd = 37000
 WHERE sku = 'SP-GAONEP';
UPDATE products SET base_price_vnd = 32000
 WHERE sku = 'SP-GAOLUT';
UPDATE products SET base_price_vnd = 26000
 WHERE sku = 'SP-GAOJA';
UPDATE products SET base_price_vnd = 95000
 WHERE sku = 'SP-HATDIEU';
UPDATE products SET base_price_vnd = 15000
 WHERE sku = 'SP-NAMKIM';
UPDATE products SET base_price_vnd = 65000
 WHERE sku = 'SP-NAMHUONG';
UPDATE products SET base_price_vnd = 55000
 WHERE sku = 'SP-NAMGIA';
UPDATE products SET base_price_vnd = 13000
 WHERE sku = 'SP-MONGTOI';
UPDATE products SET base_price_vnd = 85000
 WHERE sku = 'SP-BANHDAUX';

-- 500 ml bottle is the retail unit for honey; "lít" made a 1-litre bottle the implicit default.
UPDATE products
   SET unit = 'chai',
       description = description || ' Chai 500 ml.',
       base_price_vnd = 165000
 WHERE sku = 'SP-MATONGNHAN' AND unit <> 'chai';
UPDATE products
   SET unit = 'chai',
       description = description || ' Chai 500 ml.',
       base_price_vnd = 45000
 WHERE sku = 'SP-TUONGBAN' AND unit <> 'chai';
UPDATE products
   SET unit = 'chai',
       description = description || ' Chai 500 ml.',
       base_price_vnd = 190000
 WHERE sku = 'SP-MATONG' AND unit <> 'chai';

-- Pack sizes belong in the description; the seed said "Gói 500 g" nowhere.
UPDATE products SET description = description || ' Gói 500 g.'
 WHERE sku = 'SP-YENMACH' AND description NOT LIKE '%Gói 500 g%';
UPDATE products SET description = description || ' Hộp 250 g.'
 WHERE sku = 'SP-HATDIEU' AND description NOT LIKE '%Hộp 250 g%';
UPDATE products SET description = description || ' Gói 150 g.'
 WHERE sku = 'SP-NAMKIM' AND description NOT LIKE '%Gói 150 g%';

-- Slug `mong-toi` named mồng tơi for a rau muống product, so the URL contradicted the page.
-- The SKU and every batch/order key stay put; only the public URL changes.
UPDATE products SET slug = 'rau-muong-bo'
 WHERE sku = 'SP-MONGTOI' AND slug = 'mong-toi';
UPDATE product_images SET url = '/images/products/rau-muong-bo.jpg'
 WHERE url = '/images/products/mong-toi.jpg';

-- Mushrooms and processed specialties were attached to "Vườn cam Khoái Châu" (an orange orchard).
-- Point each lot at the demo facility that actually produces it; batch/order ids are untouched.
WITH fac AS (
  SELECT id, crops FROM farms WHERE name IN (
    'Trang trại nấm Hưng Yên (demo)', 'Cơ sở chế biến đặc sản Hưng Yên (demo)'
  )
)
UPDATE crop_seasons s
   SET farm_id = (SELECT id FROM fac WHERE crops LIKE 'Nấm%')
 WHERE s.code IN ('SS-DEMO-NAMKIM', 'SS-DEMO-NAMHUONG', 'SS-DEMO-NAMGIA')
   AND EXISTS (SELECT 1 FROM fac WHERE crops LIKE 'Nấm%');

UPDATE crop_seasons s
   SET farm_id = (SELECT id FROM farms WHERE name = 'Cơ sở chế biến đặc sản Hưng Yên (demo)')
 WHERE s.code IN ('SS-DEMO-MATONGNHAN', 'SS-DEMO-TUONGBAN', 'SS-DEMO-BANHDAUX')
   AND EXISTS (SELECT 1 FROM farms WHERE name = 'Cơ sở chế biến đặc sản Hưng Yên (demo)');

-- Origin notes named districts the linked (Khoái Châu) farm does not sit in.
UPDATE products SET origin_note = 'Khoái Châu, Hưng Yên.'
 WHERE sku IN ('SP-NHANLONG', 'SP-CHUOIGIA', 'SP-DUAHẠU', 'SP-DUDU', 'SP-BIDO', 'SP-XALACH')
   AND origin_note LIKE '%Hưng Yên%';

-- Post-merger Hưng Yên has no "Tân Dân" or "Bần Yên Nhân" commune-level unit; the ward dataset
-- (104 units) carries Xã Khoái Châu and Phường Mỹ Hào instead.
UPDATE farms SET commune = 'Xã Khoái Châu' WHERE commune = 'Tân Dân' AND province = 'Hưng Yên';
UPDATE farms SET commune = 'Phường Mỹ Hào' WHERE commune = 'Bần Yên Nhân' AND province = 'Hưng Yên';
