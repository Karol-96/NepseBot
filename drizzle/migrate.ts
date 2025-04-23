import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { initDb } from './client';

async function main() {
  console.log('Initializing database connection...');
  
  const db = await initDb();
  
  console.log('Running migrations...');
  await migrate(db, { migrationsFolder: './drizzle/migrations' });
  
  console.log('Migrations completed!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Migration failed!');
  console.error(err);
  process.exit(1);
});