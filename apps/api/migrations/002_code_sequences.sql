-- Human-readable document codes must never be derived from COUNT(*): a cancelled
-- order or a deleted row makes the next count collide with an existing UNIQUE code.
-- One row per (kind, year) is bumped atomically inside the caller's transaction.
CREATE TABLE code_sequences (
  kind text NOT NULL,
  year int NOT NULL,
  last_value int NOT NULL DEFAULT 0,
  PRIMARY KEY (kind, year)
);

-- Backfill from whatever codes already exist so live data keeps its numbering.
INSERT INTO code_sequences (kind, year, last_value)
SELECT 'order', EXTRACT(year FROM placed_at)::int, MAX(substring(code FROM '[0-9]+$')::int)
  FROM orders
 GROUP BY 1, 2;

INSERT INTO code_sequences (kind, year, last_value)
SELECT 'complaint', EXTRACT(year FROM created_at)::int, MAX(substring(code FROM '[0-9]+$')::int)
  FROM complaints
 WHERE code ~ '^KN-[0-9]{4}-[0-9]+$'
 GROUP BY 1, 2;
