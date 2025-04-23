import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const MAX_RETRIES = 5;
const RETRY_DELAY = 5000; // 5 seconds

async function createPool() {
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      console.log('Creating database pool...');
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        connectionTimeoutMillis: 10000, // 10 seconds
        idleTimeoutMillis: 30000, // 30 seconds
      });

      console.log('Testing database connection...');
      await pool.query('SELECT 1');
      console.log('Database connection test successful');
      return pool;
    } catch (error) {
      console.error(`Database connection attempt ${i + 1}/${MAX_RETRIES} failed:`, error);
      if (i === MAX_RETRIES - 1) {
        console.error('All connection attempts failed');
        throw error;
      }
      console.log(`Waiting ${RETRY_DELAY/1000} seconds before next attempt...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    }
  }
  throw new Error('Failed to connect to database after multiple retries');
}

let pool: Pool;

export async function initDb() {
  if (!pool) {
    pool = await createPool();
  }
  return drizzle(pool, { schema });
}

export const getDb = () => {
  if (!pool) throw new Error('Database not initialized. Call initDb() first.');
  return drizzle(pool, { schema });
};