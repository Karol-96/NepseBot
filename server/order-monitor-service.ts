import { db } from './db';
import { orders, TRIGGER_STATUS, Order, StockData } from '@shared/schema';
import { marketDataService } from './market-data-service';
import { websocketService } from './websocket-server';
import { TMSService } from './tms-service';
import { log } from './vite';
import { and, eq, inArray } from 'drizzle-orm';

/**
 * Service for monitoring and executing trigger orders
 */
export class OrderMonitorService {
  private isRunning = false;
  private monitorInterval: NodeJS.Timeout | null = null;
  private intervalMs = 5000; // 5 seconds by default
  private activeSymbols = new Set<string>();
  
  /**
   * Start the order monitoring service
   */
  start(): void {
    if (this.isRunning) {
      log('Order monitor is already running', 'order-monitor');
      return;
    }
    
    this.isRunning = true;
    
    // Start the monitoring loop
    this.monitorInterval = setInterval(() => {
      this.monitorOrders().catch(error => {
        log(`Error in order monitoring: ${error}`, 'order-monitor');
      });
    }, this.intervalMs);
    
    log(`Order monitor started with interval: ${this.intervalMs}ms`, 'order-monitor');
  }
  
  /**
   * Stop the order monitoring service
   */
  stop(): void {
    if (!this.isRunning || !this.monitorInterval) {
      return;
    }
    
    clearInterval(this.monitorInterval);
    this.monitorInterval = null;
    this.isRunning = false;
    
    log('Order monitor stopped', 'order-monitor');
  }
  
  /**
   * Set the monitoring interval
   * @param intervalMs Interval in milliseconds
   */
  setInterval(intervalMs: number): void {
    this.intervalMs = intervalMs;
    
    // Restart the monitor if it's already running
    if (this.isRunning) {
      this.stop();
      this.start();
    }
  }
  
  /**
   * Check for orders that have reached their trigger conditions
   */
  private async monitorOrders(): Promise<void> {
    // Get all pending trigger orders
    const pendingOrders = await this.getPendingTriggerOrders();
    
    if (pendingOrders.length === 0) {
      return; // No pending orders to monitor
    }
    
    // Extract unique symbols to monitor
    this.activeSymbols = new Set(pendingOrders.map(order => order.symbol));
    const symbolsArray = Array.from(this.activeSymbols);
    
    // Fetch latest market data for the symbols we're monitoring
    const marketData = await marketDataService.fetchLatestData(symbolsArray);
    
    if (!marketData || marketData.length === 0) {
      log('Failed to fetch market data for monitoring', 'order-monitor');
      return;
    }
    
    // Process each pending order
    for (const order of pendingOrders) {
      const stockData = marketData.find(data => 
        data.s.toUpperCase() === order.symbol.toUpperCase()
      );
      
      if (!stockData) {
        log(`No market data available for ${order.symbol}`, 'order-monitor');
        continue;
      }
      
      await this.processOrder(order, stockData);
    }
  }
  
  /**
   * Get all pending trigger orders from the database
   */
  private async getPendingTriggerOrders(): Promise<Order[]> {
    try {
      const pendingOrders = await db.select()
        .from(orders)
        .where(
          and(
            eq(orders.is_trigger_order, true),
            inArray(orders.trigger_status, [
              TRIGGER_STATUS.PENDING,
              TRIGGER_STATUS.MONITORING
            ])
          )
        );
      
      return pendingOrders;
    } catch (error) {
      log(`Failed to fetch pending trigger orders: ${error}`, 'order-monitor');
      return [];
    }
  }
  
  /**
   * Process a single order against current market data
   */
  private async processOrder(order: Order, stockData: StockData): Promise<void> {
    try {
      const currentPrice = stockData.lp;
      
      // Update the last checked timestamp
      await this.updateLastChecked(order.id);
      
      // If base price isn't set yet, set it now
      if (!order.base_price) {
        await this.setBasePrice(order.id, currentPrice);
        order.base_price = currentPrice;
        
        // Calculate and set target price if not already set
        if (!order.target_price) {
          const targetPrice = this.calculateTargetPrice(
            currentPrice,
            order.trigger_price_percent,
            order.order_type
          );
          await this.setTargetPrice(order.id, targetPrice);
          order.target_price = targetPrice;
        }
        
        // Update order status to MONITORING
        await this.updateTriggerStatus(order.id, TRIGGER_STATUS.MONITORING);
        order.trigger_status = TRIGGER_STATUS.MONITORING;
        
        // Broadcast the initial status
        websocketService.broadcastOrderUpdate(order);
        return;
      }
      
      // Check if price target has been reached
      const targetReached = this.isPriceTargetReached(
        currentPrice,
        order.target_price!,
        order.order_type
      );
      
      // Broadcast price updates to subscribers
      websocketService.broadcastPriceUpdate(stockData);
      
      if (!targetReached) {
        // Update the order in the database with latest check time
        websocketService.broadcastOrderUpdate(order);
        return;
      }
      
      // Price target reached! Update the order status
      log(`Price target reached for order ${order.id} (${order.symbol})`, 'order-monitor');
      
      await this.updateTriggerStatus(order.id, TRIGGER_STATUS.TRIGGERED);
      order.trigger_status = TRIGGER_STATUS.TRIGGERED;
      
      await this.setTriggeredAt(order.id);
      order.triggered_at = new Date();
      
      // Broadcast trigger notification
      websocketService.broadcastTriggerNotification(order, currentPrice);
      
      // Execute the order
      await this.executeOrder(order, currentPrice);
    } catch (error) {
      log(`Error processing order ${order.id}: ${error}`, 'order-monitor');
      
      // Update order status to failed if there was an error
      await this.updateTriggerStatus(order.id, TRIGGER_STATUS.FAILED);
      order.trigger_status = TRIGGER_STATUS.FAILED;
      
      // Broadcast the failure
      websocketService.broadcastOrderUpdate(order);
    }
  }
  
  /**
   * Execute an order once the price target has been reached
   */
  private async executeOrder(order: Order, currentPrice: number): Promise<void> {
    try {
      log(`Executing order ${order.id} at price ${currentPrice}`, 'order-monitor');
      
      // We need to retrieve TMS credentials for this order
      // In a real system, these would be securely stored or provided by the user
      // For demo purposes, we'll use placeholder credentials
      // In production, you would implement secure credential management
      const orderWithCredentials = {
        ...order,
        tms_username: 'placeholder_username', // This would come from secure storage
        tms_password: 'placeholder_password',  // This would come from secure storage
        current_price: currentPrice
      };
      
      // Call TMS service to execute the order
      const result = await TMSService.processOrder(orderWithCredentials);
      
      if (!result.success) {
        throw new Error(`TMS order execution failed: ${result.error}`);
      }
      
      // Update the order with execution details
      await db.update(orders)
        .set({
          trigger_status: TRIGGER_STATUS.EXECUTED,
          executed_at: new Date(),
          execution_price: currentPrice,
          tms_order_id: result.order_id,
          tms_status: result.status,
          tms_processed_at: result.processed_at
        })
        .where(eq(orders.id, order.id));
      
      // Get the updated order
      const [updatedOrder] = await db.select()
        .from(orders)
        .where(eq(orders.id, order.id));
      
      // Broadcast the execution
      websocketService.broadcastOrderUpdate(updatedOrder);
      
      log(`Order ${order.id} executed successfully with TMS order ID: ${result.order_id}`, 'order-monitor');
    } catch (error) {
      log(`Failed to execute order ${order.id}: ${error}`, 'order-monitor');
      
      // Update order status to failed
      await this.updateTriggerStatus(order.id, TRIGGER_STATUS.FAILED);
      
      // Get the updated order
      const [updatedOrder] = await db.select()
        .from(orders)
        .where(eq(orders.id, order.id));
      
      // Broadcast the failure
      websocketService.broadcastOrderUpdate(updatedOrder);
      
      throw error;
    }
  }
  
  /**
   * Update the last_checked_at timestamp for an order
   */
  private async updateLastChecked(orderId: number): Promise<void> {
    await db.update(orders)
      .set({ last_checked_at: new Date() })
      .where(eq(orders.id, orderId));
  }
  
  /**
   * Set the base price for an order
   */
  private async setBasePrice(orderId: number, price: number): Promise<void> {
    await db.update(orders)
      .set({ base_price: price })
      .where(eq(orders.id, orderId));
  }
  
  /**
   * Set the target price for an order
   */
  private async setTargetPrice(orderId: number, price: number): Promise<void> {
    await db.update(orders)
      .set({ target_price: price })
      .where(eq(orders.id, orderId));
  }
  
  /**
   * Update the trigger status for an order
   */
  private async updateTriggerStatus(orderId: number, status: string): Promise<void> {
    await db.update(orders)
      .set({ trigger_status: status })
      .where(eq(orders.id, orderId));
  }
  
  /**
   * Set the triggered_at timestamp for an order
   */
  private async setTriggeredAt(orderId: number): Promise<void> {
    await db.update(orders)
      .set({ triggered_at: new Date() })
      .where(eq(orders.id, orderId));
  }
  
  /**
   * Calculate the target price based on base price and percentage
   */
  private calculateTargetPrice(basePrice: number, percentage: number, orderType: string): number {
    if (orderType === 'Buy') {
      // For Buy orders, target is when price rises by the percentage
      return basePrice * (1 + percentage / 100);
    } else {
      // For Sell orders, target is when price falls by the percentage
      return basePrice * (1 - percentage / 100);
    }
  }
  
  /**
   * Check if the price target has been reached
   */
  private isPriceTargetReached(currentPrice: number, targetPrice: number, orderType: string): boolean {
    if (orderType === 'Buy') {
      // For Buy orders, trigger when price rises to target or above
      return currentPrice >= targetPrice;
    } else {
      // For Sell orders, trigger when price falls to target or below
      return currentPrice <= targetPrice;
    }
  }
}

// Singleton instance
export const orderMonitorService = new OrderMonitorService();