import * as dotenv from 'dotenv';
dotenv.config();

// Check if DATABASE_URL is loaded
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set in environment variables. Check your .env file.");
  process.exit(1);
}

console.log("Environment variables loaded successfully");