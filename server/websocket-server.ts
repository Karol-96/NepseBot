import { Server } from 'http';
import WebSocket, { WebSocketServer } from 'ws';
import { WebSocketMessage, WebSocketMessageType, StockData, Order, TRIGGER_STATUS } from '@shared/schema';
import { log } from './vite';

/**
 * WebSocket server for real-time updates of market data and order status
 */
export class WebSocketService {
  private wss: WebSocketServer | null = null;
  private clients: Map<WebSocket, Set<string>> = new Map();
  private symbolSubscribers: Map<string, Set<WebSocket>> = new Map();
  private orderSubscribers: Map<number, Set<WebSocket>> = new Map();

  /**
   * Initialize the WebSocket server
   * @param server HTTP server instance
   */
  initialize(server: Server): void {
    if (this.wss) {
      log('WebSocket server already initialized', 'websocket');
      return;
    }

    this.wss = new WebSocketServer({ server, path: '/ws' });
    
    this.wss.on('connection', (ws) => {
      log('New WebSocket connection established', 'websocket');
      
      // Initialize empty subscription sets for this client
      this.clients.set(ws, new Set());
      
      // Set up message handler
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString()) as WebSocketMessage;
          this.handleMessage(ws, message);
        } catch (error) {
          log(`Error handling WebSocket message: ${error}`, 'websocket');
          this.sendError(ws, 'Invalid message format');
        }
      });
      
      // Handle disconnection
      ws.on('close', () => {
        log('WebSocket connection closed', 'websocket');
        this.handleDisconnect(ws);
      });
      
      // Send initial connection confirmation
      this.send(ws, {
        type: 'CONNECTION_ESTABLISHED',
        payload: { timestamp: new Date().toISOString() }
      });
    });
    
    log('WebSocket server initialized', 'websocket');
  }
  
  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(ws: WebSocket, message: WebSocketMessage): void {
    switch (message.type) {
      case 'SUBSCRIBE_SYMBOL':
        this.handleSymbolSubscription(ws, message.payload.symbol);
        break;
        
      case 'UNSUBSCRIBE_SYMBOL':
        this.handleSymbolUnsubscription(ws, message.payload.symbol);
        break;
        
      case 'SUBSCRIBE_ORDER':
        this.handleOrderSubscription(ws, message.payload.orderId);
        break;
        
      case 'UNSUBSCRIBE_ORDER':
        this.handleOrderUnsubscription(ws, message.payload.orderId);
        break;
        
      default:
        this.sendError(ws, `Unknown message type: ${message.type}`);
    }
  }
  
  /**
   * Subscribe a client to updates for a specific stock symbol
   */
  private handleSymbolSubscription(ws: WebSocket, symbol: string): void {
    if (!symbol) {
      this.sendError(ws, 'Symbol is required for subscription');
      return;
    }
    
    // Get or create subscriber set for this symbol
    if (!this.symbolSubscribers.has(symbol)) {
      this.symbolSubscribers.set(symbol, new Set());
    }
    
    // Add this client to the subscribers for this symbol
    this.symbolSubscribers.get(symbol)!.add(ws);
    
    // Track this subscription for the client
    this.clients.get(ws)!.add(`symbol:${symbol}`);
    
    log(`Client subscribed to symbol: ${symbol}`, 'websocket');
    
    // Confirm subscription
    this.send(ws, {
      type: 'SUBSCRIPTION_CONFIRMED',
      payload: { type: 'symbol', symbol }
    });
  }
  
  /**
   * Unsubscribe a client from updates for a specific stock symbol
   */
  private handleSymbolUnsubscription(ws: WebSocket, symbol: string): void {
    if (!symbol || !this.symbolSubscribers.has(symbol)) {
      return;
    }
    
    // Remove this client from the subscribers for this symbol
    this.symbolSubscribers.get(symbol)!.delete(ws);
    
    // Remove this subscription from the client's tracking
    this.clients.get(ws)!.delete(`symbol:${symbol}`);
    
    log(`Client unsubscribed from symbol: ${symbol}`, 'websocket');
    
    // If no more subscribers for this symbol, clean up
    if (this.symbolSubscribers.get(symbol)!.size === 0) {
      this.symbolSubscribers.delete(symbol);
    }
  }
  
  /**
   * Subscribe a client to updates for a specific order
   */
  private handleOrderSubscription(ws: WebSocket, orderId: number): void {
    if (!orderId) {
      this.sendError(ws, 'Order ID is required for subscription');
      return;
    }
    
    // Get or create subscriber set for this order
    if (!this.orderSubscribers.has(orderId)) {
      this.orderSubscribers.set(orderId, new Set());
    }
    
    // Add this client to the subscribers for this order
    this.orderSubscribers.get(orderId)!.add(ws);
    
    // Track this subscription for the client
    this.clients.get(ws)!.add(`order:${orderId}`);
    
    log(`Client subscribed to order: ${orderId}`, 'websocket');
    
    // Confirm subscription
    this.send(ws, {
      type: 'SUBSCRIPTION_CONFIRMED',
      payload: { type: 'order', orderId }
    });
  }
  
  /**
   * Unsubscribe a client from updates for a specific order
   */
  private handleOrderUnsubscription(ws: WebSocket, orderId: number): void {
    if (!orderId || !this.orderSubscribers.has(orderId)) {
      return;
    }
    
    // Remove this client from the subscribers for this order
    this.orderSubscribers.get(orderId)!.delete(ws);
    
    // Remove this subscription from the client's tracking
    this.clients.get(ws)!.delete(`order:${orderId}`);
    
    log(`Client unsubscribed from order: ${orderId}`, 'websocket');
    
    // If no more subscribers for this order, clean up
    if (this.orderSubscribers.get(orderId)!.size === 0) {
      this.orderSubscribers.delete(orderId);
    }
  }
  
  /**
   * Handle client disconnection
   */
  private handleDisconnect(ws: WebSocket): void {
    // Get all subscriptions for this client
    const subscriptions = this.clients.get(ws);
    
    if (subscriptions) {
      // Remove this client from all subscription lists
      for (const sub of subscriptions) {
        const [type, id] = sub.split(':');
        
        if (type === 'symbol') {
          this.handleSymbolUnsubscription(ws, id);
        } else if (type === 'order') {
          this.handleOrderUnsubscription(ws, parseInt(id));
        }
      }
    }
    
    // Remove client from tracking
    this.clients.delete(ws);
  }
  
  /**
   * Broadcast price updates to all subscribers of a symbol
   */
  broadcastPriceUpdate(stock: StockData): void {
    const symbol = stock.s;
    
    if (!this.symbolSubscribers.has(symbol)) {
      return; // No subscribers for this symbol
    }
    
    const subscribers = this.symbolSubscribers.get(symbol)!;
    
    const message: WebSocketMessage = {
      type: 'PRICE_UPDATE',
      payload: {
        symbol: stock.s,
        price: stock.lp,
        change: stock.c,
        volume: stock.q,
        timestamp: new Date().toISOString()
      }
    };
    
    this.broadcast(subscribers, message);
  }
  
  /**
   * Broadcast order status updates to all subscribers of an order
   */
  broadcastOrderUpdate(order: Order): void {
    if (!this.orderSubscribers.has(order.id)) {
      return; // No subscribers for this order
    }
    
    const subscribers = this.orderSubscribers.get(order.id)!;
    
    const message: WebSocketMessage = {
      type: 'ORDER_STATUS_UPDATE',
      payload: {
        orderId: order.id,
        symbol: order.symbol,
        status: order.trigger_status,
        lastCheckedAt: order.last_checked_at,
        targetPrice: order.target_price,
        timestamp: new Date().toISOString()
      }
    };
    
    this.broadcast(subscribers, message);
  }
  
  /**
   * Broadcast trigger notifications to subscribers
   */
  broadcastTriggerNotification(order: Order, currentPrice: number): void {
    if (!this.orderSubscribers.has(order.id)) {
      return;
    }
    
    const subscribers = this.orderSubscribers.get(order.id)!;
    
    const message: WebSocketMessage = {
      type: 'TRIGGER_NOTIFICATION',
      payload: {
        orderId: order.id,
        symbol: order.symbol,
        orderType: order.order_type,
        quantity: order.quantity,
        targetPrice: order.target_price,
        currentPrice: currentPrice,
        status: order.trigger_status,
        timestamp: new Date().toISOString()
      }
    };
    
    this.broadcast(subscribers, message);
    
    // Also broadcast to all subscribers of this symbol
    if (this.symbolSubscribers.has(order.symbol)) {
      this.broadcast(this.symbolSubscribers.get(order.symbol)!, message);
    }
  }
  
  /**
   * Send an error message to a client
   */
  private sendError(ws: WebSocket, errorMessage: string): void {
    this.send(ws, {
      type: 'ERROR',
      payload: { message: errorMessage }
    });
  }
  
  /**
   * Send a message to a specific client
   */
  private send(ws: WebSocket, message: any): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }
  
  /**
   * Broadcast a message to multiple clients
   */
  private broadcast(clients: Set<WebSocket>, message: any): void {
    const messageStr = JSON.stringify(message);
    
    for (const client of clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    }
  }
  
  /**
   * Get a list of all active subscriptions
   */
  getActiveSubscriptions(): { symbols: string[], orders: number[] } {
    return {
      symbols: Array.from(this.symbolSubscribers.keys()),
      orders: Array.from(this.orderSubscribers.keys())
    };
  }
}

// Singleton instance
export const websocketService = new WebSocketService();