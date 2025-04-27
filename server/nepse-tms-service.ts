import { Order } from '@shared/schema';
import { spawn } from 'child_process';
import { log } from './vite';
import path from 'path';
import fs from 'fs';

// Extended interface for order data including current price and credentials
interface NepseOrderData extends Partial<Order> {
    current_price?: number;
    tms_username: string;
    tms_password: string;
    broker_number?: string; // Add this field
  }

/**
 * Service to interact with NEPSE TMS using the Selenium-based scraper
 */
export class NepseTMSService {
  private static scriptPath = path.join(process.cwd(), 'server', 'nepse-scraper.py');
  private static modelsDownloaded = false;
  
  /**
   * Initialize the service by downloading required models
   * Call this during application startup
   */
  static async initialize(): Promise<void> {
    try {
      log("Initializing Nepse TMS Service...", 'nepse-tms');
      await this.ensureModelsDownloaded();
      log("Nepse TMS Service initialized", 'nepse-tms');
    } catch (error) {
      log(`Error initializing Nepse TMS Service: ${error}`, 'nepse-tms');
    }
  }
  
  /**
   * Execute an order by logging in to NEPSE TMS using the scraper
   * This method is specifically for orders where base price equals target price
   */
  static async executeOrder(orderData: NepseOrderData): Promise<{
    success: boolean;
    message: string;
    order_id?: string;
    error?: string;
    status?: string;
    processed_at?: Date;
  }> {
    try {
        // Log credentials for debugging
        console.log("TMS Credentials received:", {
          username: orderData.tms_username,
          password: Boolean(orderData.tms_password), // Just log that it exists, not the actual password
          broker: orderData.broker_number
        });
    
        // Check if credentials are missing
        if (!orderData.tms_username || !orderData.tms_password) {
          return {
            success: false,
            message: "Missing TMS credentials",
            error: "Missing credentials"
          };
        }
  
      log(`Executing NEPSE TMS order for ${orderData.symbol} via scraper`, 'nepse-tms');
      
      // Run the Python scraper as a child process
      const result = await this.runScraperProcess(
        orderData.tms_username,
        orderData.tms_password,
        orderData.symbol,
        orderData.quantity as number,
        orderData.order_type,
        orderData.broker_number || "21" // Use the provided broker number or default to 21
      );
      
      
      if (!result.success) {
        return {
          success: false,
          message: `Failed to execute order via NEPSE TMS: ${result.error}`,
          error: result.error
        };
      }
      
      const now = new Date();
      
      return {
        success: true,
        message: `Successfully executed order via NEPSE TMS scraper`,
        order_id: `nepse-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        status: "NEPSE_EXECUTED",
        processed_at: now
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      log(`Error executing NEPSE TMS order: ${errorMessage}`, 'nepse-tms');
      
      return {
        success: false,
        message: `Failed to execute order via NEPSE TMS`,
        error: errorMessage
      };
    }
  }
  
  /**
   * Ensure that EasyOCR models are downloaded before running the scraper
   */
  private static async ensureModelsDownloaded(): Promise<boolean> {
    try {
      if (this.modelsDownloaded) {
        return true;
      }
      
      log("Checking EasyOCR models...", 'nepse-tms');
      
      const modelDir = path.join(process.cwd(), 'models');
      const craftModelPath = path.join(modelDir, 'craft_mlt_25k.pth');
      const recognitionModelPath = path.join(modelDir, 'english_g2.pth');
      
      // If models already exist, return success
      if (fs.existsSync(craftModelPath) && fs.existsSync(recognitionModelPath)) {
        log("EasyOCR models already downloaded", 'nepse-tms');
        this.modelsDownloaded = true;
        return true;
      }
      
      // Create model directory if it doesn't exist
      if (!fs.existsSync(modelDir)) {
        fs.mkdirSync(modelDir, { recursive: true });
      }
      
      // Also ensure captcha directories exist
      const captchaOrigDir = path.join(process.cwd(), 'captchas', 'original');
      const captchaProcDir = path.join(process.cwd(), 'captchas', 'processed');
      
      if (!fs.existsSync(captchaOrigDir)) {
        fs.mkdirSync(captchaOrigDir, { recursive: true });
      }
      
      if (!fs.existsSync(captchaProcDir)) {
        fs.mkdirSync(captchaProcDir, { recursive: true });
      }
      
      // Run Python script to download models
      const result = await new Promise<boolean>((resolve) => {
        const pythonProcess = spawn(process.platform === 'darwin' ? 'python3' : 'python', [
          '-c',
          'import easyocr; reader = easyocr.Reader([\'en\'], model_storage_directory=\'./models\', download_enabled=True, recog_network=\'english_g2\')'
        ]);
        
        pythonProcess.stdout.on('data', (data) => {
          log(`Model download: ${data.toString().trim()}`, 'nepse-tms');
        });
        
        pythonProcess.stderr.on('data', (data) => {
          log(`Model download error: ${data.toString().trim()}`, 'nepse-tms');
        });
        
        pythonProcess.on('close', (code) => {
          if (code === 0) {
            log('Models downloaded successfully', 'nepse-tms');
            this.modelsDownloaded = true;
            resolve(true);
          } else {
            log(`Model download failed with code ${code}`, 'nepse-tms');
            resolve(false);
          }
        });
        
        pythonProcess.on('error', (err) => {
          log(`Failed to start model download: ${err.message}`, 'nepse-tms');
          resolve(false);
        });
      });
      
      return result;
    } catch (error) {
      log(`Error ensuring models: ${error}`, 'nepse-tms');
      return false;
    }
  }
  
  /**
   * Run the Python scraper as a child process
   */
  private static runScraperProcess(
    username: string, 
    password: string, 
    symbol: string, 
    quantity: number,
    orderType: string,
    brokerNumber: string = "21" // Add parameter with default value
  ): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      // Check if the script exists
      if (!fs.existsSync(this.scriptPath)) {
        log(`Scraper script not found at ${this.scriptPath}`, 'nepse-tms');
        return resolve({ success: false, error: `Script not found at ${this.scriptPath}` });
      }
      
      // Create the python command based on system
      const pythonCmd = process.platform === 'darwin' ? 'python3' : 'python';
      
      // Spawn the Python process with required arguments
      const scraperProcess = spawn(pythonCmd, [
        this.scriptPath,
        '--username', username,
        '--password', password,
        '--symbol', symbol,
        '--quantity', quantity.toString(),
        '--order-type', orderType,
        '--broker-number', brokerNumber
      ]);
      
      let stdoutData = '';
      let stderrData = '';
      
      // Collect stdout data
      scraperProcess.stdout.on('data', (data) => {
        stdoutData += data.toString();
        log(`NEPSE Scraper output: ${data.toString().trim()}`, 'nepse-tms');
      });
      
      // Collect stderr data
      scraperProcess.stderr.on('data', (data) => {
        stderrData += data.toString();
        log(`NEPSE Scraper error: ${data.toString().trim()}`, 'nepse-tms');
      });
      
      // Handle process completion
      scraperProcess.on('close', (code) => {
        if (code === 0) {
          log('NEPSE Scraper completed successfully', 'nepse-tms');
          resolve({ success: true });
        } else {
          const errorMessage = stderrData || `Process exited with code ${code}`;
          log(`NEPSE Scraper failed: ${errorMessage}`, 'nepse-tms');
          resolve({ success: false, error: errorMessage });
        }
      });
      
      // Handle process errors
      scraperProcess.on('error', (err) => {
        const errorMessage = `Failed to start NEPSE Scraper: ${err.message}`;
        log(errorMessage, 'nepse-tms');
        resolve({ success: false, error: errorMessage });
      });
    });
  }
}

// Create and export an instance
export const nepseTMSService = new NepseTMSService();