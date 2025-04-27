import { pgTable, serial, text, timestamp, numeric, boolean } from 'drizzle-orm/pg-core';

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Orders table
export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  symbol: text('symbol').notNull(),
  quantity: numeric('quantity').notNull(),
  order_type: text('order_type').notNull(),
  trigger_price_percent: numeric('trigger_price_percent'),
  submitted_at: timestamp('submitted_at').defaultNow(),
  is_trigger_order: boolean('is_trigger_order').default(false),
  
  // Base and target prices for trigger orders
  base_price: numeric('base_price'),
  target_price: numeric('target_price'),
  
  // Trigger status tracking
  trigger_status: text('trigger_status'),
  last_checked_at: timestamp('last_checked_at'),
  triggered_at: timestamp('triggered_at'),
  
  // Order execution tracking
  executed_at: timestamp('executed_at'),
  execution_price: numeric('execution_price'),
  
  // TMS order details
  tms_order_id: text('tms_order_id'),
  tms_status: text('tms_status'),
  tms_processed_at: timestamp('tms_processed_at'),
  
// Fix in drizzle/schema.ts
tms_username: text('tms_username'),
tms_password: text('tms_password'),
broker_number: text('broker_number'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});