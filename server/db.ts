import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as dotenv from "dotenv";

// Load environment variables directly in this file too
dotenv.config();

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error("DATABASE_URL environment variable is required");
  console.error("Current environment variables:", process.env);
  throw new Error("DATABASE_URL environment variable is required");
}

console.log("Connecting to database:", dbUrl.replace(/:.*@/, ':***@')); // Hide password in logs

// Initialize postgres-js client with proper configuration
const client = postgres(dbUrl, {
  max: 1,
  idle_timeout: 20,
  max_lifetime: 60 * 30, // 30 minutes
  connect_timeout: 10, // 10 seconds
  onnotice: () => {}, // Suppress notices
});

// Initialize drizzle ORM with the postgres-js client
export const db = drizzle(client);

console.log("Database connection initialized");