-- Databases that applied 013 before it was corrected still hold the illustrative Sóc Trăng / Cà Mau
-- origin farms with an invented manager ("Trương Văn Lộc", "Trần Văn Sáu") and a made-up phone.
-- Clear that pair only while it still matches exactly what the seeder wrote, so a real manager an
-- operator has since entered is never overwritten. `is_demo` marks the rows as illustrative.
-- Nothing else changes: `crop_seasons.farm_id`, lots and order history stay as they are.
UPDATE farms SET manager_name='', manager_phone='', is_demo=true
 WHERE (name='Ruộng lúa Sóc Trăng' AND manager_name='Trương Văn Lộc' AND manager_phone='0913666777')
    OR (name='Rừng tràm U Minh Hạ' AND manager_name='Trần Văn Sáu' AND manager_phone='0913888999');

-- Demo farms written by `demo-farms.ts` shared one fabricated phone number. Same guard: only the
-- exact seeded pair is cleared.
UPDATE farms SET manager_phone=''
 WHERE is_demo AND manager_name='Bộ phận kỹ thuật' AND manager_phone='0912555777';
