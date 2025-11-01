import { config } from "dotenv";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

config({ path: ".env.local" });

const connectionString = process.env.DATABASE_URL || "";

export const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client);
