import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "../config/env";
import * as schema from "../models/_index";

// Single shared connection pool for the app.
const client = postgres(env.DATABASE_URL);

export const db = drizzle(client, { schema });
export type DB = typeof db;
export { schema };
