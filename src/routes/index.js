import express from 'express';
import healthRoutes from './health.js';

const router = express.Router();

// Health check route
router.use('/health', healthRoutes);

export default router;