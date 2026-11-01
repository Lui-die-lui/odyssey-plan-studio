require("dotenv/config");

const { Client } = require("pg");

const EMAIL = "invader1569@gmail.com";

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("Missing DATABASE_URL env var.");
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  // Qualify explicitly: this project's DB may be shared with another app's "User" table.
  const schema = new URL(process.env.DATABASE_URL).searchParams.get("schema") ?? "public";
  const userTable = `${client.escapeIdentifier(schema)}."User"`;

  await client.query(
    `UPDATE ${userTable} SET role = $1 WHERE email = $2;`,
    ["ADMIN", EMAIL],
  );

  await client.query(
    `SELECT id, email, role, "aiBlocked" FROM ${userTable} WHERE email = $1;`,
    [EMAIL],
  );

  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

