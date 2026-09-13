-- Add role lifecycle state and enforce case-insensitive role names.
ALTER TABLE "Role" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
CREATE UNIQUE INDEX "Role_name_lower_key" ON "Role" (LOWER("name"));
