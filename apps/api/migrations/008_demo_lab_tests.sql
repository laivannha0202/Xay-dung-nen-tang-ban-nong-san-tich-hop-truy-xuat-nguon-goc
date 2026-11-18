-- Demo seeders create lots that are sold on the storefront, so the publish invariant demands an
-- effective PASS lab test (same rule the API enforces). That test is fabricated demo data, so it
-- is flagged here and every surface renders it as illustrative — never as a real certificate.
ALTER TABLE lab_tests ADD COLUMN is_demo boolean NOT NULL DEFAULT false;
