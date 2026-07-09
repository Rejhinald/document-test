import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { env, isProd } from "../config/env";

// Dedicated single-connection client for running migrations.
// SSL in production for Railway's postgres-ssl image (self-signed cert).
const migrationClient = postgres(env.DATABASE_URL, {
  max: 1,
  ...(isProd ? { ssl: { rejectUnauthorized: false } } : {}),
});

console.log("Running migrations…");
await migrate(drizzle(migrationClient), { migrationsFolder: "./db/migrations" });
await migrationClient.end();
console.log("✅ Migrations applied.");
