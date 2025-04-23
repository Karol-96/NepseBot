import { pgTable, serial, text, timestamp, numeric, boolean } from 'drizzle-orm/pg-core';

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Orders table
export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  userId: serial('user_id').references(() => users.id),
  symbol: text('symbol').notNull(),
  quantity: numeric('quantity').notNull(),
  orderType: text('order_type').notNull(), // 'BUY' or 'SELL'
  price: numeric('price'),
  status: text('status').notNull().default('PENDING'), // 'PENDING', 'COMPLETED', 'CANCELLED'
  
  // Trigger-specific fields
  isTriggerOrder: boolean('is_trigger_order').default(false),
  triggerType: text('trigger_type'), // 'ABOVE' or 'BELOW'
  triggerPrice: numeric('trigger_price'),
  triggerPercentage: numeric('trigger_percentage'),
  basePrice: numeric('base_price'),
  targetPrice: numeric('target_price'),
  triggerStatus: text('trigger_status'), // 'PENDING', 'TRIGGERED', 'COMPLETED', 'CANCELLED'
  lastChecked: timestamp('last_checked'),
  triggeredAt: timestamp('triggered_at'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});