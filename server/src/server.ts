import http from 'http';
import mongoose from 'mongoose';
import app from './app';
import { loadEnv } from './config/env';
import { logger } from './utils/logger';

const env = loadEnv();
const PORT = env.PORT || 5000;

const LOCAL_MONGO_URI = 'mongodb://localhost:27017/online_recruit_system';

function srvToStandardUri(srvUri: string): string {
  try {
    const match = srvUri.match(/mongodb\+srv:\/\/([^:]+):([^@]+)@([^/]+)\/([^?]*)(\?.*)?/);
    if (!match) return srvUri;
    const [, user, pass, host, db, qs = ''] = match;
    const params = new URLSearchParams(qs.replace('?', ''));
    params.set('ssl', 'true');
    params.set('authSource', 'admin');
    return `mongodb://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${host}:27017/${db}?${params.toString()}`;
  } catch {
    return srvUri;
  }
}

async function connectMongo(): Promise<void> {
  const options = {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: env.isProd ? 10000 : 5000,
  };

  try {
    await mongoose.connect(env.MONGODB_URI, options);
    logger.info('Connected to MongoDB');
  } catch (mongoError: unknown) {
    const err = mongoError as { code?: string; syscall?: string };
    const isSrvError = err?.code === 'ECONNREFUSED' && err?.syscall === 'querySrv';

    if (env.isProd) {
      logger.error('MongoDB connection failed', mongoError);
      throw mongoError;
    }

    if (isSrvError && env.MONGODB_URI.startsWith('mongodb+srv://') && !env.MONGODB_URI.includes('localhost')) {
      logger.warn('SRV lookup failed. Trying standard connection string...');
      try {
        await mongoose.connect(srvToStandardUri(env.MONGODB_URI), options);
        logger.info('Connected to MongoDB');
        return;
      } catch {
        logger.warn('Standard Atlas failed. Trying local MongoDB...');
      }
      try {
        await mongoose.connect(LOCAL_MONGO_URI, options);
        logger.info('Connected to MongoDB (local)');
      } catch {
        logger.error('All connection attempts failed. Install MongoDB locally or fix network.', mongoError);
        throw mongoError;
      }
    } else {
      throw mongoError;
    }
  }
}

async function start() {
  try {
    await connectMongo();

    const server = http.createServer(app);

    server.listen(PORT, '0.0.0.0', () => {
      logger.info(`Server running on port ${PORT}`, { NODE_ENV: env.NODE_ENV });
    });

    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${PORT} is already in use. Please free the port and restart.`);
        process.exit(1);
      } else {
        logger.error('Server error', error);
        process.exit(1);
      }
    });

    const shutdown = (signal: string) => {
      logger.info(`${signal} received. Shutting down gracefully.`);
      server.close(() => {
        mongoose.connection.close(false).then(
          () => {
            logger.info('MongoDB connection closed.');
            process.exit(0);
          },
          (err) => {
            logger.error('Error closing MongoDB', err);
            process.exit(1);
          },
        );
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

void start();
