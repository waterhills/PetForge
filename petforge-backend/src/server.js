import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', process.env.FRONTEND_URL].filter(Boolean),
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'PetForge API Server is running' });
});

// API Routes
app.use('/api/auth', (await import('./routes/auth.js')).default);
app.use('/api/user', (await import('./routes/user.js')).default);
app.use('/api/upload', (await import('./routes/upload.js')).default);
app.use('/api/upload-image', (await import('./routes/upload-image.js')).default);
app.use('/api/petips', (await import('./routes/petips.js')).default);
app.use('/api/cart', (await import('./routes/cart.js')).default);
app.use('/api/orders', (await import('./routes/orders.js')).default);
app.use('/api/payments', (await import('./routes/payments.js')).default);
app.use('/api/addresses', (await import('./routes/addresses.js')).default);
app.use('/api/points', (await import('./routes/points.js')).default);
app.use('/api/admin', (await import('./routes/admin.js')).default);

// Import generation routes
import generationRouter from './routes/generation.js';
import simpleGenerationRouter from './routes/generation-simple.js';
import comfyUIRouter from './routes/generation-comfyui.js';

// Enable ComfyUI routes (real AI generation)
app.use('/api/generation', comfyUIRouter);
// Simple test routes available as fallback
// app.use('/api/generation', simpleGenerationRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════╗
║     🐾 PetForge Backend API Server         ║
╠═══════════════════════════════╣
║  Environment: ${process.env.NODE_ENV || 'development'}                      ║
║  Port: ${PORT}                                  ║
║  URL: http://localhost:${PORT}              ║
╚══════════════════════════════════╝

`);
});
