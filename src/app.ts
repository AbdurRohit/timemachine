import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { IdentityController, identifyController } from './controllers/identityController';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Logging
app.use(morgan('combined'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check route (put this before other routes)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes - Option 1: Using class instance
const identityControllerInstance = new IdentityController();
app.post('/identify', identityControllerInstance.identify);

// // API Routes - Option 2: Using object with arrow functions (simpler, recommended for junior devs)
// // app.post('/identify', identifyController.identify);

// // 404 handler - use this instead of '*'
// app.all('*', (req, res) => {
//   res.status(404).json({
//     error: 'Not Found',
//     message: `The requested endpoint ${req.method} ${req.path} does not exist`
//   });
// });

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;