import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertOrderSchema, orderFormSchema, TRIGGER_STATUS } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { TMSService } from "./tms-service";
import { websocketService } from "./websocket-server";
import { orderMonitorService } from "./order-monitor-service";
import { marketDataService } from "./market-data-service";
import { log } from "./vite";
import { schema } from '@shared/schema';
import { setupMockAPI } from './api-mock';
import path from 'path';
import fs from 'fs';

export async function registerRoutes(app: Express): Promise<Server> {
  setupMockAPI(app);
  // API endpoint to create a new order
  app.post("/api/orders", async (req: Request, res: Response) => {
    try {
      // Validate the complete form data including TMS credentials using orderFormSchema
      const formValidationResult = orderFormSchema.safeParse(req.body);
      
      if (!formValidationResult.success) {
        const errorMessage = fromZodError(formValidationResult.error).message;
        return res.status(400).json({ message: errorMessage });
      }

      // Process order with TMS API
      const tmsResult = await TMSService.processOrder(formValidationResult.data);
      
      if (!tmsResult.success) {
        return res.status(400).json({ 
          message: tmsResult.message || "TMS order processing failed"
        });
      }

      // Extract order data for database (exclude TMS credentials but include TMS order data)
      const orderData = {
        symbol: formValidationResult.data.symbol,
        quantity: formValidationResult.data.quantity,
        order_type: formValidationResult.data.order_type,
        trigger_price_percent: formValidationResult.data.trigger_price_percent.toString(),
        // Include TMS order data
        tms_order_id: tmsResult.order_id,
        tms_status: tmsResult.status,
        tms_processed_at: tmsResult.processed_at
      };

      // Create order in the database
      const order = await storage.createOrder(orderData);
      
      return res.status(201).json({
        ...order,
        tms_message: tmsResult.message
      });
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

  app.get("/api/market-data", async (_req: Request, res: Response) => {
    try {
      // Set headers to mimic a browser as closely as possible
      const response = await fetch("https://merolagani.com/handlers/webrequesthandler.ashx?type=market_summary", {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': 'https://merolagani.com/',
          'Origin': 'https://merolagani.com',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      // Get the raw text response
      const rawText = await response.text();
      
      // Log the first part of the response for debugging
      console.log("API Response (first 100 chars):", rawText.substring(0, 100));
      
      // Check if the response is HTML (error) or JSON (success)
      if (rawText.includes('<!DOCTYPE') || rawText.includes('<html')) {
        console.error("Received HTML instead of JSON from external API");
        return res.status(500).json({ 
          message: "External API returned HTML instead of JSON",
          error: "API returned HTML document" 
        });
      }
      
      try {
        // Parse the text as JSON
        const jsonData = JSON.parse(rawText);
        
        // Check for the expected structure
        if (jsonData && jsonData.mt === 'ok' && jsonData.turnover && jsonData.turnover.detail) {
          console.log("Successfully parsed market data with", jsonData.turnover.detail.length, "stocks");
          
          // Transform the API response to match the expected structure in your client
          // Your dashboard expects data.stock.detail
          const transformedData = {
            mt: jsonData.mt,
            stock: {
              date: jsonData.turnover.date || new Date().toISOString(),
              detail: jsonData.turnover.detail
            }
          };
          
          return res.status(200).json(transformedData);
        } else {
          console.error("Unexpected JSON structure from API:", Object.keys(jsonData));
          return res.status(500).json({ 
            message: "External API returned unexpected data structure",
            error: "Unexpected data structure" 
          });
        }
      } catch (parseError) {
        console.error("Failed to parse JSON:", parseError);
        return res.status(500).json({ 
          message: "Failed to parse response from external API",
          error: parseError instanceof Error ? parseError.message : String(parseError)
        });
      }
    } catch (fetchError) {
      console.error("Fetch error:", fetchError);
      return res.status(500).json({ 
        message: "Failed to fetch data from external API",
        error: fetchError instanceof Error ? fetchError.message : String(fetchError)
      });
    }
  });
  // API endpoint to create a trigger order
  app.post("/api/trigger-orders", async (req: Request, res: Response) => {
    try {
      // Validate the form data using orderFormSchema (same as regular orders)
      const formValidationResult = orderFormSchema.safeParse(req.body);
      
      if (!formValidationResult.success) {
        const errorMessage = fromZodError(formValidationResult.error).message;
        return res.status(400).json({ message: errorMessage });
      }

      // Get current price for the symbol from market data service
      const stockData = await marketDataService.getStockData(formValidationResult.data.symbol);
      
      if (!stockData) {
        return res.status(400).json({ 
          message: `Unable to fetch current price for symbol: ${formValidationResult.data.symbol}` 
        });
      }

      const currentPrice = stockData.lp;
      
      // Calculate target price
      const triggerPricePercent = formValidationResult.data.trigger_price_percent;
      const targetPrice = formValidationResult.data.order_type === 'Buy'
        ? currentPrice * (1 + triggerPricePercent / 100)
        : currentPrice * (1 - triggerPricePercent / 100);
        
      log(`Creating trigger order for ${formValidationResult.data.symbol} at ${currentPrice} with target ${targetPrice}`, 'routes');

      // Process with TMS API to validate credentials (but do not execute yet)
      const tmsResult = await TMSService.processOrder({
        ...formValidationResult.data,
        is_trigger_order: false // We don't want to actually execute yet
      });
      
      if (!tmsResult.success) {
        return res.status(400).json({ 
          message: tmsResult.message || "TMS validation failed, cannot create trigger order"
        });
      }

      // Store TMS credentials securely
      // In a real system, this would be done securely, not using placeholders
      // This is where you would implement secure credential storage
      
      // Create the trigger order in the database
      const orderData = {
        symbol: formValidationResult.data.symbol,
        quantity: formValidationResult.data.quantity,
        order_type: formValidationResult.data.order_type,
        trigger_price_percent: formValidationResult.data.trigger_price_percent.toString(),
        is_trigger_order: true,
        base_price: currentPrice.toString(),
        target_price: targetPrice.toString(),
        trigger_status: TRIGGER_STATUS.PENDING
      };

      // Create order in the database
      const order = await storage.createOrder(orderData);
      
      return res.status(201).json({
        ...order,
        message: "Trigger order created successfully. Monitoring will begin shortly."
      });
    } catch (error) {
      console.error("Error creating trigger order:", error);
      return res.status(500).json({ 
        message: "Failed to create trigger order. Please try again later." 
      });
    }
  });

  // API endpoint to get all trigger orders
  app.get("/api/trigger-orders", async (_req: Request, res: Response) => {
    try {
      const orders = await storage.getTriggerOrders();
      return res.status(200).json(orders);
    } catch (error) {
      console.error("Error fetching trigger orders:", error);
      return res.status(500).json({ 
        message: "Failed to fetch trigger orders. Please try again later." 
      });
    }
  });

  // API endpoint to cancel a trigger order
  app.post("/api/trigger-orders/:id/cancel", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }
      
      const order = await storage.getOrder(id);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Ensure it's a trigger order in a cancellable state
      if (!order.is_trigger_order) {
        return res.status(400).json({ message: "Not a trigger order" });
      }
      
      const cancellableStatuses = [TRIGGER_STATUS.PENDING, TRIGGER_STATUS.MONITORING];
      if (!cancellableStatuses.includes(order.trigger_status as any)) {
        return res.status(400).json({ 
          message: `Cannot cancel order in ${order.trigger_status} status` 
        });
      }
      
      // Cancel the order by updating its status
      const updatedOrder = await storage.updateOrderStatus(id, TRIGGER_STATUS.CANCELLED);
      
      return res.status(200).json({
        ...updatedOrder,
        message: "Trigger order cancelled successfully"
      });
    } catch (error) {
      console.error("Error cancelling trigger order:", error);
      return res.status(500).json({ 
        message: "Failed to cancel trigger order. Please try again later." 
      });
    }
  });

  // Initialize HTTP server
  const httpServer = createServer(app);
  
  // Initialize WebSocket server with the HTTP server
  websocketService.initialize(httpServer);
  log('WebSocket server initialized', 'routes');
  
  // Start the order monitoring service
  orderMonitorService.start();
  log('Order monitoring service started', 'routes');
  
  return httpServer;
}
