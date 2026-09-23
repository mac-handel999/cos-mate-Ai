import express from 'express';

const router = express.Router();

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/', (req, res) => {
  res.json({
    success: true,
    service: 'COS MATE',
    status: 'online',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default router;