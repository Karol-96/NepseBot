import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertOrderSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // API endpoint to create a new order
  app.post("/api/orders", async (req: Request, res: Response) => {
    try {
      // Validate the request body using zod schema
      const result = insertOrderSchema.safeParse(req.body);
      
      if (!result.success) {
        const errorMessage = fromZodError(result.error).message;
        return res.status(400).json({ message: errorMessage });
      }

      // Create order in the database
      const order = await storage.createOrder(result.data);
      
      return res.status(201).json(order);
    } catch (error) {
      console.error("Error creating order:", error);
      return res.status(500).json({ 
        message: "Failed to create order. Please try again later." 
      });
    }
  });

  // API endpoint to get all orders
  app.get("/api/orders", async (_req: Request, res: Response) => {
    try {
      const orders = await storage.getOrders();
      return res.status(200).json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      return res.status(500).json({ 
        message: "Failed to fetch orders. Please try again later." 
      });
    }
  });

  // API endpoint to get a specific order by ID
  app.get("/api/orders/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }
      
      const order = await storage.getOrder(id);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      return res.status(200).json(order);
    } catch (error) {
      console.error("Error fetching order:", error);
      return res.status(500).json({ 
        message: "Failed to fetch order. Please try again later." 
      });
    }
  });

  // API endpoint to proxy market data requests
  app.get("/api/market-data", async (_req: Request, res: Response) => {
    try {
      const response = await fetch("https://merolagani.com/handlers/webrequesthandler.ashx?type=market_summary");
      
      if (!response.ok) {
        return res.status(response.status).json({ 
          message: `Market data API returned status: ${response.status}` 
        });
      }
      
      const data = await response.json();
      return res.status(200).json(data);
    } catch (error) {
      console.error("Error fetching market data:", error);
      return res.status(500).json({ 
        message: "Failed to fetch market data. Please try again later." 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
