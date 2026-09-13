CREATE UNIQUE INDEX IF NOT EXISTS "Invitation_pending_email_lower_key" ON "Invitation"(LOWER("email")) WHERE "status" = 'PENDING';
