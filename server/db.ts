import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// Ensure we have a database URL available
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Initialize postgres-js client with proper configuration
const client = postgres(process.env.DATABASE_URL, {
  max: 1,
  idle_timeout: 20,
  max_lifetime: 60 * 30, // 30 minutes
});

// Initialize drizzle ORM with the postgres-js client
export const db = drizzle(client);
