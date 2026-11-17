-- Per-device logout: a token that has been signed out must stop working before
-- its 7-day expiry, without killing the user's other devices (a token_version bump
-- would do that). Rows are pruned by the same INSERT that adds one.
CREATE TABLE session_revocations (
  jti text PRIMARY KEY,
  expires_at timestamptz NOT NULL
);
CREATE INDEX session_revocations_expiry_idx ON session_revocations (expires_at);
