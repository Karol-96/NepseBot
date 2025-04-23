import { initDb } from './drizzle/client';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './drizzle/schema';

async function init() {
  let retries = 10;
  while (retries > 0) {
    try {
      console.log('Attempting to connect to database...');
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        connectionTimeoutMillis: 5000,
      });
      
      // Test the connection
      await pool.query('SELECT 1');
      console.log('Database connection successful');

      // Initialize Drizzle
      const db = drizzle(pool, { schema });
      
      // Create the migrations table if it doesn't exist
      await pool.query(`
        CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
          id serial PRIMARY KEY,
          hash text NOT NULL,
          created_at timestamptz DEFAULT now()
        );
      `);

      console.log('Running migrations...');
      await migrate(db, { migrationsFolder: './drizzle/migrations' });
      
      console.log('Database initialization complete!');
      await pool.end();
      return;
    } catch (error) {
      console.error('Database connection/migration failed:', error);
      retries -= 1;
      if (retries === 0) {
        console.error('Max retries reached. Exiting.');
        process.exit(1);
      }
      console.log(`Retrying in 5 seconds... (${retries} attempts remaining)`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

init().catch((error) => {
  console.error('Initialization failed:', error);
  process.exit(1);
});