// server/api-mock.js
import fs from 'fs';
import path from 'path';

export function setupMockAPI(app) {
  app.get('/api/market-data', (req, res) => {
    try {
      const sampleDataPath = path.join(process.cwd(), 'market_data_sample.json');
      const data = fs.readFileSync(sampleDataPath, 'utf8');
      res.setHeader('Content-Type', 'application/json');
      res.send(data);
    } catch (error) {
      console.error('Error serving mock market data:', error);
      res.status(500).json({ message: 'Failed to load market data' });
    }
  });
}