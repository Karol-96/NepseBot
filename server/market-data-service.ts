import { StockData, MarketDataResponse } from '@shared/schema';

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
  async fetchLatestData(symbols: string[]): Promise<StockData[]> {
    const now = Date.now();
    
    // Rate limiting to avoid excessive API calls
    if (now - this.lastFetchTime < this.fetchInterval) {
      // Return cached data if we fetched recently
      return this.getStocksFromCache(symbols);
    }
    
    try {
      // Update last fetch time
      this.lastFetchTime = now;
      
      const response = await fetch(this.marketDataUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch market data: ${response.status} ${response.statusText}`);
      }
      
      const data: MarketDataResponse = await response.json();
      
      if (!data || !data.stock || !data.stock.detail) {
        throw new Error('Invalid market data format');
      }
      
      // Process and filter relevant symbols
      const stockData = this.processMarketData(data, symbols);
      
      // Update cache with fresh data
      this.updateCache(stockData);
      
      return stockData;
    } catch (error) {
      console.error('Error fetching market data:', error);
      
      // Fall back to cached data if available
      return this.getStocksFromCache(symbols);
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