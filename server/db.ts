import { drizzle } from "drizzle-orm/neon-serverless";
import { neon, neonConfig } from "@neondatabase/serverless";

// Ensure we have a database URL available
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Configure neon client for server-side usage
neonConfig.fetchConnectionCache = true;

// Initialize neon client
const sql = neon(process.env.DATABASE_URL);

// Initialize drizzle ORM
export const db = drizzle(sql);
