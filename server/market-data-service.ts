import { StockData, MarketDataResponse } from '@shared/schema';
import { log } from './vite'; // Add this import

/**
 * Service for fetching and processing market data
 */
export class MarketDataService {
  private cache: Map<string, StockData> = new Map();
  private lastFetchTime: number = 0;
  private fetchInterval: number = 5000; // 5 seconds
  private marketDataUrl = 'https://merolagani.com/handlers/webrequesthandler.ashx?type=market_summary';

  /**
   * Fetches latest market data for specified symbols
   * @param symbols List of stock symbols to fetch data for
   * @returns Filtered stock data for the requested symbols
   */
  private async fetchWithRetry(url: string, retries = 3, delay = 2000): Promise<any> {
    let lastError;
    
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'TradeTrigger/1.0',
            'Accept': 'application/json'
          },
          timeout: 10000
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
      } catch (error) {
        lastError = error;
        log(`Fetch attempt ${attempt + 1} failed: ${error}`, 'market-data');
        
        if (attempt < retries - 1) {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }
  
  async fetchLatestData(symbols: string[]): Promise<StockData[]> {
    if (symbols.length === 0) {
      return [];
    }
    
    try {
      // Check if we should fetch fresh data
      const now = Date.now();
      if (now - this.lastFetchTime < this.fetchInterval) {
        // Return cached data if available
        return this.getStocksFromCache(symbols);
      }
      
      // Fetch fresh data
      const data = await this.fetchWithRetry(this.marketDataUrl);
      this.lastFetchTime = now;
      
      if (!data || !data.stock || !data.stock.detail) {
        throw new Error('Invalid market data response format');
      }
      
      // Process and cache the data
      const stocksData = this.processMarketData(data, symbols);
      this.updateCache(stocksData);
      
      return stocksData;
    } catch (error) {
      log(`Using mock data as fallback after fetch error: ${error}`, 'market-data');
      // Return mock data for the requested symbols
      return symbols.map(symbol => ({
        s: symbol,
        lp: 1000, // Mock price
        c: 0,
        q: 1000
      }));
    }
  }
  
  /**
   * Get stock data for a specific symbol
   * @param symbol The stock symbol to get data for
   * @returns Stock data or null if not found
   */
  async getStockData(symbol: string): Promise<StockData | null> {
    const stocks = await this.fetchLatestData([symbol]);
    return stocks.length > 0 ? stocks[0] : null;
  }
  
  /**
   * Get multiple stocks from cache
   */
  private getStocksFromCache(symbols: string[]): StockData[] {
    return symbols
      .map(symbol => this.cache.get(symbol))
      .filter((data): data is StockData => !!data);
  }
  
  /**
   * Filter and process raw market data
   */
  private processMarketData(data: MarketDataResponse, symbols: string[]): StockData[] {
    if (symbols.length === 0) {
      // If no specific symbols requested, return all stocks
      return data.stock.detail;
    }
    
    // Filter stocks by the requested symbols (case insensitive)
    const upperSymbols = symbols.map(s => s.toUpperCase());
    return data.stock.detail.filter(item => 
      upperSymbols.includes(item.s.toUpperCase())
    );
  }
  
  /**
   * Update the in-memory cache with fresh stock data
   */
  private updateCache(stocks: StockData[]): void {
    for (const stock of stocks) {
      this.cache.set(stock.s, stock);
    }
  }
  
  /**
   * Set the polling interval for market data fetching
   * @param intervalMs Interval in milliseconds
   */
  setFetchInterval(intervalMs: number): void {
    this.fetchInterval = intervalMs;
  }
}

// Singleton instance
export const marketDataService = new MarketDataService();