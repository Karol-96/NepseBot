import { users, type User, type InsertUser, orders, type Order, type InsertOrder } from "@shared/schema";
import { db } from "./db";
import { eq, and, or } from "drizzle-orm";

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Orders methods
  createOrder(order: InsertOrder): Promise<Order>;
  getOrders(): Promise<Order[]>;
  getOrder(id: number): Promise<Order | undefined>;
  
  // Trigger order methods
  getTriggerOrders(): Promise<Order[]>;
  getPendingTriggerOrders(): Promise<Order[]>;
  updateOrderStatus(id: number, status: string): Promise<Order>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const [order] = await db
      .insert(orders)
      .values(insertOrder)
      .returning();
    return order;
  }

  async getOrders(): Promise<Order[]> {
    // Fetch orders sorted by most recent first
    return await db.select().from(orders).orderBy(orders.submitted_at);
  }

  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order || undefined;
  }
  
  async getTriggerOrders(): Promise<Order[]> {
    // Fetch only trigger orders, sorted by most recent first
    return await db
      .select()
      .from(orders)
      .where(eq(orders.is_trigger_order, true))
      .orderBy(orders.submitted_at);
  }
  
  async getPendingTriggerOrders(): Promise<Order[]> {
    // Fetch only trigger orders in PENDING or MONITORING status
    return await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.is_trigger_order, true),
          or(
            eq(orders.trigger_status, 'PENDING'),
            eq(orders.trigger_status, 'MONITORING')
          )
        )
      )
      .orderBy(orders.submitted_at);
  }
  
  async updateOrderStatus(id: number, status: string): Promise<Order> {
    // Update order status and return the updated order
    const [updatedOrder] = await db
      .update(orders)
      .set({ trigger_status: status })
      .where(eq(orders.id, id))
      .returning();
      
    if (!updatedOrder) {
      throw new Error(`Order with ID ${id} not found`);
    }
    
    return updatedOrder;
  }
}

export const storage = new DatabaseStorage();
