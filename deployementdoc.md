TradeTrigger: Comprehensive Documentation
1. Introduction
TradeTrigger is a web-based trading application that allows users to create and monitor trigger-based stock orders. The application enables users to set price conditions for stocks and automatically execute trades when those conditions are met.
2. System Architecture
2.1 Core Components
Frontend: React-based SPA with TanStack Query for data fetching
Backend: Express.js server with WebSocket support
Database: PostgreSQL with Drizzle ORM
Market Data Service: Real-time market data monitoring
Order Monitoring Service: Background service that watches for trigger conditions
3. Technology Stack
Frontend: React, TypeScript, TailwindCSS, Shadcn UI
Backend: Node.js, Express, TypeScript
Database: PostgreSQL, Drizzle ORM
State Management: TanStack Query (React Query)
API Communication: REST, WebSockets
Build Tools: Vite, ESBuild
Containerization: Docker, Docker Compose
4. Local Development Setup
4.1 Prerequisites
Node.js 20.x
PostgreSQL 16
Git
4.2 Installation
Apply to vite.config....
Run
credentials
4.3 Database Setup
Apply to vite.config....
Run
push
4.4 Starting Development Server
Apply to vite.config....
Run
5000
5. Docker Setup
5.1 Prerequisites
Docker
Docker Compose
5.2 Configuration
Apply to vite.config....
Run
5000
6. Database Schema
6.1 Core Tables
users: User accounts and authentication
orders: Contains all order data (both regular and trigger orders)
6.2 Key Relationships
Orders are associated with users
Trigger orders have additional status fields for monitoring
7. API Endpoints
7.1 Order Management
POST /api/orders: Create a regular order
GET /api/orders: Get all orders
GET /api/orders/:id: Get a specific order
7.2 Trigger Orders
POST /api/trigger-orders: Create a trigger order
GET /api/trigger-orders: Get all trigger orders
POST /api/trigger-orders/:id/cancel: Cancel a pending trigger order
7.3 Market Data
GET /api/market-data: Get current market data
7.4 WebSocket Events
PRICE_UPDATE: Real-time price updates
ORDER_STATUS_UPDATE: Order status changes
TRIGGER_NOTIFICATION: Notifications when triggers are activated
8. Production Deployment
8.1 VPS Setup
Apply to vite.config....
Run
nodejs
8.2 PostgreSQL Installation
Apply to vite.config....
Run
"
8.3 Application Deployment
Apply to vite.config....
Run
build
8.4 Process Management
Apply to vite.config....
Run
save
8.5 NGINX Configuration
Apply to vite.config....
Run
nginx
8.6 SSL Configuration
Apply to vite.config....
Run
com
8.7 Docker Production Deployment
Apply to vite.config....
Run
d
9. Maintenance and Monitoring
9.1 Log Management
Apply to vite.config....
Run
log
9.2 Database Backup
Apply to vite.config....
Run
-
9.3 Application Updates
Apply to vite.config....
Run
tradetrigger
10. User Guide
10.1 Creating an Order
Navigate to the Order Form page
Enter stock symbol (e.g., AAPL)
Specify quantity
Select order type (Buy/Sell)
Set trigger price percentage
Check "Create as trigger order" if desired
Enter TMS credentials
Click "Preview Order" then "Submit Order"
10.2 Monitoring Trigger Orders
Navigate to the Dashboard
View the Trigger Orders section
Monitor order status:
PENDING: Initial state
MONITORING: Actively watching price
TRIGGERED: Price condition met
EXECUTED: Order executed
FAILED: Execution failed
CANCELLED: User cancelled
10.3 Cancelling Orders
Find the order in the Trigger Orders table
Click "Cancel" button
Confirm cancellation
11. Troubleshooting
11.1 Database Connection Issues
Verify PostgreSQL is running: sudo systemctl status postgresql
Check database exists: psql -U postgres -c '\l'
Verify connection string in .env: DATABASE_URL=postgresql://tradetrigger:tradetrigger123@localhost:5432/tradetrigger
11.2 API Errors
Check server logs: pm2 logs tradetrigger
Verify API routes are registered in server/routes.ts
Check network tab in browser developer tools for specific error responses
11.3 Market Data Issues
Verify external market data API is available
Check market data service logs
Confirm proper handling of API rate limits
11.4 Order Execution Problems
Verify TMS credentials are correct
Check TMS service connectivity
Confirm order monitoring service is running
12. Development Guidelines
12.1 Code Structure
/client: Frontend React application
/server: Backend Express server
/shared: Shared types and schemas
/dist: Production build output
12.2 Adding New Features
Define schema changes in shared/schema.ts
Update database with npm run db:push
Implement backend routes in server/routes.ts
Create frontend components in client/src/components
Add any new pages to client/src/App.tsx
12.3 Testing
Apply to vite.config....
Run
check
13. Security Considerations
13.1 Authentication
TMS credentials are never stored permanently
Use SSL in production
Consider implementing OAuth for user authentication
13.2 Data Protection
Sensitive data is never logged
Consider encrypting TMS credentials in transit
Implement rate limiting for API endpoints
14. Scaling Considerations
Separate WebSocket server for high-traffic scenarios
Database connection pooling
Consider Redis for caching market data
Implement horizontal scaling for order monitoring service