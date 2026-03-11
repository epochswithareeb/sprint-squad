-- Drop old enum values and recreate with only: assigned, wip, closed
-- First update any existing tickets (should be none after data clear)
-- Then alter the enum

-- We need to recreate the enum since Postgres doesn't support removing values
-- 1. Create new enum
CREATE TYPE ticket_status_new AS ENUM ('assigned', 'wip', 'closed');

-- 2. Alter column to use new enum
ALTER TABLE tickets ALTER COLUMN status DROP DEFAULT;
ALTER TABLE tickets ALTER COLUMN status TYPE ticket_status_new USING (
  CASE status::text
    WHEN 'wip' THEN 'wip'::ticket_status_new
    WHEN 'pending' THEN 'assigned'::ticket_status_new
    WHEN 'resolved' THEN 'closed'::ticket_status_new
    WHEN 'closed' THEN 'closed'::ticket_status_new
  END
);
ALTER TABLE tickets ALTER COLUMN status SET DEFAULT 'assigned'::ticket_status_new;

-- 3. Drop old enum and rename
DROP TYPE ticket_status;
ALTER TYPE ticket_status_new RENAME TO ticket_status;

-- Remove resolved_at column since we no longer have a resolved state
ALTER TABLE tickets DROP COLUMN IF EXISTS resolved_at;