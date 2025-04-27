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

      // Debug log to verify credentials are received from form
      console.log("Form credentials:", {
        username: formValidationResult.data.tms_username ? 'present' : 'missing',
        password: formValidationResult.data.tms_password ? 'present' : 'missing',
        broker: formValidationResult.data.broker_number || 'using default'
      });

      // Process order with TMS API
      const tmsResult = await TMSService.processOrder(formValidationResult.data);
      
      if (!tmsResult.success) {
        return res.status(400).json({ 
          message: tmsResult.message || "TMS order processing failed"
        });
      }

      // Extract order data for database (include TMS credentials and order data)
      const orderData = {
        symbol: formValidationResult.data.symbol,
        quantity: formValidationResult.data.quantity,
        order_type: formValidationResult.data.order_type,
        trigger_price_percent: formValidationResult.data.trigger_price_percent.toString(),
        base_price: formValidationResult.data.base_price?.toString(),
        target_price: formValidationResult.data.target_price?.toString(),
        is_trigger_order: formValidationResult.data.is_trigger_order,
        
        // Ensure TMS credentials are stored
        tms_username: formValidationResult.data.tms_username,
        tms_password: formValidationResult.data.tms_password,
        broker_number: formValidationResult.data.broker_number || '21',
        
        // Include TMS order data
        tms_order_id: tmsResult.order_id,
        tms_status: tmsResult.status,
        tms_processed_at: tmsResult.processed_at
      };

      // Create order in the database
      const order = await storage.createOrder(orderData);
      
      // Verify credentials were stored
      console.log("Order saved with credentials:", {
        id: order.id,
        username: order.tms_username ? 'stored' : 'missing',
        hasPassword: Boolean(order.tms_password),
        broker: order.broker_number
      });
      
      // Broadcast the new order to all connected clients
      websocketService.broadcastOrderUpdate(order);
      
      log(`Order created successfully: ID=${order.id}, Symbol=${order.symbol}`, 'routes');
      
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

  // API endpoint to create a trigger order
  app.post("/api/trigger-orders", async (req: Request, res: Response) => {
    try {
      // Validate the form data using orderFormSchema (same as regular orders)
      const formValidationResult = orderFormSchema.safeParse(req.body);
      
      if (!formValidationResult.success) {
        const errorMessage = fromZodError(formValidationResult.error).message;
        return res.status(400).json({ message: errorMessage });
      }

      // Debug log to verify credentials are received
      console.log("Trigger order credentials:", {
        username: formValidationResult.data.tms_username ? 'present' : 'missing',
        password: formValidationResult.data.tms_password ? 'present' : 'missing',
        broker: formValidationResult.data.broker_number || 'using default'
      });

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
      let targetPrice;

      // Special case for 0% trigger - make target price exactly equal to base price
      if (triggerPricePercent === 0) {
        targetPrice = currentPrice;
        log(`Zero percent trigger detected, setting target price equal to current price: ${currentPrice}`, 'routes');
      } else {
        targetPrice = formValidationResult.data.order_type === 'Buy'
          ? currentPrice * (1 + triggerPricePercent / 100)
          : currentPrice * (1 - triggerPricePercent / 100);
      }
        
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

      // Create the trigger order in the database
      const orderData = {
        symbol: formValidationResult.data.symbol,
        quantity: formValidationResult.data.quantity,
        order_type: formValidationResult.data.order_type,
        trigger_price_percent: formValidationResult.data.trigger_price_percent.toString(),
        is_trigger_order: true,
        base_price: currentPrice.toString(),
        target_price: targetPrice.toString(),
        trigger_status: TRIGGER_STATUS.MONITORING, // Change from PENDING to MONITORING to start immediately
        
        // Ensure TMS credentials are stored
        tms_username: formValidationResult.data.tms_username,
        tms_password: formValidationResult.data.tms_password,
        broker_number: formValidationResult.data.broker_number || '21',
        
        tms_order_id: tmsResult.order_id,
        tms_status: tmsResult.status,
        tms_processed_at: tmsResult.processed_at
      };

      // Create order in the database
      const order = await storage.createOrder(orderData);
      
      // Verify credentials were stored
      console.log("Trigger order saved with credentials:", {
        id: order.id,
        username: order.tms_username ? 'stored' : 'missing',
        hasPassword: Boolean(order.tms_password),
        broker: order.broker_number
      });
      
      // Broadcast the new trigger order to all connected clients
      websocketService.broadcastOrderUpdate(order);
      
      // Also send a notification that a new trigger order has been created
      websocketService.broadcastTriggerNotification(order, parseFloat(order.base_price));
      
      log(`Trigger order created successfully: ID=${order.id}, Symbol=${order.symbol}, Target=${targetPrice}`, 'routes');
      
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

  // Keep all other routes unchanged
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
      
      // Broadcast the order cancellation
      websocketService.broadcastOrderUpdate(updatedOrder);
      
      log(`Trigger order cancelled: ID=${id}`, 'routes');
      
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
  
  // Force immediate check for any pending orders
  setTimeout(() => {
    log('Performing initial order monitoring check', 'routes');
    orderMonitorService.checkNow();
  }, 2000);
  
  return httpServer;
}