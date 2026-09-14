// Reassigns valid UUID ids to users whose id is not a UUID (e.g. manually imported rows).
// Idempotent: safe to run on any database, including production.
//
// Usage (set DATABASE_URL to the target database BEFORE dotenv loads; dotenv
// does not override an existing environment variable):
//   PowerShell:
//     $env:DATABASE_URL="postgres://<prod-url>"; node scripts/fix-user-uuids.cjs
//   bash:
//     DATABASE_URL="postgres://<prod-url>" node scripts/fix-user-uuids.cjs
//
// All FKs referencing "User" use ON UPDATE CASCADE, so child rows are updated
// automatically. Two locations have no FK and are updated explicitly:
//   * "AdministrativeActivity"."targetId" (free text, targetType = 'USER')
//   * "Product"."metadata" -> author.id (denormalized JSONB copy of the author user id)

require("dotenv").config();

const crypto = require("crypto");
const path = require("path");
const { PrismaClient } = require(path.join(__dirname, "..", "generated", "prisma"));
const { PrismaPg } = require("@prisma/adapter-pg");

if (!process.env.DATABASE_URL) {
  console.error("ERR: DATABASE_URL is not set.");
  process.exit(1);
}

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const UUID_RE =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

async function main() {
  const host = new URL(process.env.DATABASE_URL).host;
  console.log(`Target database host: ${host}`);

  const users = await db.user.findMany({
    select: { id: true, email: true, firstName: true, lastName: true },
  });
  const bad = users.filter((u) => !UUID_RE.test(u.id));

  if (bad.length === 0) {
    console.log("No invalid user ids found. Nothing to do.");
    return;
  }

  console.log(`Fixing ${bad.length} user(s):`);
  for (const user of bad) {
    const newId = crypto.randomUUID();
    await db.$transaction([
      db.$executeRaw`UPDATE "User" SET "id" = ${newId}, "email" = btrim("email") WHERE "id" = ${user.id}`,
      db.$executeRaw`UPDATE "AdministrativeActivity" SET "targetId" = ${newId} WHERE "targetType" = 'USER' AND "targetId" = ${user.id}`,
      db.$executeRaw`UPDATE "Product" SET "metadata" = jsonb_set("metadata", '{author,id}', to_jsonb(${newId}::text)) WHERE "metadata"->'author'->>'id' = ${user.id}`,
    ]);
    console.log(
      `  ${user.id} -> ${newId}  (email: ${(user.email ?? "").trim() || "-"})`,
    );
  }
  console.log("Done.");
}

main()
  .catch((e) => {
    console.error("ERR", e.message);
    process.exit(1);
  })
  .finally(() => db.$disconnect());