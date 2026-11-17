-- Rows created by the demo seeders are flagged so the UI can label them. Real rows
-- stay false: the seeders only touch rows they own, never a blanket UPDATE.
ALTER TABLE products ADD COLUMN is_demo boolean NOT NULL DEFAULT false;
ALTER TABLE farms ADD COLUMN is_demo boolean NOT NULL DEFAULT false;
ALTER TABLE suppliers ADD COLUMN is_demo boolean NOT NULL DEFAULT false;
ALTER TABLE batches ADD COLUMN is_demo boolean NOT NULL DEFAULT false;
ALTER TABLE orders ADD COLUMN is_demo boolean NOT NULL DEFAULT false;
ALTER TABLE reviews ADD COLUMN is_demo boolean NOT NULL DEFAULT false;
ALTER TABLE complaints ADD COLUMN is_demo boolean NOT NULL DEFAULT false;
