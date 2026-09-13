CREATE TABLE "AdministrativeActivity" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "outcome" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdministrativeActivity_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AdministrativeActivity_actorId_idx" ON "AdministrativeActivity"("actorId");
CREATE INDEX "AdministrativeActivity_targetType_targetId_createdAt_idx" ON "AdministrativeActivity"("targetType", "targetId", "createdAt");
CREATE INDEX "AdministrativeActivity_createdAt_idx" ON "AdministrativeActivity"("createdAt");
ALTER TABLE "AdministrativeActivity" ADD CONSTRAINT "AdministrativeActivity_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
