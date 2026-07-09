import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./models/_index.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
