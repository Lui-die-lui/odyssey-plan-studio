require("dotenv/config");

const { Client } = require("pg");

const EMAIL = "invader1569@gmail.com";

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("Missing DATABASE_URL env var.");
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const enumCheck = await client.query(
    `SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserRole') AS exists;`,
  );

  const exists = enumCheck.rows?.[0]?.exists;
  if (!exists) {
    await client.query(`CREATE TYPE "UserRole" AS ENUM ('USER','ADMIN');`);
    // eslint-disable-next-line no-console
    console.log("Created enum type: UserRole");
  } else {
    // eslint-disable-next-line no-console
    console.log("Enum already exists: UserRole");
  }

  await client.query(
    `ALTER TABLE "User"
     ADD COLUMN IF NOT EXISTS "role" "UserRole" NOT NULL DEFAULT 'USER',
     ADD COLUMN IF NOT EXISTS "aiBlocked" BOOLEAN NOT NULL DEFAULT false,
     ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP(3);`,
  );

  const upd = await client.query(
    `UPDATE "User" SET role = $1 WHERE email = $2;`,
    ["ADMIN", EMAIL],
  );

  // eslint-disable-next-line no-console
  console.log("Updated rows:", upd.rowCount);

  const res = await client.query(
    `SELECT id, email, role, "aiBlocked" FROM "User" WHERE email = $1;`,
    [EMAIL],
  );

  // eslint-disable-next-line no-console
  console.log("Result rows:", res.rows);

  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

