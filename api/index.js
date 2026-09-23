import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import telegramRoutes from '../src/services/telegram/telegram.routes.js';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(join(__dirname, '..', 'public')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    service: 'COS MATE',
    status: 'online',
    timestamp: new Date().toISOString(),
  });
});

// Telegram webhook
app.use('/api/telegram', telegramRoutes);

// Root endpoint - serve landing page
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, '..', 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

// Start server if running locally (not on Vercel)
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`COS MATE server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
    console.log(`Telegram webhook: http://localhost:${PORT}/api/telegram/webhook`);
    console.log(`Landing page: http://localhost:${PORT}`);
  });
}

export default app;