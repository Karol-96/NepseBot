import { pgTable, text, serial, integer, decimal, timestamp } from "drizzle-orm/pg-core";
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

// Orders table schema
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull(),
  quantity: integer("quantity").notNull(),
  order_type: text("order_type").notNull(), // "Buy" or "Sell"
  trigger_price_percent: decimal("trigger_price_percent", { precision: 10, scale: 2 }).notNull(),
  submitted_at: timestamp("submitted_at").defaultNow().notNull(),
  // TMS order data (but not credentials)
  tms_order_id: text("tms_order_id"),
  tms_status: text("tms_status"),
  tms_processed_at: timestamp("tms_processed_at")
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  submitted_at: true,
});

// Extended validation for order submission
export const orderFormSchema = insertOrderSchema.extend({
  symbol: z.string().min(1, { message: "Symbol is required" }),
  quantity: z.number().int().positive({ message: "Quantity must be a positive number" }),
  order_type: z.enum(["Buy", "Sell"], { 
    errorMap: () => ({ message: "Please select an order type" })
  }),
  trigger_price_percent: z.number().positive({ message: "Trigger price must be greater than 0%" }),
  // TMS credentials - these won't be stored in the database, only used for API authentication
  tms_username: z.string().min(1, { message: "TMS Username is required" }),
  tms_password: z.string().min(1, { message: "TMS Password is required" })
});

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type OrderFormValues = z.infer<typeof orderFormSchema>;
export type Order = typeof orders.$inferSelect;
