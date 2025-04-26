import { pgTable, text, serial, integer, decimal, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Trigger status enum for type safety
export const TRIGGER_STATUS = {
  PENDING: 'PENDING',
  MONITORING: 'MONITORING',
  TRIGGERED: 'TRIGGERED',
  EXECUTED: 'EXECUTED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED'
} as const;

export type TriggerStatus = typeof TRIGGER_STATUS[keyof typeof TRIGGER_STATUS];

// Orders table schema
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull(),
  quantity: integer("quantity").notNull(),
  order_type: text("order_type").notNull(), // "Buy" or "Sell"
  trigger_price_percent: decimal("trigger_price_percent", { precision: 10, scale: 2 }).notNull(),
  submitted_at: timestamp("submitted_at").defaultNow().notNull(),
  // New fields for automatic execution
  is_trigger_order: boolean("is_trigger_order").default(false),
  base_price: decimal("base_price", { precision: 10, scale: 2 }),
  target_price: decimal("target_price", { precision: 10, scale: 2 }),
  trigger_status: text("trigger_status").default(TRIGGER_STATUS.PENDING),
  last_checked_at: timestamp("last_checked_at"),
  triggered_at: timestamp("triggered_at"),
  executed_at: timestamp("executed_at"),
  execution_price: decimal("execution_price", { precision: 10, scale: 2 }),
  // TMS order data (but not credentials)
  tms_order_id: text("tms_order_id"),
  tms_status: text("tms_status"),
  tms_processed_at: timestamp("tms_processed_at")
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  submitted_at: true,
  last_checked_at: true,
  triggered_at: true,
  executed_at: true,
  tms_order_id: true,
  tms_status: true,
  tms_processed_at: true
});

// Extended validation for order submission
export const orderFormSchema = insertOrderSchema.extend({
  symbol: z.string().min(1, { message: "Symbol is required" }),
  quantity: z.number().int().positive({ message: "Quantity must be a positive number" }),
  order_type: z.enum(["Buy", "Sell"], { 
    errorMap: () => ({ message: "Please select an order type" })
  }),
  trigger_price_percent: z.number().positive({ message: "Trigger price must be greater than 0%" }),
  is_trigger_order: z.boolean().optional().default(false),
  // TMS credentials - these won't be stored in the database, only used for API authentication
  tms_username: z.string().min(1, { message: "TMS Username is required" }),
  tms_password: z.string().min(1, { message: "TMS Password is required" }),
  broker_number: z.string().min(1, { message: "Broker number is required" })
});

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type OrderFormValues = z.infer<typeof orderFormSchema>;

// Explicit Order interface for frontend use
export interface Order {
  id: number;
  symbol: string;
  quantity: number;
  order_type: string;
  trigger_price_percent: string | number;
  submitted_at: string;
  is_trigger_order: boolean;
  base_price?: string | null;
  target_price?: string | null;
  trigger_status?: string | null;
  last_checked_at?: string | null;
  triggered_at?: string | null;
  executed_at?: string | null;
  execution_price?: string | null;
  tms_order_id?: string | null;
  tms_status?: string | null;
  tms_processed_at?: string | null;
}

// Type for market data from the API
export interface StockData {
  s: string;    // Symbol
  lp: number;   // Last Price
  c: number;    // Percent Change
  q: number;    // Quantity/Volume
}

export interface MarketDataResponse {
  mt: string;
  stock: {
    date: string;
    detail: StockData[];
  };
}

// Type for WebSocket messages
export type WebSocketMessageType = 
  | 'SUBSCRIBE_SYMBOL'
  | 'UNSUBSCRIBE_SYMBOL'
  | 'SUBSCRIBE_ORDER'
  | 'UNSUBSCRIBE_ORDER' 
  | 'PRICE_UPDATE' 
  | 'ORDER_STATUS_UPDATE' 
  | 'TRIGGER_NOTIFICATION'
  | 'CONNECTION_ESTABLISHED'
  | 'SUBSCRIPTION_CONFIRMED'
  | 'ERROR';

export interface WebSocketMessage {
  type: WebSocketMessageType;
  payload: any;
}