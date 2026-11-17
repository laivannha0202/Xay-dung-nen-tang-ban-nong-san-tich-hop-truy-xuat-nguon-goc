-- Presentation-only: category tiles need a stable picture even when every product
-- in the category is temporarily out of stock.
ALTER TABLE categories ADD COLUMN image_url text;
