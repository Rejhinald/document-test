import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env, isProd } from "../config/env";
import * as schema from "../models/_index";

// Railway's postgres-ssl image negotiates SSL with a self-signed cert, so in
// production connect over SSL without cert verification. Local docker Postgres
// has no SSL, so connect in plaintext during development/test.
const client = postgres(env.DATABASE_URL, isProd ? { ssl: { rejectUnauthorized: false } } : {});

export const db = drizzle(client, { schema });
export type DB = typeof db;
export { schema };
