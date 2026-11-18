-- Diacritic-insensitive folding in SQL, mirroring services/serviceArea.ts#normalizeVi.
-- One function so catalogue and admin searches accept "ca chua" for "cà chua" without a
-- denormalised column (the catalogue is small; a sequential scan is fine).
CREATE OR REPLACE FUNCTION vi_norm(t text) RETURNS text
LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE AS $$
  SELECT btrim(regexp_replace(
    translate(lower(t),
      'aàảãạăắằẳẵặâấầẩẫậeéèẻẽẹêếềểễệiíìỉĩịoóòỏõọôốồổỗộơớờởỡợuúùủũụưứừửữựyýỳỷỹỵđ',
      'aaaaaaaaaaaaaaaaaeeeeeeeeeeiiiiiioooooooooooooooooouuuuuuuuuuuuyyyyyyd'),
    '\s+', ' ', 'g'))
$$;

-- Default low-stock threshold used by the warehouse screen (hours of typing saved:
-- one editable number instead of a per-product column nobody maintains).
INSERT INTO settings (key, value) VALUES ('low_stock_threshold', '10')
ON CONFLICT (key) DO NOTHING;
