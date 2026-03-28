import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.routes';
import examRoutes from './routes/exam.routes';
import submissionRoutes from './routes/submission.routes';
import codeExecutionRoutes from './routes/codeExecution.routes';
import adminRoutes from './routes/admin.routes';
import { errorHandler } from './middlewares/error.middleware';

export function createApp(corsOrigin: string): Application {
  const app: Application = express();

  // Disable ETags globally to prevent 304 responses
  app.set('etag', false);

  // Trust proxy for network access
  app.set('trust proxy', true);

  // Add middleware for network access
  app.use((req, res, next) => {
    // Add headers for network access
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });

  app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false,
  }));
  app.use(express.json({ limit: '1mb' }));

  const corsOptions =
    corsOrigin === '*'
      ? { 
          origin: true,
          credentials: true,
          optionsSuccessStatus: 200,
          methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
          allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
        }
      : { 
          origin: corsOrigin.split(',').map((o) => o.trim()), 
          credentials: true,
          optionsSuccessStatus: 200,
          methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
          allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
        };
  app.use(cors(corsOptions));

  if (process.env.NODE_ENV === 'production') {
    app.use(morgan('combined'));
    app.use(
      rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100,
        message: { message: 'Too many requests, please try again later.' },
        standardHeaders: true,
        legacyHeaders: false,
      }),
    );
    app.use(
      '/api/auth',
      rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 20,
        message: { message: 'Too many auth attempts. Try again later.' },
        standardHeaders: true,
        legacyHeaders: false,
      }),
    );
  } else {
    app.use(morgan('dev'));
  }

  app.use('/api/auth', authRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/admins', adminRoutes);
  app.use('/api/exams', examRoutes);
  app.use('/api/submissions', submissionRoutes);
  app.use('/api/code', codeExecutionRoutes);

  // Network discovery endpoint
  app.get('/api/network-info', (_req, res) => {
    res.json({
      status: 'ok',
      server: 'online-recruit-system',
      timestamp: new Date().toISOString(),
      network: {
        host: '192.168.29.125',
        ports: {
          frontend: 3001,
          backend: 5050
        }
      }
    });
  });

  app.get('/api/health', async (_req, res) => {
    const dbState = mongoose.connection.readyState;
    const healthy = dbState === 1;
    if (process.env.NODE_ENV === 'production' && !healthy) {
      return res.status(503).json({
        status: 'unhealthy',
        service: 'online-recruit-system-backend',
        database: dbState === 0 ? 'disconnected' : dbState === 2 ? 'connecting' : 'disconnecting',
      });
    }
    res.json({
      status: healthy ? 'ok' : 'degraded',
      service: 'online-recruit-system-backend',
      ...(process.env.NODE_ENV !== 'production' && { database: dbState === 1 ? 'connected' : 'not connected' }),
    });
  });

  app.use(errorHandler);

  return app;
}

const corsOrigin = process.env.CORS_ORIGIN || '*';
export default createApp(corsOrigin);
